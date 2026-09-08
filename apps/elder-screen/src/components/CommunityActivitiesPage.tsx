import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Check, ChevronRight, CircleAlert, Flag, MapPin, PhoneCall, RefreshCcw, Sparkles, UserRoundCheck, Users, X } from "lucide-react";
import { speakText } from "../audio/speech";
import type { CommunityActivity } from "../types";
import SecondaryPageHeader from "./SecondaryPageHeader";
import "./community-activities-page.css";

export type CommunityActivityAcceptanceScenario = "default" | "ended-cancelled" | "submission-failure";
type ParticipationState = "none" | "pending" | "declined" | "registered";

interface CommunityActivitiesPageProps {
  isOpen: boolean;
  onClose: () => void;
  activities: CommunityActivity[];
  onRegister: (activityId: string) => void;
  initialActivityId?: string | null;
  acceptanceScenario?: CommunityActivityAcceptanceScenario;
}

const statusText = (activity: CommunityActivity) => {
  if (activity.status === "ended") return "活动已结束";
  if (activity.status === "cancelled") return "活动已取消";
  if (activity.status === "ongoing") return "正在进行";
  return `还剩 ${activity.spotsLeft} 个名额`;
};

export default function CommunityActivitiesPage({ isOpen, onClose, activities, onRegister, initialActivityId = null, acceptanceScenario = "default" }: CommunityActivitiesPageProps) {
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(initialActivityId);
  const [participation, setParticipation] = useState<Record<string, ParticipationState>>({});
  const [failedIntent, setFailedIntent] = useState<ParticipationState | null>(null);

  const scenarioActivities = useMemo(() => activities.map((activity, index) => {
    if (acceptanceScenario !== "ended-cancelled") return activity;
    if (index === 0) return { ...activity, status: "ended" as const, registered: false };
    if (index === 1) return { ...activity, status: "cancelled" as const, registered: false };
    return activity;
  }), [acceptanceScenario, activities]);
  const selectedActivity = scenarioActivities.find((activity) => activity.id === selectedActivityId) ?? null;

  useEffect(() => {
    if (isOpen) setSelectedActivityId(initialActivityId);
    else { setSelectedActivityId(null); setFailedIntent(null); }
  }, [initialActivityId, isOpen]);

  const getParticipation = (activity: CommunityActivity): ParticipationState => participation[activity.id] ?? (activity.registered ? "registered" : "none");

  const saveIntent = (activity: CommunityActivity, intent: ParticipationState, retry = false) => {
    if (activity.status === "ended" || activity.status === "cancelled") return;
    if (acceptanceScenario === "submission-failure" && !retry) { setFailedIntent(intent); return; }
    const resolved = intent === "pending" && activity.requiresConfirmation === false ? "registered" : intent;
    setParticipation((current) => ({ ...current, [activity.id]: resolved }));
    setFailedIntent(null);
    if (resolved === "registered") onRegister(activity.id);
    const message = resolved === "pending" ? "参加意向已经提交，等待社区确认" : resolved === "registered" ? "已经确认参加，活动开始前会提醒您" : "好的，已记录暂不参加";
    speakText(message, { fallbackKey: resolved === "registered" ? "activity-registered" : "generic-feedback", rate: 0.9 });
  };

  if (!isOpen) return null;

  return (
    <main className="community-activities-page" aria-label="社区活动">
      <SecondaryPageHeader title="社区活动" icon={<Flag aria-hidden="true" />} onBack={onClose} actions={<span className="community-activities-rule">参加意向需由社区确认</span>} />
      <div className="community-activities-content">
        <section className="community-activities-intro" aria-labelledby="community-activities-title">
          <div><Sparkles aria-hidden="true" /><div><h2 id="community-activities-title">近期社区活动</h2><p>先查看详情，再选择是否想参加</p></div></div>
        </section>
        <div className="community-activities-list">
          {scenarioActivities.map((activity) => {
            const current = getParticipation(activity);
            const unavailable = activity.status === "ended" || activity.status === "cancelled";
            return (
              <article key={activity.id} className={`community-activity-card${current === "registered" ? " is-registered" : ""}${unavailable ? " is-unavailable" : ""}`}>
                <div className="community-activity-card__image"><img src={activity.imageUrl} alt={`${activity.title}活动照片`} referrerPolicy="no-referrer" /></div>
                <div className="community-activity-card__content">
                  <div className="community-activity-card__heading"><span>{activity.tag}</span>{current === "pending" && <em>待社区确认</em>}{current === "registered" && <em><Check aria-hidden="true" />已确认参加</em>}{current === "declined" && <em>暂不参加</em>}</div>
                  <h3>{activity.title}</h3>
                  <p className="community-activity-card__description">{activity.description ?? "查看时间、地点和活动说明。"}</p>
                  <div className="community-activity-card__meta"><p><CalendarClock aria-hidden="true" />{activity.time}</p><p><MapPin aria-hidden="true" />{activity.location}</p></div>
                </div>
                <div className="community-activity-card__action"><span className={unavailable ? "is-urgent" : ""}><Users aria-hidden="true" />{statusText(activity)}</span><button type="button" onClick={() => setSelectedActivityId(activity.id)}>查看详情<ChevronRight aria-hidden="true" /></button></div>
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
              <div className="community-activity-detail__facts"><span><CalendarClock aria-hidden="true" /><b>活动时间</b>{selectedActivity.time}</span><span><MapPin aria-hidden="true" /><b>活动地点</b>{selectedActivity.location}</span><span><Users aria-hidden="true" /><b>参加对象</b>{selectedActivity.audience ?? "社区长者"}</span><span className="is-contact"><PhoneCall aria-hidden="true" /><b>咨询电话</b><strong>{selectedActivity.contact ?? "010-6258 8890"}</strong></span></div>
              {(selectedActivity.status === "ended" || selectedActivity.status === "cancelled") ? <div className="community-activity-detail__unavailable"><CircleAlert aria-hidden="true" /><strong>{statusText(selectedActivity)}</strong><p>当前不再接受参加意向。</p></div> : (
                <div className="community-activity-detail__intentions">
                  {failedIntent && <p className="community-activity-detail__error" role="alert"><CircleAlert aria-hidden="true" />提交失败，您的选择尚未保存。请重新提交。</p>}
                  {getParticipation(selectedActivity) !== "none" && !failedIntent && <p className="community-activity-detail__result" role="status"><Check aria-hidden="true" />{getParticipation(selectedActivity) === "pending" && "已提交参加意向，等待社区确认；这不是报名成功。"}{getParticipation(selectedActivity) === "registered" && "已确认参加，活动开始前 30 分钟提醒一次，到点不重复弹窗。"}{getParticipation(selectedActivity) === "declined" && "已记录暂不参加。"}</p>}
                  <div><button type="button" className="is-primary" onClick={() => saveIntent(selectedActivity, "pending")}><UserRoundCheck aria-hidden="true" />我想参加</button><button type="button" onClick={() => saveIntent(selectedActivity, "declined")}><X aria-hidden="true" />暂不参加</button></div>
                  {failedIntent && <button className="community-activity-detail__retry" type="button" onClick={() => saveIntent(selectedActivity, failedIntent, true)}><RefreshCcw aria-hidden="true" />重新提交原选择</button>}
                </div>
              )}
            </article>
          </div>
        </section>
      )}
    </main>
  );
}
