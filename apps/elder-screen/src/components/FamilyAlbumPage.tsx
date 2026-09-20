import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import {
  AlertTriangle,
  Check,
  Heart,
  Images,
  ImageOff,
  Pause,
  Play,
  RefreshCw,
  Video,
  Volume2,
} from "lucide-react";
import { speakText, stopSpeech } from "../audio/speech";
import type { FamilyPhoto } from "../types";
import type { AcceptanceAlbumScenario, AcceptanceHeartScenario } from "./InteractionAcceptanceConsole";
import SecondaryPageHeader from "./SecondaryPageHeader";
import "./family-album-page.css";

type AlbumCategoryId = "all" | string;
type VoiceState = "idle" | "playing" | "finished";

interface AlbumCategory {
  id: AlbumCategoryId;
  name: string;
  icon: typeof Images;
}

interface AlbumPhoto {
  id: string;
  categoryId: Exclude<AlbumCategoryId, "all">;
  url: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
  type?: "photo" | "video";
  videoUrl?: string;
  batchCaption?: string;
  senderName: string;
  senderRole: string;
  uploadTime: string;
  location: string;
  voiceDuration: number;
  initialHearts: number;
  unread: boolean;
}

interface FamilyAlbumPageProps {
  isOpen: boolean;
  onClose: () => void;
  photos: FamilyPhoto[];
  viewedMediaIds: string[];
  initialMediaId?: string | null;
  onMediaViewed: (mediaId: string) => void;
  onLogInteraction?: (log: string) => void;
  onStartCallExternal?: (contactName: string) => void;
  heartStates?: Record<string, boolean>;
  onToggleHeart?: (photoKey: string, liked: boolean) => void;
  acceptanceScenario?: AcceptanceAlbumScenario;
  acceptanceHeartScenario?: AcceptanceHeartScenario;
}

const CATEGORY_STORAGE_KEY = "u2g-family-album-category-v1";

const categories: AlbumCategory[] = [
  {
    id: "all",
    name: "全部影像",
    icon: Images,
  },
];

const getInitialCategory = (): AlbumCategoryId => {
  if (typeof window === "undefined") return "all";
  return window.localStorage.getItem(CATEGORY_STORAGE_KEY) || "all";
};

