import { useEffect, useRef } from "react";
import { BellRing, CalendarDays, CheckCircle2, Clock3, Pill } from "lucide-react";
import { speakText, stopSpeech } from "../audio/speech";
import type { MedicationReminder } from "../types";

interface HomeReminderAlertProps {
  reminder: MedicationReminder;
  minutesUntil: number;
  onComplete: () => void;
  onDismiss: () => void;
  currentTime?: Date;
  autoDismissMs?: number;
}

const spokenReminderKeys = new Set<string>();

export const resetHomeReminderSpeechTracking = () => spokenReminderKeys.clear();

export default function HomeReminderAlert({
  reminder,
  minutesUntil,
  onComplete,
  onDismiss,
  currentTime = new Date(),
  autoDismissMs = 60_000,
}: HomeReminderAlertProps) {
  const isDailyReminder = reminder.category === "schedule";
  const title = isDailyReminder ? "马上有一件日常事项" : "马上到服药时间了";
  const actionLabel = isDailyReminder ? "我已完成" : "我已服药";
  const remainingLabel = minutesUntil > 0 ? `还有 ${minutesUntil} 分钟` : "提醒时间到了";
  const ReminderIcon = isDailyReminder ? CalendarDays : Pill;
  const dismissRef = useRef(onDismiss);

  useEffect(() => {
    dismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    const timer = window.setTimeout(() => dismissRef.current(), autoDismissMs);
    return () => window.clearTimeout(timer);
  }, [autoDismissMs, reminder.id]);

  useEffect(() => {
    const hour = currentTime.getHours();
    const isQuietHours = hour >= 22 || hour < 7;
    const dayKey = [
      currentTime.getFullYear(),
      String(currentTime.getMonth() + 1).padStart(2, "0"),
      String(currentTime.getDate()).padStart(2, "0"),
    ].join("-");
    const speechKey = `${dayKey}:${reminder.id}`;
    if (isQuietHours || spokenReminderKeys.has(speechKey)) return;
    spokenReminderKeys.add(speechKey);
    speakText(
      isDailyReminder
        ? `马上有一件日常事项，${reminder.name}。${reminder.dosage}`
        : `马上到服药时间了，${reminder.name}。${reminder.dosage}`,
      {
        fallbackKey: isDailyReminder ? "daily-upcoming" : "medication-upcoming",
        rate: 0.84,
      },
    );
    return stopSpeech;
  }, [currentTime, isDailyReminder, reminder.dosage, reminder.id, reminder.name]);

  return (
    <div className="home-reminder-alert" role="presentation">
      <section
        className={`home-reminder-alert__dialog is-${isDailyReminder ? "daily" : "medication"}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="home-reminder-alert-title"
        aria-describedby="home-reminder-alert-description"
      >
        <header className="home-reminder-alert__header">
          <span className="home-reminder-alert__badge">
            <BellRing aria-hidden="true" />
            {minutesUntil > 0 ? "提前 5 分钟提醒" : "到点提醒"}
          </span>
          <span className="home-reminder-alert__remaining">
            <Clock3 aria-hidden="true" />
            {remainingLabel}
          </span>
        </header>

        <div className="home-reminder-alert__content">
          <div className="home-reminder-alert__icon" aria-hidden="true">
            <ReminderIcon />
          </div>
          <div>
            <time dateTime={reminder.time}>今天 {reminder.time}</time>
            <h2 id="home-reminder-alert-title">{title}</h2>
            <strong>{reminder.name}</strong>
            <p id="home-reminder-alert-description">{reminder.dosage}</p>
          </div>
        </div>

        <div className="home-reminder-alert__actions">
          <button type="button" className="is-primary" onClick={onComplete}>
            <CheckCircle2 aria-hidden="true" />
            {actionLabel}
          </button>
          <button type="button" onClick={onDismiss}>知道了</button>
        </div>

        <p className="home-reminder-alert__note">
          点“知道了”只关闭弹窗，提醒仍会保留在提醒事项中。
        </p>
      </section>
    </div>
  );
}
