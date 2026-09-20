import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  ChevronRight,
  Clock3,
  Flag,
  Image,
  MessageCircleHeart,
  Music2,
  Pill,
  PhoneMissed,
  ShieldAlert,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import {
  createRecommendationRuntime,
  getEligibleRecommendationConfigs,
  HOME_RECOMMENDATION_CONFIGS,
  type HomeRecommendationConfig,
  type HomeRecommendationKind,
  type RecommendationRuntimeState,
} from "../home-right-content";
import type { MedicationReminder } from "../types";
import type {
  AcceptanceRightContentScenario,
} from "./InteractionAcceptanceConsole";
import {
  TODAY_OVERVIEW_RECOMMENDATIONS,
} from "./TodayOverviewPage";

interface RailReminder {
  id: string;
  time: string;
  scheduledAt?: string;
  name: string;
  status: "pending" | "completed" | "unconfirmed" | "expired";
  priority?: "P0" | "P1" | "P2";
  category?: "medication" | "schedule";
  ctaTitle?: string;
}

interface RailMessage {
  sender: string;
  played: boolean;
  type?: "voice" | "text" | "photo" | "call_log";
  deliveryStatus?: "sending" | "failed" | "delivered";
}

type RightContentSource = "p1" | "time" | "family" | "recommendation" | "empty";

interface RightContentItem {
  id: string;
  source: RightContentSource;
  kind: "medication" | "schedule" | "activity" | "missed-call" | "message" | "album" | HomeRecommendationKind | "empty";
  title: string;
  subtitle: string;
  count?: number;
  Icon: LucideIcon;
  recommendation?: HomeRecommendationConfig;
  reminderIds?: string[];
  minutesUntil?: number;
}

interface HomeTaskRailProps {
  now: Date;
  reminders: RailReminder[];
  messages: RailMessage[];
  albumUnreadCount: number;
  missedCallCount: number;
  onCompleteReminder: (id: string, fallbackReminder?: MedicationReminder) => void;
  onOpenReminder: (id: string, minutesUntil: number) => void;
  onOpenMessages: () => void;
  onOpenCommunity: () => void;
  onOpenContacts: () => void;
  onOpenAlbum: () => void;
  onOpenRecommendation: (kind: HomeRecommendationKind, contentId?: string) => void;
  acceptanceRightContentScenario?: AcceptanceRightContentScenario;
  acceptanceRightContentApplySignal?: number;
  acceptanceRightContentActionSignal?: number;
  acceptanceRevision?: number;
}

const senderRelation = (sender?: string) => sender?.match(/^(女儿|儿子|孙女|孙子|老伴)/)?.[1] ?? sender ?? "家人";

