import React from "react";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  MessageCircleHeart,
  Pill,
  Stethoscope,
} from "lucide-react";

interface ReminderItem {
  id: string;
  time: string;
  name: string;
  dosage: string;
  status: "pending" | "completed";
}

interface TodayItem {
  id: string;
  kind: "medication" | "consultation" | "community";
  time: string;
  label: string;
  title: string;
  description: string;
  status: "pending" | "completed" | "upcoming" | "info";
  reminderId?: string;
}

interface SchedulePanelProps {
  reminders?: ReminderItem[];
  onCompleteReminder?: (id: string) => void;
  highlighted?: boolean;
  unreadAlbumCount?: number;
  onOpenAlbum?: () => void;
  onOpenSchedule?: () => void;
}

const itemStyles = {
  medication: {
    icon: Pill,
    iconClass: "bg-[#EAF6EF] text-[#256F4F]",
    labelClass: "text-[#256F4F]",
  },
  consultation: {
    icon: Stethoscope,
    iconClass: "bg-[#EAF2FB] text-[#376A94]",
    labelClass: "text-[#376A94]",
  },
  community: {
    icon: Building2,
    iconClass: "bg-[#FFF5DD] text-[#956C19]",
    labelClass: "text-[#956C19]",
  },
};

export default function SchedulePanel({
  reminders = [],
  onCompleteReminder,
  highlighted,
  onOpenSchedule,
}: SchedulePanelProps) {
  const medicationItems: TodayItem[] = reminders.map((reminder) => ({
    id: reminder.id,
    kind: "medication",
    time: reminder.time,
    label: "用药",
    title: reminder.name,
    description: reminder.dosage,
    status: reminder.status === "completed" ? "completed" : "pending",
    reminderId: reminder.id,
  }));

  const consultationItem: TodayItem = {
    id: "consultation-1",
    kind: "consultation",
    time: "15:00",
    label: "健康咨询",
    title: "王护士在线健康咨询",
    description: "聊聊近期血压和用药感受，开始前可先看看准备事项。",
    status: "upcoming",
  };

  const communityItem: TodayItem = {
    id: "community-1",
    kind: "community",
    time: "明日上午",
    label: "社区消息",
    title: "12号楼电梯例行检修",
    description: "预计 9:00—11:00 暂停使用，外出可以提前安排时间。",
    status: "info",
  };

  const items = [
    ...medicationItems.slice(0, 2),
    consultationItem,
    ...medicationItems.slice(2),
    communityItem,
  ];
  const nextPendingMedicationId = medicationItems.find((item) => item.status === "pending")?.id;

  return (
    <section
      className={`flex flex-col w-[620px] h-full bg-[#FAF8F5] px-6 py-5 border-r border-[#EBE6DD] select-none overflow-hidden shrink-0 transition-shadow ${
        highlighted ? "shadow-[inset_0_0_0_4px_#B8D9C7]" : ""
      }`}
      aria-label="今天值得看看"
    >
      <header className="pb-4 border-b-2 border-[#E9E4DC] text-left shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#EAF6EF] text-[#14533C] flex items-center justify-center">
              <MessageCircleHeart className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-[25px] font-black text-[#1C2C24]">今天值得看看</h2>
              <p className="text-[14px] text-gray-500 font-bold mt-0.5">用药、咨询和生活消息都放在这里</p>
            </div>
          </div>
          <div className="px-3 py-1.5 rounded-full bg-white border border-[#DDD7CE] text-[14px] font-black text-[#256F4F]">
            共 {items.length} 条
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scroll pr-1">
        {items.map((item, index) => {
          const styles = itemStyles[item.kind];
          const Icon = styles.icon;
          const isCompleted = item.status === "completed";
          const isPrimary = item.kind === "medication" && item.id === nextPendingMedicationId;

          return (
            <article
              key={item.id}
              className={`py-4 ${index < items.length - 1 ? "border-b border-[#E7E1D7]" : ""} ${
                isPrimary ? "bg-white -mx-2 px-3 rounded-2xl border border-[#C3E6D2] my-2 shadow-sm" : ""
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${styles.iconClass}`}>
                  <Icon className="w-6 h-6" />
                </div>

                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between gap-3">
                    <div className={`flex items-center gap-2 text-[15px] font-black ${styles.labelClass}`}>
                      <span>{item.time}</span>
                      <span className="text-gray-300">·</span>
                      <span>{item.label}</span>
                    </div>
                    {isCompleted && (
                      <span className="inline-flex items-center gap-1 text-[14px] font-black text-[#256F4F]">
                        <CheckCircle2 className="w-4 h-4" />已完成
                      </span>
                    )}
                    {item.status === "upcoming" && (
                      <span className="text-[14px] font-black text-[#376A94]">今天下午</span>
                    )}
                  </div>

                  <h3 className="text-[21px] font-black text-[#1C2C24] leading-snug mt-1.5">{item.title}</h3>
                  <p className="text-[14px] font-bold text-gray-500 leading-relaxed mt-1">{item.description}</p>

                  {isPrimary && item.reminderId && (
                    <button
                      type="button"
                      onClick={() => onCompleteReminder?.(item.reminderId!)}
                      className="mt-3 w-full h-11 rounded-xl bg-[#14533C] hover:bg-[#0E3D2B] text-white text-[17px] font-black flex items-center justify-center gap-2 active:scale-[0.99] transition-all"
                    >
                      我已吃药
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                  )}

                  {item.kind === "consultation" && (
                    <button
                      type="button"
                      onClick={onOpenSchedule}
                      className="mt-2.5 inline-flex items-center gap-2 h-10 px-4 rounded-xl border-2 border-[#BFD3E5] bg-white text-[#376A94] text-[15px] font-black hover:bg-[#F2F7FB] transition-colors"
                    >
                      查看准备事项
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <footer className="pt-4 border-t-2 border-[#E9E4DC] shrink-0">
        <button
          type="button"
          onClick={onOpenSchedule}
          className="w-full h-12 rounded-2xl bg-white hover:bg-[#EAF6EF] border-2 border-[#DDD7CE] hover:border-[#B8D9C7] text-[#256F4F] text-[17px] font-black transition-colors flex items-center justify-center gap-2"
        >
          <Clock3 className="w-5 h-5" />
          查看完整日程
          <ArrowRight className="w-4 h-4" />
        </button>
      </footer>
    </section>
  );
}
