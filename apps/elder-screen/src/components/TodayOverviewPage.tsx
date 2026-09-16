import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarCheck2,
  Check,
  CheckCircle2,
  Clock3,
  Flag,
  Footprints,
  HeartPulse,
  Newspaper,
  Pill,
  ShieldAlert,
  Tv2,
  WifiOff,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import "./today-overview.css";
import { getEntertainmentContentById } from "../entertainment-content";

type ScheduleStatus = "not-yet" | "pending" | "completed" | "unconfirmed" | "expired";
export type RecommendationKind = "security" | "community" | "service" | "entertainment";

interface TodayOverviewPageProps {
  isOpen: boolean;
  onClose: () => void;
  initialRecommendationKind?: RecommendationKind | null;
  initialRecommendationId?: string | null;
  entertainmentOpenShouldFail?: boolean;
  onFulfillment?: (record: { kind: "schedule" | "activity" | "service" | "content"; title: string }) => void;
  isSecurityRead?: boolean;
  onOpenSecurity?: () => void;
  isServiceBooked?: boolean;
  onOpenService?: () => void;
}

interface OverviewSchedule {
  id: string;
  time: string;
  title: string;
  status: ScheduleStatus;
  Icon: LucideIcon;
}

interface OverviewRecommendation {
  id: string;
  kind: RecommendationKind;
  priority: number;
  eyebrow: string;
  title: string;
  description: string;
  actionLabel: string;
  completedLabel: string;
  targetUrl?: string;
  Icon: LucideIcon;
}

const SCHEDULE_STORAGE_KEY = "u2g-today-overview-schedules-v3";
const SYNC_QUEUE_STORAGE_KEY = "u2g-today-overview-sync-queue-v2";
const RECOMMENDATION_STORAGE_KEY = "u2g-today-overview-recommendations-v2";
const entertainmentRecommendationContent = getEntertainmentContentById("ENT-002");

const defaultSchedules: OverviewSchedule[] = [
  { id: "morning-med", time: "08:00", title: "早上药", status: "completed", Icon: Pill },
  { id: "glucose", time: "10:30", title: "测血糖", status: "unconfirmed", Icon: HeartPulse },
  { id: "noon-med", time: "12:00", title: "中午药", status: "expired", Icon: Pill },
  { id: "walk", time: "14:00", title: "下午散步", status: "pending", Icon: Footprints },
  { id: "news", time: "19:30", title: "收看新闻联播", status: "not-yet", Icon: Tv2 },
];

const recommendations: OverviewRecommendation[] = [
  {
    id: "anti-fraud",
    kind: "security",
    priority: 1,
    eyebrow: "安全资讯",
    title: "诈骗电话怎么防？",
    description: "警方提醒：陌生人要求转账，先挂断再告知家人。",
    actionLabel: "立即了解",
    completedLabel: "已阅读",
    Icon: ShieldAlert,
  },
  {
    id: "community-show",
    kind: "community",
    priority: 2,
    eyebrow: "社区活动",
    title: "周五老年文艺汇演",
    description: "社区大舞台，精彩节目，周五 14:00 开始。",
    actionLabel: "我想参加",
    completedLabel: "已选择：我想参加",
    Icon: Flag,
  },
  {
    id: "home-cleaning",
    kind: "service",
    priority: 3,
    eyebrow: "特约服务",
    title: "预约家政保洁",
    description: "本周还有 2 个名额，可预约上门服务。",
    actionLabel: "立即预约",
    completedLabel: "已预约",
    Icon: Wrench,
  },
  {
    id: "REC-010",
    kind: "entertainment",
    priority: 4,
    eyebrow: "第三方内容",
    title: entertainmentRecommendationContent?.name ?? "经典华语金曲",
    description: "按一下打开第三方娱乐内容。",
    actionLabel: "立即观看",
    completedLabel: "已查看",
    targetUrl: entertainmentRecommendationContent?.targetUrl,
    Icon: Tv2,
  },
];

export const TODAY_OVERVIEW_SCHEDULES = defaultSchedules;
export const TODAY_OVERVIEW_RECOMMENDATIONS = recommendations;

