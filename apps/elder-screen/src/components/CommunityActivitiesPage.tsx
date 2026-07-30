import { useState } from "react";
import {
  CalendarClock,
  Check,
  Flag,
  MapPin,
  Sparkles,
  Users,
} from "lucide-react";
import type { CommunityActivity } from "../types";
import SecondaryPageHeader from "./SecondaryPageHeader";
import "./community-activities-page.css";

interface CommunityActivitiesPageProps {
  isOpen: boolean;
  onClose: () => void;
  activities: CommunityActivity[];
  onRegister: (activityId: string) => void;
}

export default function CommunityActivitiesPage({
  isOpen,
  onClose,
  activities,
  onRegister,
}: CommunityActivitiesPageProps) {
  const [feedback, setFeedback] = useState("");
  const registeredCount = activities.filter((activity) => activity.registered).length;

  const registerActivity = (activity: CommunityActivity) => {
    if (activity.registered) return;
    onRegister(activity.id);
    setFeedback(`已报名“${activity.title}”，活动开始前会提醒您`);

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const confirmation = new SpeechSynthesisUtterance(`报名成功，活动开始前会提醒您`);
      confirmation.lang = "zh-CN";
      confirmation.rate = 0.9;
      window.speechSynthesis.speak(confirmation);
    }
  };

  if (!isOpen) return null;

  return (
    <main className="community-activities-page" aria-label="社区活动">
      <SecondaryPageHeader
        title="社区活动"
        icon={<Flag aria-hidden="true" />}
        onBack={onClose}
        actions={(
          <div className="community-activities-summary">
            <strong>{activities.length} 项活动</strong>
            <span>已报名 {registeredCount} 项</span>
          </div>
        )}
      />

      <div className="community-activities-content">
        <section className="community-activities-intro" aria-labelledby="community-activities-title">
          <div>
            <Sparkles aria-hidden="true" />
            <div>
              <h2 id="community-activities-title">近期社区活动</h2>
              <p>选一个喜欢的活动，按一下就能报名</p>
            </div>
          </div>
          {feedback && (
            <p className="community-activities-feedback" role="status" aria-live="polite">
              <Check aria-hidden="true" />
              {feedback}
            </p>
          )}
        </section>

        <div className="community-activities-list">
          {activities.map((activity) => {
            const isNearlyFull = activity.spotsLeft <= 3 && !activity.registered;
            return (
              <article
                key={activity.id}
                className={`community-activity-card${activity.registered ? " is-registered" : ""}`}
              >
                <div className="community-activity-card__image">
                  <img
                    src={activity.imageUrl}
                    alt={`${activity.title}活动照片`}
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="community-activity-card__content">
                  <div className="community-activity-card__heading">
                    <span>{activity.tag}</span>
                    {activity.registered && <em><Check aria-hidden="true" />您已报名</em>}
                  </div>
                  <h3>{activity.title}</h3>
                  <div className="community-activity-card__meta">
                    <p><CalendarClock aria-hidden="true" />{activity.time}</p>
                    <p><MapPin aria-hidden="true" />{activity.location}</p>
                  </div>
                </div>

                <div className="community-activity-card__action">
                  <span className={isNearlyFull ? "is-urgent" : ""}>
                    <Users aria-hidden="true" />
                    {activity.registered ? "名额已经为您保留" : `还剩 ${activity.spotsLeft} 个名额`}
                  </span>
                  <button
                    type="button"
                    className="community-activity-card__register"
                    disabled={activity.registered}
                    onClick={() => registerActivity(activity)}
                  >
                    {activity.registered ? <Check aria-hidden="true" /> : <Flag aria-hidden="true" />}
                    {activity.registered ? "已报名" : "立即报名"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}
