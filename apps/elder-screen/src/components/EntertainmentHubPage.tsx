import type { ComponentType } from "react";
import {
  CircleOff,
  Headphones,
  Music2,
  Radio,
  Tv,
  type LucideProps,
} from "lucide-react";
import SecondaryPageHeader from "./SecondaryPageHeader";
import {
  getActiveEntertainmentContentsForProject,
  type EntertainmentContentMock,
} from "../entertainment-content";
import "./entertainment-hub-page.css";

interface EntertainmentHubPageProps {
  isOpen: boolean;
  onClose: () => void;
  forceEmpty?: boolean;
}

interface EntertainmentPresentation {
  description: string;
  actionLabel: string;
  icon: ComponentType<LucideProps>;
  tone: string;
}

const CURRENT_PROJECT_ID = "PRJ-001";

const entertainmentPresentation: Record<string, EntertainmentPresentation> = {
  "ENT-001": {
    description: "观看经典戏曲和舞台节目",
    actionLabel: "进入戏曲",
    icon: Radio,
    tone: "amber",
  },
  "ENT-002": {
    description: "收听熟悉的歌曲和音乐",
    actionLabel: "进入音乐",
    icon: Music2,
    tone: "rose",
  },
  "ENT-003": {
    description: "收听相声、评书和故事",
    actionLabel: "进入收听",
    icon: Headphones,
    tone: "cyan",
  },
  "ENT-004": {
    description: "观看电视和综合视频节目",
    actionLabel: "进入电视",
    icon: Tv,
    tone: "blue",
  },
};

const isSafeExternalUrl = (value: string) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
};

export default function EntertainmentHubPage({ isOpen, onClose, forceEmpty = false }: EntertainmentHubPageProps) {
  if (!isOpen) return null;

  const activeEntries = forceEmpty
    ? []
    : getActiveEntertainmentContentsForProject(CURRENT_PROJECT_ID);

  const openEntry = (entry: EntertainmentContentMock) => {
    if (!isSafeExternalUrl(entry.targetUrl)) return;
    window.location.assign(entry.targetUrl);
  };

  return (
    <main className="entertainment-hub-page">
      <SecondaryPageHeader
        title="休闲娱乐"
        icon={<Radio aria-hidden="true" />}
        onBack={onClose}
      />

      <section className="entertainment-hub-grid" aria-label="休闲娱乐内容入口">
        {activeEntries.length === 0 ? (
          <div className="entertainment-hub-empty" role="status">
            <span><CircleOff aria-hidden="true" /></span>
            <h2>暂无娱乐内容</h2>
          </div>
        ) : activeEntries.map((entry) => {
          const presentation = entertainmentPresentation[entry.id] ?? {
            description: "按一下打开娱乐内容",
            actionLabel: "进入",
            icon: Radio,
            tone: "blue",
          };
          const EntryIcon = presentation.icon;

          return (
            <button
              type="button"
              key={entry.id}
              className="entertainment-hub-card"
              data-tone={presentation.tone}
              onClick={() => openEntry(entry)}
            >
              <span className="entertainment-hub-card__icon">
                <EntryIcon aria-hidden="true" />
              </span>
              <span className="entertainment-hub-card__copy">
                <strong>{entry.name}</strong>
                <small>{presentation.description}</small>
              </span>
              <span className="entertainment-hub-card__action">{presentation.actionLabel}</span>
            </button>
          );
        })}
      </section>
    </main>
  );
}