export default function FamilyAlbumPage({
  isOpen,
  onClose,
  photos: sourcePhotos,
  viewedMediaIds,
  initialMediaId = null,
  onMediaViewed,
  onLogInteraction,
  heartStates,
  onToggleHeart,
  acceptanceScenario = "default",
  acceptanceHeartScenario = "not-liked",
}: FamilyAlbumPageProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<AlbumCategoryId>(getInitialCategory);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [localHeartStates, setLocalHeartStates] = useState<Record<string, boolean>>({});
  const [heartBurstKey, setHeartBurstKey] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [imageRetrySucceeded, setImageRetrySucceeded] = useState(false);
  const [videoState, setVideoState] = useState<"cover" | "playing" | "ended" | "failed">("cover");
  const [viewedVideoIds, setViewedVideoIds] = useState<string[]>([]);
  const pointerStartX = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const photos = useMemo<AlbumPhoto[]>(() => sourcePhotos.map((photo) => ({
    id: photo.id,
    categoryId: photo.categoryNameSnapshot || "未分类",
    url: photo.url,
    width: photo.width ?? 1280,
    height: photo.height ?? 900,
    alt: photo.alt ?? photo.caption,
    caption: photo.caption,
    type: photo.type,
    videoUrl: photo.videoUrl,
    batchCaption: photo.batchCaption,
    senderName: photo.senderName ?? "家人",
    senderRole: "家人",
    uploadTime: photo.uploadTime ?? photo.date,
    location: "",
    voiceDuration: photo.voiceDuration ?? 8,
    initialHearts: photo.initialHearts ?? 0,
    unread: !viewedMediaIds.includes(photo.id),
  })), [sourcePhotos, viewedMediaIds]);

  const scenarioPhotos = useMemo(
    () => acceptanceScenario === "empty"
      ? []
      : acceptanceScenario === "single"
        ? photos.slice(0, 1)
        : photos,
    [acceptanceScenario, photos],
  );
  const visiblePhotos = useMemo(
    () =>
      selectedCategoryId === "all"
        ? scenarioPhotos
        : scenarioPhotos.filter((photo) => photo.categoryId === selectedCategoryId),
    [scenarioPhotos, selectedCategoryId],
  );

  const dynamicCategories = useMemo<AlbumCategory[]>(() => [
    ...categories,
    ...Array.from(new Set(scenarioPhotos.map((photo) => photo.categoryId).filter(Boolean))).map((name) => ({
      id: name,
      name,
      icon: Images,
    })),
  ], [scenarioPhotos]);

  useEffect(() => {
    if (dynamicCategories.some((category) => category.id === selectedCategoryId)) return;
    setSelectedCategoryId("all");
  }, [dynamicCategories, selectedCategoryId]);

  const activePhoto = visiblePhotos[currentIndex] ?? visiblePhotos[0];

  const stopVoice = () => {
    stopSpeech();
    setVoiceState("idle");
  };

  const stopVideo = () => {
    videoRef.current?.pause();
    setVideoState((state) => state === "playing" ? "cover" : state);
  };

  const playVideo = async () => {
    if (!activePhoto || activePhoto.type !== "video" || !activePhoto.videoUrl) {
      setVideoState("failed");
      setFeedback("视频暂时无法播放，请重试");
      return;
    }
    if (videoState === "playing") {
      stopVideo();
      setFeedback("视频已暂停");
      return;
    }
    const video = videoRef.current;
    if (!video) return;
    if (videoState === "ended") video.currentTime = 0;
    if (videoState === "failed") video.load();
    try {
      await video.play();
    } catch {
      setVideoState("failed");
      setFeedback("视频暂时无法播放，请重试");
    }
  };

  const showPreviousPhoto = () => {
    if (visiblePhotos.length <= 1) return;
    stopVoice();
    stopVideo();
    setFeedback("");
    setCurrentIndex((index) => (index - 1 + visiblePhotos.length) % visiblePhotos.length);
  };

  const showNextPhoto = () => {
    if (visiblePhotos.length <= 1) return;
    stopVoice();
    stopVideo();
    setFeedback("");
    setCurrentIndex((index) => (index + 1) % visiblePhotos.length);
  };

  const selectCategory = (categoryId: AlbumCategoryId) => {
    stopVoice();
    stopVideo();
    setSelectedCategoryId(categoryId);
    setCurrentIndex(0);
    setFeedback("");
    window.localStorage.setItem(CATEGORY_STORAGE_KEY, categoryId);
  };

  const playVoiceMessage = () => {
    if (!activePhoto) return;
    if (voiceState === "playing") {
      stopVoice();
      setFeedback("播放已暂停");
      return;
    }

    setVoiceState("playing");
    setFeedback(`正在播放${activePhoto.senderName}的留言`);
    speakText(activePhoto.caption, {
      rate: 0.86,
      onEnd: () => {
        setVoiceState("finished");
        setFeedback("留言播放完毕");
        onLogInteraction?.(`收听了${activePhoto.senderName}的照片留言`);
      },
      onError: () => {
        setVoiceState("idle");
        setFeedback("播放没有成功，请再按一次");
      },
    });
  };

  const sendHeart = () => {
    if (!activePhoto) return;
    if (acceptanceHeartScenario === "sending") return;
    const isLiked = acceptanceHeartScenario === "liked"
      || (acceptanceHeartScenario !== "not-liked" && Boolean(heartStates?.[activePhoto.url] ?? localHeartStates[activePhoto.url]));
    const nextLiked = !isLiked;
    if (onToggleHeart) {
      onToggleHeart(activePhoto.url, nextLiked);
    } else {
      setLocalHeartStates((current) => ({
        ...current,
        [activePhoto.url]: nextLiked,
      }));
    }
    if (!nextLiked) {
      setFeedback("已取消喜欢");
      onLogInteraction?.(`取消喜欢${activePhoto.senderName}分享的影像`);
      return;
    }
    setHeartBurstKey((key) => key + 1);
    setFeedback(`已喜欢${activePhoto.senderName}分享的影像`);
    onLogInteraction?.(`喜欢了${activePhoto.senderName}分享的影像`);

    speakText(`已告诉${activePhoto.senderName}您喜欢这项家庭影像`, {
      fallbackKey: "heart-family",
      rate: 0.9,
    });
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    pointerStartX.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (pointerStartX.current === null) return;
    const distance = event.clientX - pointerStartX.current;
    const threshold = event.currentTarget.clientWidth / 5;
    pointerStartX.current = null;

    if (distance > threshold) showPreviousPhoto();
    if (distance < -threshold) showNextPhoto();
  };

  useEffect(() => {
    setImageRetrySucceeded(false);
  }, [acceptanceScenario]);

  useEffect(() => {
    if (currentIndex >= visiblePhotos.length) setCurrentIndex(0);
  }, [currentIndex, visiblePhotos.length]);

  useEffect(() => {
    if (!isOpen || !activePhoto?.unread || activePhoto.type === "video" || acceptanceScenario === "notice-photo") return;
    const timer = window.setTimeout(() => {
      onMediaViewed(activePhoto.id);
      onLogInteraction?.(`查看了${activePhoto.senderName}分享的新照片`);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [acceptanceScenario, activePhoto?.id, activePhoto?.unread, isOpen, onLogInteraction, onMediaViewed]);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedCategoryId("all");
    setCurrentIndex(0);
    setVideoState("cover");
    setVoiceState("idle");
    setFeedback("");
    const shouldShowVideo = acceptanceScenario === "video-failure" || acceptanceScenario === "notice-video";
    const requestedIndex = initialMediaId ? scenarioPhotos.findIndex((item) => item.id === initialMediaId) : -1;
    const firstVideoIndex = scenarioPhotos.findIndex((item) => item.type === "video");
    if (requestedIndex >= 0) setCurrentIndex(requestedIndex);
    else if (shouldShowVideo && firstVideoIndex >= 0) setCurrentIndex(firstVideoIndex);
    if (shouldShowVideo) setVideoState(acceptanceScenario === "video-failure" ? "failed" : "cover");
    if (shouldShowVideo && firstVideoIndex >= 0) {
      const videoId = scenarioPhotos[firstVideoIndex].id;
      setViewedVideoIds((ids) => ids.filter((id) => id !== videoId));
    }
  }, [acceptanceScenario, initialMediaId, isOpen, sourcePhotos]);

  useEffect(() => {
    if (isOpen) return;
    stopVoice();
    videoRef.current?.pause();
    setVideoState("cover");
    setFeedback("");
  }, [isOpen]);

  useEffect(
    () => () => {
      stopSpeech();
      videoRef.current?.pause();
    },
    [],
  );

  if (!isOpen) return null;

  const renderCategorySidebar = () => (
    <aside className="family-album-sidebar" aria-label="相册分类">
      <nav className="family-album-categories" aria-label="选择相册分类">
        {dynamicCategories.map((category) => {
          const CategoryIcon = category.icon;
          const categoryCount =
            category.id === "all"
              ? scenarioPhotos.length
              : scenarioPhotos.filter((photo) => photo.categoryId === category.id).length;
          const isSelected = category.id === selectedCategoryId;

          return (
            <button
              type="button"
              key={category.id}
              className={isSelected ? "is-selected" : ""}
              aria-current={isSelected ? "page" : undefined}
              onClick={() => selectCategory(category.id)}
            >
              <span className="family-album-category__icon">
                <CategoryIcon aria-hidden="true" />
              </span>
              <span className="family-album-category__copy">
                <strong>{category.name}</strong>
              </span>
              <span className="family-album-category__count">{categoryCount}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );

  if (!activePhoto) return (
    <main className="family-album-page" aria-label="家庭相册">
      <SecondaryPageHeader title="家庭相册" icon={<Images aria-hidden="true" />} onBack={onClose} />
      <div className="family-album-layout">
        {renderCategorySidebar()}
        <section className="family-album-stage">
          <div className="family-album-empty" role="status">
            <Images aria-hidden="true" />
            <strong>暂无家庭影像</strong>
            <span>家人分享照片或视频后，会在这里展示</span>
          </div>
        </section>
      </div>
    </main>
  );

  const currentPhotoLiked = acceptanceHeartScenario === "liked"
    || (acceptanceHeartScenario !== "not-liked" && Boolean(heartStates?.[activePhoto.url] ?? localHeartStates[activePhoto.url]));
  const isActiveVideo = activePhoto.type === "video";
  const isActivePhotoUnread = !isActiveVideo && (acceptanceScenario === "notice-photo" || activePhoto.unread);
  const isActiveVideoUnread = isActiveVideo && (acceptanceScenario === "notice-video" || activePhoto.unread);

  return (
    <main className="family-album-page" aria-label="家庭相册">
      <SecondaryPageHeader
        title="家庭相册"
        icon={<Images aria-hidden="true" />}
        onBack={onClose}
      />

      <div className="family-album-layout">
        {renderCategorySidebar()}

        <section
          className="family-album-stage"
          aria-label="家庭影像"
        >
          <div
            className="family-album-photo"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerCancel={() => {
              pointerStartX.current = null;
            }}
          >
            {isActiveVideo ? (
              <>
                <video
                  key={activePhoto.id}
                  ref={videoRef}
                  src={activePhoto.videoUrl}
                  poster={activePhoto.url}
                  preload="metadata"
                  playsInline
                  aria-label={activePhoto.alt}
                  onPlaying={() => {
                    setVideoState("playing");
                    setFeedback("视频正在播放");
                    setViewedVideoIds((ids) => {
                      if (ids.includes(activePhoto.id)) return ids;
                      onMediaViewed(activePhoto.id);
                      onLogInteraction?.(`查看了${activePhoto.senderName}分享的新视频`);
                      return [...ids, activePhoto.id];
                    });
                  }}
                  onPause={() => setVideoState((state) => state === "playing" ? "cover" : state)}
                  onEnded={() => {
                    setVideoState("ended");
                    setFeedback("视频播放完毕，可以重新播放");
                  }}
                />
                {videoState === "failed" ? (
                  <div className="family-album-video__failure" role="alert">
                    <AlertTriangle aria-hidden="true" />
                    <strong>视频暂时无法播放</strong>
                    <span>请检查网络后再试一次</span>
                    <button type="button" onPointerDown={(event) => event.stopPropagation()} onPointerUp={(event) => event.stopPropagation()} onClick={() => void playVideo()}><RefreshCw aria-hidden="true" />重试播放</button>
                  </div>
                ) : videoState !== "playing" && (
                  <button
                    type="button"
                    className="family-album-video__play"
                    onPointerDown={(event) => event.stopPropagation()}
                    onPointerUp={(event) => event.stopPropagation()}
                    onClick={() => void playVideo()}
                    aria-label={videoState === "playing" ? "暂停家庭视频" : videoState === "ended" ? "重新播放家庭视频" : "播放家庭视频"}
                  >
                    {videoState === "playing" ? <Pause aria-hidden="true" /> : videoState === "ended" ? <RefreshCw aria-hidden="true" /> : <Play aria-hidden="true" fill="currentColor" />}
                    <span>{videoState === "playing" ? "暂停" : videoState === "ended" ? "重新播放" : "播放视频"}</span>
                  </button>
                )}
              </>
            ) : acceptanceScenario === "load-failure" && !imageRetrySucceeded ? (
              <div className="family-album-image-failure" role="alert">
                <ImageOff aria-hidden="true" />
                <strong>照片暂时无法加载</strong>
                <span>上传人和照片留言已保留，请检查网络后重试</span>
                <button type="button" onClick={() => setImageRetrySucceeded(true)}><RefreshCw aria-hidden="true" />重新加载</button>
              </div>
            ) : (
              <img
                key={activePhoto.id}
                src={activePhoto.url}
                alt={activePhoto.alt}
                width={activePhoto.width}
                height={activePhoto.height}
                fetchPriority="high"
                draggable={false}
                referrerPolicy="no-referrer"
              />
            )}

            <div className="family-album-photo__position" aria-hidden="true">
              <Images aria-hidden="true" />
              <span>家庭相册 · {currentIndex + 1} / {visiblePhotos.length}</span>
            </div>

            {heartBurstKey > 0 && (
              <div key={heartBurstKey} className="family-album-heart-burst" aria-hidden="true">
                {Array.from({ length: 5 }, (_, index) => (
                  <Heart key={index} />
                ))}
              </div>
            )}
            {acceptanceHeartScenario === "failure" && (
              <div className="family-album-heart-toast" role="status"><AlertTriangle aria-hidden="true" />喜欢失败，请稍后重试</div>
            )}
          </div>

          <footer className="family-album-story">
            <div className="family-album-story__copy">
              <div className="family-album-story__meta">
                <span className="family-album-story__sender">{activePhoto.senderName}</span>
                <span>{activePhoto.uploadTime}</span>
                {isActivePhotoUnread && <span className="family-album-story__unread">新照片 · 未查看</span>}
                {isActiveVideoUnread && <span className="family-album-story__unread">新视频 · 未查看</span>}
              </div>
              <blockquote>“{activePhoto.batchCaption || activePhoto.caption}”</blockquote>
              {(isActiveVideo && videoState === "playing") || voiceState === "playing" || feedback ? (
                <p className="family-album-feedback" aria-live="polite">
                  {isActiveVideo && videoState === "playing" ? (
                    <><Video aria-hidden="true" />视频正在播放…</>
                  ) : voiceState === "playing" ? (
                    <>
                      <Volume2 aria-hidden="true" />
                      正在大声播放留言…
                    </>
                  ) : (
                    <>
                      <Check aria-hidden="true" />
                      {feedback}
                    </>
                  )}
                </p>
              ) : null}
            </div>

            <div className="family-album-story__actions">
              {isActiveVideo ? (
                <button type="button" className={`family-album-voice${videoState === "playing" ? " is-playing" : ""}`} onClick={() => void playVideo()}>
                  {videoState === "playing" ? <Pause aria-hidden="true" /> : videoState === "ended" ? <RefreshCw aria-hidden="true" /> : <Play aria-hidden="true" />}
                  {videoState === "playing" ? "暂停视频" : videoState === "ended" ? "重新播放" : videoState === "failed" ? "重试播放" : "播放视频"}
                </button>
              ) : (
                <button
                  type="button"
                  className={`family-album-voice${voiceState === "playing" ? " is-playing" : ""}`}
                  aria-busy={voiceState === "playing"}
                  onClick={playVoiceMessage}
                >
                  {voiceState === "playing" ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
                  {voiceState === "playing"
                    ? "暂停播放"
                    : voiceState === "finished"
                      ? "重新播放"
                      : `播放留言 ${activePhoto.voiceDuration}秒`}
                </button>
              )}
              <button type="button" className={`family-album-heart${currentPhotoLiked ? " is-liked" : ""}`} onClick={sendHeart} disabled={acceptanceHeartScenario === "sending"} aria-label={currentPhotoLiked ? "取消喜欢这项家庭影像" : "喜欢这项家庭影像"}>
                <Heart aria-hidden="true" />
                {acceptanceHeartScenario === "sending" ? "发送中" : currentPhotoLiked ? "取消喜欢" : "喜欢"}
              </button>
            </div>
          </footer>
        </section>
      </div>
    </main>
  );
}
