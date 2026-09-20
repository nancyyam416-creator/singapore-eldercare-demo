import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from "react";
import {
  CircleOff,
  LoaderCircle,
  Music2,
  Radio,
  RefreshCw,
  Youtube,
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
  openShouldFail?: boolean;
  failureSignal?: number;
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
    description: "观看视频和喜爱的节目",
    actionLabel: "打开 YouTube",
    icon: Youtube,
    tone: "red",
  },
  "ENT-002": {
    description: "收听音乐和播客内容",
    actionLabel: "打开 Spotify",
    icon: Music2,
    tone: "green",
  },
  "ENT-003": {
    description: "收听新加坡广播电台",
    actionLabel: "打开 MeRadio",
    icon: Radio,
    tone: "cyan",
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

export default function EntertainmentHubPage({
  isOpen,
  onClose,
  forceEmpty = false,
  openShouldFail = false,
  failureSignal = 0,
}: EntertainmentHubPageProps) {
  const [activeEntry, setActiveEntry] = useState<EntertainmentContentMock | null>(null);
  const [failedEntry, setFailedEntry] = useState<EntertainmentContentMock | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const retryTimer = useRef<number | null>(null);
  const activeEntries = useMemo(() => forceEmpty
    ? []
    : getActiveEntertainmentContentsForProject(CURRENT_PROJECT_ID), [forceEmpty]);

  useEffect(() => {
    if (isOpen && openShouldFail) return;
    if (retryTimer.current) window.clearTimeout(retryTimer.current);
    if (!isOpen) setActiveEntry(null);
    setFailedEntry(null);
    setIsRetrying(false);
  }, [isOpen, openShouldFail]);

  useEffect(() => () => {
    if (retryTimer.current) window.clearTimeout(retryTimer.current);
  }, []);

  useEffect(() => {
    if (!isOpen || !openShouldFail || failureSignal <= 0) return;
    setFailedEntry(activeEntries[0] ?? null);
    setIsRetrying(false);
  }, [activeEntries, failureSignal, isOpen, openShouldFail]);

  if (!isOpen) return null;

  const openEntry = (entry: EntertainmentContentMock) => {
    if (openShouldFail) {
      setFailedEntry(entry);
      setIsRetrying(false);
      return;
    }
    if (!isSafeExternalUrl(entry.targetUrl)) return;
    setActiveEntry(entry);
  };

  const retryEntry = () => {
    if (!failedEntry) return;
    if (retryTimer.current) window.clearTimeout(retryTimer.current);
    setIsRetrying(true);
    retryTimer.current = window.setTimeout(() => setIsRetrying(false), 700);
  };

  if (activeEntry) {
    const presentation = entertainmentPresentation[activeEntry.id];
    const EntryIcon = presentation?.icon ?? Radio;
    const externalHost = new URL(activeEntry.targetUrl).hostname.replace(/^www\./, "");

    return (
      <main className="entertainment-hub-page entertainment-hub-page--external">
        <SecondaryPageHeader
          title={activeEntry.name}
          icon={<EntryIcon aria-hidden="true" />}
          onBack={() => setActiveEntry(null)}
          backLabel="返回休闲娱乐"
          actions={<span className="entertainment-external-badge">外部内容</span>}
        />
        <section className="entertainment-external-frame" aria-label={`${activeEntry.name} 外部内容`}>
          <div
            className="entertainment-external-frame__fallback"
            data-tone={presentation?.tone ?? "green"}
          >
            <span><EntryIcon aria-hidden="true" /></span>
            <strong>{activeEntry.name}</strong>
            <small>{externalHost}</small>
          </div>
          <iframe
            src={activeEntry.targetUrl}
            title={activeEntry.name}
            allow="autoplay; encrypted-media; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </section>
      </main>
    );
  }

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

      {failedEntry && (
        <div className="entertainment-hub-failure-layer">
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="entertainment-open-failure-title"
            className="entertainment-hub-failure"
          >
            <span className="entertainment-hub-failure__icon">
              {isRetrying
                ? <LoaderCircle className="is-spinning" aria-hidden="true" />
                : <CircleOff aria-hidden="true" />}
            </span>
            <h2 id="entertainment-open-failure-title">
              {isRetrying ? "正在重新打开" : "内容暂时无法播放"}
            </h2>
            <p>
              {isRetrying
                ? `正在尝试打开“${failedEntry.name}”`
                : `“${failedEntry.name}”暂时无法打开，请稍后再试。`}
            </p>
            {!isRetrying && (
              <div className="entertainment-hub-failure__actions">
                <button type="button" onClick={() => setFailedEntry(null)}>返回</button>
                <button type="button" onClick={retryEntry} className="is-primary">
                  <RefreshCw aria-hidden="true" />再试一次
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
