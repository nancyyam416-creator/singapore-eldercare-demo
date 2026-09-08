import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
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
  X,
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
  TODAY_OVERVIEW_SCHEDULES,
} from "./TodayOverviewPage";

interface RailReminder {
  id: string;
  time: string;
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
}

type RightContentSource = "p1" | "time" | "family" | "recommendation" | "ai";

interface RightContentItem {
  id: string;
  source: RightContentSource;
  kind: "medication" | "schedule" | "activity" | "missed-call" | "message" | "album" | HomeRecommendationKind | "ai";
  title: string;
  subtitle: string;
  count?: number;
  Icon: LucideIcon;
  recommendation?: HomeRecommendationConfig;
}

interface HomeTaskRailProps {
  now: Date;
  reminders: RailReminder[];
  messages: RailMessage[];
  albumUnreadCount: number;
  missedCallCount: number;
  onCompleteReminder: (id: string, fallbackReminder?: MedicationReminder) => void;
  onOpenTodayOverview: () => void;
  onOpenSchedule: () => void;
  onOpenMessages: () => void;
  onOpenCommunity: () => void;
  onOpenContacts: () => void;
  onOpenAlbum: () => void;
  onOpenAssistant: () => void;
  onOpenRecommendation: (kind: HomeRecommendationKind) => void;
  acceptanceRightContentScenario?: AcceptanceRightContentScenario;
  acceptanceRightContentApplySignal?: number;
  acceptanceRevision?: number;
}

const reminderMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const medicinePeriod = (time: string) => time < "12:00" ? "早上" : time < "18:00" ? "中午" : "晚上";

const senderRelation = (sender?: string) => sender?.match(/^(女儿|儿子|孙女|孙子|老伴)/)?.[1] ?? sender ?? "家人";

