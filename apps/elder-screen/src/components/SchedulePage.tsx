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
  Trash2,
  X,
} from "lucide-react";
import { speakText } from "../audio/speech";
import { MedicationReminder } from "../types";
import type { AcceptanceReminderScenario } from "./InteractionAcceptanceConsole";
import SecondaryPageHeader from "./SecondaryPageHeader";
import "./schedule-page.css";

type ScheduleKind = "medication" | "life";
type ReminderStatus = "pending" | "completed";
type RepeatRule = "once" | "daily" | "weekly";
type CreationSource = "elder" | "child" | "admin";
const SHOW_QUICK_ADD = true;

interface ScheduleItem {
  id: string;
  kind: ScheduleKind;
  title: string;
  detail: string;
  date: string;
  endDate?: string;
  time: string;
  status: ReminderStatus;
  repeat: RepeatRule;
  creationSource: CreationSource;
  creatorName: string;
  lastModifiedBy?: string;
  lastModifiedAt?: string;
  completedAt?: string;
}

type ScheduleLayer = "daily" | "plans";

interface SchedulePageProps {
  isOpen: boolean;
  onClose: () => void;
  reminders: MedicationReminder[];
  onCompleteExternal?: (name: string) => void;
  onPlanUpsert?: (item: ScheduleItem) => void;
  onPlanDelete?: (id: string) => void;
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
type VoiceStage = "guide" | "listening" | "error" | "unsupported";
type VoiceTarget = "title" | "detail";

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

const creationSourceLabels: Record<CreationSource, string> = {
  elder: "本人创建",
  child: "子女端创建",
  admin: "管理后台创建",
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

const createDefaultItems = (reminders: MedicationReminder[], today: Date): ScheduleItem[] => {
  const todayKey = dateKey(today);

  return [
    ...reminders.map<ScheduleItem>((reminder) => ({
      id: reminder.id,
      kind: reminder.category === "schedule" ? "life" : "medication",
      title: reminder.name,
      detail: reminder.dosage,
      date: reminder.scheduledAt?.match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? todayKey,
      time: reminder.time,
      status: reminder.status === "completed" ? "completed" : "pending",
      completedAt: reminder.takenAt,
      repeat: reminder.repeat ?? "once",
      creationSource: reminder.creationSource ?? "child",
      creatorName: reminder.creatorName ?? "家庭成员",
      lastModifiedBy: reminder.lastModifiedBy,
      lastModifiedAt: reminder.lastModifiedAt,
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
      creationSource: "elder",
      creatorName: "本人",
    },
  ];
};

const normalizeStoredItems = (items: ScheduleItem[]): ScheduleItem[] => items.map((item) => ({
  ...item,
  status: ["expired", "unconfirmed"].includes(item.status as string) ? "pending" : item.status,
  repeat: item.repeat ?? "once",
  creationSource: item.creationSource ?? (item.id.startsWith("self-") || item.id.startsWith("voice-") ? "elder" : "child"),
  creatorName: item.creatorName ?? (item.id.startsWith("self-") || item.id.startsWith("voice-") ? "本人" : "家庭成员"),
}));

export default function SchedulePage({
  isOpen,
  onClose,
  reminders,
  onCompleteExternal,
  onPlanUpsert,
  onPlanDelete,
  acceptanceScenario = "default",
}: SchedulePageProps) {
  const todayKey = dateKey(new Date());
  const today = useMemo(() => new Date(`${todayKey}T00:00:00`), [todayKey]);
  const storageKey = `u2g-reminders-v2-${todayKey}`;
  const occurrenceStorageKey = `u2g-reminder-occurrences-v1-${todayKey}`;

  const [items, setItems] = useState<ScheduleItem[]>(() => {
    const cached = window.localStorage.getItem(storageKey);
    if (cached) {
      try {
        return normalizeStoredItems(JSON.parse(cached) as ScheduleItem[]);
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }
    return createDefaultItems(reminders, today);
  });
  const [occurrenceHistory, setOccurrenceHistory] = useState<Record<string, ScheduleItem>>(() => {
    const cached = window.localStorage.getItem(occurrenceStorageKey);
    if (!cached) return {};
    try {
      return JSON.parse(cached) as Record<string, ScheduleItem>;
    } catch {
      window.localStorage.removeItem(occurrenceStorageKey);
      return {};
    }
  });
  const [activeLayer, setActiveLayer] = useState<ScheduleLayer>("daily");
  const [showEditor, setShowEditor] = useState(false);
  const [toast, setToast] = useState("");
  const [voiceStage, setVoiceStage] = useState<VoiceStage>("guide");
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceTarget, setVoiceTarget] = useState<VoiceTarget | null>(null);
  const [voiceNeedsReplacement, setVoiceNeedsReplacement] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const completionLocksRef = useRef<Set<string>>(new Set());
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const [formKind, setFormKind] = useState<ScheduleKind>("life");
  const [formTitle, setFormTitle] = useState("");
  const [formDate, setFormDate] = useState(todayKey);
  const [formEndDate, setFormEndDate] = useState("");
  const [formTime, setFormTime] = useState("09:00");
  const [formDetail, setFormDetail] = useState("");
  const [formRepeat, setFormRepeat] = useState<RepeatRule>("once");
  const [backfillItem, setBackfillItem] = useState<ScheduleItem | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [deleteItem, setDeleteItem] = useState<ScheduleItem | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const defaults = createDefaultItems(reminders, today);
    const editableItem: ScheduleItem = {
      ...defaults[defaults.length - 1],
      id: "acceptance-elder-created",
      title: "本人创建的复诊提醒",
      date: todayKey,
      time: "00:01",
      status: "pending",
      repeat: "once",
      creationSource: "elder",
      creatorName: "本人",
    };
    const childCreatedItem: ScheduleItem = {
      ...editableItem,
      id: "acceptance-child-created",
      title: "女儿设置的量血压提醒",
      creationSource: "child",
      creatorName: "女儿小敏",
    };
    const adminCreatedItem: ScheduleItem = {
      ...editableItem,
      id: "acceptance-admin-created",
      kind: "medication",
      title: "社区医生设置的维生素D提醒",
      detail: "1片，早餐后服用",
      creationSource: "admin",
      creatorName: "社区健康管家",
    };
    const withBothKinds = (sourceItem: ScheduleItem) => [
      sourceItem,
      {
        ...sourceItem,
        id: `${sourceItem.id}-second-kind`,
        kind: sourceItem.kind === "medication" ? "life" as const : "medication" as const,
        title: sourceItem.kind === "medication" ? "每周测量血压" : "早餐后服用维生素D",
        detail: sourceItem.kind === "medication" ? "每周测量并记录一次血压。" : "1片，早餐后服用。",
      },
    ];
    const externalWeeklyItem: ScheduleItem = {
      ...childCreatedItem,
      id: "acceptance-external-weekly",
      title: "每周测量血压",
      detail: "女儿小敏设置的每周测量提醒。",
      date: dateKey(addDays(today, -7)),
      time: "09:30",
      repeat: "weekly",
    };
    const acceptanceExecutionItem = (
      kind: ScheduleKind,
      status: ReminderStatus,
      time: string,
      completedAt?: string,
    ): ScheduleItem => ({
      ...editableItem,
      id: `acceptance-${kind}-${status}`,
      kind,
      title: kind === "medication" ? "阿司匹林肠溶片" : "傍晚散步",
      detail: kind === "medication" ? "1片，饭后半小时服用" : "天气合适时在楼下慢走20分钟",
      time,
      status,
      completedAt,
    });
    let nextSelectedDateKey = todayKey;
    if (acceptanceScenario === "empty") setItems([]);
    else if (acceptanceScenario === "all-completed") setItems(defaults.map((item) => ({ ...item, status: "completed", completedAt: "08:14" })));
    else if (acceptanceScenario === "due") setItems([{ ...editableItem, kind: "medication", title: "阿司匹林肠溶片", detail: "1片，饭后半小时服用" }]);
    else if (acceptanceScenario === "not-yet") setItems([{ ...editableItem, date: dateKey(addDays(today, 1)), time: "09:00", status: "pending" }]);
    else if (acceptanceScenario === "overdue-today") setItems([{ ...editableItem, time: "00:01", status: "pending" }]);
    else if (acceptanceScenario === "cross-day-overdue") {
      const previousDateKey = dateKey(addDays(today, -1));
      setItems([{ ...editableItem, id: "acceptance-cross-day", date: previousDateKey, time: "09:00", status: "pending" }]);
      nextSelectedDateKey = previousDateKey;
    }
    else if (acceptanceScenario === "elder-created") setItems(withBothKinds(editableItem));
    else if (acceptanceScenario === "other-created") setItems(withBothKinds(childCreatedItem));
    else if (acceptanceScenario === "admin-created") setItems(withBothKinds(adminCreatedItem));
    else if (acceptanceScenario === "external-repeat") {
      setItems([externalWeeklyItem]);
      nextSelectedDateKey = externalWeeklyItem.date;
    } else if (acceptanceScenario === "medication-pending") setItems([acceptanceExecutionItem("medication", "pending", "23:30")]);
    else if (acceptanceScenario === "medication-early-completed") setItems([acceptanceExecutionItem("medication", "completed", "23:30", "08:10")]);
    else if (acceptanceScenario === "medication-completed") setItems([acceptanceExecutionItem("medication", "completed", "08:00", "08:06")]);
    else if (acceptanceScenario === "medication-overdue") setItems([acceptanceExecutionItem("medication", "pending", "00:01")]);
    else if (acceptanceScenario === "life-pending") setItems([acceptanceExecutionItem("life", "pending", "23:30")]);
    else if (acceptanceScenario === "life-early-completed") setItems([acceptanceExecutionItem("life", "completed", "23:30", "08:10")]);
    else if (acceptanceScenario === "life-completed") setItems([acceptanceExecutionItem("life", "completed", "08:00", "08:06")]);
    else if (acceptanceScenario === "life-overdue") setItems([acceptanceExecutionItem("life", "pending", "00:01")]);
    else setItems(defaults);
    setSelectedDateKey(nextSelectedDateKey);
    setActiveLayer(acceptanceScenario === "medication-validation" ? "plans" : "daily");
    setCalendarMonth(new Date(`${nextSelectedDateKey}T00:00:00`));
    setEditingItemId(null);
    setShowEditor(acceptanceScenario === "medication-validation");
    if (acceptanceScenario === "medication-validation") {
      setFormKind("medication");
      setFormTitle("维生素D片");
      setFormDate(todayKey);
      setFormTime("09:00");
      setFormDetail("");
      setFormRepeat("daily");
    }
    setBackfillItem(null);
    setDeleteItem(null);
    setToast(acceptanceScenario === "action-failure" ? "确认失败，提醒状态未改变，请稍后重试" : "");
  }, [acceptanceScenario, isOpen, reminders, today, todayKey]);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, storageKey]);

