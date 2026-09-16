import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Check, ChevronRight, CircleAlert, Flag, MapPin, PhoneCall, Radio, RefreshCcw, Sparkles, UserRoundCheck, Users, Video, X } from "lucide-react";
import { speakText } from "../audio/speech";
import type { CommunityActivity } from "../types";
import SecondaryPageHeader from "./SecondaryPageHeader";
import "./community-activities-page.css";

export type CommunityActivityAcceptanceScenario =
  | "default"
  | "ended-cancelled"
  | "submission-failure"
  | "live-unconfigured"
  | "live-not-started"
  | "live-active"
  | "live-ended"
  | "live-cancelled-conflict"
  | "live-invalid-access"
  | "live-load-failure"
  | "live-interrupted";
type ParticipationState = "interested" | "not_interested";
type LivePlaybackState = "playing" | "load-failure" | "interrupted";

interface CommunityActivitiesPageProps {
  isOpen: boolean;
  onClose: () => void;
  activities: CommunityActivity[];
  initialActivityId?: string | null;
  acceptanceScenario?: CommunityActivityAcceptanceScenario;
}

const VALID_MOCK_PLAYBACK_URL = "https://live.example.test/community/activity";

const isActivityUnavailable = (activity: CommunityActivity) => activity.status === "ended" || activity.status === "cancelled";

const hasValidLiveAccess = (activity: CommunityActivity) => {
  if (!activity.liveEnabled) return false;
  if (activity.liveAccessType === "url") {
    const rawUrl = activity.playbackUrl?.trim();
    if (!rawUrl) return false;
    try {
      const parsedUrl = new URL(rawUrl);
      return parsedUrl.protocol === "https:" || parsedUrl.protocol === "http:";
    } catch {
      return false;
    }
  }
  if (activity.liveAccessType === "third_party_id") return Boolean(activity.liveProvider?.trim() && activity.externalLiveId?.trim());
  return false;
};

const canEnterLiveStream = (activity: CommunityActivity) => (
  activity.liveEnabled
  && activity.liveStatus === "live"
  && !isActivityUnavailable(activity)
  && hasValidLiveAccess(activity)
);

const liveStatusText = (activity: CommunityActivity) => {
  if (activity.liveStatus === "live") return "直播中";
  if (activity.liveStatus === "ended") return "直播已结束";
  return activity.scheduledLiveStartAt ? `预计${activity.scheduledLiveStartAt}开播` : "直播未开始";
};

const liveActionLabel = (activity: CommunityActivity) => {
  if (isActivityUnavailable(activity)) return activity.status === "cancelled" ? "活动已取消" : "活动已结束";
  if (!hasValidLiveAccess(activity)) return "直播暂不可用";
  if (activity.liveStatus === "live") return "进入直播";
  if (activity.liveStatus === "ended") return "直播已结束";
  return activity.scheduledLiveStartAt ? `${activity.scheduledLiveStartAt}开播` : "等待开播";
};

const statusText = (activity: CommunityActivity) => {
  if (activity.status === "ended") return "活动已结束";
  if (activity.status === "cancelled") return "活动已取消";
  if (activity.status === "ongoing") return "正在进行";
  return `还剩 ${activity.spotsLeft} 个名额`;
};

