import React, { useEffect, useMemo, useRef, useState } from "react";
import { speakText } from "../audio/speech";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleEllipsis,
  Heart,
  Image,
  ImageOff,
  MessageCircleHeart,
  Mic,
  MapPin,
  Pause,
  Play,
  Phone,
  RefreshCw,
  RotateCcw,
  Send,
  Sun,
  CloudRain,
  CloudSun,
  WifiOff,
  X,
} from "lucide-react";
import HomeTaskRail from "./HomeTaskRail";
import NewFamilyMediaOverlay from "./NewFamilyMediaOverlay";
import type { AcceptanceAlbumScenario, AcceptanceHeartScenario, AcceptanceHomeCommand, AcceptanceRightContentScenario } from "./InteractionAcceptanceConsole";
import type { MedicationReminder } from "../types";
import {
  formatWeatherLocalTime,
  formatWeatherUpdatedAt,
  type FamilyWeatherMember,
  type FamilyWeatherSnapshot,
  type WeatherConditionCode,
} from "../weather/familyWeather";

interface ReminderItem {
  id: string;
  time: string;
  name: string;
  status: "pending" | "completed" | "unconfirmed" | "expired";
  takenAt?: string;
  priority?: "P0" | "P1" | "P2";
  category?: "medication" | "schedule";
  ctaTitle?: string;
}

interface MessageItem {
  id: string;
  sender: string;
  played: boolean;
  content: string;
  type?: "voice" | "text" | "photo" | "call_log";
  timestamp?: string;
  audioUrl?: string;
  photoUrl?: string;
  photoUrls?: string[];
  loadFailed?: boolean;
}

interface AlbumPhotoItem {
  id: string;
  url: string;
  caption?: string;
  type?: "photo" | "video";
  videoUrl?: string;
  senderName?: string;
  uploadTime?: string;
  categoryName?: string;
  batchCaption?: string;
  initialHearts?: number;
}

type HomeVideoState = "cover" | "playing" | "ended" | "failed";
type WeatherCareStage = "idle" | "confirm" | "sending" | "success" | "failure";

interface WeatherCareDraft {
  recipientId: string;
  requestId: string;
  text: string;
}

interface ControlCenterHomeProps {
  reminders: ReminderItem[];
  messages: MessageItem[];
  albumPhotos: AlbumPhotoItem[];
  albumUnreadCount: number;
  missedCallCount: number;
  photoHeartStates: Record<string, boolean>;
  onTogglePhotoHeart: (photoKey: string, liked: boolean) => void;
  onVideoViewed: (videoId: string) => void;
  onCompleteReminder: (id: string, fallbackReminder?: MedicationReminder) => void;
  onOpenAlbum: () => void;
  onOpenMessages: () => void;
  onOpenSchedule: () => void;
  onOpenTodayOverview: () => void;
  onOpenCommunity: () => void;
  onOpenRecommendation: (kind: "security" | "community" | "service" | "entertainment", contentId?: string) => void;
  onOpenContacts: () => void;
  onOpenAssistant: () => void;
  onOpenMore: () => void;
  onTriggerSOS: () => void;
  acceptanceTimeOverride?: string | null;
  acceptanceAlbumScenario?: AcceptanceAlbumScenario;
  acceptanceHeartScenario?: AcceptanceHeartScenario;
  acceptanceRightContentScenario?: AcceptanceRightContentScenario;
  acceptanceRightContentApplySignal?: number;
  acceptanceRevision?: number;
  acceptanceCommand?: { id: number; type: AcceptanceHomeCommand } | null;
  familyWeather: FamilyWeatherSnapshot;
}

const HOME_ALBUM_MAX_ITEMS = 30;

const hasUsableWeather = (member: FamilyWeatherMember) => Boolean(
  member.location?.status === "valid"
  && member.weather
  && (member.weather.queryState === "success" || member.weather.queryState === "cached")
);

const weatherIcon = (condition?: WeatherConditionCode) => {
  if (condition === "sunny" || condition === "hot") return <Sun />;
  if (condition === "rain" || condition === "storm") return <CloudRain />;
  return <CloudSun />;
};

const formatMemberLocation = (member: FamilyWeatherMember, elderCountryCode?: string) => {
  const location = member.location;
  if (!location || location.status !== "valid") return "尚未设置天气位置";
  if (member.isElder || location.countryCode === elderCountryCode) return location.cityName;
  return [location.cityName, location.administrativeAreaName, location.countryName].filter(Boolean).join(" · ");
};

const weatherUnavailableText = (member: FamilyWeatherMember) => {
  if (!member.location || member.location.status === "incomplete") return "尚未设置天气位置";
  if (member.location.status === "invalid") return "天气位置已失效";
  if (member.weather?.queryState === "unsupported") return "该地区天气暂时不支持";
  return member.weather?.statusMessage ?? "天气暂时无法获取，请稍后再试";
};