  useEffect(() => {
    window.localStorage.setItem(occurrenceStorageKey, JSON.stringify(occurrenceHistory));
  }, [occurrenceHistory, occurrenceStorageKey]);

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

  const isItemOverdue = (item: ScheduleItem) => {
    if (item.status !== "pending") return false;
    const scheduledAt = new Date(`${item.date}T${item.time}:00`);
    return Date.now() - scheduledAt.getTime() >= 30 * 60 * 1000;
  };

  const getDisplayStatus = (item: ScheduleItem) => {
    if (item.status === "completed") return { label: "已完成", className: "bg-[#EAF6EF] text-[#256F4F]" };
    if (isItemOverdue(item)) return { label: "待完成 · 已超时", className: "bg-[#FFF0D9] text-[#A04C2D]" };
    return { label: "待完成", className: "bg-[#EAF2FB] text-[#376A94]" };
  };

  const canCompleteItem = (item: ScheduleItem) => {
    return item.status === "pending" && item.date <= todayKey;
  };
  const getCompletionLabel = (item: ScheduleItem) => {
    if (isItemOverdue(item)) return "超时后确认";
    return item.kind === "medication" ? "我已服药" : "我已完成";
  };
  const occurrenceKey = (planId: string, targetKey: string) => `${planId}:${targetKey}`;

