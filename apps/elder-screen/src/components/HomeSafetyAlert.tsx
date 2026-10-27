import { BellRing, ChevronRight, Clock3, ShieldAlert } from "lucide-react";
import type { AntiScamTip } from "../types";

interface HomeSafetyAlertProps {
  tip: AntiScamTip;
  position: number;
  total: number;
  onView: () => void;
  onDismiss: () => void;
}

export default function HomeSafetyAlert({
  tip,
  position,
  total,
  onView,
  onDismiss,
}: HomeSafetyAlertProps) {
  return (
    <div className="home-reminder-alert" role="presentation">
      <section
        className="home-reminder-alert__dialog is-daily"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="home-safety-alert-title"
        aria-describedby="home-safety-alert-description"
      >
        <header className="home-reminder-alert__header">
          <span className="home-reminder-alert__badge">
            <BellRing aria-hidden="true" />
            警惕事项
          </span>
          <span className="home-reminder-alert__remaining">
            <Clock3 aria-hidden="true" />
            第 {position} 条，共 {total} 条
          </span>
        </header>

        <div className="home-reminder-alert__content">
          <div className="home-reminder-alert__icon" aria-hidden="true">
            <ShieldAlert />
          </div>
          <div>
            <time>社区最新发布</time>
            <h2 id="home-safety-alert-title">请留意这条安全提醒</h2>
            <strong>{tip.title}</strong>
            <p id="home-safety-alert-description">{tip.summary ?? tip.description}</p>
          </div>
        </div>

        <div className="home-reminder-alert__actions">
          <button type="button" className="is-primary" onClick={onView}>
            <ChevronRight aria-hidden="true" />
            现在查看
          </button>
          <button type="button" onClick={onDismiss}>稍后查看</button>
        </div>
      </section>
    </div>
  );
}
