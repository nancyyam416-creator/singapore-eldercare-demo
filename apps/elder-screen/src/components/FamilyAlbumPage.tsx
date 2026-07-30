import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import {
  AlertTriangle,
  Baby,
  Check,
  ChevronLeft,
  ChevronRight,
  Flower2,
  Heart,
  Images,
  ImageOff,
  MonitorPlay,
  Pause,
  Play,
  RefreshCw,
  Sparkles,
  UsersRound,
  Video,
  Volume2,
} from "lucide-react";
import type { AcceptanceAlbumScenario, AcceptanceHeartScenario } from "./InteractionAcceptanceConsole";
import SecondaryPageHeader from "./SecondaryPageHeader";
import "./family-album-page.css";

type AlbumCategoryId = "all" | "grandchildren" | "reunion" | "daily";
type VoiceState = "idle" | "playing" | "finished";

interface AlbumCategory {
  id: AlbumCategoryId;
  name: string;
  description: string;
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
  onLogInteraction?: (log: string) => void;
  onStartCallExternal?: (contactName: string) => void;
  onUnreadCountChange?: (count: number) => void;
  heartStates?: Record<string, boolean>;
  onToggleHeart?: (photoKey: string, liked: boolean) => void;
  acceptanceScenario?: AcceptanceAlbumScenario;
  acceptanceHeartScenario?: AcceptanceHeartScenario;
}

const CATEGORY_STORAGE_KEY = "u2g-family-album-category-v1";
const SCREEN_SAVER_INTERVAL = 8_000;

const categories: AlbumCategory[] = [
  {
    id: "all",
    name: "全部影像",
    description: "家人分享的照片和视频",
    icon: Images,
  },
  {
    id: "grandchildren",
    name: "孙辈成长",
    description: "孩子们的成长与新鲜事",
    icon: Baby,
  },
  {
    id: "reunion",
    name: "节日团聚",
    description: "全家相聚的珍贵回忆",
    icon: UsersRound,
  },
  {
    id: "daily",
    name: "日常与花草",
    description: "平凡日子里的小美好",
    icon: Flower2,
  },
];

