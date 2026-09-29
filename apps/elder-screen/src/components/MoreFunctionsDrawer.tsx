import type { ComponentType } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  CalendarClock,
  ContactRound,
  HandHeart,
  Images,
  Landmark,
  Radio,
  UserRound,
  X,
} from "lucide-react";
import "./more-functions-drawer.css";

interface MoreFunctionsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAlbum: () => void;
  onOpenContacts: () => void;
  onOpenReminders: () => void;
  onOpenCommunity: () => void;
  onOpenSpecialServices: () => void;
  onOpenEntertainment: () => void;
  onOpenProfile: () => void;
}

interface FunctionEntry {
  id: string;
  title: string;
  description: string;
  icon: ComponentType<{ "aria-hidden"?: boolean }>;
  tone: string;
  action: () => void;
}

export default function MoreFunctionsDrawer({
  isOpen,
  onClose,
  onOpenAlbum,
  onOpenContacts,
  onOpenReminders,
  onOpenCommunity,
  onOpenSpecialServices,
  onOpenEntertainment,
  onOpenProfile,
}: MoreFunctionsDrawerProps) {
  const entries: FunctionEntry[] = [
    {
      id: "album",
      title: "家庭相册",
      description: "查看家人分享的照片",
      icon: Images,
      tone: "rose",
      action: onOpenAlbum,
    },
    {
      id: "contacts",
      title: "通讯录",
      description: "联系家人与服务人员",
      icon: ContactRound,
      tone: "cyan",
      action: onOpenContacts,
    },
    {
      id: "reminders",
      title: "提醒事项",
      description: "查看用药和日程提醒",
      icon: CalendarClock,
      tone: "green",
      action: onOpenReminders,
    },
    {
      id: "community",
      title: "社区生活",
      description: "公告、资讯、话题、活动与警惕事项",
      icon: Landmark,
      tone: "blue",
      action: onOpenCommunity,
    },
    {
      id: "special-services",
      title: "特约服务",
      description: "预约家政等上门服务",
      icon: HandHeart,
      tone: "purple",
      action: onOpenSpecialServices,
    },
    {
      id: "entertainment",
      title: "休闲娱乐",
      description: "戏曲、音乐、评书与电视",
      icon: Radio,
      tone: "magenta",
      action: onOpenEntertainment,
    },
    {
      id: "profile",
      title: "我的信息",
      description: "查看本人、家人和社区资料",
      icon: UserRound,
      tone: "teal",
      action: onOpenProfile,
    },
  ];

  const selectEntry = (entry: FunctionEntry) => {
    onClose();
    entry.action();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="more-functions-overlay">
          <motion.button
            type="button"
            className="more-functions-backdrop"
            aria-label="关闭全部功能"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.section
            id="more-modules-drawer"
            className="more-functions-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="more-functions-title"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 27, stiffness: 190 }}
          >
            <header className="more-functions-header">
              <div>
                <h2 id="more-functions-title">更多功能</h2>
                <p>按一下，直接进入需要的功能</p>
              </div>
              <button type="button" className="more-functions-close" onClick={onClose} aria-label="关闭全部功能">
                <X aria-hidden="true" />
              </button>
            </header>

            <div className="more-functions-grid">
              {entries.map((entry) => {
                const EntryIcon = entry.icon;
                return (
                  <button
                    type="button"
                    key={entry.id}
                    className="more-function-card"
                    data-tone={entry.tone}
                    onClick={() => selectEntry(entry)}
                  >
                    <span className="more-function-card__icon">
                      <EntryIcon aria-hidden="true" />
                    </span>
                    <span className="more-function-card__copy">
                      <strong>{entry.title}</strong>
                      <small>{entry.description}</small>
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.section>
        </div>
      )}
    </AnimatePresence>
  );
}
