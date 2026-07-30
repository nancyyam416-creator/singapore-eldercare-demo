import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Flag,
  MessageCircleHeart,
  Music2,
  Pill,
  ShieldAlert,
  Sparkles,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { FulfillmentKind, FulfillmentRecord } from "../types";
import type { AcceptanceCareMode, AcceptanceCareRegion, AcceptanceCareScenario, AcceptanceCareTime, AcceptanceDisasterScenario } from "./InteractionAcceptanceConsole";

type RecommendationKind = "security" | "community" | "service" | "entertainment";

interface RailReminder {
  id: string;
  time: string;
  name: string;
  status: "pending" | "completed" | "unconfirmed" | "expired";
  priority?: "P0" | "P1" | "P2";
  category?: "medication" | "schedule";
  ctaTitle?: string;
}

interface RecommendationSlot {
  kind: RecommendationKind;
  startMinute: number;
  endMinute: number;
  priority: number;
  title: string;
  subtitle: string;
  count: number;
  Icon: LucideIcon;
}

interface HomeTaskRailProps {
  now: Date;
  reminders: RailReminder[];
  records: FulfillmentRecord[];
  securityUnreadCount: number;
  onCompleteReminder: (id: string) => void;
  onOpenTodayOverview: () => void;
  onOpenSchedule: () => void;
  onOpenMessageBox: () => void;
  onOpenCommunity: () => void;
  onOpenSpecialServices: () => void;
  onOpenRecommendation: (kind: RecommendationKind) => void;
  acceptanceCareRegion?: AcceptanceCareRegion;
  acceptanceCareTime?: AcceptanceCareTime;
  acceptanceCareMode?: AcceptanceCareMode;
  acceptanceCareScenario?: AcceptanceCareScenario;
  acceptanceDisasterScenario?: AcceptanceDisasterScenario;
}

const careCopy: Record<AcceptanceCareRegion, Record<AcceptanceCareScenario, string>> = {
  domestic: {
    daily: "阳光正好，去阳台晒晒太阳吧",
    festival: "今日冬至：常言“冬至大如年”，祝您合家欢聚",
    seasonal: "今日立秋：贴秋膘不宜油腻，多吃润燥食物",
  },
  singapore: {
    daily: "清晨空气清新，去公园散散步吧",
    festival: "今日冬至：吃一碗热汤圆，祝您和家人圆圆满满",
    seasonal: "气候湿热：午后宜喝点薏米水或凉茶，清热祛湿",
  },
};

const disasterCareCopy: Record<AcceptanceCareRegion, Record<AcceptanceDisasterScenario, string>> = {
  domestic: {
    typhoon: "台风来袭：风力强劲，请关紧门窗，切勿出门",
    rainstorm: "暴雨预警：外面雨势较大，请关好窗户，暂停出门",
    "cold-wave": "寒潮降温：今天比昨天冷多了，出门多穿件厚外套",
    heat: "酷暑高温：今天高达 36 度，多喝水，少在正午出门",
    haze: "今日雾霾：空气质量较差，出门请戴好口罩",
    "strong-wind": "今日大风：屋外风力较大，出门注意避开广告牌和树木",
  },
  singapore: {
    typhoon: "台风预警：海面风浪大，请收回阳台花盆并留在室内",
    rainstorm: "突发暴雨：雨势猛烈，出门请备好雨具，谨防路滑",
    "cold-wave": "雨季湿冷：天气转凉，外出记得多带一件薄外套",
    heat: "户外高热：午后紫外线极强，尽量待在室内吹吹风扇",
    haze: "烟霾、空气较差：请减少户外晨练，保持室内空气流通",
    "strong-wind": "强阵雨伴强风：关好阳台门窗，晾晒衣物及时收回",
  },
};

const recommendationSlots: RecommendationSlot[] = [
  { kind: "security", startMinute: 0, endMinute: 570, priority: 1, title: "防诈骗电话", subtitle: "按一下听警官说", count: 3, Icon: ShieldAlert },
  { kind: "community", startMinute: 570, endMinute: 750, priority: 2, title: "社区剪纸活动", subtitle: "按一下报名", count: 2, Icon: Flag },
  { kind: "service", startMinute: 750, endMinute: 1020, priority: 3, title: "预约家政保洁", subtitle: "按一下查看", count: 2, Icon: Wrench },
  { kind: "entertainment", startMinute: 1020, endMinute: 1440, priority: 4, title: "经典京剧", subtitle: "按一下听戏", count: 4, Icon: Music2 },
];

const reminderMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const medicinePeriod = (time: string) => time < "12:00" ? "早上" : time < "18:00" ? "中午" : "晚上";

