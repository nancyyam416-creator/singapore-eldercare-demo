import { useEffect, useRef, useState, type PointerEvent } from "react";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Heart,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Volume2,
  X,
} from "lucide-react";
import { speakText, stopSpeech } from "../audio/speech";
import "./new-family-media-overlay.css";

export interface NewFamilyMediaItem {
  id: string;
  url: string;
  caption?: string;
  type?: "photo" | "video";
  videoUrl?: string;
  senderName?: string;
  uploadTime?: string;
  batchCaption?: string;
}

interface NewFamilyMediaOverlayProps {
  isOpen: boolean;
  items: NewFamilyMediaItem[];
  unreadCount: number;
  heartStates: Record<string, boolean>;
  onToggleHeart: (photoKey: string, liked: boolean) => void;
  onViewed: (mediaId: string) => void;
  onClose: () => void;
}

type VideoState = "cover" | "playing" | "ended" | "failed";

export default function NewFamilyMediaOverlay({
  isOpen,
  items,
  unreadCount,
  heartStates,
  onToggleHeart,
  onViewed,
  onClose,
}: NewFamilyMediaOverlayProps) {
  const [queue, setQueue] = useState<NewFamilyMediaItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [videoState, setVideoState] = useState<VideoState>("cover");
  const [voicePlaying, setVoicePlaying] = useState(false);
  const [feedback, setFeedback] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const wasOpenRef = useRef(false);
  const viewedIdsRef = useRef(new Set<string>());
  const pointerStartXRef = useRef<number | null>(null);

  const activeItem = queue[currentIndex] ?? queue[0];
  const isVideo = activeItem?.type === "video";
  const isLiked = activeItem ? Boolean(heartStates[activeItem.url]) : false;

  const pauseMedia = () => {
    videoRef.current?.pause();
    stopSpeech();
    setVoicePlaying(false);
    setVideoState((state) => state === "playing" ? "cover" : state);
  };

  const markViewed = (item: NewFamilyMediaItem) => {
    if (viewedIdsRef.current.has(item.id)) return;
    viewedIdsRef.current.add(item.id);
    onViewed(item.id);
  };

  const showItem = (nextIndex: number) => {
    if (queue.length <= 1) return;
    pauseMedia();
    setFeedback("");
    setVideoState("cover");
    setCurrentIndex((nextIndex + queue.length) % queue.length);
  };

  const playVideo = async () => {
    if (!activeItem?.videoUrl || !videoRef.current) {
      setVideoState("failed");
      setFeedback("视频暂时无法播放，请重试");
      return;
    }
    if (videoState === "playing") {
      videoRef.current.pause();
      setFeedback("视频已暂停");
      return;
    }
    if (videoState === "ended") videoRef.current.currentTime = 0;
    if (videoState === "failed") videoRef.current.load();
    try {
      await videoRef.current.play();
    } catch {
      setVideoState("failed");
      setFeedback("视频暂时无法播放，请重试");
    }
  };

  const playCaption = () => {
    if (!activeItem) return;
    if (voicePlaying) {
      stopSpeech();
      setVoicePlaying(false);
      setFeedback("留言已暂停");
      return;
    }
    setVoicePlaying(true);
    setFeedback("正在播放家人的留言…");
    speakText(activeItem.batchCaption || activeItem.caption || "家人发来一项新影像", {
      rate: 0.88,
      onEnd: () => {
        setVoicePlaying(false);
        setFeedback("留言播放完毕");
      },
      onError: () => {
        setVoicePlaying(false);
        setFeedback("播放没有成功，请再按一次");
      },
    });
  };

  const closeOverlay = () => {
    pauseMedia();
    setFeedback("");
    onClose();
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button")) return;
    pointerStartXRef.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (pointerStartXRef.current === null) return;
    const distance = event.clientX - pointerStartXRef.current;
    const switchThreshold = Math.min(160, event.currentTarget.clientWidth / 6);
    pointerStartXRef.current = null;
    if (distance > switchThreshold) showItem(currentIndex - 1);
    if (distance < -switchThreshold) showItem(currentIndex + 1);
  };

  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      setQueue(items.slice(0, Math.max(1, unreadCount)));
      setCurrentIndex(0);
      setVideoState("cover");
      setFeedback("");
      viewedIdsRef.current.clear();
    }
    if (!isOpen && wasOpenRef.current) pauseMedia();
    wasOpenRef.current = isOpen;
  }, [isOpen, items, unreadCount]);

  useEffect(() => {
    if (!isOpen || !activeItem || activeItem.type === "video") return;
    const timer = window.setTimeout(() => markViewed(activeItem), 350);
    return () => window.clearTimeout(timer);
  }, [activeItem, isOpen]);

  useEffect(() => () => {
    stopSpeech();
    videoRef.current?.pause();
  }, []);

  if (!isOpen || !activeItem) return null;

  return (
    <section className="new-family-media-overlay" role="dialog" aria-modal="true" aria-label="查看家人发来的新影像">
      <header className="new-family-media-overlay__header">
        <button type="button" onClick={closeOverlay}><X aria-hidden="true" /><strong>收起</strong></button>
        <div>
          <strong>家人发来的新影像</strong>
          <span>{currentIndex + 1} / {queue.length}</span>
        </div>
      </header>

      <div
        className="new-family-media-overlay__stage"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => { pointerStartXRef.current = null; }}
      >
        {isVideo ? (
          <video
            key={activeItem.id}
            ref={videoRef}
            src={activeItem.videoUrl}
            poster={activeItem.url}
            preload="metadata"
            playsInline
            onPlaying={() => {
              setVideoState("playing");
              setFeedback("视频正在播放…");
              markViewed(activeItem);
            }}
            onPause={() => setVideoState((state) => state === "playing" ? "cover" : state)}
            onEnded={() => {
              setVideoState("ended");
              setFeedback("视频播放完毕，可以重新播放");
            }}
            onError={() => {
              setVideoState("failed");
              setFeedback("视频暂时无法播放，请重试");
            }}
          />
        ) : (
          <img src={activeItem.url} alt={activeItem.caption || "家人发来的新照片"} draggable={false} />
        )}

        {isVideo && videoState !== "playing" && videoState !== "failed" && (
          <button className="new-family-media-overlay__play" type="button" onPointerDown={(event) => event.stopPropagation()} onPointerUp={(event) => event.stopPropagation()} onClick={() => void playVideo()}>
            {videoState === "ended" ? <RotateCcw aria-hidden="true" /> : <Play aria-hidden="true" fill="currentColor" />}
            <strong>{videoState === "ended" ? "重新播放" : "播放视频"}</strong>
          </button>
        )}
        {isVideo && videoState === "failed" && (
          <div className="new-family-media-overlay__failure" role="alert">
            <AlertTriangle aria-hidden="true" />
            <strong>视频暂时无法播放</strong>
            <button type="button" onClick={() => void playVideo()}><RefreshCw aria-hidden="true" />重试播放</button>
          </div>
        )}

        {queue.length > 1 && <>
          <button
            className="new-family-media-overlay__arrow is-left"
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onPointerUp={(event) => event.stopPropagation()}
            onClick={() => showItem(currentIndex - 1)}
            aria-label="上一项新影像"
          >
            <ChevronLeft aria-hidden="true" />
            <span>上一项</span>
          </button>
          <button
            className="new-family-media-overlay__arrow is-right"
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onPointerUp={(event) => event.stopPropagation()}
            onClick={() => showItem(currentIndex + 1)}
            aria-label="下一项新影像"
          >
            <ChevronRight aria-hidden="true" />
            <span>下一项</span>
          </button>
        </>}
      </div>

      <footer className="new-family-media-overlay__caption">
        <div className="new-family-media-overlay__copy">
          <span>{activeItem.senderName || "家人"}{activeItem.uploadTime ? ` · ${activeItem.uploadTime}` : ""}</span>
          <strong>“{activeItem.batchCaption || activeItem.caption || "家人发来一项新影像"}”</strong>
          {feedback && <small aria-live="polite">{feedback}</small>}
        </div>
        <div className="new-family-media-overlay__actions">
          {isVideo ? (
            <button className="is-primary" type="button" onClick={() => void playVideo()}>
              {videoState === "playing" ? <Pause aria-hidden="true" /> : videoState === "ended" ? <RotateCcw aria-hidden="true" /> : <Play aria-hidden="true" />}
              {videoState === "playing" ? "暂停视频" : videoState === "ended" ? "重新播放" : videoState === "failed" ? "重试播放" : "播放视频"}
            </button>
          ) : (
            <button className="is-primary" type="button" onClick={playCaption}>
              {voicePlaying ? <Pause aria-hidden="true" /> : <Volume2 aria-hidden="true" />}
              {voicePlaying ? "暂停留言" : "播放留言"}
            </button>
          )}
          <button className={`is-heart${isLiked ? " is-liked" : ""}`} type="button" onClick={() => onToggleHeart(activeItem.url, !isLiked)}>
            <Heart aria-hidden="true" fill={isLiked ? "currentColor" : "none"} />
            {isLiked ? "已喜欢" : "喜欢"}
          </button>
        </div>
      </footer>
    </section>
  );
}