export default function HomeTaskRail({
  now,
  reminders,
  messages,
  albumUnreadCount,
  missedCallCount,
  onCompleteReminder,
  onOpenReminder,
  onOpenMessages,
  onOpenCommunity,
  onOpenContacts,
  onOpenAlbum,
  onOpenRecommendation,
  acceptanceRightContentScenario = "default",
  acceptanceRightContentApplySignal = 0,
  acceptanceRightContentActionSignal = 0,
  acceptanceRevision = 0,
}: HomeTaskRailProps) {
  const [recommendationRuntime, setRecommendationRuntime] = useState<Record<string, RecommendationRuntimeState>>(createRecommendationRuntime);
  const [activeRecommendationId, setActiveRecommendationId] = useState(HOME_RECOMMENDATION_CONFIGS[0].contentId);
  const [isInteractionLocked, setIsInteractionLocked] = useState(false);
  const [isTodayRecommendationOpen, setIsTodayRecommendationOpen] = useState(false);
  const [completedOverviewScheduleIds, setCompletedOverviewScheduleIds] = useState<Set<string>>(() => new Set());
  const [frozenRightContentItems, setFrozenRightContentItems] = useState<RightContentItem[] | null>(null);
  const [hasAppliedLockedUpdate, setHasAppliedLockedUpdate] = useState(false);
  const [dailyRecommendationsExpired, setDailyRecommendationsExpired] = useState(false);
  const interactionTimerRef = useRef<number | null>(null);
  const recommendationDayRef = useRef("");
  const nowTimestamp = now.getTime();
  const reminderTimestamp = (item: RailReminder) => {
    if (item.scheduledAt) return new Date(item.scheduledAt).getTime();
    const fallback = new Date(now);
    const [hours, minutes] = item.time.split(":").map(Number);
    fallback.setHours(hours, minutes, 0, 0);
    return fallback.getTime();
  };
  const p0Tasks = useMemo(() => reminders.filter((item) => (item.priority ?? "P0") === "P0"), [reminders]);

  const dueTasks = p0Tasks
    .filter((item) => {
      const elapsedSeconds = (nowTimestamp - reminderTimestamp(item)) / 1000;
      return item.status === "pending" && elapsedSeconds >= 0 && elapsedSeconds < 30 * 60;
    })
    .sort((first, second) => reminderTimestamp(first) - reminderTimestamp(second));
  const upcomingTasks = p0Tasks
    .filter((item) => {
      const secondsUntil = (reminderTimestamp(item) - nowTimestamp) / 1000;
      return item.status === "pending" && secondsUntil > 0 && secondsUntil <= 30 * 60;
    })
    .sort((first, second) => reminderTimestamp(first) - reminderTimestamp(second));

  const recommendationConfigs = useMemo(() => acceptanceRightContentScenario === "no-content"
    || acceptanceRightContentScenario === "next-day-exit"
    || dailyRecommendationsExpired
    ? HOME_RECOMMENDATION_CONFIGS.map((item) => ({ ...item, enabled: false }))
    : HOME_RECOMMENDATION_CONFIGS.map((item) => (
      ["third-party-entertainment", "third-party-entertainment-failure"].includes(acceptanceRightContentScenario)
        ? { ...item, enabled: item.kind === "entertainment" }
        : acceptanceRightContentScenario === "single-recommendation"
        ? { ...item, enabled: item.contentId === HOME_RECOMMENDATION_CONFIGS[0].contentId }
        : acceptanceRightContentScenario === "recommendation-order"
          ? { ...item, displayDurationMs: 3_200 }
          : item
    )), [acceptanceRightContentScenario, dailyRecommendationsExpired]);
  const eligibleRecommendations = useMemo(() => getEligibleRecommendationConfigs(
    recommendationConfigs,
    now,
    "elder",
    recommendationRuntime,
  ), [now, recommendationConfigs, recommendationRuntime]);
  const activeRecommendation = eligibleRecommendations.find((item) => item.contentId === activeRecommendationId)
    ?? eligibleRecommendations[0]
    ?? null;

  useEffect(() => () => {
    if (interactionTimerRef.current) window.clearTimeout(interactionTimerRef.current);
  }, []);

  useEffect(() => {
    setRecommendationRuntime(createRecommendationRuntime());
    setActiveRecommendationId(HOME_RECOMMENDATION_CONFIGS[0].contentId);
    setHasAppliedLockedUpdate(false);
    setIsInteractionLocked(acceptanceRightContentScenario === "interaction-locked");
    setFrozenRightContentItems(null);
    setIsTodayRecommendationOpen(false);
    setCompletedOverviewScheduleIds(new Set());
    setDailyRecommendationsExpired(acceptanceRightContentScenario === "next-day-exit");
  }, [acceptanceRevision, acceptanceRightContentScenario]);

  useEffect(() => {
    const dayKey = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");
    const previousDayKey = recommendationDayRef.current;
    recommendationDayRef.current = dayKey;
    if (previousDayKey && dayKey > previousDayKey) setDailyRecommendationsExpired(true);
  }, [now]);

  useEffect(() => {
    if (isInteractionLocked || !activeRecommendation) return;
    const timer = window.setTimeout(() => {
      const finishedId = activeRecommendation.contentId;
      const currentIndex = eligibleRecommendations.findIndex((item) => item.contentId === finishedId);
      const next = eligibleRecommendations[currentIndex + 1] ?? eligibleRecommendations[0];
      if (next && next.contentId !== finishedId) setActiveRecommendationId(next.contentId);
    }, activeRecommendation.displayDurationMs);
    return () => window.clearTimeout(timer);
  }, [
    activeRecommendation?.contentId,
    activeRecommendation?.displayDurationMs,
    isInteractionLocked,
  ]);

  useEffect(() => {
    if (acceptanceRightContentApplySignal <= 0 || acceptanceRightContentScenario !== "interaction-locked") return;
    setHasAppliedLockedUpdate(true);
    setIsInteractionLocked(false);
    setFrozenRightContentItems(null);
  }, [acceptanceRightContentApplySignal, acceptanceRightContentScenario]);

  const beginContentInteraction = (contentItems: RightContentItem[]) => {
    if (interactionTimerRef.current) window.clearTimeout(interactionTimerRef.current);
    setFrozenRightContentItems(contentItems);
    setIsInteractionLocked(true);
  };

  const finishContentInteraction = () => {
    if (acceptanceRightContentScenario === "interaction-locked" && !hasAppliedLockedUpdate) return;
    interactionTimerRef.current = window.setTimeout(() => {
      setFrozenRightContentItems(null);
      setIsInteractionLocked(false);
    }, 800);
  };

  const suppressLivePools = [
    "recommendations-only",
    "recommendation-order",
    "single-recommendation",
    "third-party-entertainment",
    "third-party-entertainment-failure",
    "no-content",
    "next-day-exit",
    "activity-updated",
    "activity-cancelled",
  ].includes(acceptanceRightContentScenario);
  const realUnreadMessages = messages.filter((item) => (
    !item.played
    && item.sender !== "您 (我)"
    && item.deliveryStatus !== "failed"
    && item.type !== "photo"
    && item.type !== "call_log"
  ));
  const serviceMessageSenders = new Set(["林佳慧", "社区服务站"]);
  const hasServiceUnread = realUnreadMessages.some((item) => serviceMessageSenders.has(item.sender));
  const hasFamilyUnread = realUnreadMessages.some((item) => !serviceMessageSenders.has(item.sender));
  const messageCount = acceptanceRightContentScenario === "new-message"
    ? Math.max(3, realUnreadMessages.length)
    : acceptanceRightContentScenario === "time-and-family"
      ? Math.max(2, realUnreadMessages.length)
      : acceptanceRightContentScenario === "interaction-locked"
        ? hasAppliedLockedUpdate ? Math.max(2, realUnreadMessages.length) : 0
        : suppressLivePools || ["new-album", "new-album-invalid-relation"].includes(acceptanceRightContentScenario) || acceptanceRightContentScenario === "missed-call"
          ? 0
          : realUnreadMessages.length;
  const visibleAlbumUnreadCount = ["new-album", "new-album-invalid-relation"].includes(acceptanceRightContentScenario)
    ? Math.max(2, albumUnreadCount)
    : suppressLivePools || ["new-message", "missed-call", "interaction-locked"].includes(acceptanceRightContentScenario)
      ? 0
      : albumUnreadCount;
  const visibleMissedCallCount = acceptanceRightContentScenario === "missed-call"
    ? Math.max(2, missedCallCount)
    : suppressLivePools || acceptanceRightContentScenario !== "default"
      ? 0
      : missedCallCount;

  const currentTask = dueTasks[0] ?? upcomingTasks[0];
  const currentTaskIsDue = currentTask ? nowTimestamp >= reminderTimestamp(currentTask) : false;
  const currentTaskGroup = currentTask
    ? (currentTaskIsDue ? dueTasks : upcomingTasks).filter((item) => (
        item.time === currentTask.time
        && item.scheduledAt === currentTask.scheduledAt
        && (item.category === "schedule") === (currentTask.category === "schedule")
      ))
    : [];
  const currentTaskCount = Math.max(1, currentTaskGroup.length);
  const timeItems: RightContentItem[] = suppressLivePools || ["new-message", "new-album", "new-album-invalid-relation", "missed-call", "interaction-locked"].includes(acceptanceRightContentScenario)
    ? []
    : acceptanceRightContentScenario === "activity-updated"
      ? [{
          id: "activity-updated",
          source: "time",
          kind: "activity",
          title: "活动信息已更新",
          subtitle: "14:00 社区剪纸活动 · 社区活动室2",
          Icon: Flag,
        }]
      : acceptanceRightContentScenario === "activity-cancelled"
        ? []
    : ["time-and-family", "activity-upcoming"].includes(acceptanceRightContentScenario)
      ? [{
          id: "activity-upcoming",
          source: "time",
          kind: "activity",
          title: "活动快开始了",
          subtitle: "13:10 社区剪纸活动",
          Icon: Flag,
        }]
      : acceptanceRightContentScenario === "activity-started"
        ? [{
            id: "activity-started",
            source: "p1",
            kind: "activity",
            title: "活动开始了",
            subtitle: "社区剪纸活动",
            Icon: Flag,
          }]
      : currentTask
        ? [{
            id: currentTask.id,
            source: currentTaskIsDue ? "p1" : "time",
            kind: currentTask.category === "schedule" ? "schedule" : "medication",
            title: currentTask.category === "schedule"
              ? (currentTaskIsDue ? "该做事项了" : "事项时间快到了")
              : (currentTaskIsDue ? "该用药了" : "用药时间快到了"),
            subtitle: currentTaskCount > 1
              ? currentTaskIsDue
                ? `有${currentTaskCount}项${currentTask.category === "schedule" ? "事项" : "用药"}待完成`
                : `${currentTask.time} 有${currentTaskCount}项${currentTask.category === "schedule" ? "事项" : "用药"}`
              : `${currentTaskIsDue ? "" : `${currentTask.time} `}${currentTask.name}`,
            Icon: currentTask.category === "schedule" ? CalendarDays : Pill,
            reminderIds: currentTaskGroup.map((item) => item.id),
            minutesUntil: Math.max(0, Math.ceil((reminderTimestamp(currentTask) - nowTimestamp) / 60_000)),
          }]
        : [];

  const currentDayKey = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
  const todayReminderItems = reminders
    .filter((item) => !item.scheduledAt || item.scheduledAt.slice(0, 10) === currentDayKey)
    .map((item) => {
      const elapsedSeconds = (nowTimestamp - reminderTimestamp(item)) / 1000;
      const status = completedOverviewScheduleIds.has(item.id)
        ? "completed" as const
        : item.status === "pending"
          ? elapsedSeconds < 0
            ? "not-yet" as const
            : elapsedSeconds < 30 * 60
              ? "pending" as const
              : "unconfirmed" as const
          : item.status;
      return {
        id: item.id,
        time: item.time,
        title: item.name,
        status,
        category: item.category === "schedule" ? "schedule" as const : "medication" as const,
        Icon: item.category === "schedule" ? CalendarDays : Pill,
      };
    })
    .sort((first, second) => first.time.localeCompare(second.time));

  const familyItems = [
    visibleMissedCallCount > 0 ? {
      id: "family-missed-call",
      source: "family" as const,
      kind: "missed-call" as const,
      title: "您有未接来电",
      subtitle: visibleMissedCallCount > 1 ? `共${visibleMissedCallCount}次未接来电` : "家人",
      count: visibleMissedCallCount,
      Icon: PhoneMissed,
    } : null,
    messageCount > 0 ? {
      id: "family-messages",
      source: "family" as const,
      kind: "message" as const,
      title: hasServiceUnread && !hasFamilyUnread
        ? "服务人员给您留言了"
        : hasServiceUnread && hasFamilyUnread
          ? "您有新的留言"
          : "家人给您留言了",
      subtitle: messageCount > 1 ? `共${messageCount}条新留言` : senderRelation(realUnreadMessages[0]?.sender),
      count: messageCount,
      Icon: MessageCircleHeart,
    } : null,
    visibleAlbumUnreadCount > 0 ? {
      id: "family-album",
      source: "family" as const,
      kind: "album" as const,
      title: "家人分享了新影像",
      subtitle: visibleAlbumUnreadCount > 1 ? `共${visibleAlbumUnreadCount}项新影像` : "女儿小敏",
      count: visibleAlbumUnreadCount,
      Icon: Image,
    } : null,
  ].filter(Boolean) as RightContentItem[];

  const recommendationItem: RightContentItem = activeRecommendation ? {
    id: activeRecommendation.contentId,
    source: "recommendation",
    kind: activeRecommendation.kind,
    title: activeRecommendation.title,
    subtitle: activeRecommendation.kind === "entertainment"
      ? "按一下观看"
      : (activeRecommendation.subtitle ?? ""),
    Icon: activeRecommendation.kind === "security"
      ? ShieldAlert
      : activeRecommendation.kind === "community"
        ? Flag
        : activeRecommendation.kind === "service"
          ? Wrench
          : Music2,
    recommendation: activeRecommendation,
  } : {
    id: "right-content-empty",
    source: "empty",
    kind: "empty",
    title: "今日暂无内容",
    subtitle: "有新内容时会显示在这里",
    Icon: Clock3,
  };

  const latestMergedItems = [...timeItems, ...familyItems, recommendationItem].slice(0, 1);
  const mergedItems = isInteractionLocked && frozenRightContentItems
    ? frozenRightContentItems
    : latestMergedItems;
  const primaryContent = mergedItems[0] ?? recommendationItem;
  const sourceLabel: Record<RightContentSource, string> = {
    p1: "到点提醒",
    time: "时间提醒",
    family: "家庭互动",
    recommendation: "今日推荐",
    empty: "暂无内容",
  };

  const activateContent = (item: RightContentItem) => {
    if (item.kind === "medication" || item.kind === "schedule") {
      if (item.reminderIds?.length === 1) {
        onOpenReminder(item.reminderIds[0], item.minutesUntil ?? 0);
      } else {
        setIsTodayRecommendationOpen(true);
      }
    }
    else if (item.kind === "activity") onOpenCommunity();
    else if (item.kind === "missed-call") onOpenContacts();
    else if (item.kind === "message") onOpenMessages();
    else if (item.kind === "album") onOpenAlbum();
    else if (item.kind === "empty") return;
    else {
      const entertainmentFailed = acceptanceRightContentScenario === "third-party-entertainment-failure"
        && item.kind === "entertainment";
      if (item.source === "recommendation" && item.recommendation && !entertainmentFailed) {
        const recommendationId = item.recommendation.contentId;
        setRecommendationRuntime((runtime) => ({
          ...runtime,
          [recommendationId]: {
            viewed: true,
          },
        }));
      }
      onOpenRecommendation(item.kind, item.recommendation?.contentId);
    }
  };

  const primaryContentRef = useRef(primaryContent);
  const activateContentRef = useRef(activateContent);
  primaryContentRef.current = primaryContent;
  activateContentRef.current = activateContent;

  useEffect(() => {
    if (acceptanceRightContentActionSignal <= 0) return;
    activateContentRef.current(primaryContentRef.current);
  }, [acceptanceRightContentActionSignal]);

  const contentClass = (item: RightContentItem) => `is-${item.source} is-${item.kind}`;

  return (
    <aside className="task-rail" aria-label="首页右侧内容">
      <section className={`primary-task${isTodayRecommendationOpen ? " is-overview-open" : ""}`}>
        {isTodayRecommendationOpen ? (
          <section className="home-today-popover" aria-label="今日全览内容">
            <header>
              <div>
                <strong>今日全览</strong>
              </div>
            </header>
            <div className="home-today-scroll">
              <section className="home-today-section" aria-label="提醒事项">
                <div className="home-today-section-title">
                  <Clock3 aria-hidden="true" />
                  <strong>提醒事项</strong>
                </div>
                <div className="home-today-list is-schedule">
                  {todayReminderItems.map((item) => {
                    const currentStatus = completedOverviewScheduleIds.has(item.id) ? "completed" : item.status;
                    const statusLabel = {
                      "not-yet": "未到时间",
                      pending: "待完成",
                      completed: "已完成",
                      unconfirmed: item.category === "medication" ? "用药尚未确认" : "事项尚未完成",
                      expired: "已过期",
                    }[currentStatus];
                    const isActionable = currentStatus === "pending"
                      || currentStatus === "unconfirmed"
                      || currentStatus === "expired";
                    const actionLabel = item.category === "medication" ? "服药" : "完成";
                    return (
                      <article
                        key={item.id}
                        className={`is-${currentStatus}`}
                      >
                        <div className={`home-today-schedule-summary${isActionable ? " has-action" : ""}`}>
                          <time>{item.time}</time>
                          <span className="home-today-item-icon"><item.Icon aria-hidden="true" /></span>
                          <strong>{item.title}</strong>
                          <small>{statusLabel}</small>
                          {isActionable && (
                            <button
                            type="button"
                            className="home-today-schedule-action"
                            onClick={() => {
                              setCompletedOverviewScheduleIds((current) => new Set(current).add(item.id));
                              onCompleteReminder(item.id);
                            }}
                            >
                              {actionLabel}
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>

              <section className="home-today-section" aria-label="今日值得看">
                <div className="home-today-section-title">
                  <ShieldAlert aria-hidden="true" />
                  <strong>今日值得看</strong>
                </div>
                <div className="home-today-list is-recommendation">
                  {TODAY_OVERVIEW_RECOMMENDATIONS.map((recommendation) => (
                    <button
                      key={recommendation.id}
                      type="button"
                      className={`is-${recommendation.kind}`}
                      onClick={() => {
                        setIsTodayRecommendationOpen(false);
                        onOpenRecommendation(recommendation.kind, recommendation.id);
                      }}
                    >
                      <span className="home-today-item-icon"><recommendation.Icon aria-hidden="true" /></span>
                      <span className="home-today-item-copy">
                        <small>{recommendation.eyebrow}</small>
                        <strong>{recommendation.title}</strong>
                      </span>
                      <ChevronRight aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </section>
        ) : (
          <div
            className="right-content-deck"
            onPointerDown={() => beginContentInteraction(mergedItems)}
            onPointerUp={finishContentInteraction}
            onPointerCancel={finishContentInteraction}
          >
            <button
              type="button"
              className={`medicine-orb ${contentClass(primaryContent)}`}
              onClick={() => activateContent(primaryContent)}
              disabled={primaryContent.source === "empty"}
              aria-label={`${sourceLabel[primaryContent.source]}：${primaryContent.title} ${primaryContent.subtitle}`}
            >
              {primaryContent.count && primaryContent.count > 0 && (
                <span className="recommendation-count" aria-hidden="true">{primaryContent.count}</span>
              )}
              <primaryContent.Icon aria-hidden="true" />
              <strong>{primaryContent.title}</strong>
              <small>{primaryContent.subtitle}</small>
            </button>

            {acceptanceRightContentScenario === "interaction-locked" && !hasAppliedLockedUpdate && (
              <div className="right-content-pending" role="status">
                <Clock3 aria-hidden="true" />正在查看，新留言将在操作结束后显示
              </div>
            )}
          </div>
        )}
        <div className="today-overview-entry-group">
          <button
            type="button"
            className={`today-overview-button${isTodayRecommendationOpen ? " is-open" : ""}`}
            onClick={() => setIsTodayRecommendationOpen((isOpen) => !isOpen)}
            aria-label={isTodayRecommendationOpen ? "收起首页今日全览" : "在首页展开今日全览"}
          >
            <CalendarDays aria-hidden="true" />
            <strong>{isTodayRecommendationOpen ? "收起全览" : "今日全览"}</strong>
          </button>
        </div>
      </section>

    </aside>
  );
}