function readStoredStatuses() {
  try {
    const stored = window.localStorage.getItem(SCHEDULE_STORAGE_KEY);
    return stored ? JSON.parse(stored) as Record<string, ScheduleStatus> : {};
  } catch {
    return {};
  }
}

function readStringArray(key: string) {
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? JSON.parse(stored) as string[] : [];
  } catch {
    return [];
  }
}

const isValidHttpTarget = (targetUrl?: string) => {
  if (!targetUrl) return false;
  try {
    const parsed = new URL(targetUrl);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

export default function TodayOverviewPage({
  isOpen,
  onClose,
  initialRecommendationKind,
  initialRecommendationId,
  entertainmentOpenShouldFail = false,
  onFulfillment,
  isSecurityRead = false,
  onOpenSecurity,
  isServiceBooked = false,
  onOpenService,
}: TodayOverviewPageProps) {
  const [scheduleStatuses, setScheduleStatuses] = useState<Record<string, ScheduleStatus>>(readStoredStatuses);
  const [pendingSyncIds, setPendingSyncIds] = useState<string[]>(() => readStringArray(SYNC_QUEUE_STORAGE_KEY));
  const [completedRecommendationIds, setCompletedRecommendationIds] = useState<string[]>(() => readStringArray(RECOMMENDATION_STORAGE_KEY));
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [syncNotice, setSyncNotice] = useState("");
  const [activeRecommendationId, setActiveRecommendationId] = useState<string | null>(null);
  const [entertainmentOpenState, setEntertainmentOpenState] = useState<"ready" | "retrying" | "failure">("ready");

  const sortedSchedules = useMemo(() => defaultSchedules
    .map((item) => ({ ...item, status: scheduleStatuses[item.id] ?? item.status }))
    .sort((first, second) => first.time.localeCompare(second.time)), [scheduleStatuses]);

  const sortedRecommendations = useMemo(() => [...recommendations].sort((first, second) => first.priority - second.priority), []);
  const activeRecommendation = recommendations.find((item) => item.id === activeRecommendationId);
  const activeRecommendationCompleted = activeRecommendation
    ? activeRecommendation.kind === "entertainment"
      ? false
      : activeRecommendation.kind === "security"
      ? isSecurityRead
      : activeRecommendation.kind === "service"
        ? isServiceBooked
      : completedRecommendationIds.includes(activeRecommendation.id)
    : false;

  useEffect(() => {
    if (!isOpen || !initialRecommendationKind) return;
    const recommendation = recommendations.find((item) => item.id === initialRecommendationId)
      ?? recommendations.find((item) => item.kind === initialRecommendationKind);
    if (recommendation?.kind === "security" && onOpenSecurity) {
      onOpenSecurity();
      return;
    }
    if (recommendation?.kind === "service" && onOpenService) {
      onOpenService();
      return;
    }
    const entertainmentTargetInvalid = recommendation?.kind === "entertainment"
      && !isValidHttpTarget(recommendation.targetUrl);
    if (recommendation?.kind === "entertainment" && !entertainmentOpenShouldFail && !entertainmentTargetInvalid) {
      window.location.assign(recommendation.targetUrl!);
      return;
    }
    setEntertainmentOpenState(recommendation?.kind === "entertainment" ? "failure" : "ready");
    setActiveRecommendationId(recommendation?.id ?? null);
  }, [entertainmentOpenShouldFail, initialRecommendationId, initialRecommendationKind, isOpen, onOpenSecurity, onOpenService]);

  useEffect(() => {
    if (!isOpen) setActiveRecommendationId(null);
  }, [isOpen]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!isOnline || pendingSyncIds.length === 0) return;
    const timer = window.setTimeout(() => {
      setPendingSyncIds([]);
      window.localStorage.setItem(SYNC_QUEUE_STORAGE_KEY, "[]");
      setSyncNotice("离线补打记录已同步");
      window.setTimeout(() => setSyncNotice(""), 3000);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [isOnline, pendingSyncIds]);

  const handleBackfill = (scheduleId: string) => {
    const nextStatuses = { ...scheduleStatuses, [scheduleId]: "completed" as const };
    setScheduleStatuses(nextStatuses);
    window.localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(nextStatuses));

    if (!isOnline) {
      const nextQueue = pendingSyncIds.includes(scheduleId) ? pendingSyncIds : [...pendingSyncIds, scheduleId];
      setPendingSyncIds(nextQueue);
      window.localStorage.setItem(SYNC_QUEUE_STORAGE_KEY, JSON.stringify(nextQueue));
    }
    const schedule = defaultSchedules.find((item) => item.id === scheduleId);
    if (schedule) onFulfillment?.({ kind: "schedule", title: `${schedule.title}已确认` });
  };

  const handleRecommendation = (recommendationId: string) => {
    const recommendation = recommendations.find((item) => item.id === recommendationId);
    if (!isOnline || !recommendation) return;
    if (recommendation.kind === "entertainment") {
      if (entertainmentOpenShouldFail || !isValidHttpTarget(recommendation.targetUrl)) {
        setEntertainmentOpenState("failure");
        setActiveRecommendationId(recommendation.id);
        return;
      }
      window.location.assign(recommendation.targetUrl!);
      return;
    }
    const completed = recommendation.kind === "security"
      ? isSecurityRead
      : recommendation.kind === "service"
        ? isServiceBooked
      : completedRecommendationIds.includes(recommendationId);
    if (completed) return;
    if (recommendation.kind === "security") {
      onOpenSecurity?.();
      return;
    }
    if (recommendation.kind === "service") {
      onOpenService?.();
      return;
    }

    const nextCompletedIds = [...completedRecommendationIds, recommendationId];
    setCompletedRecommendationIds(nextCompletedIds);
    window.localStorage.setItem(RECOMMENDATION_STORAGE_KEY, JSON.stringify(nextCompletedIds));
    if (recommendation.kind === "community") onFulfillment?.({ kind: "activity", title: `已选择参加${recommendation.title}` });
    else onFulfillment?.({ kind: "content", title: `${recommendation.completedLabel}${recommendation.title}` });
  };

  const retryEntertainmentOpen = () => {
    setEntertainmentOpenState("retrying");
    window.setTimeout(() => setEntertainmentOpenState("failure"), 650);
  };

  if (!isOpen) return null;

  return (
    <main className="today-overview-page" aria-label="今日全览">
      <header className="today-overview-header">
        <button type="button" onClick={onClose}>
          <ArrowLeft aria-hidden="true" />
          <span>返回首页</span>
        </button>
        <div>
          <CalendarCheck2 aria-hidden="true" />
          <h1>今日全览</h1>
        </div>
      </header>

      <div className="today-overview-layout">
        <section className="today-schedule-panel" aria-labelledby="today-schedule-title">
          <div className="overview-section-title">
            <div>
              <Clock3 aria-hidden="true" />
              <h2 id="today-schedule-title">提醒事项</h2>
            </div>
            <span>00:00—23:59</span>
          </div>

          <div className="today-timeline">
            {sortedSchedules.map((item) => {
              const isDone = item.status === "completed";
              const canBackfill = item.status === "unconfirmed";
              const isPendingSync = pendingSyncIds.includes(item.id);
              const statusLabel: Record<ScheduleStatus, string> = {
                "not-yet": "未到时间",
                pending: "待完成",
                completed: "已完成",
                unconfirmed: "未确认",
                expired: "已过期",
              };
              return (
                <article key={item.id} className={`today-schedule-row is-${item.status}`}>
                  <time>{item.time}</time>
                  <span className="today-timeline-dot" aria-hidden="true" />
                  <div className="today-schedule-card">
                    <div className="today-schedule-name">
                      <item.Icon aria-hidden="true" />
                      <strong>{item.title}</strong>
                    </div>
                    {canBackfill && (
                      <div className="today-schedule-action">
                        <span className="today-schedule-state is-unconfirmed">{statusLabel[item.status]}</span>
                        <button type="button" onClick={() => handleBackfill(item.id)}>补打卡</button>
                      </div>
                    )}
                    {isDone && (
                      <span className="today-schedule-state">
                        <Check aria-hidden="true" />
                        {statusLabel[item.status]}
                        {isPendingSync && <small>待联网同步</small>}
                      </span>
                    )}
                    {!isDone && !canBackfill && (
                      <span className={`today-schedule-state is-${item.status}`}>{statusLabel[item.status]}</span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          <div className="today-offline-note">
            {isOnline ? <CheckCircle2 aria-hidden="true" /> : <WifiOff aria-hidden="true" />}
            <span>{isOnline ? (syncNotice || "日程已保存，本地补打记录会自动同步") : "离线模式：日程仍可查看和补打，联网后自动同步"}</span>
          </div>
        </section>

        <section className="today-recommendation-panel" aria-labelledby="today-worth-title">
          <div className="overview-section-title">
            <div>
              <Newspaper aria-hidden="true" />
              <h2 id="today-worth-title">今日值得看</h2>
            </div>
            <span>为您精选</span>
          </div>

          {!isOnline && (
            <div className="today-network-warning" role="status">
              <WifiOff aria-hidden="true" />
              <div><strong>网络异常</strong><span>请连接网络后查看</span></div>
            </div>
          )}

          <div className="today-recommendation-list">
            {sortedRecommendations.map((item) => {
              const completed = item.kind === "entertainment"
                ? false
                : item.kind === "security"
                ? isSecurityRead
                : item.kind === "service"
                  ? isServiceBooked
                : completedRecommendationIds.includes(item.id);
              return (
                <article key={item.id} className={`today-recommendation-card is-${item.kind}`}>
                  <span className="today-recommendation-icon"><item.Icon aria-hidden="true" /></span>
                  <div className="today-recommendation-copy">
                    <span>{item.eyebrow}</span>
                    <strong>{item.title}</strong>
                    <p>{item.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRecommendation(item.id)}
                    disabled={!isOnline || completed}
                  >
                    {!isOnline ? "网络异常" : completed ? item.completedLabel : item.actionLabel}
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      </div>

      {activeRecommendation && (
        <section className="recommendation-detail-backdrop" role="dialog" aria-modal="true" aria-label={`${activeRecommendation.eyebrow}详情`}>
          <article className={`recommendation-detail is-${activeRecommendation.kind}`}>
            <button
              type="button"
              className="recommendation-detail-close"
              onClick={() => setActiveRecommendationId(null)}
              aria-label="关闭详情"
            >
              <X aria-hidden="true" />
            </button>
            {activeRecommendation.kind === "entertainment" && entertainmentOpenState !== "ready" ? (
              <div className="recommendation-detail-failure" role="status">
                <WifiOff aria-hidden="true" />
                <h2>暂时无法打开</h2>
                <p>第三方内容暂时无法连接，请稍后重试。</p>
                <div>
                  <button type="button" onClick={retryEntertainmentOpen} disabled={entertainmentOpenState === "retrying"}>
                    {entertainmentOpenState === "retrying" ? "正在重试…" : "重试"}
                  </button>
                  <button type="button" onClick={onClose}>返回</button>
                </div>
              </div>
            ) : (
              <>
                <span className="recommendation-detail-icon"><activeRecommendation.Icon aria-hidden="true" /></span>
                <span className="recommendation-detail-eyebrow">{activeRecommendation.eyebrow}</span>
                <h2>{activeRecommendation.title}</h2>
                <p>{activeRecommendation.description}</p>
                <button
                  type="button"
                  className="recommendation-detail-action"
                  onClick={() => handleRecommendation(activeRecommendation.id)}
                  disabled={!isOnline || activeRecommendationCompleted}
                >
                  {!isOnline
                    ? "网络异常"
                    : activeRecommendationCompleted
                        ? activeRecommendation.completedLabel
                        : activeRecommendation.actionLabel}
                </button>
                {!isOnline && <small>请连接网络后查看</small>}
              </>
            )}
          </article>
        </section>
      )}
    </main>
  );
}