  const isScheduledOnDate = (item: ScheduleItem, targetKey: string) => {
    if (item.date === targetKey) return true;
    if (targetKey < item.date) return false;
    if (item.endDate && targetKey > item.endDate) return false;
    if (item.repeat === "daily") return true;
    if (item.repeat === "weekly") {
      const start = new Date(`${item.date}T00:00:00`);
      const target = new Date(`${targetKey}T00:00:00`);
      return Math.round((target.getTime() - start.getTime()) / 86_400_000) % 7 === 0;
    }
    return false;
  };

  const getItemsForDate = (targetKey: string) => {
    const generated = items
      .filter((item) => isScheduledOnDate(item, targetKey))
      .map((item) => {
        const historical = occurrenceHistory[occurrenceKey(item.id, targetKey)];
        if (historical) return ["expired", "unconfirmed"].includes(historical.status as string) ? { ...historical, status: "pending" as ReminderStatus } : historical;
      if (item.date === targetKey) {
        return item;
      }
      return {
        ...item,
        date: targetKey,
        status: "pending" as ReminderStatus,
        completedAt: undefined,
      };
      });
    const generatedIds = new Set(generated.map((item) => item.id));
    const preserved = (Object.values(occurrenceHistory) as ScheduleItem[])
      .filter((item) => item.date === targetKey && !generatedIds.has(item.id));
    return [...generated, ...preserved].sort((a, b) => a.time.localeCompare(b.time));
  };

  const preserveOccurredInstances = (plan: ScheduleItem) => {
    setOccurrenceHistory((current) => {
      const next = { ...current };
      const cursor = new Date(`${plan.date}T00:00:00`);
      const lastDate = new Date(`${todayKey}T00:00:00`);
      let inspected = 0;
      while (cursor <= lastDate && inspected < 370) {
        const targetKey = dateKey(cursor);
        if (isScheduledOnDate(plan, targetKey)) {
          const hasOccurredToday = targetKey === todayKey && (plan.status !== "pending" || plan.time <= nowTime());
          if ((targetKey < todayKey || hasOccurredToday) && !next[occurrenceKey(plan.id, targetKey)]) {
            const isOriginalDate = targetKey === plan.date;
            next[occurrenceKey(plan.id, targetKey)] = {
              ...plan,
              date: targetKey,
              status: isOriginalDate && plan.status !== "pending" ? plan.status : "pending",
              completedAt: isOriginalDate ? plan.completedAt : undefined,
            };
          }
        }
        cursor.setDate(cursor.getDate() + 1);
        inspected += 1;
      }
      return next;
    });
  };