const initialPhotos: AlbumPhoto[] = [
  {
    id: "snowman-message",
    categoryId: "grandchildren",
    url: "/assets/snowman-photo-message.jpg",
    width: 2400,
    height: 1744,
    alt: "孩子们在雪地里一起堆雪人",
    caption: "爸，这是昨天下雪拍的照片",
    senderName: "女儿小敏",
    senderRole: "女儿",
    uploadTime: "今天 09:12",
    location: "北京",
    voiceDuration: 7,
    initialHearts: 12,
    unread: true,
  },
  {
    id: "dragon-boat-song-video",
    categoryId: "grandchildren",
    url: "https://picsum.photos/seed/familygarden/600/450",
    width: 1280,
    height: 900,
    alt: "重孙女在幼儿园唱端午节儿歌的视频封面",
    caption: "悦悦在幼儿园唱了端午节儿歌，专门录给爷爷看。",
    type: "video",
    videoUrl: "/assets/family-video-mock.mp4",
    batchCaption: "幼儿园端午节活动的一段家庭视频。",
    senderName: "女儿小敏",
    senderRole: "女儿",
    uploadTime: "今天 10:05",
    location: "北京",
    voiceDuration: 0,
    initialHearts: 15,
    unread: true,
  },
  {
    id: "granddaughter-card",
    categoryId: "grandchildren",
    url: "https://picsum.photos/seed/card/1280/900",
    width: 1280,
    height: 900,
    alt: "孙女画给爷爷的节日贺卡",
    caption: "小雅画了一张贺卡送给爷爷，祝您每天都开心！",
    senderName: "女儿小敏",
    senderRole: "女儿",
    uploadTime: "07月20日 16:30",
    location: "北京",
    voiceDuration: 8,
    initialHearts: 9,
    unread: true,
  },
  {
    id: "grandson-piano",
    categoryId: "grandchildren",
    url: "https://picsum.photos/seed/piano/1280/900",
    width: 1280,
    height: 900,
    alt: "外孙参加学校钢琴比赛",
    caption: "小杰参加学校钢琴比赛了，他说下次要弹给爷爷听。",
    senderName: "儿子小刚",
    senderRole: "儿子",
    uploadTime: "07月18日 19:45",
    location: "上海",
    voiceDuration: 9,
    initialHearts: 15,
    unread: false,
  },
  {
    id: "family-gift-video",
    categoryId: "reunion",
    url: "https://picsum.photos/seed/grandsonplay/600/450",
    width: 1280,
    height: 900,
    alt: "家人一起拆礼物的视频封面",
    caption: "孩子们一起准备了礼物，想让爷爷也看看当时有多热闹。",
    type: "video",
    videoUrl: "/assets/family-video-mock.mp4",
    batchCaption: "家庭聚会当天的一段欢乐视频。",
    senderName: "儿子小刚",
    senderRole: "儿子",
    uploadTime: "07月17日 20:10",
    location: "上海",
    voiceDuration: 0,
    initialHearts: 18,
    unread: false,
  },
  {
    id: "birthday-reunion",
    categoryId: "reunion",
    url: "https://picsum.photos/seed/familyall/1280/900",
    width: 1280,
    height: 900,
    alt: "全家人在寿宴上拍摄的大合影",
    caption: "这是上个月寿宴的大合影，四世同堂，大家都笑得特别开心。",
    senderName: "儿子小刚",
    senderRole: "儿子",
    uploadTime: "05月22日 18:10",
    location: "杭州",
    voiceDuration: 10,
    initialHearts: 21,
    unread: false,
  },
  {
    id: "mid-autumn-reunion",
    categoryId: "reunion",
    url: "https://picsum.photos/seed/bbq/1280/900",
    width: 1280,
    height: 900,
    alt: "全家人在中秋节聚餐",
    caption: "去年中秋大家一起赏月，小雅还给爷爷留了一块蛋黄月饼。",
    senderName: "女儿小敏",
    senderRole: "女儿",
    uploadTime: "去年中秋节",
    location: "北京",
    voiceDuration: 9,
    initialHearts: 18,
    unread: false,
  },
  {
    id: "hydrangea-daily",
    categoryId: "daily",
    url: "https://picsum.photos/seed/hydrangea/1280/900",
    width: 1280,
    height: 900,
    alt: "窗边盛开的绣球花",
    caption: "阳台上的绣球花开了，颜色和您以前种的一样漂亮。",
    senderName: "女儿小敏",
    senderRole: "女儿",
    uploadTime: "07月16日 08:40",
    location: "北京",
    voiceDuration: 7,
    initialHearts: 11,
    unread: false,
  },
  {
    id: "garden-walk",
    categoryId: "daily",
    url: "https://picsum.photos/seed/gardenstroll/1280/900",
    width: 1280,
    height: 900,
    alt: "家人在公园里散步",
    caption: "周末带孩子们去公园散步了，下次我们陪您一起去。",
    senderName: "女儿小敏",
    senderRole: "女儿",
    uploadTime: "07月13日 15:40",
    location: "北京",
    voiceDuration: 8,
    initialHearts: 14,
    unread: false,
  },
  {
    id: "mountain-memory",
    categoryId: "daily",
    url: "https://picsum.photos/seed/mountain/1280/900",
    width: 1280,
    height: 900,
    alt: "清晨山间的日出风景",
    caption: "整理旧照片时看到这张山顶日出，想起您以前常讲的旅行故事。",
    senderName: "儿子小刚",
    senderRole: "儿子",
    uploadTime: "07月10日 10:20",
    location: "杭州",
    voiceDuration: 10,
    initialHearts: 17,
    unread: false,
  },
];

const getInitialCategory = (): AlbumCategoryId => {
  if (typeof window === "undefined") return "all";
  const storedCategory = window.localStorage.getItem(CATEGORY_STORAGE_KEY);
  return categories.some((category) => category.id === storedCategory)
    ? (storedCategory as AlbumCategoryId)
    : "all";
};