export default function CommunityActivitiesPage({ isOpen, onClose, activities, initialActivityId = null, acceptanceScenario = "default" }: CommunityActivitiesPageProps) {
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(initialActivityId);
  const [participation, setParticipation] = useState<Record<string, ParticipationState>>({});
  const [failedIntent, setFailedIntent] = useState<ParticipationState | null>(null);
  const [liveActivityId, setLiveActivityId] = useState<string | null>(null);
  const [livePlaybackState, setLivePlaybackState] = useState<LivePlaybackState>("playing");

  const scenarioActivities = useMemo(() => {
    const nextActivities = activities.map((activity) => ({ ...activity }));
    const liveTargetIndex = Math.max(0, nextActivities.findIndex((activity) => activity.liveEnabled));
    const withLive = (activity: CommunityActivity, overrides: Partial<CommunityActivity> = {}): CommunityActivity => ({
      ...activity,
      location: activity.location.includes("同步直播") ? activity.location : `${activity.location}（同步直播）`,
      liveEnabled: true,
      liveStatus: "live",
      scheduledLiveStartAt: "今天上午 10:00",
      liveAccessType: "url",
      playbackUrl: VALID_MOCK_PLAYBACK_URL,
      liveProvider: undefined,
      externalLiveId: undefined,
      ...overrides,
    });
    const withoutLive = (activity: CommunityActivity): CommunityActivity => ({
      ...activity,
      location: activity.location.replace("（同步直播）", ""),
      liveEnabled: false,
      liveStatus: "not_started",
      scheduledLiveStartAt: undefined,
      liveAccessType: undefined,
      playbackUrl: undefined,
      liveProvider: undefined,
      externalLiveId: undefined,
    });

    if (acceptanceScenario === "ended-cancelled") {
      if (nextActivities[0]) nextActivities[0] = { ...nextActivities[0], status: "ended" };
      if (nextActivities[1]) nextActivities[1] = { ...nextActivities[1], status: "cancelled" };
      return nextActivities;
    }
    if (acceptanceScenario === "live-unconfigured") return nextActivities.map(withoutLive);
    if (!nextActivities[liveTargetIndex]) return nextActivities;

    if (acceptanceScenario === "live-not-started") {
      nextActivities[liveTargetIndex] = withLive(nextActivities[liveTargetIndex], { liveStatus: "not_started", scheduledLiveStartAt: "今天下午 15:00" });
    } else if (acceptanceScenario === "live-active" || acceptanceScenario === "live-load-failure" || acceptanceScenario === "live-interrupted") {
      nextActivities[liveTargetIndex] = withLive(nextActivities[liveTargetIndex]);
    } else if (acceptanceScenario === "live-ended") {
      nextActivities[liveTargetIndex] = withLive(nextActivities[liveTargetIndex], { liveStatus: "ended" });
    } else if (acceptanceScenario === "live-cancelled-conflict") {
      nextActivities[liveTargetIndex] = withLive(nextActivities[liveTargetIndex], { status: "cancelled", liveStatus: "live" });
    } else if (acceptanceScenario === "live-invalid-access") {
      nextActivities[liveTargetIndex] = withLive(nextActivities[liveTargetIndex], { liveStatus: "live", playbackUrl: "" });
    }
    return nextActivities;
  }, [acceptanceScenario, activities]);
  const selectedActivity = scenarioActivities.find((activity) => activity.id === selectedActivityId) ?? null;
  const liveActivity = scenarioActivities.find((activity) => activity.id === liveActivityId) ?? null;

  useEffect(() => {
    if (isOpen) setSelectedActivityId(initialActivityId);
    else setSelectedActivityId(null);
    setParticipation({});
    setFailedIntent(null);
    setLiveActivityId(null);
    setLivePlaybackState("playing");
  }, [acceptanceScenario, initialActivityId, isOpen]);

  const getParticipation = (activity: CommunityActivity): ParticipationState | null => participation[activity.id] ?? null;

  const saveIntent = (activity: CommunityActivity, intent: ParticipationState, retry = false) => {
    if (activity.status === "ended" || activity.status === "cancelled") return;
    if (acceptanceScenario === "submission-failure" && !retry) { setFailedIntent(intent); return; }
    setParticipation((current) => ({ ...current, [activity.id]: intent }));
    setFailedIntent(null);
    speakText(intent === "interested" ? "已选择：我想参加" : "已选择：暂不参加", { fallbackKey: "generic-feedback", rate: 0.9 });
  };

  const openLiveStream = (activity: CommunityActivity) => {
    if (!canEnterLiveStream(activity)) return;
    setLiveActivityId(activity.id);
    setLivePlaybackState(
      acceptanceScenario === "live-load-failure"
        ? "load-failure"
        : acceptanceScenario === "live-interrupted"
          ? "interrupted"
          : "playing",
    );
    speakText(`已进入${activity.title}线上直播`, { rate: 0.9 });
  };

  if (!isOpen) return null;

  return (
    <main className="community-activities-page" aria-label="社区活动">
      <SecondaryPageHeader title="社区活动" icon={<Flag aria-hidden="true" />} onBack={onClose} />
      <div className="community-activities-content">
        <section className="community-activities-intro" aria-labelledby="community-activities-title">
          <div><Sparkles aria-hidden="true" /><div><h2 id="community-activities-title">近期社区活动</h2><p>先查看详情，再选择是否想参加</p></div></div>
        </section>
        <div className="community-activities-list">
          {scenarioActivities.map((activity) => {
            const current = getParticipation(activity);
            const unavailable = isActivityUnavailable(activity);
            return (
              <article key={activity.id} className={`community-activity-card${current === "interested" ? " is-interested" : ""}${unavailable ? " is-unavailable" : ""}`}>
                <div className="community-activity-card__image"><img src={activity.imageUrl} alt={`${activity.title}活动照片`} referrerPolicy="no-referrer" /></div>
                <div className="community-activity-card__content">
                  <div className="community-activity-card__heading">
                    <span>{activity.tag}</span>
                    {unavailable && <em className="is-activity-state">{statusText(activity)}</em>}
                    {activity.liveEnabled && <em className="is-live"><Radio aria-hidden="true" />{liveStatusText(activity)}</em>}
                    {current === "interested" && <em><Check aria-hidden="true" />已选择：我想参加</em>}
                    {current === "not_interested" && <em>已选择：暂不参加</em>}
                  </div>
                  <h3>{activity.title}</h3>
                  <p className="community-activity-card__description">{activity.description ?? "查看时间、地点和活动说明。"}</p>
                  <div className="community-activity-card__meta"><p><CalendarClock aria-hidden="true" />{activity.time}</p><p><MapPin aria-hidden="true" />{activity.location}</p></div>
                </div>
                <div className="community-activity-card__action">
                  <span className={unavailable ? "is-urgent" : ""}><Users aria-hidden="true" />{statusText(activity)}</span>
                  {activity.liveEnabled && <button type="button" className="is-live-stream" disabled={!canEnterLiveStream(activity)} onClick={() => openLiveStream(activity)}><Video aria-hidden="true" />{liveActionLabel(activity)}</button>}
                  <button type="button" onClick={() => setSelectedActivityId(activity.id)}>查看详情<ChevronRight aria-hidden="true" /></button>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {selectedActivity && (
        <section className="community-activity-detail" role="dialog" aria-modal="true" aria-label={`查看活动：${selectedActivity.title}`}>
          <header><button type="button" onClick={() => initialActivityId ? onClose() : setSelectedActivityId(null)}><X aria-hidden="true" />收起</button><strong>社区活动详情</strong></header>
          <div className="community-activity-detail__layout">
            <div className="community-activity-detail__image"><img src={selectedActivity.imageUrl} alt={`${selectedActivity.title}活动照片`} referrerPolicy="no-referrer" /></div>
            <article>
              <span className="community-activity-detail__tag">{selectedActivity.tag}</span><h2>{selectedActivity.title}</h2><p>{selectedActivity.description ?? "社区为长者准备的活动，欢迎查看后表达参加意向。"}</p>
              <div className="community-activity-detail__facts"><span><CalendarClock aria-hidden="true" /><b>活动时间</b>{selectedActivity.time}</span><span><MapPin aria-hidden="true" /><b>活动地点</b>{selectedActivity.location}</span>{selectedActivity.liveEnabled && <><span className="is-live"><Video aria-hidden="true" /><b>参加方式</b>现场参加或线上直播</span><span className="is-live"><Radio aria-hidden="true" /><b>直播状态</b>{liveStatusText(selectedActivity)}</span></>}<span className="is-contact"><PhoneCall aria-hidden="true" /><b>咨询电话</b><strong>{selectedActivity.contact ?? "010-6258 8890"}</strong></span></div>
              {(selectedActivity.status === "ended" || selectedActivity.status === "cancelled") ? <div className="community-activity-detail__unavailable"><CircleAlert aria-hidden="true" /><strong>{statusText(selectedActivity)}</strong><p>当前不再接受参加意向。</p></div> : (
                <div className="community-activity-detail__intentions">
                  {failedIntent && <p className="community-activity-detail__error" role="alert"><CircleAlert aria-hidden="true" />提交失败，您的选择尚未保存。请重新提交。</p>}
                  {getParticipation(selectedActivity) && !failedIntent && <p className="community-activity-detail__result" role="status"><Check aria-hidden="true" />{getParticipation(selectedActivity) === "interested" ? "已选择：我想参加" : "已选择：暂不参加"}</p>}
                  {selectedActivity.liveEnabled && <button type="button" className="community-activity-detail__live-entry" disabled={!canEnterLiveStream(selectedActivity)} onClick={() => openLiveStream(selectedActivity)}><Video aria-hidden="true" />{liveActionLabel(selectedActivity)}</button>}
                  <div><button type="button" className="is-primary" onClick={() => saveIntent(selectedActivity, "interested")}><UserRoundCheck aria-hidden="true" />我想参加</button><button type="button" onClick={() => saveIntent(selectedActivity, "not_interested")}><X aria-hidden="true" />暂不参加</button></div>
                  {failedIntent && <button className="community-activity-detail__retry" type="button" onClick={() => saveIntent(selectedActivity, failedIntent, true)}><RefreshCcw aria-hidden="true" />重新提交原选择</button>}
                </div>
              )}
            </article>
          </div>
        </section>
      )}

      {liveActivity && (
        <section className="community-live-room" role="dialog" aria-modal="true" aria-label={`${liveActivity.title}线上直播`}>
          <header>
            <div><Radio aria-hidden="true" /><span><strong>社区活动直播</strong><small>线上观看</small></span></div>
            <button type="button" onClick={() => setLiveActivityId(null)}><X aria-hidden="true" />退出直播</button>
          </header>
          <div className={`community-live-room__stage${livePlaybackState !== "playing" ? " has-error" : ""}`}>
            {livePlaybackState === "playing" ? <>
              <img src={liveActivity.imageUrl} alt="" referrerPolicy="no-referrer" />
              <div className="community-live-room__shade" />
              <span className="community-live-room__badge"><i />直播中</span>
              <div className="community-live-room__copy"><Video aria-hidden="true" /><h2>{liveActivity.title}</h2><p>正在播放社区活动现场画面</p></div>
            </> : <div className="community-live-room__error" role="alert">
              <CircleAlert aria-hidden="true" />
              <h2>{livePlaybackState === "load-failure" ? "直播暂时没有加载出来" : "直播画面暂时中断"}</h2>
              <p>{livePlaybackState === "load-failure" ? "请检查网络后重新加载。" : "您的参加意向不会受到影响，可以尝试重新连接。"}</p>
              <div><button type="button" onClick={() => setLivePlaybackState("playing")}><RefreshCcw aria-hidden="true" />{livePlaybackState === "load-failure" ? "重新加载" : "重新连接"}</button><button type="button" onClick={() => setLiveActivityId(null)}><X aria-hidden="true" />退出直播</button></div>
            </div>}
          </div>
          <footer><span><CalendarClock aria-hidden="true" />{liveActivity.time}</span><span><MapPin aria-hidden="true" />线上直播 · {liveActivity.location.replace("（同步直播）", "")}</span></footer>
        </section>
      )}
    </main>
  );
}