export default function HomeTaskRail({
  now,
  reminders,
  messages,
  albumUnreadCount,
  missedCallCount,
  onCompleteReminder,
  onOpenTodayOverview,
  onOpenSchedule,
  onOpenMessages,
  onOpenCommunity,
  onOpenContacts,
  onOpenAlbum,
  onOpenAssistant,
  onOpenRecommendation,
  acceptanceRightContentScenario = "default",
  acceptanceRightContentApplySignal = 0,
  acceptanceRevision = 0,
}: HomeTaskRailProps) {
  const [recommendationRuntime, setRecommendationRuntime] = useState<Record<string, RecommendationRuntimeState>>(createRecommendationRuntime);
  const [activeRecommendationId, setActiveRecommendationId] = useState(HOME_RECOMMENDATION_CONFIGS[0].contentId);
  const [runtimeNow, setRuntimeNow] = useState(Date.now());
  const [isInteractionLocked, setIsInteractionLocked] = useState(false);
  const [isTodayRecommendationOpen, setIsTodayRecommendationOpen] = useState(false);
  const [completedOverviewScheduleIds, setCompletedOverviewScheduleIds] = useState<Set<string>>(() => new Set());
  const [frozenRightContentItems, setFrozenRightContentItems] = useState<RightContentItem[] | null>(null);
  const [hasAppliedLockedUpdate, setHasAppliedLockedUpdate] = useState(false);
  const interactionTimerRef = useRef<number | null>(null);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const p0Tasks = useMemo(() => reminders.filter((item) => (item.priority ?? "P0") === "P0"), [reminders]);

  const dueTasks = p0Tasks
    .filter((item) => item.status !== "completed" && nowMinutes >= reminderMinutes(item.time) && nowMinutes <= reminderMinutes(item.time) + 30)
    .sort((first, second) => reminderMinutes(first.time) - reminderMinutes(second.time));
  const upcomingTasks = p0Tasks
    .filter((item) => item.status !== "completed" && reminderMinutes(item.time) > nowMinutes && reminderMinutes(item.time) - nowMinutes <= 30)
    .sort((first, second) => reminderMinutes(first.time) - reminderMinutes(second.time));

  const recommendationConfigs = useMemo(() => acceptanceRightContentScenario === "ai-fallback"
    ? HOME_RECOMMENDATION_CONFIGS.map((item) => ({ ...item, enabled: false }))
    : HOME_RECOMMENDATION_CONFIGS.map((item) => (
      acceptanceRightContentScenario === "recommendation-cooldown"
        ? { ...item, displayDurationMs: 2_400, displayLimit: 1, cooldownMs: 4_800 }
        : acceptanceRightContentScenario === "recommendation-order"
          ? { ...item, displayDurationMs: 3_200, displayLimit: 2, cooldownMs: 6_400 }
          : item
    )), [acceptanceRightContentScenario]);
  const recommendationClock = new Date(Math.max(now.getTime(), runtimeNow));
  const eligibleRecommendations = useMemo(() => getEligibleRecommendationConfigs(
    recommendationConfigs,
    recommendationClock,
    "elder",
    recommendationRuntime,
  ), [recommendationClock.getTime(), recommendationConfigs, recommendationRuntime]);
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
  }, [acceptanceRevision, acceptanceRightContentScenario]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const current = Date.now();
      setRuntimeNow(current);
      setRecommendationRuntime((runtime) => Object.fromEntries(Object.entries(runtime).map(([contentId, state]: [string, RecommendationRuntimeState]) => [
        contentId,
        state.cooldownUntil && state.cooldownUntil <= current
          ? { exposureCount: 0, lastShownAt: state.lastShownAt, cooldownUntil: null }
          : state,
      ])));
    }, 500);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isInteractionLocked || !activeRecommendation) return;
    const timer = window.setTimeout(() => {
      const finishedId = activeRecommendation.contentId;
      setRecommendationRuntime((runtime) => {
        const previous = runtime[finishedId] ?? { exposureCount: 0, lastShownAt: null, cooldownUntil: null };
        const nextExposureCount = previous.exposureCount + 1;
        return {
          ...runtime,
          [finishedId]: {
            exposureCount: nextExposureCount,
            lastShownAt: Date.now(),
            cooldownUntil: nextExposureCount >= activeRecommendation.displayLimit
              ? Date.now() + activeRecommendation.cooldownMs
              : null,
          },
        };
      });
      const currentIndex = eligibleRecommendations.findIndex((item) => item.contentId === finishedId);
      const next = eligibleRecommendations[currentIndex + 1] ?? eligibleRecommendations[0];
      if (next && next.contentId !== finishedId) setActiveRecommendationId(next.contentId);
    }, activeRecommendation.displayDurationMs);
    return () => window.clearTimeout(timer);
  }, [
    activeRecommendation?.contentId,
    activeRecommendation?.cooldownMs,
    activeRecommendation?.displayDurationMs,
    activeRecommendation?.displayLimit,
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
    "recommendation-cooldown",
    "ai-fallback",
  ].includes(acceptanceRightContentScenario);
  const realUnreadMessages = messages.filter((item) => (
    !item.played
    && item.sender !== "您 (我)"
    && item.type !== "photo"
    && item.type !== "call_log"
  ));
  const messageCount = acceptanceRightContentScenario === "new-message"
    ? Math.max(3, realUnreadMessages.length)
    : acceptanceRightContentScenario === "time-and-family"
      ? Math.max(2, realUnreadMessages.length)
      : acceptanceRightContentScenario === "interaction-locked"
        ? hasAppliedLockedUpdate ? Math.max(2, realUnreadMessages.length) : 0
        : suppressLivePools || acceptanceRightContentScenario === "new-album" || acceptanceRightContentScenario === "missed-call"
          ? 0
          : realUnreadMessages.length;
  const visibleAlbumUnreadCount = acceptanceRightContentScenario === "new-album"
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
  const currentTaskIsDue = currentTask ? nowMinutes >= reminderMinutes(currentTask.time) : false;
  const timeItems: RightContentItem[] = suppressLivePools || ["new-message", "new-album", "missed-call", "interaction-locked"].includes(acceptanceRightContentScenario)
    ? []
    : acceptanceRightContentScenario === "time-and-family"
      ? [{
          id: "activity-upcoming",
          source: "time",
          kind: "activity",
          title: "社区剪纸活动快开始了",
          subtitle: "30分钟后开始 · 按一下查看",
          Icon: Flag,
        }]
      : currentTask
        ? [{
            id: currentTask.id,
            source: currentTaskIsDue ? "p1" : "time",
            kind: currentTask.category === "schedule" ? "schedule" : "medication",
            title: currentTask.category === "schedule"
              ? (currentTask.ctaTitle ?? currentTask.name)
              : currentTaskIsDue ? `该吃${medicinePeriod(currentTask.time)}药啦` : `${medicinePeriod(currentTask.time)}药快到时间了`,
            subtitle: currentTaskIsDue
              ? currentTask.category === "schedule" ? "按一下：我已完成" : "按一下：我已服药"
              : `将在 ${currentTask.time} 提醒`,
            Icon: currentTask.category === "schedule" ? CalendarDays : Pill,
          }]
        : [];

  const familyItems = [
    visibleMissedCallCount > 0 ? {
      id: "family-missed-call",
      source: "family" as const,
      kind: "missed-call" as const,
      title: "家人有未接来电",
      subtitle: "按一下查看通话记录",
      count: visibleMissedCallCount,
      Icon: PhoneMissed,
    } : null,
    messageCount > 0 ? {
      id: "family-messages",
      source: "family" as const,
      kind: "message" as const,
      title: `${senderRelation(realUnreadMessages[0]?.sender)}发来新留言`,
      subtitle: "按一下查看留言",
      count: messageCount,
      Icon: MessageCircleHeart,
    } : null,
    visibleAlbumUnreadCount > 0 ? {
      id: "family-album",
      source: "family" as const,
      kind: "album" as const,
      title: "家人发来新影像",
      subtitle: "按一下全屏查看",
      count: visibleAlbumUnreadCount,
      Icon: Image,
    } : null,
  ].filter(Boolean) as RightContentItem[];

  const recommendationItem: RightContentItem = activeRecommendation ? {
    id: activeRecommendation.contentId,
    source: "recommendation",
    kind: activeRecommendation.kind,
    title: activeRecommendation.title,
    subtitle: activeRecommendation.subtitle,
    Icon: activeRecommendation.kind === "security"
      ? ShieldAlert
      : activeRecommendation.kind === "community"
        ? Flag
        : activeRecommendation.kind === "service"
          ? Wrench
          : Music2,
    recommendation: activeRecommendation,
  } : {
    id: "ai-voice-fallback",
    source: "ai",
    kind: "ai",
    title: "想聊聊天吗？",
    subtitle: "按一下问小达",
    Icon: Bot,
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
    ai: "AI 语音",
  };

  const activateContent = (item: RightContentItem) => {
    if (item.source === "p1" && (item.kind === "medication" || item.kind === "schedule")) onCompleteReminder(item.id);
    else if (item.kind === "medication" || item.kind === "schedule") onOpenSchedule();
    else if (item.kind === "activity") onOpenCommunity();
    else if (item.kind === "missed-call") onOpenContacts();
    else if (item.kind === "message") onOpenMessages();
    else if (item.kind === "album") onOpenAlbum();
    else if (item.kind === "ai") onOpenAssistant();
    else onOpenRecommendation(item.kind);
  };

  const contentClass = (item: RightContentItem) => `is-${item.source} is-${item.kind}`;

  return (
    <aside className="task-rail" aria-label="首页右侧内容">
      <section className="primary-task">
        {isTodayRecommendationOpen ? (
          <section className="home-today-popover" aria-label="今日全览内容">
            <header>
              <div>
                <strong>今日全览</strong>
                <small>{TODAY_OVERVIEW_SCHEDULES.length} 项提醒 · {TODAY_OVERVIEW_RECOMMENDATIONS.length} 项推荐</small>
              </div>
              <button type="button" onClick={() => setIsTodayRecommendationOpen(false)}>
                <X aria-hidden="true" />收起
              </button>
            </header>
            <div className="home-today-scroll">
              <section className="home-today-section" aria-label="提醒事项">
                <div className="home-today-section-title">
                  <Clock3 aria-hidden="true" />
                  <strong>提醒事项</strong>
                </div>
                <div className="home-today-list is-schedule">
                  {TODAY_OVERVIEW_SCHEDULES.map((item) => {
                    const currentStatus = completedOverviewScheduleIds.has(item.id) ? "completed" : item.status;
                    const statusLabel = {
                      "not-yet": "未到时间",
                      pending: "待完成",
                      completed: "已完成",
                      unconfirmed: "未确认",
                      expired: "已过期",
                    }[currentStatus];
                    const isActionable = currentStatus === "pending"
                      || currentStatus === "unconfirmed"
                      || currentStatus === "expired";
                    const actionLabel = item.id.includes("med") ? "服药" : "完成";
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
                              const isMedication = item.id.includes("med");
                              setCompletedOverviewScheduleIds((current) => new Set(current).add(item.id));
                              if (isMedication) {
                                const overviewTime = reminderMinutes(item.time);
                                const targetMedication = reminders
                                  .filter((reminder) => reminder.category !== "schedule" && reminder.status !== "completed")
                                  .sort((first, second) => (
                                    Math.abs(reminderMinutes(first.time) - overviewTime)
                                    - Math.abs(reminderMinutes(second.time) - overviewTime)
                                  ))[0];
                                onCompleteReminder(targetMedication?.id ?? item.title);
                              } else {
                                const overviewReminder: MedicationReminder = {
                                  id: `overview-${item.id}`,
                                  time: item.time,
                                  name: item.title,
                                  dosage: "",
                                  status: "pending",
                                  category: "schedule",
                                };
                                onCompleteReminder(overviewReminder.id, overviewReminder);
                              }
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
                        onOpenRecommendation(recommendation.kind);
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
        <div className="today-overview-entry-group" aria-label="今日全览打开方式">
          <button
            type="button"
            className={`today-overview-button${isTodayRecommendationOpen ? " is-open" : ""}`}
            onClick={() => setIsTodayRecommendationOpen((isOpen) => !isOpen)}
            aria-label={isTodayRecommendationOpen ? "收起首页今日全览" : "在首页展开今日全览"}
          >
            <CalendarDays aria-hidden="true" />
            <strong>{isTodayRecommendationOpen ? "收起全览" : "今日全览"}</strong>
          </button>
          <button
            type="button"
            className="today-overview-page-button"
            onClick={() => {
              setIsTodayRecommendationOpen(false);
              onOpenTodayOverview();
            }}
            aria-label="进入今日全览完整二级页面"
          >
            <strong>完整页面</strong>
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
      </section>

    </aside>
  );
}