  const selectedItems = getItemsForDate(selectedDateKey);
  const selectedMedicationItems = selectedItems.filter((item) => item.kind === "medication");
  const selectedDailyItems = selectedItems.filter((item) => item.kind !== "medication");
  const selectedActionableItems = selectedItems.filter((item) => item.status === "pending");
  const selectedCompletedItems = selectedItems.filter((item) => item.status === "completed");
  const priorityItem = selectedActionableItems.find((item) => item.kind === "medication") ?? selectedActionableItems[0];
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
    cancelVoiceRecognition();
    setVoiceStage("guide");
    setVoiceTranscript("");
    setVoiceTarget(null);
    setVoiceNeedsReplacement(false);
    setEditingItemId(null);
    setFormKind("life");
    setFormTitle("");
    setFormDate(todayKey);
    setFormEndDate("");
    setFormTime("09:00");
    setFormDetail("");
    setFormRepeat("once");
    setShowEditor(true);
  };

  const openEdit = (item: ScheduleItem) => {
    cancelVoiceRecognition();
    setVoiceStage("guide");
    setVoiceTranscript("");
    setVoiceTarget(null);
    setVoiceNeedsReplacement(false);
    const editableStartDate = item.date < todayKey ? todayKey : item.date;
    setEditingItemId(item.id);
    setFormKind(item.kind);
    setFormTitle(item.title);
    setFormDate(editableStartDate);
    setFormEndDate(item.endDate && item.endDate >= editableStartDate ? item.endDate : "");
    setFormTime(item.time);
    setFormDetail(item.detail);
    setFormRepeat(item.repeat);
    setShowEditor(true);
  };

  const saveItem = (event: React.FormEvent) => {
    event.preventDefault();
    if (!formTitle.trim()) {
      setToast("请先填写提醒内容");
      return;
    }
    if (formKind === "medication" && !formDetail.trim()) {
      setToast("请填写用药剂量或服用说明");
      return;
    }
    if (formEndDate && formEndDate < formDate) {
      setToast("结束日期不能早于开始日期");
      return;
    }
    if (acceptanceScenario === "action-failure") {
      setToast("保存失败，计划内容已保留，请稍后重试");
      return;
    }

    const currentPlan = editingItemId ? items.find((item) => item.id === editingItemId) : undefined;
    const nextItem: ScheduleItem = {
      id: editingItemId ?? `self-${Date.now()}`,
      kind: formKind,
      title: formTitle.trim(),
      detail: formDetail.trim() || "到时间会提醒您。",
      date: formDate,
      endDate: formRepeat === "once" ? formDate : formEndDate || undefined,
      time: formTime,
      status: "pending",
      repeat: formRepeat,
      creationSource: currentPlan?.creationSource ?? "elder",
      creatorName: currentPlan?.creatorName ?? "本人",
      lastModifiedBy: editingItemId ? "本人" : undefined,
      lastModifiedAt: editingItemId ? nowTime() : undefined,
    };
    if (currentPlan) preserveOccurredInstances(currentPlan);
    setItems((current) => editingItemId
      ? current.map((item) => item.id === editingItemId ? nextItem : item)
      : [...current, nextItem]);
    onPlanUpsert?.(nextItem);
    setToast(editingItemId ? "提醒已更新" : "提醒已添加");
    cancelVoiceRecognition();
    setVoiceStage("guide");
    setVoiceTranscript("");
    setVoiceTarget(null);
    setVoiceNeedsReplacement(false);
    setEditingItemId(null);
    setShowEditor(false);
  };

  const confirmDelete = () => {
    if (!deleteItem) return;
    if (acceptanceScenario === "action-failure") {
      setToast("删除失败，原计划仍然保留，请稍后重试");
      return;
    }
    preserveOccurredInstances(deleteItem);
    setItems((current) => current.filter((item) => item.id !== deleteItem.id));
    onPlanDelete?.(deleteItem.id);
    setDeleteItem(null);
    setToast("提醒已删除，已发生的执行记录保持不变");
  };

  const completeItem = (item: ScheduleItem) => {
    if (acceptanceScenario === "action-failure") {
      setToast("确认失败，提醒状态未改变，请稍后重试");
      return;
    }
    const instanceKey = occurrenceKey(item.id, item.date);
    if (item.status === "completed" || occurrenceHistory[instanceKey]?.status === "completed" || completionLocksRef.current.has(instanceKey)) return;
    completionLocksRef.current.add(instanceKey);
    const completedAt = nowTime();
    setOccurrenceHistory((current) => ({
      ...current,
      [instanceKey]: { ...item, status: "completed", completedAt },
    }));
    setItems((current) => current.map((currentItem) => currentItem.id === item.id && currentItem.date === item.date
      ? { ...currentItem, status: "completed", completedAt }
      : currentItem));
    if (item.kind === "medication") onCompleteExternal?.(item.title);
    const feedback = isItemOverdue(item)
      ? "超时事项已确认，已记录实际完成时间"
      : item.kind === "medication" ? "服药已记录" : "事项已确认，已记录";
    speak(feedback);
    setToast(feedback);
  };

  const requestCompleteItem = (item: ScheduleItem) => {
    if (!canCompleteItem(item)) return;
    if (isItemOverdue(item)) {
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

  const cancelVoiceRecognition = () => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    recognition.onstart = null;
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
    recognition.abort();
    recognitionRef.current = null;
  };

  const closeEditor = () => {
    cancelVoiceRecognition();
    setVoiceStage("guide");
    setVoiceTranscript("");
    setVoiceTarget(null);
    setVoiceNeedsReplacement(false);
    setEditingItemId(null);
    setShowEditor(false);
  };

  const beginVoiceRecognition = (target: VoiceTarget) => {
    const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    setVoiceTarget(target);
    setVoiceTranscript("");
    setVoiceNeedsReplacement(false);
    if (!Recognition) {
      setVoiceStage("unsupported");
      speak("当前设备暂时不能听写，您可以改用手动填写。");
      return;
    }

    cancelVoiceRecognition();
    const recognition = new Recognition();
    recognitionRef.current = recognition;
    let receivedResult = false;
    let recognitionFailed = false;
    recognition.lang = "zh-CN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => {
      setVoiceStage("listening");
    };
    recognition.onresult = (event) => {
      receivedResult = true;
      const result = event.results[event.results.length - 1]?.[0]?.transcript?.trim() ?? "";
      setVoiceTranscript(result);
      if (result) {
        const currentValue = target === "title" ? formTitle : formDetail;
        const requiresReplacement = Boolean(currentValue.trim());
        setVoiceNeedsReplacement(requiresReplacement);
        if (!requiresReplacement) {
          if (target === "title") setFormTitle(result);
          else setFormDetail(result);
        }
        setVoiceStage("guide");
        speak(requiresReplacement
          ? `我听到的是，${result}。请确认是否替换当前${target === "title" ? "名称" : "说明"}。`
          : `我听到的是，${result}。已经填入${target === "title" ? "名称" : "说明"}，您可以继续修改。`);
      } else {
        setVoiceStage("error");
        speak("我没有听清提醒内容，请再说一次。");
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
        speak("刚才没有听到提醒内容，请靠近一些再说一次。");
      }
    };

    try {
      recognition.start();
    } catch {
      setVoiceStage("error");
      speak("语音输入没有启动成功，请再试一次。");
    }
  };

  const cancelCurrentRecording = () => {
    cancelVoiceRecognition();
    setVoiceStage("guide");
    setVoiceTranscript("");
    setVoiceTarget(null);
    setVoiceNeedsReplacement(false);
  };

  const confirmVoiceReplacement = () => {
    if (!voiceTarget || !voiceTranscript.trim()) return;
    if (voiceTarget === "title") setFormTitle(voiceTranscript.trim());
    else setFormDetail(voiceTranscript.trim());
    setVoiceNeedsReplacement(false);
    speak(`已经替换${voiceTarget === "title" ? "名称" : "说明"}，您可以继续修改。`);
  };

  const renderVoiceFieldFeedback = (target: VoiceTarget) => {
    if (voiceTarget !== target) return null;
    const fieldLabel = target === "title" ? "名称" : "说明";

    if (voiceStage === "listening") {
      return (
        <div className="schedule-field-voice-status is-listening" role="status" aria-live="polite">
          <AudioLines aria-hidden="true" />
          <div><strong>正在听{fieldLabel}</strong><span>说完后点击“我说完了”</span></div>
          <button type="button" onClick={() => recognitionRef.current?.stop()}>我说完了</button>
          <button type="button" className="is-secondary" onClick={cancelCurrentRecording}>取消录音</button>
        </div>
      );
    }

    if (voiceStage === "error" || voiceStage === "unsupported") {
      return (
        <div className="schedule-field-voice-status is-error" role="alert">
          <div>
            <strong>{voiceStage === "unsupported" ? "当前设备暂时不能录音" : `刚才没有听清${fieldLabel}`}</strong>
            <span>{voiceStage === "unsupported" ? "请继续手动填写，当前内容会保留。" : "可以重新录音，当前内容不会丢失。"}</span>
          </div>
          {voiceStage === "error" && <button type="button" onClick={() => beginVoiceRecognition(target)}><RotateCcw aria-hidden="true" />重新录音</button>}
          <button type="button" className="is-secondary" onClick={cancelCurrentRecording}>继续手动填写</button>
        </div>
      );
    }

    if (!voiceTranscript.trim()) return null;
    return (
      <div className="schedule-field-voice-status is-result" role="status" aria-live="polite">
        <div><strong>识别结果</strong><span>{voiceTranscript}</span></div>
        {voiceNeedsReplacement
          ? <button type="button" onClick={confirmVoiceReplacement}>替换当前{fieldLabel}</button>
          : <span className="schedule-field-voice-status__saved">已填入，可继续编辑</span>}
        <button type="button" className="is-secondary" onClick={() => beginVoiceRecognition(target)}>重新录音</button>
        <button type="button" className="is-secondary" onClick={cancelCurrentRecording}>{voiceNeedsReplacement ? "保留原内容" : "收起"}</button>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="schedule-page absolute inset-0 z-50 flex flex-col overflow-hidden bg-[#F5F2EB] text-[#1C2C24]">
      <SecondaryPageHeader
        title="提醒事项"
        icon={<CalendarDays aria-hidden="true" />}
        onBack={onClose}
      />

      <nav className="schedule-layer-tabs" aria-label="提醒事项查看方式">
        <button type="button" className={activeLayer === "daily" ? "is-active" : ""} aria-pressed={activeLayer === "daily"} onClick={() => setActiveLayer("daily")}>
          <CheckCircle2 aria-hidden="true" /><span><strong>每日待办</strong><small>按日期查看和完成当天事项</small></span>
        </button>
        <button type="button" className={activeLayer === "plans" ? "is-active" : ""} aria-pressed={activeLayer === "plans"} onClick={() => setActiveLayer("plans")}>
          <CalendarDays aria-hidden="true" /><span><strong>提醒计划</strong><small>新增或管理后续提醒安排</small></span>
        </button>
      </nav>

      {activeLayer === "daily" && <main className="schedule-page__main flex-1 min-h-0 p-6 flex gap-6">
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

        </section>

        <section className="schedule-agenda flex-1 min-w-0 rounded-[28px] border-2 border-[#E2DDD4] bg-white flex flex-col overflow-hidden" aria-label={`${selectedDateTitle}的日程`}>
          <div className="schedule-agenda__header shrink-0 px-7 py-5 border-b border-[#E8E2D9] flex items-center justify-between gap-5">
            <div><small className="text-[15px] font-black text-[#3B8C68]">每日执行记录</small><h2 className="mt-1 text-[28px] font-black">{selectedDateTitle}</h2></div>
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
                      {canCompleteItem(item) ? <button type="button" onClick={() => requestCompleteItem(item)} className="w-full h-[64px] rounded-[18px] bg-[#16824F] text-white text-[20px] font-black flex items-center justify-center gap-2"><Check className="w-7 h-7" />{getCompletionLabel(item)}</button> : <span className="flex h-[58px] items-center justify-center rounded-[18px] bg-[#EEEAE3] text-[17px] font-black text-gray-600">{getDisplayStatus(item).label}</span>}
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
                        {canCompleteItem(item) ? <button type="button" onClick={() => requestCompleteItem(item)} className="w-full h-[64px] rounded-[18px] bg-[#315F87] text-white text-[20px] font-black flex items-center justify-center gap-2"><Check className="w-7 h-7" />{getCompletionLabel(item)}</button> : <span className="flex h-[58px] items-center justify-center rounded-[18px] bg-[#EEEAE3] text-[17px] font-black text-gray-600">{getDisplayStatus(item).label}</span>}
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
      </main>}

      {activeLayer === "plans" && <main className="schedule-plans flex-1 min-h-0 p-6">
        <section className="schedule-plans__panel">
          <header className="schedule-plans__header">
            <div>
              <small>提醒定义</small>
              <h2>提醒计划</h2>
              <p>在这里设置名称、重复时间和起止范围。完成记录请到“每日待办”查看。</p>
            </div>
            {SHOW_QUICK_ADD && <div className="schedule-plans__actions">
              <button type="button" className="is-primary" onClick={openCreate}><Plus aria-hidden="true" />新增提醒计划</button>
            </div>}
          </header>

          <div className="schedule-plan-list custom-scroll">
            {items.length === 0 ? <div className="schedule-plan-empty"><CalendarDays aria-hidden="true" /><strong>还没有提醒计划</strong><p>新增计划后，每天需要执行的事项会出现在“每日待办”。</p></div>
              : items.map((item) => {
                const Icon = kindConfig[item.kind].icon;
                const planRange = item.repeat === "once"
                  ? formatShortDate(item.date)
                  : `${formatShortDate(item.date)}起${item.endDate ? `，至${formatShortDate(item.endDate)}` : "，长期"}`;
                return <article key={`plan-${item.id}`} className={`schedule-plan-card schedule-plan-card--${item.kind}`}>
                  <span className="schedule-plan-card__icon"><Icon aria-hidden="true" /></span>
                  <div className="schedule-plan-card__body">
                    <div><span>{item.kind === "medication" ? "用药计划" : "日常计划"}</span><span>{creationSourceLabels[item.creationSource]}</span>{item.lastModifiedBy && <span>最近由{item.lastModifiedBy}{item.lastModifiedAt ? ` ${item.lastModifiedAt}` : ""}修改</span>}</div>
                    <h3>{item.title}</h3>
                    <p>{item.detail}</p>
                    <dl>
                      <div><dt>提醒时间</dt><dd>{item.time}</dd></div>
                      <div><dt>重复方式</dt><dd>{repeatLabels[item.repeat]}</dd></div>
                      <div><dt>起止范围</dt><dd>{planRange}</dd></div>
                    </dl>
                  </div>
                  <div className="schedule-plan-card__actions">
                    <button type="button" onClick={() => openEdit(item)}><PenLine aria-hidden="true" />编辑计划</button>
                    <button type="button" className="is-danger" onClick={() => setDeleteItem(item)}><Trash2 aria-hidden="true" />删除计划</button>
                  </div>
                </article>;
              })}
          </div>
        </section>
      </main>}

      {toast && (
        <div className="schedule-toast absolute top-[122px] left-1/2 -translate-x-1/2 z-[80] rounded-2xl bg-[#1C2C24] px-6 py-3 text-[16px] font-black text-white shadow-xl">
          {toast}
        </div>
      )}

      {backfillItem && (
        <div className="absolute inset-0 z-[90] bg-black/60 flex items-center justify-center p-8">
          <section role="dialog" aria-modal="true" aria-labelledby="backfill-dialog-title" className="w-[700px] overflow-hidden rounded-[32px] border-2 border-[#76BA95] bg-white shadow-2xl">
            <header className="px-8 py-6 border-b border-[#E2E8E4] bg-[#F2FAF5]">
              <h2 id="backfill-dialog-title" className="text-[31px] font-black text-[#1C2C24]">超时后确认</h2>
              <p className="mt-2 text-[18px] font-bold text-[#476557]">请确认这项提醒已经完成</p>
            </header>
            <div className="p-8">
              <div className="rounded-[24px] bg-[#FFFAEE] border-2 border-[#E9C98D] px-6 py-5">
                <p className="text-[21px] font-black text-[#8A651C]">{backfillItem.time} · {backfillItem.kind === "medication" ? "用药提醒" : "日常提醒"}</p>
                <h3 className="mt-3 text-[28px] leading-tight font-black text-[#1C2C24]">{backfillItem.title}</h3>
                <p className="mt-3 text-[19px] leading-relaxed font-bold text-gray-600">{backfillItem.detail}</p>
              </div>
              <p className="mt-5 text-[17px] leading-relaxed font-bold text-gray-500">确认后将记录本次实际完成时间。</p>
            </div>
            <footer className="grid grid-cols-2 gap-4 px-8 py-6 border-t border-[#E2E8E4] bg-[#FAF8F5]">
              <button type="button" onClick={() => setBackfillItem(null)} className="h-[68px] rounded-[18px] border-2 border-[#CFC8BD] bg-white text-[20px] font-black text-gray-600">暂不确认</button>
              <button type="button" onClick={confirmBackfill} className="h-[68px] rounded-[18px] bg-[#16824F] text-white text-[20px] font-black flex items-center justify-center gap-3"><Check className="w-7 h-7" />{backfillItem.kind === "medication" ? "确认已服药" : "确认已完成"}</button>
            </footer>
          </section>
        </div>
      )}

      {deleteItem && (
        <div className="absolute inset-0 z-[90] bg-black/60 flex items-center justify-center p-8">
          <section role="dialog" aria-modal="true" aria-labelledby="delete-reminder-title" className="w-[700px] overflow-hidden rounded-[32px] border-2 border-[#DCA7A3] bg-white shadow-2xl">
            <header className="px-8 py-6 border-b border-[#F0D9D6] bg-[#FFF6F5]">
              <h2 id="delete-reminder-title" className="text-[30px] font-black text-[#7F2E29]">删除“{deleteItem.title}”？</h2>
            </header>
            <div className="p-8"><p className="text-[19px] leading-relaxed font-bold text-gray-600">删除后不再生成新的每日待办。已经产生的执行记录仍会保留，不会被改写。</p></div>
            <footer className="grid grid-cols-2 gap-4 px-8 py-6 border-t border-[#F0D9D6] bg-[#FAF8F5]">
              <button type="button" onClick={() => setDeleteItem(null)} className="h-[66px] rounded-[18px] border-2 border-[#CFC8BD] bg-white text-[19px] font-black text-gray-600">取消</button>
              <button type="button" onClick={confirmDelete} className="h-[66px] rounded-[18px] bg-[#A23B34] text-white text-[19px] font-black flex items-center justify-center gap-2"><Trash2 className="w-6 h-6" />删除提醒</button>
            </footer>
          </section>
        </div>
      )}

      {showEditor && (
        <div className="absolute inset-0 z-[70] bg-black/45 flex items-center justify-center p-6">
          <form onSubmit={saveItem} className="schedule-editor w-[760px] max-h-[92%] overflow-hidden rounded-[28px] bg-white shadow-2xl flex flex-col">
            <div className="shrink-0 px-7 py-5 border-b border-[#E8E2D9] flex items-center justify-between">
              <div>
                <h2 className="text-[25px] font-black">{editingItemId ? "编辑提醒计划" : "新增提醒计划"}</h2>
                <p className="mt-1 text-[14px] font-bold text-gray-500">{editingItemId ? "修改仅影响未执行的后续提醒，已有执行记录保持不变" : "设置计划后，每日执行事项会显示在“每日待办”"}</p>
              </div>
              <button type="button" onClick={closeEditor} aria-label="关闭提醒编辑" className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
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
                <div className="schedule-field-heading">
                  <label htmlFor="schedule-title" className="text-[16px] font-black">{formKind === "medication" ? "药品名称" : "事项名称"}</label>
                  {!editingItemId && <button type="button" onClick={() => beginVoiceRecognition("title")} aria-label={`语音填写${formKind === "medication" ? "药品名称" : "事项名称"}`}><Mic aria-hidden="true" />语音输入</button>}
                </div>
                <input
                  id="schedule-title"
                  value={formTitle}
                  onChange={(event) => setFormTitle(event.target.value)}
                  placeholder={formKind === "medication" ? "例如：阿司匹林肠溶片" : "例如：下午去复诊"}
                  className="mt-2 w-full h-14 rounded-2xl border-2 border-[#DDD7CE] px-4 text-[17px] font-bold outline-none focus:border-[#3B8C68]"
                />
                {!editingItemId && renderVoiceFieldFeedback("title")}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="schedule-date" className="text-[16px] font-black">开始日期</label>
                  <input id="schedule-date" type="date" min={todayKey} value={formDate} onChange={(event) => setFormDate(event.target.value)} className="mt-2 w-full h-14 rounded-2xl border-2 border-[#DDD7CE] px-4 text-[17px] font-bold" />
                </div>
                <div>
                  <label htmlFor="schedule-time" className="text-[16px] font-black">提醒时间</label>
                  <input id="schedule-time" type="time" value={formTime} onChange={(event) => setFormTime(event.target.value)} className="mt-2 w-full h-14 rounded-2xl border-2 border-[#DDD7CE] px-4 text-[17px] font-bold" />
                </div>
                <div>
                  <label htmlFor="schedule-end-date" className="text-[16px] font-black">结束日期</label>
                  <input id="schedule-end-date" type="date" min={formDate} value={formRepeat === "once" ? formDate : formEndDate} disabled={formRepeat === "once"} onChange={(event) => setFormEndDate(event.target.value)} className="mt-2 w-full h-14 rounded-2xl border-2 border-[#DDD7CE] px-4 text-[17px] font-bold disabled:opacity-60" />
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
                <div className="schedule-field-heading">
                  <label htmlFor="schedule-detail" className="text-[16px] font-black">{formKind === "medication" ? "剂量与服用说明" : "事项说明（选填）"}</label>
                  {!editingItemId && <button type="button" onClick={() => beginVoiceRecognition("detail")} aria-label={`语音填写${formKind === "medication" ? "剂量与服用说明" : "事项说明"}`}><Mic aria-hidden="true" />语音输入</button>}
                </div>
                <textarea
                  id="schedule-detail"
                  value={formDetail}
                  onChange={(event) => setFormDetail(event.target.value)}
                  placeholder={formKind === "medication" ? "例如：1片，饭后半小时温水送服" : "例如：复诊要带上病历卡"}
                  className="mt-2 w-full h-24 resize-none rounded-2xl border-2 border-[#DDD7CE] px-4 py-3 text-[16px] font-bold outline-none focus:border-[#3B8C68]"
                />
                {!editingItemId && renderVoiceFieldFeedback("detail")}
              </div>

            </div>

            <div className="shrink-0 px-7 py-5 border-t border-[#E8E2D9] flex justify-end gap-3 bg-[#FAF8F5]">
              <button type="button" onClick={closeEditor} className="h-12 px-6 rounded-xl border-2 border-[#DDD7CE] bg-white text-[16px] font-black text-gray-600">取消</button>
              <button type="submit" className="h-12 px-8 rounded-xl bg-[#14533C] text-white text-[16px] font-black">{editingItemId ? "保存计划" : "添加计划"}</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