const formatRecordTime = (occurredAt: string, now: Date) => {
  const date = new Date(occurredAt);
  if (Number.isNaN(date.getTime())) return occurredAt;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const recordDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDifference = Math.round((today.getTime() - recordDay.getTime()) / 86_400_000);
  const time = date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false });
  if (dayDifference === 0) return `今天 ${time}`;
  if (dayDifference === 1) return `昨天 ${time}`;
  return `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${time}`;
};

const recordIcon: Record<FulfillmentKind, LucideIcon> = {
  medication: Pill,
  schedule: CalendarDays,
  message: MessageCircleHeart,
  activity: Flag,
  service: Wrench,
  content: Music2,
};

export default function HomeTaskRail({
  now,
  reminders,
  records,
  securityUnreadCount,
  onCompleteReminder,
  onOpenTodayOverview,
  onOpenSchedule,
  onOpenMessageBox,
  onOpenCommunity,
  onOpenSpecialServices,
  onOpenRecommendation,
  acceptanceCareRegion = "domestic",
  acceptanceCareTime = "morning",
  acceptanceCareMode = "no-disaster",
  acceptanceCareScenario = "daily",
  acceptanceDisasterScenario = "rainstorm",
}: HomeTaskRailProps) {
  const [manualTaskId, setManualTaskId] = useState<string | null>(null);
  const manualTimerRef = useRef<number | null>(null);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const p0Tasks = useMemo(() => reminders.filter((item) => (item.priority ?? "P0") === "P0"), [reminders]);
  const completedCount = p0Tasks.filter((item) => item.status === "completed").length;
  const overdueTasks = p0Tasks.filter((item) => item.status !== "completed" && nowMinutes > reminderMinutes(item.time) + 30);
  const allCompleted = p0Tasks.length > 0 && completedCount === p0Tasks.length;
  const progress = Math.round((completedCount / Math.max(p0Tasks.length, 1)) * 100);

  const timedTask = p0Tasks
    .filter((item) => item.status !== "completed" && Math.abs(nowMinutes - reminderMinutes(item.time)) <= 30)
    .sort((first, second) => Math.abs(nowMinutes - reminderMinutes(first.time)) - Math.abs(nowMinutes - reminderMinutes(second.time)))[0];
  const manualTask = manualTaskId ? p0Tasks.find((item) => item.id === manualTaskId && item.status !== "completed") : undefined;
  const activeTask = manualTask ?? timedTask;
  const activeRecommendation = [...recommendationSlots]
    .filter((item) => nowMinutes >= item.startMinute && nowMinutes < item.endMinute)
    .sort((first, second) => first.priority - second.priority)[0] ?? recommendationSlots[0];
  const activeRecommendationCount = activeRecommendation.kind === "security"
    ? securityUnreadCount
    : activeRecommendation.count;

  useEffect(() => () => {
    if (manualTimerRef.current) window.clearTimeout(manualTimerRef.current);
  }, []);

  useEffect(() => {
    if (manualTaskId && !manualTask) {
      setManualTaskId(null);
    }
  }, [manualTask, manualTaskId]);

  const selectTask = (taskId: string) => {
    if (manualTimerRef.current) window.clearTimeout(manualTimerRef.current);
    setManualTaskId(taskId);
    manualTimerRef.current = window.setTimeout(() => {
      setManualTaskId(null);
      manualTimerRef.current = null;
    }, 5 * 60 * 1000);
  };

  const openRecord = (kind: FulfillmentKind) => {
    if (kind === "message") onOpenMessageBox();
    else if (kind === "medication" || kind === "schedule") onOpenSchedule();
    else if (kind === "activity") onOpenCommunity();
    else if (kind === "service") onOpenSpecialServices();
    else onOpenTodayOverview();
  };

  const currentHour = now.getHours();
  const currentMinutes = currentHour * 60 + now.getMinutes();
  const greeting = currentMinutes < 300 || currentMinutes >= 1320
    ? "夜深了"
    : currentMinutes < 660
      ? "早上好"
      : currentMinutes < 810
        ? "中午好"
        : currentMinutes < 1080
          ? "下午好"
          : "晚上好";
  const recentRecords = [...records]
    .sort((first, second) => new Date(second.occurredAt).getTime() - new Date(first.occurredAt).getTime())
    .slice(0, 2);
  const ActiveIcon = activeTask ? (activeTask.category === "schedule" ? CalendarDays : Pill) : activeRecommendation.Icon;
  const activeCareCopy = acceptanceCareTime === "late-night"
    ? "早点休息，祝您今晚好梦"
    : acceptanceCareMode === "disaster"
      ? disasterCareCopy[acceptanceCareRegion][acceptanceDisasterScenario]
      : careCopy[acceptanceCareRegion][acceptanceCareScenario];
  const ctaTitle = activeTask
    ? activeTask.category === "schedule" ? (activeTask.ctaTitle ?? activeTask.name) : `该吃${medicinePeriod(activeTask.time)}药啦`
    : activeRecommendation.title;
  const ctaSubtitle = activeTask
    ? activeTask.category === "schedule" ? "按一下：我已完成" : "按一下：我已服药"
    : activeRecommendation.subtitle;

  return (
    <aside className="task-rail" aria-label="今日关键任务">
      <section className={`task-summary ${overdueTasks.length > 0 ? "has-overdue" : ""}`}>
        {p0Tasks.length === 0 ? (
          <div className="task-greeting">
            <Sparkles aria-hidden="true" />
            <div><strong>{greeting}，王奶奶</strong><span>{activeCareCopy}</span></div>
          </div>
        ) : allCompleted ? (
          <div className="task-completed-title">
            <CheckCircle2 aria-hidden="true" />
            <div><strong>今日任务全部完成 🎉</strong><span>做得很好，安心休息</span></div>
          </div>
        ) : (
          <>
            <div className="task-title-row">
              <h2>今日任务进度</h2>
              <div className="task-summary-badges">
                {overdueTasks.length > 0 && <span className="is-overdue">有 {overdueTasks.length} 项未完成</span>}
                <span>{completedCount} / {p0Tasks.length} 完成</span>
              </div>
            </div>
            <div className="task-progress" aria-label={`已完成${progress}%`}><span style={{ width: `${progress}%` }} /></div>
            <div className="task-chips">
              {p0Tasks.map((item) => {
                const overdue = overdueTasks.some((task) => task.id === item.id);
                const TaskIcon = item.category === "schedule" ? CalendarDays : Pill;
                const content = <>{item.status === "completed" ? "✓" : overdue ? "!" : "○"} <TaskIcon /> {item.category === "schedule" ? item.name : `${medicinePeriod(item.time)}药`}</>;
                return item.status !== "completed" ? (
                  <button
                    key={item.id}
                    type="button"
                    className={`${manualTaskId === item.id ? "is-active " : ""}${overdue ? "is-overdue" : ""}`.trim()}
                    onClick={() => selectTask(item.id)}
                    aria-pressed={manualTaskId === item.id}
                    aria-label={`切换查看${item.category === "schedule" ? item.name : `${medicinePeriod(item.time)}药`}提醒`}
                  >
                    {content}
                  </button>
                ) : (
                  <span key={item.id} className="is-done" aria-label={`${item.category === "schedule" ? item.name : `${medicinePeriod(item.time)}药`}已完成`}>{content}</span>
                );
              })}
            </div>
          </>
        )}
      </section>

      <section className="primary-task">
        <button
          type="button"
          className={`medicine-orb ${activeTask ? `is-task is-${activeTask.category ?? "medication"}` : `is-recommendation is-${activeRecommendation.kind}`}`}
          onClick={() => activeTask ? onCompleteReminder(activeTask.id) : onOpenRecommendation(activeRecommendation.kind)}
          aria-label={`${ctaTitle} ${ctaSubtitle}${activeTask ? "" : `，${activeRecommendationCount}条推荐`}`}
        >
          {!activeTask && activeRecommendationCount > 0 && (
            <span className="recommendation-count" aria-hidden="true">{activeRecommendationCount}</span>
          )}
          <ActiveIcon aria-hidden="true" />
          <strong>{ctaTitle}</strong>
          <small>{ctaSubtitle}</small>
        </button>
        <button type="button" className="today-overview-button" onClick={onOpenTodayOverview}>
          <CalendarDays aria-hidden="true" />
          <strong>今日全览</strong>
          <ChevronRight aria-hidden="true" />
        </button>
      </section>

      <section className="recent-records">
        <h2>近期履约记录</h2>
        {recentRecords.length === 0 ? (
          <p className="recent-records-empty">今日暂无履约记录</p>
        ) : recentRecords.map((record) => {
          const Icon = recordIcon[record.kind];
          return (
            <button key={record.id} type="button" onClick={() => openRecord(record.kind)}>
              <Icon aria-hidden="true" />
              <span>{record.title}</span>
              <b>✓ {formatRecordTime(record.occurredAt, now)}</b>
            </button>
          );
        })}
      </section>
    </aside>
  );
}
