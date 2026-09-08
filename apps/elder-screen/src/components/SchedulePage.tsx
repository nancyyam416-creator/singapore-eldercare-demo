import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AudioLines,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Mic,
  PenLine,
  Pill,
  Plus,
  RotateCcw,
  Volume2,
  X,
} from "lucide-react";
import { speakText } from "../audio/speech";
import { MedicationReminder } from "../types";
import type { AcceptanceReminderScenario } from "./InteractionAcceptanceConsole";
import SecondaryPageHeader from "./SecondaryPageHeader";
import "./schedule-page.css";

type ScheduleKind = "medication" | "life";
type ReminderStatus = "pending" | "completed" | "unconfirmed" | "expired";
type RepeatRule = "once" | "daily" | "weekly";
const SHOW_QUICK_ADD = false;

interface ScheduleItem {
  id: string;
  kind: ScheduleKind;
  title: string;
  detail: string;
  date: string;
  time: string;
  status: ReminderStatus;
  repeat: RepeatRule;
  completedAt?: string;
}

interface SchedulePageProps {
  isOpen: boolean;
  onClose: () => void;
  reminders: MedicationReminder[];
  onCompleteExternal?: (name: string) => void;
  acceptanceScenario?: AcceptanceReminderScenario;
}

interface SpeechRecognitionResultLike {
  readonly results: {
    readonly length: number;
    readonly [index: number]: {
      readonly [index: number]: {
        readonly transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorLike {
  readonly error: string;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionResultLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;
type VoiceStage = "guide" | "listening" | "review" | "error" | "unsupported";

interface VoiceReminderDraft {
  kind: "medication" | "life";
  title: string;
  detail: string;
  date: string;
  time: string;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const kindConfig = {
  medication: {
    label: "用药",
    icon: Pill,
    iconClass: "bg-[#EAF6EF] text-[#256F4F]",
  },
  life: {
    label: "日常提醒",
    icon: CalendarDays,
    iconClass: "bg-[#F2EEFA] text-[#70548D]",
  },
};

const repeatLabels: Record<RepeatRule, string> = {
  once: "仅这一次",
  daily: "每天",
  weekly: "每周",
};

const pad = (value: number) => String(value).padStart(2, "0");

const dateKey = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const formatShortDate = (key: string) => {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });
};

const nowTime = () =>
  new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false });

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const chineseNumberToValue = (source: string) => {
  if (/^\d+$/.test(source)) return Number(source);
  const digits: Record<string, number> = {
    零: 0,
    一: 1,
    二: 2,
    两: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
    七: 7,
    八: 8,
    九: 9,
  };
  if (source === "十") return 10;
  if (source.includes("十")) {
    const [tens, ones] = source.split("十");
    return (tens ? digits[tens] : 1) * 10 + (ones ? digits[ones] : 0);
  }
  return digits[source];
};

const parseVoiceReminder = (transcript: string, today: Date): VoiceReminderDraft | null => {
  const normalized = transcript.replace(/[，。,.]/g, "").replace(/\s+/g, "");
  const timeMatch = normalized.match(
    /(凌晨|早上|早晨|上午|中午|下午|傍晚|晚上)?([零一二三四五六七八九十两\d]{1,3})[点时](?:([零一二三四五六七八九十两\d]{1,3})分?)?/,
  );
  if (!timeMatch) return null;

  const period = timeMatch[1] ?? "";
  let hour = chineseNumberToValue(timeMatch[2]);
  const minute = timeMatch[3] ? chineseNumberToValue(timeMatch[3]) : 0;
  if (hour === undefined || minute === undefined || hour > 23 || minute > 59) return null;
  if (["下午", "傍晚", "晚上"].includes(period) && hour < 12) hour += 12;
  if (period === "中午" && hour < 11) hour += 12;
  if (period === "凌晨" && hour === 12) hour = 0;

  const daysLater = normalized.includes("后天") ? 2 : normalized.includes("明天") ? 1 : 0;
  const kind: VoiceReminderDraft["kind"] = /吃药|服药|药片|用药/.test(normalized)
    ? "medication"
    : "life";
  const title = normalized
    .replace(/^小[Uu优][，,]?/, "")
    .replace(/请?提醒我/, "")
    .replace(/今天|明天|后天/g, "")
    .replace(timeMatch[0], "")
    .replace(/到时候|记得|一下/g, "")
    .trim();
  const fallbackTitle = kind === "medication" ? "按时服药" : "我的提醒";

  return {
    kind,
    title: title || fallbackTitle,
    detail: kind === "medication" ? "请按医嘱服用，到时间会大声提醒您。" : "到时间会大声提醒您。",
    date: dateKey(addDays(today, daysLater)),
    time: `${pad(hour)}:${pad(minute)}`,
  };
};

const createDefaultItems = (reminders: MedicationReminder[], today: Date): ScheduleItem[] => {
  const todayKey = dateKey(today);

  return [
    ...reminders.map<ScheduleItem>((reminder) => ({
      id: reminder.id,
      kind: reminder.category === "schedule" ? "life" : "medication",
      title: reminder.name,
      detail: reminder.dosage,
      date: todayKey,
      time: reminder.time,
      status: reminder.status === "completed"
        ? "completed"
        : reminder.status === "unconfirmed"
          ? "unconfirmed"
          : reminder.status === "expired"
            ? "expired"
            : "pending",
      completedAt: reminder.takenAt,
      repeat: "daily",
    })),
    {
      id: "family-call-today",
      kind: "life",
      title: "晚上给女儿回电话",
      detail: "女儿小敏希望晚上和您聊聊天。",
      date: todayKey,
      time: "18:30",
      status: "pending",
      repeat: "once",
    },
  ];
};

export default function SchedulePage({
  isOpen,
  onClose,
  reminders,
  onCompleteExternal,
  acceptanceScenario = "default",
}: SchedulePageProps) {
  const today = useMemo(() => new Date(), []);
  const todayKey = dateKey(today);
  const storageKey = `u2g-reminders-v2-${todayKey}`;

  const [items, setItems] = useState<ScheduleItem[]>(() => {
    const cached = window.localStorage.getItem(storageKey);
    if (cached) {
      try {
        return JSON.parse(cached) as ScheduleItem[];
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }
    return createDefaultItems(reminders, today);
  });
  const [showEditor, setShowEditor] = useState(false);
  const [toast, setToast] = useState("");
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);
  const [voiceStage, setVoiceStage] = useState<VoiceStage>("guide");
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceDraft, setVoiceDraft] = useState<VoiceReminderDraft | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const [formKind, setFormKind] = useState<ScheduleKind>("life");
  const [formTitle, setFormTitle] = useState("");
  const [formDate, setFormDate] = useState(todayKey);
  const [formTime, setFormTime] = useState("09:00");
  const [formDetail, setFormDetail] = useState("");
  const [formRepeat, setFormRepeat] = useState<RepeatRule>("once");
  const [backfillItem, setBackfillItem] = useState<ScheduleItem | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const defaults = createDefaultItems(reminders, today);
    if (acceptanceScenario === "empty") setItems([]);
    else if (acceptanceScenario === "all-completed") setItems(defaults.map((item) => ({ ...item, status: "completed", completedAt: "08:14" })));
    else if (acceptanceScenario === "due") setItems([{ ...defaults.find((item) => item.status === "pending")!, time: "00:01", status: "pending" }]);
    else if (acceptanceScenario === "not-yet") setItems([{ ...defaults[0], date: dateKey(addDays(today, 1)), time: "09:00", status: "pending" }]);
    else if (acceptanceScenario === "unconfirmed") setItems([{ ...defaults[0], status: "unconfirmed" }]);
    else setItems(defaults);
    setSelectedDateKey(todayKey);
    setShowEditor(false);
    setBackfillItem(null);
    setToast(acceptanceScenario === "action-failure" ? "确认失败，提醒状态未改变，请稍后重试" : "");
  }, [acceptanceScenario, isOpen, reminders, today, todayKey]);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, storageKey]);

  useEffect(() => {
    setItems((current) =>
      current.map((item) => {
        const matched = reminders.find((reminder) => reminder.id === item.id);
        if (!matched) return item;
        return {
          ...item,
          status: matched.status === "completed" ? "completed" : item.status,
          completedAt: matched.takenAt || item.completedAt,
        };
      }),
    );
  }, [reminders]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => () => {
    recognitionRef.current?.abort();
  }, []);

  const getDisplayStatus = (item: ScheduleItem) => {
    if (item.status === "completed") return { label: "已完成", className: "bg-[#EAF6EF] text-[#256F4F]" };
    if (item.status === "unconfirmed") return { label: "未确认", className: "bg-[#FFF0EA] text-[#A04C2D]" };
    if (item.status === "expired") return { label: "已过期", className: "bg-gray-100 text-gray-600" };
    if (item.date > todayKey || (item.date === todayKey && item.time > nowTime())) {
      return { label: "未到时间", className: "bg-[#F1F3F5] text-[#59636D]" };
    }
    return { label: "待完成", className: "bg-[#EAF2FB] text-[#376A94]" };
  };

  const canCompleteItem = (item: ScheduleItem) => item.status === "pending" || item.status === "unconfirmed" || item.status === "expired";
  const getCompletionLabel = (item: ScheduleItem) => {
    if (item.status === "unconfirmed" || item.status === "expired") return "补打卡";
    return item.kind === "medication" ? "我已服药" : "我已完成";
  };

  const isScheduledOnDate = (item: ScheduleItem, targetKey: string) => {
    if (item.date === targetKey) return true;
    if (targetKey < item.date) return false;
    if (item.repeat === "daily") return true;
    if (item.repeat === "weekly") {
      const start = new Date(`${item.date}T00:00:00`);
      const target = new Date(`${targetKey}T00:00:00`);
      return Math.round((target.getTime() - start.getTime()) / 86_400_000) % 7 === 0;
    }
    return false;
  };

  const getItemsForDate = (targetKey: string) => items
    .filter((item) => isScheduledOnDate(item, targetKey))
    .map((item) => item.date === targetKey ? item : {
      ...item,
      date: targetKey,
      status: "pending" as ReminderStatus,
      completedAt: undefined,
    })
    .sort((a, b) => a.time.localeCompare(b.time));

  const selectedItems = getItemsForDate(selectedDateKey);
  const selectedMedicationItems = selectedItems.filter((item) => item.kind === "medication");
  const selectedDailyItems = selectedItems.filter((item) => item.kind !== "medication");
  const selectedUnresolvedItems = selectedItems.filter((item) => item.status !== "completed");
  const selectedCompletedItems = selectedItems.filter((item) => item.status === "completed");
  const priorityItem = selectedUnresolvedItems.find((item) => item.kind === "medication") ?? selectedUnresolvedItems[0];
  const selectedDate = new Date(`${selectedDateKey}T00:00:00`);
  const selectedDateTitle = selectedDateKey === todayKey
    ? `${selectedDate.getFullYear()}年${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日（今天）`
    : formatShortDate(selectedDateKey);

  const calendarYear = calendarMonth.getFullYear();
  const calendarMonthIndex = calendarMonth.getMonth();
  const calendarDays = new Date(calendarYear, calendarMonthIndex + 1, 0).getDate();
  const calendarStartDay = new Date(calendarYear, calendarMonthIndex, 1).getDay();
  const calendarCells = [
    ...Array.from({ length: calendarStartDay }, () => null),
    ...Array.from({ length: calendarDays }, (_, index) => index + 1),
  ];

  const openCreate = () => {
    setFormKind("life");
    setFormTitle("");
    setFormDate(todayKey);
    setFormTime("09:00");
    setFormDetail("");
    setFormRepeat("once");
    setShowEditor(true);
  };

  const saveItem = (event: React.FormEvent) => {
    event.preventDefault();
    if (!formTitle.trim()) {
      setToast("请先填写提醒内容");
      return;
    }

    setItems((current) => [
      ...current,
      {
        id: `self-${Date.now()}`,
        kind: formKind,
        title: formTitle.trim(),
        detail: formDetail.trim() || "到时间会提醒您。",
        date: formDate,
        time: formTime,
        status: "pending",
        repeat: formRepeat,
      },
    ]);
    setToast("提醒已添加");
    setShowEditor(false);
  };

  const completeItem = (item: ScheduleItem) => {
    if (acceptanceScenario === "action-failure") {
      setToast("确认失败，提醒状态未改变，请稍后重试");
      return;
    }
    const completedAt = nowTime();
    setItems((current) =>
      current.map((currentItem) =>
        currentItem.id === item.id
          ? { ...currentItem, status: "completed", completedAt }
          : currentItem,
      ),
    );
    if (item.kind === "medication") onCompleteExternal?.(item.title);
    const feedback = item.status === "unconfirmed" || item.status === "expired"
      ? "补打卡成功，已记录并通知子女"
      : item.kind === "medication" ? "服药已打卡，已通知子女" : "事项已确认，已记录";
    speak(feedback);
    setToast(feedback);
  };

  const requestCompleteItem = (item: ScheduleItem) => {
    if (item.status === "unconfirmed" || item.status === "expired") {
      setBackfillItem(item);
      return;
    }
    completeItem(item);
  };

  const confirmBackfill = () => {
    if (!backfillItem) return;
    completeItem(backfillItem);
    setBackfillItem(null);
  };

  const speak = (content: string) => {
    speakText(content, {
      rate: 0.86,
      onError: () => setToast("语音播放失败，请再试一次"),
    });
  };

  const speakItem = (item: ScheduleItem) => {
    const action = item.kind === "medication" ? "用药提醒" : "日常提醒";
    speak(`${action}，${item.time}，${item.title}。${item.detail}`);
    setToast("正在大声念给您听");
  };

  const speakRemaining = () => {
    if (selectedUnresolvedItems.length === 0) {
      speak("今天的任务已全部完成，真棒！");
      setToast("今天的任务已全部完成");
      return;
    }
    const summary = selectedUnresolvedItems
      .map((item) => `${item.time}，${item.title}，${item.detail}`)
      .join("。");
    speak(`${selectedDateTitle}还有${selectedUnresolvedItems.length}件事。${summary}`);
    setToast("正在播报剩余事项");
  };

  const closeVoiceAssistant = () => {
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    setShowVoiceAssistant(false);
    setVoiceStage("guide");
    setVoiceTranscript("");
    setVoiceDraft(null);
  };

  const startVoiceCreate = () => {
    setVoiceStage("guide");
    setVoiceTranscript("");
    setVoiceDraft(null);
    setShowVoiceAssistant(true);
    speak("用说话添加提醒。点一下开始说话，然后说完整一句，例如，明天下午三点提醒我去复诊。");
  };

  const beginVoiceRecognition = () => {
    const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Recognition) {
      setVoiceStage("unsupported");
      speak("当前设备暂时不能听写，您可以改用手动填写。");
      return;
    }

    recognitionRef.current?.abort();
    const recognition = new Recognition();
    recognitionRef.current = recognition;
    let receivedResult = false;
    let recognitionFailed = false;
    recognition.lang = "zh-CN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => {
      setVoiceTranscript("");
      setVoiceDraft(null);
      setVoiceStage("listening");
    };
    recognition.onresult = (event) => {
      receivedResult = true;
      const result = event.results[event.results.length - 1]?.[0]?.transcript?.trim() ?? "";
      const parsed = parseVoiceReminder(result, today);
      setVoiceTranscript(result);
      setVoiceDraft(parsed);
      if (parsed) {
        setVoiceStage("review");
        speak(`我听到的是，${result}。请确认是否添加。`);
      } else {
        setVoiceStage("error");
        speak("我没有听清提醒时间，请再说一次完整的日期、时间和事情。");
      }
    };
    recognition.onerror = (event) => {
      recognitionFailed = true;
      setVoiceStage(event.error === "not-allowed" || event.error === "service-not-allowed" ? "unsupported" : "error");
      speak(event.error === "not-allowed" ? "没有获得麦克风权限，请改用手动填写。" : "刚才没有听清，请再说一次。");
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      if (!receivedResult && !recognitionFailed) {
        setVoiceStage("error");
        speak("刚才没有听到声音，请靠近一些再说一次。");
      }
    };

    try {
      recognition.start();
    } catch {
      setVoiceStage("error");
      speak("语音输入没有启动成功，请再试一次。");
    }
  };

  const confirmVoiceReminder = () => {
    if (!voiceDraft) return;
    setItems((current) => [
      ...current,
      {
        id: `voice-${Date.now()}`,
        kind: voiceDraft.kind,
        title: voiceDraft.title,
        detail: voiceDraft.detail,
        date: voiceDraft.date,
        time: voiceDraft.time,
        status: "pending",
        repeat: "once",
      },
    ]);
    setSelectedDateKey(voiceDraft.date);
    setCalendarMonth(new Date(`${voiceDraft.date}T00:00:00`));
    closeVoiceAssistant();
    setToast("语音提醒已添加");
    speak("提醒已经添加，到时间我会大声提醒您。");
  };

  const switchVoiceToManual = () => {
    closeVoiceAssistant();
    openCreate();
  };

  const useVoiceAcceptanceExample = () => {
    const transcript = "明天下午三点提醒我去复诊";
    const draft = parseVoiceReminder(transcript, today);
    setVoiceTranscript(transcript);
    setVoiceDraft(draft);
    setVoiceStage(draft ? "review" : "error");
    if (draft) speak(`我听到的是，${transcript}。请确认是否添加。`);
  };

  if (!isOpen) return null;

  return (
    <div className="schedule-page absolute inset-0 z-50 flex flex-col overflow-hidden bg-[#F5F2EB] text-[#1C2C24]">
      <SecondaryPageHeader
        title="提醒事项"
        icon={<CalendarDays aria-hidden="true" />}
        onBack={onClose}
      />

      <main className="schedule-page__main flex-1 min-h-0 p-6 flex gap-6">
        <section className="schedule-page__focus-column w-[35%] min-w-[500px] shrink-0 flex flex-col gap-4" aria-label="当前最优先和月历">
          <div className="schedule-priority rounded-[28px] border-2 border-[#A9D3BA] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[24px] font-black text-[#256F4F] flex items-center gap-3"><Clock3 className="w-7 h-7" />当前最优先</h2>
              {priorityItem && <span className={`px-4 py-2 rounded-full text-[15px] font-black ${getDisplayStatus(priorityItem).className}`}>{getDisplayStatus(priorityItem).label}</span>}
            </div>
            {priorityItem ? (
              <div key={priorityItem.id} className="mt-5">
                <div className="flex items-start gap-4">
                  <div className={`w-20 h-20 rounded-[22px] shrink-0 flex items-center justify-center ${priorityItem.kind === "medication" ? "bg-[#FFF0D8] text-[#B76500]" : kindConfig[priorityItem.kind].iconClass}`}>
                    {React.createElement(kindConfig[priorityItem.kind].icon, { className: "w-11 h-11" })}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[31px] leading-none font-black">{priorityItem.time}</p>
                    <h3 className="mt-3 text-[27px] leading-tight font-black">{priorityItem.title}</h3>
                    <p className="mt-3 text-[19px] leading-relaxed font-bold text-gray-600">{priorityItem.detail}</p>
                  </div>
                </div>
                {canCompleteItem(priorityItem) ? <button type="button" onClick={() => requestCompleteItem(priorityItem)} className="mt-6 w-full h-[96px] rounded-[24px] bg-[#16824F] text-white text-[27px] font-black flex items-center justify-center gap-3 shadow-lg hover:bg-[#0F6B40]">
                  <Check className="w-9 h-9" />{getCompletionLabel(priorityItem)}
                </button> : <div className="mt-6 w-full min-h-[82px] rounded-[24px] bg-[#F3F0EA] text-[#705F50] text-[22px] font-black flex items-center justify-center">本次提醒{getDisplayStatus(priorityItem).label}，可在记录中查看</div>}
              </div>
            ) : (
              <div className="py-9 text-center">
                <CheckCircle2 className="w-20 h-20 mx-auto text-[#39A66D]" />
                <h3 className="mt-4 text-[28px] font-black">今日任务已全部完成，真棒！</h3>
                <p className="mt-2 text-[17px] font-bold text-gray-500">可以安心休息，系统会继续陪着您。</p>
              </div>
            )}
          </div>

          <div className="schedule-calendar flex-1 min-h-0 rounded-[26px] border-2 border-[#E2DDD4] bg-white p-5 flex flex-col">
            <div className="flex items-center justify-between gap-3">
              <button type="button" aria-label="上个月" onClick={() => setCalendarMonth(new Date(calendarYear, calendarMonthIndex - 1, 1))} className="w-12 h-12 rounded-full border-2 border-[#DDD7CE] flex items-center justify-center"><ChevronLeft className="w-6 h-6" /></button>
              <div className="text-center"><h2 className="text-[23px] font-black">{calendarYear}年{calendarMonthIndex + 1}月</h2><p className="mt-1 text-[14px] font-bold text-gray-500">红点用药 · 蓝点事项</p></div>
              <button type="button" aria-label="下个月" onClick={() => setCalendarMonth(new Date(calendarYear, calendarMonthIndex + 1, 1))} className="w-12 h-12 rounded-full border-2 border-[#DDD7CE] flex items-center justify-center"><ChevronRight className="w-6 h-6" /></button>
            </div>
            <div className="schedule-calendar__weekdays mt-4 grid grid-cols-7 text-center text-[15px] font-black text-gray-500">{["日", "一", "二", "三", "四", "五", "六"].map((day) => <span key={day}>{day}</span>)}</div>
            <div className="schedule-calendar__days mt-2 grid grid-cols-7 gap-1.5 flex-1 min-h-0">
              {calendarCells.map((day, index) => {
                if (!day) return <span key={`blank-${index}`} />;
                const dayKey = `${calendarYear}-${pad(calendarMonthIndex + 1)}-${pad(day)}`;
                const dayItems = getItemsForDate(dayKey);
                const hasMedication = dayItems.some((item) => item.kind === "medication");
                const hasDaily = dayItems.some((item) => item.kind !== "medication");
                const selected = dayKey === selectedDateKey;
                const isToday = dayKey === todayKey;
                return (
                  <button key={dayKey} type="button" onClick={() => setSelectedDateKey(dayKey)} aria-label={`${day}日${isToday ? "，今天" : ""}`} className={`schedule-calendar-day ${selected ? "is-selected" : ""} ${isToday ? "is-today" : ""} min-h-[52px] rounded-2xl border-2 flex flex-col items-center justify-center text-[19px] font-black ${selected ? "border-[#16824F] bg-[#16824F] text-white" : isToday ? "border-[#65B98A] bg-[#EFF9F3] text-[#14533C]" : "border-transparent bg-[#FAF8F5]"}`}>
                    {day}<span className="mt-1 flex gap-1">{hasMedication && <i className="w-2 h-2 rounded-full bg-[#E1473E]" />}{hasDaily && <i className="w-2 h-2 rounded-full bg-[#3B82C4]" />}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {SHOW_QUICK_ADD && (
            <>
              <div className="schedule-quick-add grid grid-cols-[1fr_152px] gap-3">
                <button
                  type="button"
                  onClick={startVoiceCreate}
                  className="schedule-voice-entry min-h-[112px] rounded-[24px] border-2 border-[#16824F] bg-[#14533C] px-5 text-left text-white shadow-md flex items-center gap-4 hover:bg-[#0F6B40]"
                >
                  <span className="w-16 h-16 shrink-0 rounded-full bg-white text-[#16824F] flex items-center justify-center shadow-sm">
                    <Mic className="w-9 h-9" />
                  </span>
                  <span className="min-w-0">
                    <strong className="block text-[22px] leading-tight font-black">点一下，用说话添加提醒</strong>
                    <span className="mt-2 block text-[15px] leading-snug font-bold text-white/85">例如：“明天下午3点提醒我去复诊”</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={openCreate}
                  className="schedule-manual-entry min-h-[112px] rounded-[24px] border-2 border-[#DDD7CE] bg-white text-[#315B49] text-[18px] font-black flex flex-col items-center justify-center gap-2 hover:bg-[#F7F4EF]"
                >
                  <Plus className="w-8 h-8" />
                  手动填写
                </button>
              </div>
              <p className="text-center text-[14px] leading-none font-black text-gray-500">点击绿色按钮后，按提示说一句完整的话即可</p>
            </>
          )}
        </section>

        <section className="schedule-agenda flex-1 min-w-0 rounded-[28px] border-2 border-[#E2DDD4] bg-white flex flex-col overflow-hidden" aria-label={`${selectedDateTitle}的日程`}>
          <div className="schedule-agenda__header shrink-0 px-7 py-5 border-b border-[#E8E2D9] flex items-center justify-between gap-5">
            <h2 className="text-[28px] font-black">{selectedDateTitle}</h2>
            <button type="button" onClick={speakRemaining} className="min-w-[190px] h-[66px] rounded-[20px] bg-[#14533C] text-white text-[19px] font-black flex items-center justify-center gap-3"><Volume2 className="w-7 h-7" />语音播报</button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 custom-scroll">
            <section aria-labelledby="medicine-plan-title">
              <div className="flex items-center justify-between"><h3 id="medicine-plan-title" className="text-[23px] font-black flex items-center gap-3"><Pill className="w-7 h-7 text-[#B76500]" />用药提醒</h3><span className="text-[15px] font-black text-[#8A651C]">{selectedMedicationItems.filter((item) => item.status !== "completed").length} 次待服用</span></div>
              <div className="mt-4 space-y-4">
                {selectedMedicationItems.filter((item) => item.status !== "completed").map((item) => (
                    <article key={`med-${item.id}`} className="schedule-item schedule-item--medication min-h-[180px] rounded-[24px] border-2 border-[#E9C98D] bg-[#FFFAEE] p-5 flex items-center gap-5">
                    <div className="w-20 h-20 rounded-[22px] bg-[#FFE6B8] text-[#B76500] flex items-center justify-center shrink-0"><Pill className="w-11 h-11" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3"><strong className="text-[27px]">{item.time}</strong><span className={`px-3 py-1 rounded-full text-[14px] font-black ${getDisplayStatus(item).className}`}>{getDisplayStatus(item).label}</span></div>
                      <h4 className="mt-2 text-[25px] leading-tight font-black">{item.title}</h4><p className="mt-2 text-[18px] font-bold text-gray-600">{item.detail}</p>
                    </div>
                    <div className="w-[220px] shrink-0">
                      {canCompleteItem(item) ? <button type="button" onClick={() => requestCompleteItem(item)} className="w-full h-[72px] rounded-[20px] bg-[#16824F] text-white text-[21px] font-black flex items-center justify-center gap-2"><Check className="w-7 h-7" />{getCompletionLabel(item)}</button> : <span className="flex h-[72px] items-center justify-center rounded-[20px] bg-[#EEEAE3] text-[18px] font-black text-gray-600">{getDisplayStatus(item).label}</span>}
                    </div>
                  </article>
                ))}
                {selectedMedicationItems.filter((item) => item.status !== "completed").length === 0 && <p className="schedule-empty rounded-2xl bg-[#F3F8F5] px-5 py-5 text-[18px] font-black text-[#3B8C68]">当天没有待服用的药品</p>}
              </div>
            </section>

            <section className="mt-7 pt-6 border-t border-[#E8E2D9]" aria-labelledby="daily-plan-title">
              <div className="flex items-center justify-between"><h3 id="daily-plan-title" className="text-[23px] font-black flex items-center gap-3"><CalendarDays className="w-7 h-7 text-[#376A94]" />日常提醒</h3><span className="text-[15px] font-black text-[#376A94]">{selectedDailyItems.filter((item) => item.status !== "completed").length} 件待处理</span></div>
              <div className="mt-4 space-y-4">
                {selectedDailyItems.filter((item) => item.status !== "completed").map((item) => {
                  const Icon = kindConfig[item.kind].icon;
                  return (
                    <article key={`daily-${item.id}`} className="schedule-item schedule-item--daily min-h-[132px] rounded-[24px] border-2 border-[#C9DCEB] bg-[#F5FAFE] p-5 flex items-center gap-5">
                      <div className="w-[72px] h-[72px] rounded-[22px] bg-[#E5F0FA] text-[#376A94] flex items-center justify-center shrink-0"><Icon className="w-9 h-9" /></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3"><strong className="text-[25px]">{item.time}</strong><span className={`rounded-full px-3 py-1 text-[13px] font-black ${getDisplayStatus(item).className}`}>{getDisplayStatus(item).label}</span></div>
                        <h4 className="mt-2 text-[23px] leading-tight font-black">{item.title}</h4><p className="mt-2 text-[17px] font-bold text-gray-600 line-clamp-2">{item.detail}</p>
                      </div>
                      <div className="w-[220px] shrink-0">
                        {canCompleteItem(item) ? <button type="button" onClick={() => requestCompleteItem(item)} className="w-full h-[72px] rounded-[20px] bg-[#315F87] text-white text-[21px] font-black flex items-center justify-center gap-2"><Check className="w-7 h-7" />{getCompletionLabel(item)}</button> : <span className="flex h-[72px] items-center justify-center rounded-[20px] bg-[#EEEAE3] text-[18px] font-black text-gray-600">{getDisplayStatus(item).label}</span>}
                      </div>
                    </article>
                  );
                })}
                {selectedDailyItems.filter((item) => item.status !== "completed").length === 0 && <p className="schedule-empty rounded-2xl bg-[#F4F7FA] px-5 py-5 text-[18px] font-black text-[#56748E]">当天没有待处理的日常提醒</p>}
              </div>
            </section>

            {selectedCompletedItems.length > 0 && (
              <section className="schedule-completed mt-7 pt-6 border-t border-[#E8E2D9]" aria-label="已完成事项">
                <h3 className="text-[22px] font-black text-[#3B8C68] flex items-center gap-3"><CheckCircle2 className="w-7 h-7" />今日已完成（{selectedCompletedItems.length}件）</h3>
                <div className="mt-4 space-y-3">{selectedCompletedItems.map((item) => <div key={`done-${item.id}`} className="schedule-completed__item rounded-[20px] bg-[#F1F5F3] px-5 py-4 flex items-center gap-4 text-gray-500"><CheckCircle2 className="w-7 h-7 text-[#68A786]" /><strong className="text-[19px]">{item.time}</strong><div className="flex-1 min-w-0"><span className="block text-[19px] font-bold">{item.title}</span></div><span className="text-[15px] font-black">{item.completedAt ? `${item.completedAt}已完成` : "已完成"}</span></div>)}</div>
              </section>
            )}
          </div>
        </section>
      </main>

      {toast && (
        <div className="schedule-toast absolute top-[122px] left-1/2 -translate-x-1/2 z-[80] rounded-2xl bg-[#1C2C24] px-6 py-3 text-[16px] font-black text-white shadow-xl">
          {toast}
        </div>
      )}

      {backfillItem && (
        <div className="absolute inset-0 z-[90] bg-black/60 flex items-center justify-center p-8">
          <section role="dialog" aria-modal="true" aria-labelledby="backfill-dialog-title" className="w-[700px] overflow-hidden rounded-[32px] border-2 border-[#76BA95] bg-white shadow-2xl">
            <header className="px-8 py-6 border-b border-[#E2E8E4] bg-[#F2FAF5]">
              <h2 id="backfill-dialog-title" className="text-[31px] font-black text-[#1C2C24]">确认补打卡</h2>
              <p className="mt-2 text-[18px] font-bold text-[#476557]">请确认这项提醒已经完成</p>
            </header>
            <div className="p-8">
              <div className="rounded-[24px] bg-[#FFFAEE] border-2 border-[#E9C98D] px-6 py-5">
                <p className="text-[21px] font-black text-[#8A651C]">{backfillItem.time} · {backfillItem.kind === "medication" ? "用药提醒" : "日常提醒"}</p>
                <h3 className="mt-3 text-[28px] leading-tight font-black text-[#1C2C24]">{backfillItem.title}</h3>
                <p className="mt-3 text-[19px] leading-relaxed font-bold text-gray-600">{backfillItem.detail}</p>
              </div>
              <p className="mt-5 text-[17px] leading-relaxed font-bold text-gray-500">确认后将记录为补打卡完成，并同步给家人。</p>
            </div>
            <footer className="grid grid-cols-2 gap-4 px-8 py-6 border-t border-[#E2E8E4] bg-[#FAF8F5]">
              <button type="button" onClick={() => setBackfillItem(null)} className="h-[68px] rounded-[18px] border-2 border-[#CFC8BD] bg-white text-[20px] font-black text-gray-600">暂不补打</button>
              <button type="button" onClick={confirmBackfill} className="h-[68px] rounded-[18px] bg-[#16824F] text-white text-[20px] font-black flex items-center justify-center gap-3"><Check className="w-7 h-7" />{backfillItem.kind === "medication" ? "确认已服药" : "确认已完成"}</button>
            </footer>
          </section>
        </div>
      )}

      {showVoiceAssistant && (
        <div className="absolute inset-0 z-[75] bg-black/55 flex items-center justify-center p-6">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="voice-reminder-title"
            className="schedule-voice-dialog w-[820px] overflow-hidden rounded-[32px] border-2 border-[#76BA95] bg-white shadow-2xl"
          >
            <header className="px-8 py-6 border-b border-[#E2E8E4] bg-[#F2FAF5] flex items-center justify-between gap-5">
              <div className="flex items-center gap-4">
                <span className="w-14 h-14 rounded-full bg-[#16824F] text-white flex items-center justify-center">
                  <Mic className="w-8 h-8" />
                </span>
                <div>
                  <h2 id="voice-reminder-title" className="text-[29px] leading-none font-black text-[#1C2C24]">用说话添加提醒</h2>
                  <p className="mt-2 text-[17px] font-bold text-[#476557]">不用填写表格，说一句完整的话就可以</p>
                </div>
              </div>
              <button type="button" onClick={closeVoiceAssistant} aria-label="关闭语音添加提醒" className="w-12 h-12 rounded-full bg-white border-2 border-[#D9E3DD] text-gray-600 flex items-center justify-center">
                <X className="w-7 h-7" />
              </button>
            </header>

            <div className="p-8">
              {voiceStage === "guide" && (
                <>
                  <div className="grid grid-cols-3 gap-3" aria-label="语音添加提醒的三个步骤">
                    {[
                      ["1", "点开始说话"],
                      ["2", "说时间和事情"],
                      ["3", "听结果再确认"],
                    ].map(([step, label]) => (
                      <div key={step} className="voice-guide-step rounded-[20px] bg-[#F4F7F5] px-4 py-4 flex items-center gap-3">
                        <span className="w-9 h-9 rounded-full bg-[#14533C] text-white text-[18px] font-black flex items-center justify-center">{step}</span>
                        <strong className="text-[18px] font-black text-[#314A3F]">{label}</strong>
                      </div>
                    ))}
                  </div>
                  <div className="voice-example mt-6 rounded-[24px] border-2 border-[#F0D190] bg-[#FFFAEE] px-6 py-5 text-center">
                    <p className="text-[17px] font-black text-[#8B6219]">可以照着这样说</p>
                    <p className="mt-2 text-[27px] leading-snug font-black text-[#2B382F]">“明天下午3点，提醒我去复诊”</p>
                  </div>
                  <button type="button" onClick={beginVoiceRecognition} className="mt-6 w-full h-[100px] rounded-[26px] bg-[#16824F] text-white text-[27px] font-black shadow-lg flex items-center justify-center gap-4 hover:bg-[#0F6B40]">
                    <Mic className="w-10 h-10" />
                    点一下，开始说话
                  </button>
                  <button type="button" onClick={useVoiceAcceptanceExample} className="mt-3 w-full h-14 rounded-2xl border-2 border-[#BFCBC4] bg-white text-[#315B49] text-[17px] font-black">
                    使用示例查看确认步骤
                  </button>
                  <p className="mt-4 text-center text-[16px] font-bold text-gray-500">系统听完后会先让您确认，不会直接添加</p>
                </>
              )}

              {voiceStage === "listening" && (
                <div className="py-5 text-center">
                  <div className="voice-listening-orb mx-auto w-[150px] h-[150px] rounded-full bg-[#EAF6EF] border-4 border-[#63B687] text-[#16824F] flex flex-col items-center justify-center">
                    <AudioLines className="w-16 h-16" />
                    <span className="mt-1 flex h-8 items-center justify-center gap-1">
                      <i className="w-1.5 rounded-full bg-[#16824F] animate-wave-short" />
                      <i className="w-1.5 rounded-full bg-[#16824F] animate-wave-tall" />
                      <i className="w-1.5 rounded-full bg-[#16824F] animate-wave-medium" />
                      <i className="w-1.5 rounded-full bg-[#16824F] animate-wave-tall" />
                      <i className="w-1.5 rounded-full bg-[#16824F] animate-wave-short" />
                    </span>
                  </div>
                  <h3 className="mt-6 text-[31px] font-black text-[#1C2C24]">正在听，请开始说</h3>
                  <p className="mt-3 text-[20px] font-bold text-gray-600">请把日期、时间和事情一起说完整</p>
                  <p className="voice-listening-example mt-5 rounded-2xl bg-[#F4F7F5] px-5 py-4 text-[19px] font-black text-[#476557]">例如：明天下午3点，提醒我去复诊</p>
                  <button type="button" onClick={() => recognitionRef.current?.stop()} className="mt-6 h-14 min-w-[190px] rounded-2xl border-2 border-[#D6DDD8] bg-white px-6 text-[18px] font-black text-gray-600">我说完了</button>
                </div>
              )}

              {voiceStage === "review" && voiceDraft && (
                <>
                  <div className="voice-transcript rounded-[22px] bg-[#F4F7F5] px-6 py-5">
                    <p className="text-[16px] font-black text-gray-500">我听到您说</p>
                    <p className="mt-2 text-[24px] leading-snug font-black text-[#263A31]">“{voiceTranscript}”</p>
                  </div>
                  <div className="voice-draft mt-5 rounded-[24px] border-2 border-[#8AC6A3] bg-[#F2FAF5] p-6">
                    <p className="text-[18px] font-black text-[#256F4F]">将为您添加这条提醒</p>
                    <div className="mt-4 grid grid-cols-[170px_1fr] gap-x-5 gap-y-3 text-[21px]">
                      <span className="font-bold text-gray-500">类型</span><strong>{voiceDraft.kind === "medication" ? "用药提醒" : "日常提醒"}</strong>
                      <span className="font-bold text-gray-500">日期</span><strong>{formatShortDate(voiceDraft.date)}</strong>
                      <span className="font-bold text-gray-500">时间</span><strong>{voiceDraft.time}</strong>
                      <span className="font-bold text-gray-500">提醒内容</span><strong>{voiceDraft.title}</strong>
                    </div>
                  </div>
                  <div className="mt-6 grid grid-cols-[1fr_220px] gap-4">
                    <button type="button" onClick={confirmVoiceReminder} className="h-[84px] rounded-[24px] bg-[#16824F] text-white text-[24px] font-black flex items-center justify-center gap-3">
                      <Check className="w-8 h-8" />确认添加
                    </button>
                    <button type="button" onClick={beginVoiceRecognition} className="h-[84px] rounded-[24px] border-2 border-[#BFCBC4] bg-white text-[#315B49] text-[20px] font-black flex items-center justify-center gap-3">
                      <RotateCcw className="w-7 h-7" />重新说
                    </button>
                  </div>
                </>
              )}

              {(voiceStage === "error" || voiceStage === "unsupported") && (
                <div className="py-3 text-center">
                  <span className="voice-error-icon mx-auto w-20 h-20 rounded-full bg-[#FFF2E7] text-[#B76500] flex items-center justify-center">
                    <Mic className="w-10 h-10" />
                  </span>
                  <h3 className="mt-5 text-[28px] font-black text-[#1C2C24]">{voiceStage === "unsupported" ? "暂时不能使用语音输入" : "刚才没有听清"}</h3>
                  <p className="mt-3 text-[19px] leading-relaxed font-bold text-gray-600">
                    {voiceStage === "unsupported" ? "请检查麦克风权限，或改用手动填写。" : "请再说一次，并把日期、时间和事情一起说出来。"}
                  </p>
                  {voiceTranscript && <p className="voice-error-transcript mt-4 rounded-2xl bg-[#F4F7F5] px-5 py-4 text-[18px] font-bold text-gray-600">刚才听到：“{voiceTranscript}”</p>}
                  {voiceStage === "error" && (
                    <button type="button" onClick={beginVoiceRecognition} className="mt-6 w-full h-[82px] rounded-[24px] bg-[#16824F] text-white text-[24px] font-black flex items-center justify-center gap-3">
                      <RotateCcw className="w-8 h-8" />再说一次
                    </button>
                  )}
                  {voiceStage === "unsupported" && (
                    <button type="button" onClick={useVoiceAcceptanceExample} className="mt-6 w-full h-[72px] rounded-[22px] bg-[#16824F] text-white text-[21px] font-black">使用示例继续添加</button>
                  )}
                </div>
              )}

              {voiceStage !== "listening" && voiceStage !== "review" && (
                <button type="button" onClick={switchVoiceToManual} className="voice-manual-fallback mt-5 mx-auto min-w-[240px] h-14 rounded-2xl border-2 border-[#D6DDD8] bg-white px-6 text-[18px] font-black text-[#476557] flex items-center justify-center gap-2">
                  <PenLine className="w-6 h-6" />改为手动填写
                </button>
              )}
            </div>
          </section>
        </div>
      )}

      {showEditor && (
        <div className="absolute inset-0 z-[70] bg-black/45 flex items-center justify-center p-6">
          <form onSubmit={saveItem} className="schedule-editor w-[760px] max-h-[92%] overflow-hidden rounded-[28px] bg-white shadow-2xl flex flex-col">
            <div className="shrink-0 px-7 py-5 border-b border-[#E8E2D9] flex items-center justify-between">
              <div>
                <h2 className="text-[25px] font-black">新增提醒</h2>
                <p className="mt-1 text-[14px] font-bold text-gray-500">选择用药提醒或日常提醒，到时会大声提醒您</p>
              </div>
              <button type="button" onClick={() => setShowEditor(false)} aria-label="关闭新增提醒" className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-7 space-y-5 custom-scroll">
              <div>
                <label className="text-[16px] font-black">提醒类型</label>
                <div className="mt-2 grid grid-cols-2 gap-4">
                  {(["medication", "life"] as ScheduleKind[]).map((kind) => {
                    const config = kindConfig[kind];
                    const Icon = config.icon;
                    const visibleLabel = kind === "medication" ? "用药提醒" : "日常提醒";
                    return (
                      <button
                        key={kind}
                        type="button"
                        onClick={() => setFormKind(kind)}
                        aria-pressed={formKind === kind}
                        className={`h-16 rounded-2xl border-2 text-[18px] font-black flex items-center justify-center gap-3 ${
                          formKind === kind ? "border-[#3B8C68] bg-[#EAF6EF] text-[#256F4F]" : "border-[#DDD7CE] bg-white text-gray-600"
                        }`}
                      >
                        <Icon className="w-6 h-6" />{visibleLabel}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label htmlFor="schedule-title" className="text-[16px] font-black">{formKind === "medication" ? "药品名称" : "事项名称"}</label>
                <input
                  id="schedule-title"
                  value={formTitle}
                  onChange={(event) => setFormTitle(event.target.value)}
                  placeholder={formKind === "medication" ? "例如：阿司匹林肠溶片" : "例如：下午去复诊"}
                  className="mt-2 w-full h-14 rounded-2xl border-2 border-[#DDD7CE] px-4 text-[17px] font-bold outline-none focus:border-[#3B8C68]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="schedule-date" className="text-[16px] font-black">提醒日期</label>
                  <input id="schedule-date" type="date" min={todayKey} value={formDate} onChange={(event) => setFormDate(event.target.value)} className="mt-2 w-full h-14 rounded-2xl border-2 border-[#DDD7CE] px-4 text-[17px] font-bold" />
                </div>
                <div>
                  <label htmlFor="schedule-time" className="text-[16px] font-black">提醒时间</label>
                  <input id="schedule-time" type="time" value={formTime} onChange={(event) => setFormTime(event.target.value)} className="mt-2 w-full h-14 rounded-2xl border-2 border-[#DDD7CE] px-4 text-[17px] font-bold" />
                </div>
              </div>

              <div>
                <label className="text-[16px] font-black">重复方式</label>
                <div className="mt-2 grid grid-cols-3 gap-3">
                  {(["once", "daily", "weekly"] as RepeatRule[]).map((rule) => (
                    <button
                      key={rule}
                      type="button"
                      onClick={() => setFormRepeat(rule)}
                      aria-pressed={formRepeat === rule}
                      className={`h-12 rounded-xl border-2 text-[15px] font-black ${
                        formRepeat === rule ? "border-[#3B8C68] bg-[#EAF6EF] text-[#256F4F]" : "border-[#DDD7CE] text-gray-600"
                      }`}
                    >
                      {repeatLabels[rule]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="schedule-detail" className="text-[16px] font-black">{formKind === "medication" ? "剂量与服用说明" : "事项说明（选填）"}</label>
                <textarea
                  id="schedule-detail"
                  value={formDetail}
                  onChange={(event) => setFormDetail(event.target.value)}
                  placeholder={formKind === "medication" ? "例如：1片，饭后半小时温水送服" : "例如：复诊要带上病历卡"}
                  className="mt-2 w-full h-24 resize-none rounded-2xl border-2 border-[#DDD7CE] px-4 py-3 text-[16px] font-bold outline-none focus:border-[#3B8C68]"
                />
              </div>

            </div>

            <div className="shrink-0 px-7 py-5 border-t border-[#E8E2D9] flex justify-end gap-3 bg-[#FAF8F5]">
              <button type="button" onClick={() => setShowEditor(false)} className="h-12 px-6 rounded-xl border-2 border-[#DDD7CE] bg-white text-[16px] font-black text-gray-600">取消</button>
              <button type="submit" className="h-12 px-8 rounded-xl bg-[#14533C] text-white text-[16px] font-black">添加提醒</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