const createWeatherCareMessage = (member: FamilyWeatherMember) => {
  const timeZone = member.location?.timeZone ?? "Asia/Shanghai";
  const localHour = Number(new Intl.DateTimeFormat("zh-CN", {
    timeZone,
    hour: "2-digit",
    hourCycle: "h23",
  }).format(new Date()));
  const greeting = localHour < 11 ? "早上好" : localHour < 14 ? "中午好" : localHour < 18 ? "下午好" : "晚上好";
  const city = member.location?.cityName ?? "你那里";
  const condition = member.weather?.conditionText ?? "天气有变化";
  const temperature = typeof member.weather?.temperatureC === "number" ? `，${member.weather.temperatureC}度` : "";
  return `${member.relationship}，${greeting}。${city}今天${condition}${temperature}，照顾好自己，有空给家里回句话。`;
};

export default function ControlCenterHome({
  reminders,
  messages,
  albumPhotos,
  albumUnreadCount,
  missedCallCount,
  photoHeartStates,
  onTogglePhotoHeart,
  onVideoViewed,
  onCompleteReminder,
  onOpenAlbum,
  onOpenMessages,
  onOpenSchedule,
  onOpenTodayOverview,
  onOpenCommunity,
  onOpenRecommendation,
  onOpenContacts,
  onOpenAssistant,
  onOpenMore,
  onTriggerSOS,
  acceptanceTimeOverride = null,
  acceptanceAlbumScenario = "default",
  acceptanceHeartScenario = "not-liked",
  acceptanceRightContentScenario = "default",
  acceptanceRightContentApplySignal = 0,
  acceptanceRevision = 0,
  acceptanceCommand = null,
  familyWeather,
}: ControlCenterHomeProps) {
  const [now, setNow] = useState(new Date());
  const [photoIndex, setPhotoIndex] = useState(0);
  const [isPhotoHeld, setIsPhotoHeld] = useState(false);
  const [arePhotoControlsVisible, setArePhotoControlsVisible] = useState(false);
  const [photoHeartBurstKey, setPhotoHeartBurstKey] = useState(0);
  const [heartFeedbackPhotoId, setHeartFeedbackPhotoId] = useState<string | null>(null);
  const [isHeartFailureToastVisible, setIsHeartFailureToastVisible] = useState(false);
  const [photoLoadFailedId, setPhotoLoadFailedId] = useState<string | null>(null);
  const [homeVideoState, setHomeVideoState] = useState<HomeVideoState>("cover");
  const [viewedVideoIds, setViewedVideoIds] = useState<string[]>([]);
  const [confirmSOS, setConfirmSOS] = useState(false);
  const [isWeatherOpen, setIsWeatherOpen] = useState(false);
  const [isNewFamilyMediaOpen, setIsNewFamilyMediaOpen] = useState(false);
  const [selectedWeatherId, setSelectedWeatherId] = useState("");
  const [isWeatherOnline, setIsWeatherOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);
  const [weatherCareStage, setWeatherCareStage] = useState<WeatherCareStage>("idle");
  const [weatherCareDraft, setWeatherCareDraft] = useState<WeatherCareDraft | null>(null);
  const [weatherCareError, setWeatherCareError] = useState("");
  const [weatherCareSent, setWeatherCareSent] = useState<Record<string, string>>({});
  const homeVideoRef = useRef<HTMLVideoElement | null>(null);
  const photoControlsTimerRef = useRef<number | null>(null);
  const heartFeedbackTimerRef = useRef<number | null>(null);
  const heartFailureToastTimerRef = useRef<number | null>(null);
  const weatherCareTimerRef = useRef<number | null>(null);
  const swipeStartXRef = useRef<number | null>(null);
  const swipePointerIdRef = useRef<number | null>(null);
  const homePhotoPool = useMemo(() => {
    let photos = [
      {
        id: "home-featured-family",
        url: "./assets/family-dashboard-source.png",
        caption: "家人团聚合照",
        type: "photo" as const,
        senderName: "全家",
        uploadTime: "上个月",
        categoryName: "节日团聚",
        batchCaption: "一家人团聚时拍下的珍贵合影。",
        cropClass: "photo-crop--family",
        initialHearts: 21,
      },
      ...albumPhotos.map((photo) => ({
        ...photo,
        cropClass: "photo-crop--cover",
      })),
    ].slice(0, HOME_ALBUM_MAX_ITEMS);
    const prefersVideo = acceptanceAlbumScenario === "video-failure";
    if (prefersVideo) {
      const firstVideo = photos.find((photo) => photo.type === "video");
      if (firstVideo) photos = [firstVideo, ...photos.filter((photo) => photo.id !== firstVideo.id)];
    }
    if (acceptanceAlbumScenario === "single") return photos.slice(0, 1);
    if (acceptanceAlbumScenario === "load-failure") {
      return [{ ...photos[0], url: "./assets/acceptance-missing-photo.jpg" }];
    }
    if (acceptanceAlbumScenario === "video-failure") {
      return photos.map((photo, index) => index === 0 && photo.type === "video"
        ? { ...photo, videoUrl: "./assets/acceptance-missing-family-video.mp4" }
        : photo);
    }
    return photos;
  }, [albumPhotos, acceptanceAlbumScenario]);
  const isAlbumEmpty = acceptanceAlbumScenario === "empty";
  const isAcceptanceVideoScenario = acceptanceAlbumScenario === "video-failure";
  const currentPhoto = homePhotoPool[photoIndex] ?? homePhotoPool[0];
  const isCurrentVideo = currentPhoto?.type === "video";
  const pauseHomeVideo = () => {
    homeVideoRef.current?.pause();
    setHomeVideoState((state) => state === "playing" ? "cover" : state);
  };
  const playHomeVideo = async () => {
    if (!isCurrentVideo || !currentPhoto.videoUrl) {
      setHomeVideoState("failed");
      return;
    }
    if (homeVideoState === "playing") {
      pauseHomeVideo();
      return;
    }
    const video = homeVideoRef.current;
    if (!video) return;
    if (homeVideoState === "ended") video.currentTime = 0;
    if (homeVideoState === "failed") video.load();
    try {
      await video.play();
    } catch {
      setHomeVideoState("failed");
    }
  };
  const openAlbumFromHome = () => {
    pauseHomeVideo();
    onOpenAlbum();
  };
  const openNewFamilyMedia = () => {
    pauseHomeVideo();
    setIsNewFamilyMediaOpen(true);
  };
  const currentPhotoLiked = acceptanceHeartScenario === "liked"
    || (acceptanceHeartScenario !== "not-liked" && Boolean(photoHeartStates[currentPhoto.url]));
  const boundWeatherChildren = useMemo(() => familyWeather.children
    .filter((member) => member.relationStatus === "active")
    .sort((first, second) => second.priority - first.priority
      || new Date(second.recentInteractionAt).getTime() - new Date(first.recentInteractionAt).getTime()
      || first.displayName.localeCompare(second.displayName, "zh-CN")), [familyWeather.children]);
  const elderLocation = familyWeather.elder.location;
  const elderWeather = familyWeather.elder.weather;
  const elderWeatherAvailable = familyWeather.elder.location?.status === "valid"
    && familyWeather.elder.weather
    && (familyWeather.elder.weather.queryState === "success" || familyWeather.elder.weather.queryState === "cached");
  const selectedWeatherMember = boundWeatherChildren.find((member) => member.id === selectedWeatherId) ?? null;
  const selectedWeatherAvailable = selectedWeatherMember ? hasUsableWeather(selectedWeatherMember) : false;
  const selectedWeatherSentText = selectedWeatherMember ? weatherCareSent[selectedWeatherMember.id] : undefined;

  useEffect(() => {
    if (acceptanceTimeOverride) {
      const acceptanceNow = acceptanceTimeOverride.includes("T")
        ? new Date(acceptanceTimeOverride)
        : new Date();
      if (!acceptanceTimeOverride.includes("T")) {
        const [hours, minutes] = acceptanceTimeOverride.split(":").map(Number);
        acceptanceNow.setHours(hours, minutes, 0, 0);
      }
      setNow(acceptanceNow);
      return;
    }

    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, [acceptanceTimeOverride]);

  useEffect(() => {
    const handleOnline = () => setIsWeatherOnline(true);
    const handleOffline = () => setIsWeatherOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const firstMember = familyWeather.children
      .filter((member) => member.relationStatus === "active")
      .sort((first, second) => second.priority - first.priority)[0];
    setSelectedWeatherId(firstMember?.id ?? "");
    setWeatherCareStage("idle");
    setWeatherCareDraft(null);
    setWeatherCareError("");
  }, [familyWeather.loadedAt, familyWeather.scenario]);

  useEffect(() => {
    if (isAlbumEmpty || isAcceptanceVideoScenario || isPhotoHeld || isWeatherOpen || homeVideoState === "playing" || homePhotoPool.length <= 1) return;
    const timer = window.setTimeout(() => {
      setPhotoIndex((current) => (current + 1) % homePhotoPool.length);
    }, 8000);
    return () => window.clearTimeout(timer);
  }, [isAlbumEmpty, isAcceptanceVideoScenario, isPhotoHeld, isWeatherOpen, homeVideoState, photoIndex, homePhotoPool.length]);

  useEffect(() => {
    setPhotoIndex(0);
    setPhotoLoadFailedId(null);
    const targetVideo = homePhotoPool.find((photo) => photo.type === "video");
    if (targetVideo && acceptanceAlbumScenario === "video-failure") {
      setViewedVideoIds((ids) => ids.filter((id) => id !== targetVideo.id));
    }
  }, [acceptanceAlbumScenario]);

  useEffect(() => {
    homeVideoRef.current?.pause();
    setHomeVideoState(acceptanceAlbumScenario === "video-failure" ? "failed" : "cover");
  }, [acceptanceAlbumScenario, photoIndex]);

  useEffect(() => () => homeVideoRef.current?.pause(), []);

  useEffect(() => {
    if (photoIndex >= homePhotoPool.length) setPhotoIndex(0);
  }, [homePhotoPool.length, photoIndex]);

  useEffect(() => {
    if (heartFailureToastTimerRef.current) window.clearTimeout(heartFailureToastTimerRef.current);
    if (acceptanceHeartScenario !== "failure") {
      setIsHeartFailureToastVisible(false);
      return;
    }
    setIsHeartFailureToastVisible(true);
    heartFailureToastTimerRef.current = window.setTimeout(() => {
      setIsHeartFailureToastVisible(false);
      heartFailureToastTimerRef.current = null;
    }, 2800);
  }, [acceptanceHeartScenario]);

  useEffect(() => {
    return () => {
      if (photoControlsTimerRef.current) window.clearTimeout(photoControlsTimerRef.current);
      if (heartFeedbackTimerRef.current) window.clearTimeout(heartFeedbackTimerRef.current);
      if (heartFailureToastTimerRef.current) window.clearTimeout(heartFailureToastTimerRef.current);
      if (weatherCareTimerRef.current) window.clearTimeout(weatherCareTimerRef.current);
    };
  }, []);

  const unreadCount = messages.filter((item) => !item.played && item.sender !== "您 (我)").length;

  const dateText = useMemo(() => {
    return new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric" }).format(now);
  }, [now]);

  const weekText = useMemo(() => {
    return new Intl.DateTimeFormat("zh-CN", { weekday: "short" }).format(now);
  }, [now]);

  function selectWeatherRecipient(weather: FamilyWeatherMember) {
    if (weatherCareTimerRef.current) window.clearTimeout(weatherCareTimerRef.current);
    setSelectedWeatherId(weather.id);
    setWeatherCareError("");
    const sentText = weatherCareSent[weather.id];
    setWeatherCareDraft(sentText ? { recipientId: weather.id, requestId: `sent-${weather.id}`, text: sentText } : null);
    setWeatherCareStage(sentText ? "success" : "idle");
  }

  function closeWeatherOverview() {
    if (weatherCareTimerRef.current) {
      window.clearTimeout(weatherCareTimerRef.current);
      weatherCareTimerRef.current = null;
    }
    if (weatherCareStage === "sending") {
      setWeatherCareDraft(null);
      setWeatherCareStage("idle");
    }
    setIsWeatherOpen(false);
  }

  function prepareWeatherCare() {
    if (!selectedWeatherMember || !selectedWeatherAvailable) return;
    const draft = {
      recipientId: selectedWeatherMember.id,
      requestId: `weather-care-${selectedWeatherMember.id}-${Date.now()}`,
      text: createWeatherCareMessage(selectedWeatherMember),
    };
    setWeatherCareDraft(draft);
    setWeatherCareError("");
    setWeatherCareStage("confirm");
  }

  function cancelWeatherCare() {
    setWeatherCareDraft(null);
    setWeatherCareError("");
    setWeatherCareStage("idle");
  }

  function confirmWeatherCare() {
    if (!selectedWeatherMember || !weatherCareDraft) return;
    if (weatherCareTimerRef.current) window.clearTimeout(weatherCareTimerRef.current);
    if (!isWeatherOnline) {
      setWeatherCareError("网络异常，暂时没有发送成功。连接网络后可以重新发送。");
      setWeatherCareStage("failure");
      return;
    }
    setWeatherCareError("");
    setWeatherCareStage("sending");
    weatherCareTimerRef.current = window.setTimeout(() => {
      setWeatherCareSent((records) => ({ ...records, [weatherCareDraft.recipientId]: weatherCareDraft.text }));
      setWeatherCareStage("success");
      weatherCareTimerRef.current = null;
      speakText(`已给${selectedWeatherMember.relationship}发送关怀消息`, { fallbackKey: "generic-feedback", rate: 0.9 });
    }, 900);
  }

  const stepPhoto = (direction: number) => {
    pauseHomeVideo();
    setPhotoIndex((current) => (current + direction + homePhotoPool.length) % homePhotoPool.length);
  };

  const revealPhotoControls = () => {
    if (photoControlsTimerRef.current) window.clearTimeout(photoControlsTimerRef.current);
    photoControlsTimerRef.current = null;
    setArePhotoControlsVisible(true);
  };

  const schedulePhotoControlsHide = () => {
    if (photoControlsTimerRef.current) window.clearTimeout(photoControlsTimerRef.current);
    photoControlsTimerRef.current = window.setTimeout(() => {
      setArePhotoControlsVisible(false);
      photoControlsTimerRef.current = null;
    }, 5000);
  };

  const handlePhotoArrowClick = (direction: number) => {
    stepPhoto(direction);
    revealPhotoControls();
    schedulePhotoControlsHide();
  };

  const sendPhotoHeart = () => {
    if (acceptanceHeartScenario === "sending") return;
    const nextLiked = !currentPhotoLiked;
    onTogglePhotoHeart(currentPhoto.url, nextLiked);
    if (!nextLiked) return;
    setPhotoHeartBurstKey((key) => key + 1);
    setHeartFeedbackPhotoId(currentPhoto.id);
    if (heartFeedbackTimerRef.current) window.clearTimeout(heartFeedbackTimerRef.current);
    heartFeedbackTimerRef.current = window.setTimeout(() => {
      setHeartFeedbackPhotoId(null);
      heartFeedbackTimerRef.current = null;
    }, 1800);

    speakText("已告诉家人您喜欢这张照片", { fallbackKey: "heart-family", rate: 0.9 });
  };

  const handlePhotoPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    revealPhotoControls();
    swipeStartXRef.current = event.clientX;
    swipePointerIdRef.current = event.pointerId;
    setIsPhotoHeld(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePhotoPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (swipeStartXRef.current === null) return;
    const deltaX = event.clientX - swipeStartXRef.current;
    const swipeThreshold = window.innerWidth / 5;
    if (Math.abs(deltaX) >= swipeThreshold) stepPhoto(deltaX < 0 ? 1 : -1);

    swipeStartXRef.current = null;
    swipePointerIdRef.current = null;
    setIsPhotoHeld(false);
    schedulePhotoControlsHide();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const cancelPhotoInteraction = () => {
    swipeStartXRef.current = null;
    swipePointerIdRef.current = null;
    setIsPhotoHeld(false);
    schedulePhotoControlsHide();
  };

  useEffect(() => {
    if (!acceptanceCommand) return;

    if (acceptanceCommand.type === "reset-home-overlays") {
      setConfirmSOS(false);
      setIsWeatherOpen(false);
      setIsNewFamilyMediaOpen(false);
      return;
    }
    if (acceptanceCommand.type === "previous-photo") {
      stepPhoto(-1);
      revealPhotoControls();
      schedulePhotoControlsHide();
      return;
    }
    if (acceptanceCommand.type === "next-photo") {
      stepPhoto(1);
      revealPhotoControls();
      schedulePhotoControlsHide();
      return;
    }
    if (acceptanceCommand.type === "show-photo-controls") {
      revealPhotoControls();
      schedulePhotoControlsHide();
      return;
    }
    if (acceptanceCommand.type === "open-weather") {
      setIsWeatherOpen(true);
      return;
    }
  }, [acceptanceCommand?.id]);

  return (
    <main
      className="control-center"
      aria-label="高龄智慧中控屏首页"
    >
      <header className="control-header">
        <button
          className={`weather-card ${elderWeatherAvailable ? "" : "has-no-weather"}`}
          type="button"
          onClick={() => setIsWeatherOpen(true)}
          aria-label={`查看家庭天气详情，${elderWeatherAvailable && elderWeather && elderLocation
            ? `${elderLocation.cityName}${elderWeather.conditionText}${elderWeather.temperatureC}度`
            : "本人天气暂时无法显示"}`}
        >
          {elderWeatherAvailable && elderWeather && elderLocation ? (
            <span className="weather-local">
              <span className="weather-sun" aria-hidden="true">{weatherIcon(elderWeather.conditionCode)}</span>
              <span className="weather-main">
                <span><strong>{elderWeather.temperatureC}°C</strong><b>{elderWeather.conditionText}</b></span>
                <small>{elderLocation.cityName} · 最高{elderWeather.highC}° / 最低{elderWeather.lowC}°</small>
              </span>
            </span>
          ) : (
            <span className="weather-local weather-local--unavailable">
              <span className="weather-sun" aria-hidden="true"><CloudSun /></span>
              <span className="weather-main"><b>天气暂时无法显示</b><small>请联系家人或服务人员完善地址</small></span>
            </span>
          )}
          <span className="weather-details">家庭天气<ChevronDown aria-hidden="true" /></span>
        </button>

        <div className="clock-block" aria-label="当前时间">
          <time className="clock-time">
            {now.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false })}
          </time>
          <div className="clock-date">
            <strong>{weekText}</strong>
            <span>{dateText}</span>
          </div>
        </div>

        <button className="sos-button" type="button" onClick={() => setConfirmSOS(true)}>
          <Phone aria-hidden="true" />
          <span>紧急呼叫</span>
        </button>
      </header>

      <section className="control-workspace">
        <div className={`family-stage ${arePhotoControlsVisible ? "show-photo-controls" : ""}`}>
          {!isAlbumEmpty && <div
            className={`photo-crop ${currentPhoto.cropClass} ${isPhotoHeld ? "is-held" : ""}`}
            aria-label={`家庭相册${isCurrentVideo ? "视频封面" : "照片"}，按住暂停，左右滑动切换`}
            onPointerDown={handlePhotoPointerDown}
            onPointerUp={handlePhotoPointerUp}
            onPointerCancel={cancelPhotoInteraction}
            onLostPointerCapture={cancelPhotoInteraction}
            onContextMenu={(event) => event.preventDefault()}
          >
            {photoLoadFailedId !== currentPhoto.id && isCurrentVideo ? (
              <>
                <video
                  key={currentPhoto.id}
                  ref={homeVideoRef}
                  src={currentPhoto.videoUrl}
                  poster={currentPhoto.url}
                  preload="metadata"
                  playsInline
                  onPlaying={() => {
                    setHomeVideoState("playing");
                    setViewedVideoIds((ids) => {
                      if (ids.includes(currentPhoto.id)) return ids;
                      onVideoViewed(currentPhoto.id);
                      return [...ids, currentPhoto.id];
                    });
                  }}
                  onPause={() => setHomeVideoState((state) => state === "playing" ? "cover" : state)}
                  onEnded={() => setHomeVideoState("ended")}
                />
                {homeVideoState === "failed" ? (
                  <div className="home-video-failure" role="alert">
                    <AlertTriangle aria-hidden="true" />
                    <strong>视频暂时无法播放</strong>
                    <button type="button" onPointerDown={(event) => event.stopPropagation()} onPointerUp={(event) => event.stopPropagation()} onClick={() => void playHomeVideo()}><RefreshCw aria-hidden="true" />重新播放</button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className={`home-video-play${homeVideoState === "playing" ? " is-playing" : ""}`}
                    onPointerDown={(event) => event.stopPropagation()}
                    onPointerUp={(event) => event.stopPropagation()}
                    onClick={() => void playHomeVideo()}
                    aria-label={homeVideoState === "playing" ? "暂停家庭视频" : homeVideoState === "ended" ? "重新播放家庭视频" : "播放家庭视频"}
                  >
                    {homeVideoState === "playing" ? <Pause aria-hidden="true" /> : homeVideoState === "ended" ? <RotateCcw aria-hidden="true" /> : <Play aria-hidden="true" fill="currentColor" />}
                    <span>{homeVideoState === "playing" ? "暂停" : homeVideoState === "ended" ? "重新播放" : "播放视频"}</span>
                  </button>
                )}
              </>
            ) : photoLoadFailedId !== currentPhoto.id && (
              <img
                src={currentPhoto.url}
                alt={currentPhoto.caption || "家庭相册照片"}
                draggable="false"
                onError={() => setPhotoLoadFailedId(currentPhoto.id)}
              />
            )}
          </div>}
          {(isAlbumEmpty || photoLoadFailedId === currentPhoto.id) && (
            <div className="home-album-empty" role="status">
              <ImageOff aria-hidden="true" />
              <strong>{isAlbumEmpty ? "家人还没有上传影像" : "这项家庭影像暂时无法显示"}</strong>
              <span>{isAlbumEmpty ? "进入家庭相册后可以查看和等待家人分享" : "可以进入家庭相册查看其他内容"}</span>
            </div>
          )}
          <div className="photo-shade" />

          {isPhotoHeld && (
            <div className="photo-pause-feedback" role="status">
              <Pause aria-hidden="true" />
              <span>相册已暂停，松开后继续</span>
            </div>
          )}

          {!isAlbumEmpty && homePhotoPool.length > 1 && <button className="photo-arrow photo-arrow--left" type="button" onClick={() => handlePhotoArrowClick(-1)} aria-label="上一张家庭照片">
            <ChevronLeft />
          </button>}
          {!isAlbumEmpty && homePhotoPool.length > 1 && <button className="photo-arrow photo-arrow--right" type="button" onClick={() => handlePhotoArrowClick(1)} aria-label="下一张家庭照片">
            <ChevronRight />
          </button>}

          <div className="home-album-actions">
            <button className={`album-label${isAlbumEmpty ? "" : " is-subtle"}`} type="button" onClick={openAlbumFromHome}>
              <Image aria-hidden="true" />
              <span>{isAlbumEmpty ? "进入家庭相册" : `家庭相册 · ${photoIndex + 1} / ${homePhotoPool.length}`}</span>
            </button>
            {!isAlbumEmpty && photoLoadFailedId !== currentPhoto.id && <button
              className={`home-photo-heart${currentPhotoLiked ? " is-liked" : ""}${heartFeedbackPhotoId === currentPhoto.id ? " is-sent" : ""}`}
              type="button"
              onClick={sendPhotoHeart}
              disabled={acceptanceHeartScenario === "sending"}
              aria-label={currentPhotoLiked ? "取消喜欢这张照片" : "喜欢这张照片"}
            >
              <Heart aria-hidden="true" />
              <span>{acceptanceHeartScenario === "sending" ? "喜欢中" : currentPhotoLiked ? "已喜欢" : "喜欢"}</span>
            </button>}
          </div>
          {isHeartFailureToastVisible && (
            <div className="home-heart-toast is-error" role="status" aria-live="polite">
              <AlertTriangle aria-hidden="true" />
              <span>喜欢失败，请稍后重试</span>
            </div>
          )}
          {photoHeartBurstKey > 0 && (
            <div key={photoHeartBurstKey} className="home-photo-heart-burst" aria-hidden="true">
              {Array.from({ length: 5 }, (_, index) => <Heart key={index} />)}
            </div>
          )}
          {!isAlbumEmpty && homePhotoPool.length > 1 && <div className="photo-dots" aria-hidden="true">
            {homePhotoPool.map((photo, index) => <span key={photo.id} className={index === photoIndex ? "is-active" : ""} />)}
          </div>}
        </div>

        <HomeTaskRail
          now={now}
          reminders={reminders}
          messages={messages}
          albumUnreadCount={albumUnreadCount}
          missedCallCount={missedCallCount}
          onCompleteReminder={onCompleteReminder}
          onOpenTodayOverview={onOpenTodayOverview}
          onOpenMessages={onOpenMessages}
          onOpenCommunity={onOpenCommunity}
          onOpenContacts={onOpenContacts}
          onOpenAlbum={openNewFamilyMedia}
          onOpenRecommendation={onOpenRecommendation}
          acceptanceRightContentScenario={acceptanceRightContentScenario}
          acceptanceRightContentApplySignal={acceptanceRightContentApplySignal}
          acceptanceRevision={acceptanceRevision}
        />
      </section>

      <nav className="control-dock" aria-label="常用功能">
        <div className="dock-group">
          <button type="button" onClick={openAlbumFromHome}><span className="dock-icon"><Image /></span><strong>家庭相册</strong></button>
          <button type="button" onClick={onOpenContacts} className="has-badge"><span className="dock-icon"><MessageCircleHeart /></span><strong>通讯录</strong>{unreadCount + missedCallCount > 0 && <i>{unreadCount + missedCallCount}</i>}</button>
        </div>
        <button type="button" className="assistant-entry" onClick={onOpenAssistant}>
          <span className="sound-wave"><i /><i /><i /><i /><i /></span>
          <span>问小达，查日程、听留言、找活动</span>
          <span className="assistant-mic"><Mic /></span>
        </button>
        <div className="dock-group">
          <button type="button" onClick={onOpenSchedule}><span className="dock-icon"><CalendarDays /></span><strong>提醒事项</strong></button>
          <button type="button" onClick={onOpenMore}><span className="dock-icon"><CircleEllipsis /></span><strong>更多功能</strong></button>
        </div>
      </nav>

      <NewFamilyMediaOverlay
        isOpen={isNewFamilyMediaOpen}
        items={albumPhotos}
        unreadCount={albumUnreadCount}
        heartStates={photoHeartStates}
        onToggleHeart={onTogglePhotoHeart}
        onViewed={onVideoViewed}
        onClose={() => setIsNewFamilyMediaOpen(false)}
      />

      {isWeatherOpen && (
        <div className="weather-overview-overlay">
          <section className="weather-overview" role="dialog" aria-modal="true" aria-labelledby="weather-overview-title">
            <header className="weather-overview__header">
              <div>
                <h2 id="weather-overview-title">家庭天气</h2>
                <span className={isWeatherOnline ? "" : "is-offline"}>
                  {isWeatherOnline ? (
                    <>天气数据更新时间以各城市卡片为准</>
                  ) : (
                    <><WifiOff aria-hidden="true" />网络已断开 · 显示最近缓存天气</>
                  )}
                </span>
              </div>
              <button type="button" onClick={closeWeatherOverview} aria-label="关闭天气总览"><X aria-hidden="true" /></button>
            </header>

            <div className="weather-city-grid">
              {[familyWeather.elder, ...boundWeatherChildren].map((member) => {
                const isAvailable = hasUsableWeather(member);
                const isSelected = member.id === selectedWeatherId;
                const locationLabel = formatMemberLocation(member, familyWeather.elder.location?.countryCode);
                const cardContent = <>
                  <span className="weather-city-card__identity"><b>{member.isElder ? "我这里" : member.displayName}</b><small>{member.relationship}</small></span>
                  <span className="weather-city-card__icon" aria-hidden="true">
                    {weatherIcon(member.weather?.conditionCode)}
                  </span>
                  {isAvailable && member.weather && member.location ? (
                    <>
                      <strong>{member.weather.temperatureC}°C</strong>
                      <span className="weather-city-card__condition">{member.weather.conditionText} · 最高{member.weather.highC}° / 最低{member.weather.lowC}°</span>
                      <b className="weather-city-card__location"><MapPin aria-hidden="true" />{locationLabel}</b>
                      <span className="weather-city-card__time">当地 {formatWeatherLocalTime(member.location.timeZone)}</span>
                      <span className="weather-city-card__updated">{member.weather.queryState === "cached" ? `更新失败 · 显示 ${formatWeatherUpdatedAt(member.weather.lastSuccessAt, member.location.timeZone)} 的缓存天气` : `已更新 · ${formatWeatherUpdatedAt(member.weather.lastSuccessAt, member.location.timeZone)}`}</span>
                      {member.weather.riskText && <em>{member.weather.riskText}</em>}
                    </>
                  ) : (
                    <>
                      <strong className="weather-city-card__empty-temperature">--</strong>
                      <span className="weather-city-card__empty-copy">{weatherUnavailableText(member)}</span>
                      {member.location && <b className="weather-city-card__location"><MapPin aria-hidden="true" />{locationLabel}</b>}
                    </>
                  )}
                  {!member.isElder && isSelected && <CheckCircle2 className="weather-city-card__selected" aria-hidden="true" />}
                </>;

                if (member.isElder) {
                  return <article key={member.id} className={`weather-city-card is-local ${isAvailable ? "" : "is-unavailable"}`}>{cardContent}</article>;
                }

                return (
                  <button
                    key={member.id}
                    type="button"
                    className={`weather-city-card ${member.weather?.riskText ? "has-warning" : ""} ${isSelected ? "is-selected" : ""} ${isAvailable ? "" : "is-unavailable"}`}
                    aria-label={`查看${member.displayName}的天气状态`}
                    aria-pressed={isSelected}
                    onClick={() => selectWeatherRecipient(member)}
                  >
                    {cardContent}
                  </button>
                );
              })}
            </div>

            <section className={`weather-care-panel is-${weatherCareStage}`} aria-live="polite">
              {!selectedWeatherMember ? (
                <div className="weather-care-panel__message">
                  <AlertTriangle aria-hidden="true" />
                  <span>请选择一位家人查看天气。</span>
                </div>
              ) : !selectedWeatherAvailable ? (
                <div className="weather-care-panel__message is-muted">
                  <AlertTriangle aria-hidden="true" />
                  <span>暂时没有{selectedWeatherMember.displayName}的天气，无法发送天气关怀。</span>
                </div>
              ) : weatherCareStage === "idle" ? (
                <>
                  <div className="weather-care-panel__copy">
                    <span>发送给：{selectedWeatherMember.displayName}</span>
                    <strong>“{createWeatherCareMessage(selectedWeatherMember)}”</strong>
                  </div>
                  <button type="button" className="weather-care-panel__primary" onClick={prepareWeatherCare}>
                    <Send aria-hidden="true" />送句关心
                  </button>
                </>
              ) : weatherCareStage === "confirm" && weatherCareDraft ? (
                <>
                  <div className="weather-care-panel__copy">
                    <span>确认发送给：{selectedWeatherMember.displayName}</span>
                    <strong>“{weatherCareDraft.text}”</strong>
                  </div>
                  <div className="weather-care-panel__actions">
                    <button type="button" className="weather-care-panel__secondary" onClick={cancelWeatherCare}>取消</button>
                    <button type="button" className="weather-care-panel__primary" onClick={confirmWeatherCare}>
                      <Send aria-hidden="true" />确认发送
                    </button>
                  </div>
                </>
              ) : weatherCareStage === "sending" ? (
                <div className="weather-care-panel__status">
                  <RefreshCw className="is-spinning" aria-hidden="true" />
                  <div><strong>正在发送给{selectedWeatherMember.relationship}…</strong><span>请稍候，不需要重复点击</span></div>
                </div>
              ) : weatherCareStage === "success" ? (
                <>
                  <div className="weather-care-panel__status is-success">
                    <CheckCircle2 aria-hidden="true" />
                    <div>
                      <strong>已发送给{selectedWeatherMember.relationship}</strong>
                      <span>“{selectedWeatherSentText ?? weatherCareDraft?.text}”</span>
                    </div>
                  </div>
                  <button type="button" className="weather-care-panel__primary" onClick={closeWeatherOverview}>完成</button>
                </>
              ) : (
                <>
                  <div className="weather-care-panel__status is-failure">
                    <AlertTriangle aria-hidden="true" />
                    <div><strong>发送失败</strong><span>{weatherCareError}</span></div>
                  </div>
                  <div className="weather-care-panel__actions">
                    <button type="button" className="weather-care-panel__secondary" onClick={cancelWeatherCare}>取消</button>
                    <button type="button" className="weather-care-panel__primary" onClick={confirmWeatherCare}>
                      <RefreshCw aria-hidden="true" />重新发送
                    </button>
                  </div>
                </>
              )}
            </section>

          </section>
        </div>
      )}

      {confirmSOS && (
        <div className="sos-confirm" role="dialog" aria-modal="true" aria-labelledby="sos-title">
          <div className="sos-dialog">
            <button type="button" className="dialog-close" onClick={() => setConfirmSOS(false)} aria-label="关闭"><X /></button>
            <span className="dialog-siren"><Phone /></span>
            <h2 id="sos-title">确认发出紧急呼叫？</h2>
            <p>系统将立即联系家人和紧急服务。非紧急情况请点“取消”。</p>
            <button type="button" className="confirm-call" onClick={() => { setConfirmSOS(false); onTriggerSOS(); }}><Phone />立即呼叫</button>
            <button type="button" className="cancel-call" onClick={() => setConfirmSOS(false)}>取消</button>
          </div>
        </div>
      )}
    </main>
  );
}