export default function FamilyAlbumPage({
  isOpen,
  onClose,
  onLogInteraction,
  onUnreadCountChange,
  heartStates,
  onToggleHeart,
  acceptanceScenario = "default",
  acceptanceHeartScenario = "not-liked",
}: FamilyAlbumPageProps) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [selectedCategoryId, setSelectedCategoryId] = useState<AlbumCategoryId>(getInitialCategory);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [screenSaverEnabled, setScreenSaverEnabled] = useState(false);
  const [screenSaverPaused, setScreenSaverPaused] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [localHeartStates, setLocalHeartStates] = useState<Record<string, boolean>>({});
  const [heartBurstKey, setHeartBurstKey] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [imageRetrySucceeded, setImageRetrySucceeded] = useState(false);
  const [videoState, setVideoState] = useState<"cover" | "playing" | "ended" | "failed">("cover");
  const [viewedVideoIds, setViewedVideoIds] = useState<string[]>([]);
  const pointerStartX = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

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

  const selectedCategory =
    categories.find((category) => category.id === selectedCategoryId) ?? categories[0];
  const activePhoto = visiblePhotos[currentIndex] ?? visiblePhotos[0];
  const unreadCount = scenarioPhotos.filter((photo) => photo.unread).length;

  const stopVoice = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
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

    if (!("speechSynthesis" in window)) {
      setVoiceState("finished");
      setFeedback("当前设备暂不支持语音播放");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(activePhoto.caption);
    utterance.lang = "zh-CN";
    utterance.rate = 0.86;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.onend = () => {
      setVoiceState("finished");
      setFeedback("留言播放完毕");
      onLogInteraction?.(`收听了${activePhoto.senderName}的照片留言`);
    };
    utterance.onerror = () => {
      setVoiceState("idle");
      setFeedback("播放没有成功，请再按一次");
    };
    setVoiceState("playing");
    setFeedback(`正在播放${activePhoto.senderName}的留言`);
    window.speechSynthesis.speak(utterance);
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
      setFeedback("已取消爱心");
      onLogInteraction?.(`取消了${activePhoto.senderName}分享影像的爱心`);
      return;
    }
    setHeartBurstKey((key) => key + 1);
    setFeedback(`已把爱心送给${activePhoto.senderName}`);
    onLogInteraction?.(`给${activePhoto.senderName}分享的影像送了爱心`);

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const confirmation = new SpeechSynthesisUtterance(`已把爱心送给${activePhoto.senderName}`);
      confirmation.lang = "zh-CN";
      confirmation.rate = 0.9;
      window.speechSynthesis.speak(confirmation);
    }
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    pointerStartX.current = event.clientX;
    if (screenSaverEnabled) setScreenSaverPaused(true);
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
    onUnreadCountChange?.(unreadCount);
  }, [onUnreadCountChange, unreadCount]);

  useEffect(() => {
    if (!isOpen || !activePhoto?.unread || activePhoto.type === "video" || acceptanceScenario === "notice-photo" || acceptanceScenario === "notice-mixed") return;
    const timer = window.setTimeout(() => {
      setPhotos((current) =>
        current.map((photo) =>
          photo.id === activePhoto.id ? { ...photo, unread: false } : photo,
        ),
      );
      onLogInteraction?.(`查看了${activePhoto.senderName}分享的新照片`);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [acceptanceScenario, activePhoto?.id, activePhoto?.unread, isOpen, onLogInteraction]);

  useEffect(() => {
    if (!isOpen || !screenSaverEnabled || screenSaverPaused || videoState === "playing" || visiblePhotos.length <= 1) return;
    const timer = window.setInterval(showNextPhoto, SCREEN_SAVER_INTERVAL);
    return () => window.clearInterval(timer);
  }, [isOpen, screenSaverEnabled, screenSaverPaused, videoState, visiblePhotos.length]);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedCategoryId("all");
    setCurrentIndex(0);
    setVideoState("cover");
    setVoiceState("idle");
    setFeedback("");
    const shouldShowVideo = acceptanceScenario === "notice-video"
      || acceptanceScenario === "video-cover"
      || acceptanceScenario === "video-viewed"
      || acceptanceScenario === "video-failure";
    const firstVideoIndex = initialPhotos.findIndex((item) => item.type === "video");
    if (shouldShowVideo && firstVideoIndex >= 0) setCurrentIndex(firstVideoIndex);
    if (shouldShowVideo) setVideoState(acceptanceScenario === "video-failure" ? "failed" : "cover");
    if (shouldShowVideo && firstVideoIndex >= 0) {
      const videoId = initialPhotos[firstVideoIndex].id;
      setViewedVideoIds((ids) => acceptanceScenario === "video-viewed"
        ? (ids.includes(videoId) ? ids : [...ids, videoId])
        : ids.filter((id) => id !== videoId));
    }
  }, [acceptanceScenario, isOpen]);

  useEffect(() => {
    if (isOpen) return;
    stopVoice();
    videoRef.current?.pause();
    setVideoState("cover");
    setScreenSaverEnabled(false);
    setScreenSaverPaused(false);
    setFeedback("");
  }, [isOpen]);

  useEffect(
    () => () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      videoRef.current?.pause();
    },
    [],
  );

  if (!isOpen) return null;

  if (!activePhoto) return (
    <main className="family-album-page" aria-label="家庭相册">
      <SecondaryPageHeader title="家庭相册" icon={<Images aria-hidden="true" />} onBack={onClose} />
      <section className="family-album-empty" role="status">
        <Images aria-hidden="true" />
        <strong>暂无家庭照片</strong>
        <span>家人分享照片后，会在这里展示</span>
      </section>
    </main>
  );

  const currentPhotoLiked = acceptanceHeartScenario === "liked"
    || (acceptanceHeartScenario !== "not-liked" && Boolean(heartStates?.[activePhoto.url] ?? localHeartStates[activePhoto.url]));
  const isActiveVideo = activePhoto.type === "video";
  const isActivePhotoUnread = !isActiveVideo && (
    acceptanceScenario === "notice-photo"
    || acceptanceScenario === "notice-mixed"
    || activePhoto.unread
  );
  const activeVideoViewed = viewedVideoIds.includes(activePhoto.id) || acceptanceScenario === "video-viewed";
  const activeCategoryName = categories.find((category) => category.id === activePhoto.categoryId)?.name ?? "家庭相册";

  return (
    <main className="family-album-page" aria-label="家庭相册">
      <SecondaryPageHeader
        title="家庭相册"
        icon={<Images aria-hidden="true" />}
        onBack={onClose}
        actions={(
          <button
            type="button"
            className={`family-album-screen-saver${screenSaverEnabled ? " is-active" : ""}`}
            aria-pressed={screenSaverEnabled}
            onClick={() => {
              setScreenSaverEnabled((enabled) => {
                if (enabled) setScreenSaverPaused(false);
                return !enabled;
              });
              setFeedback(screenSaverEnabled ? "屏保轮播已关闭" : "屏保轮播已开启，每8秒切换一项");
            }}
          >
            {screenSaverEnabled ? <Pause aria-hidden="true" /> : <MonitorPlay aria-hidden="true" />}
            {screenSaverEnabled ? "关闭屏保轮播" : "开启屏保轮播"}
          </button>
        )}
      />

      <div className="family-album-layout">
        <aside className="family-album-sidebar" aria-label="相册分类">
          <div className="family-album-sidebar__heading">
            <p>相册分类</p>
            <strong>{scenarioPhotos.length} 项家庭影像</strong>
          </div>

          <nav className="family-album-categories" aria-label="选择相册分类">
            {categories.map((category) => {
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
                    <small>{category.description}</small>
                  </span>
                  <span className="family-album-category__count">{categoryCount}</span>
                </button>
              );
            })}
          </nav>

          <div className="family-album-sidebar__tip">
            <Sparkles aria-hidden="true" />
            <p>
              <strong>会记住您的选择</strong>
              下次打开，仍会停在这个分类
            </p>
          </div>
        </aside>

        <section
          className="family-album-stage"
          aria-labelledby="active-album-title"
          onFocusCapture={() => {
            if (screenSaverEnabled) setScreenSaverPaused(true);
          }}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
              setScreenSaverPaused(false);
            }
          }}
        >
          <header className="family-album-stage__toolbar">
            <div>
              <h2 id="active-album-title">{selectedCategory.name}</h2>
              <p>
                第 {currentIndex + 1} 项，共 {visiblePhotos.length} 项
                {screenSaverEnabled && (
                  <span>{screenSaverPaused ? "屏保轮播已暂停" : "屏保轮播中"}</span>
                )}
              </p>
            </div>

            <div className="family-album-paging" aria-label="家庭影像翻页">
              <button
                type="button"
                onClick={showPreviousPhoto}
                disabled={visiblePhotos.length <= 1}
                aria-label="上一项家庭影像"
              >
                <ChevronLeft aria-hidden="true" />
                上一项
              </button>
              <button
                type="button"
                onClick={showNextPhoto}
                disabled={visiblePhotos.length <= 1}
                aria-label="下一项家庭影像"
              >
                下一项
                <ChevronRight aria-hidden="true" />
              </button>
            </div>
          </header>

          <div
            className="family-album-photo"
            onPointerDown={handlePointerDown}
            onPointerUp={(event) => {
              handlePointerUp(event);
              setScreenSaverPaused(false);
            }}
            onPointerCancel={() => {
              pointerStartX.current = null;
              setScreenSaverPaused(false);
            }}
            onMouseEnter={() => {
              if (screenSaverEnabled) setScreenSaverPaused(true);
            }}
            onMouseLeave={() => setScreenSaverPaused(false)}
          >
            {isActivePhotoUnread && (
              <span className="family-album-new-badge">
                {acceptanceScenario === "notice-mixed" ? "3 项新影像 · 含照片和视频" : "新照片 · 未查看"}
              </span>
            )}
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
                      setPhotos((current) => current.map((item) => item.id === activePhoto.id ? { ...item, unread: false } : item));
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
                <span className={`family-album-video__badge${activeVideoViewed ? "" : " is-unread"}`}><Video aria-hidden="true" />家庭视频 · {activeVideoViewed ? "已查看" : "未查看"}</span>
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
              {currentIndex + 1} / {visiblePhotos.length}
            </div>

            {heartBurstKey > 0 && (
              <div key={heartBurstKey} className="family-album-heart-burst" aria-hidden="true">
                {Array.from({ length: 5 }, (_, index) => (
                  <Heart key={index} />
                ))}
              </div>
            )}
            {acceptanceHeartScenario === "failure" && (
              <div className="family-album-heart-toast" role="status"><AlertTriangle aria-hidden="true" />爱心发送失败，请稍后重试</div>
            )}
          </div>

          <footer className="family-album-story">
            <div className="family-album-story__copy">
              <div className="family-album-story__meta">
                <span className="family-album-story__sender">{activePhoto.senderName}</span>
                <span>{activePhoto.senderRole}</span>
                <span>{activePhoto.uploadTime}</span>
                <span>{activeCategoryName}</span>
                <span>{isActiveVideo ? "视频" : "照片"}</span>
                {isActivePhotoUnread && <span className="family-album-story__unread">新照片 · 未查看</span>}
              </div>
              <blockquote><em>批次附言</em>“{activePhoto.batchCaption || activePhoto.caption}”</blockquote>
              <p className="family-album-feedback" aria-live="polite">
                {isActiveVideo && videoState === "playing" ? (
                  <><Video aria-hidden="true" />视频正在播放…</>
                ) : voiceState === "playing" ? (
                  <>
                    <Volume2 aria-hidden="true" />
                    正在大声播放留言…
                  </>
                ) : feedback ? (
                  <>
                    <Check aria-hidden="true" />
                    {feedback}
                  </>
                ) : (
                  isActiveVideo ? "按播放键查看视频，也可以给家人送个爱心" : "可以播放留言，也可以给家人送个爱心"
                )}
              </p>
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
              <button type="button" className={`family-album-heart${currentPhotoLiked ? " is-liked" : ""}`} onClick={sendHeart} disabled={acceptanceHeartScenario === "sending"} aria-label={currentPhotoLiked ? "取消这项家庭影像的爱心" : "给这项家庭影像送个爱心"}>
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
