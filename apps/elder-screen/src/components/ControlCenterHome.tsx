import React, { useEffect, useMemo, useRef, useState } from "react";
import Lottie from "lottie-react";
import voiceWaveAnimation from "../animations/voiceWave";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
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
  Video,
  Volume2,
  WifiOff,
  X,
} from "lucide-react";
import type { FulfillmentRecord } from "../types";
import HomeTaskRail from "./HomeTaskRail";
import type { AcceptanceAlbumScenario, AcceptanceCareMode, AcceptanceCareRegion, AcceptanceCareScenario, AcceptanceCareTime, AcceptanceDisasterScenario, AcceptanceHeartScenario, AcceptanceHomeCommand } from "./InteractionAcceptanceConsole";
import {
  formatWeatherLocalTime,
  formatWeatherUpdatedAt,
  getWeatherLocalDate,
  type FamilyWeatherMember,
  type FamilyWeatherSnapshot,
  type GenerateWeatherCareInput,
  type SendWeatherCareInput,
  type SendWeatherCareResult,
  type WeatherCareDraft,
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

type WeatherReminderStage = "idle" | "generating" | "reading" | "confirm" | "sending" | "success" | "failure" | "blocked";

interface ControlCenterHomeProps {
  reminders: ReminderItem[];
  messages: MessageItem[];
  albumPhotos: AlbumPhotoItem[];
  fulfillmentRecords: FulfillmentRecord[];
  photoHeartStates: Record<string, boolean>;
  securityUnreadCount: number;
  onTogglePhotoHeart: (photoKey: string, liked: boolean) => void;
  onVideoViewed: (videoId: string) => void;
  onCompleteReminder: (id: string) => void;
  onPlayMessage: (id: string) => void;
  onQuickReply: (recipient: string, content: string) => void;
  onOpenAlbum: () => void;
  onOpenMessageBox: () => void;
  onOpenSchedule: () => void;
  onOpenTodayOverview: () => void;
  onOpenCommunity: () => void;
  onOpenSpecialServices: () => void;
  onOpenRecommendation: (kind: "security" | "community" | "service" | "entertainment") => void;
  onOpenContacts: () => void;
  onOpenAssistant: () => void;
  onOpenMore: () => void;
  onTriggerSOS: () => void;
  acceptanceTimeOverride?: string | null;
  acceptanceAlbumScenario?: AcceptanceAlbumScenario;
  acceptanceHeartScenario?: AcceptanceHeartScenario;
  acceptanceCareRegion?: AcceptanceCareRegion;
  acceptanceCareTime?: AcceptanceCareTime;
  acceptanceCareMode?: AcceptanceCareMode;
  acceptanceCareScenario?: AcceptanceCareScenario;
  acceptanceDisasterScenario?: AcceptanceDisasterScenario;
  acceptanceRevision?: number;
  acceptanceCommand?: { id: number; type: AcceptanceHomeCommand } | null;
  familyWeather: FamilyWeatherSnapshot;
  onGenerateWeatherCareDraft: (input: GenerateWeatherCareInput) => Promise<WeatherCareDraft>;
  onSendWeatherCare: (input: SendWeatherCareInput) => Promise<SendWeatherCareResult>;
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

export default function ControlCenterHome({
  reminders,
  messages,
  albumPhotos,
  fulfillmentRecords,
  photoHeartStates,
  securityUnreadCount,
  onTogglePhotoHeart,
  onVideoViewed,
  onCompleteReminder,
  onPlayMessage,
  onQuickReply,
  onOpenAlbum,
  onOpenMessageBox,
  onOpenSchedule,
  onOpenTodayOverview,
  onOpenCommunity,
  onOpenSpecialServices,
  onOpenRecommendation,
  onOpenContacts,
  onOpenAssistant,
  onOpenMore,
  onTriggerSOS,
  acceptanceTimeOverride = null,
  acceptanceAlbumScenario = "default",
  acceptanceHeartScenario = "not-liked",
  acceptanceCareRegion = "domestic",
  acceptanceCareTime = "morning",
  acceptanceCareMode = "no-disaster",
  acceptanceCareScenario = "daily",
  acceptanceDisasterScenario = "rainstorm",
  acceptanceRevision = 0,
  acceptanceCommand = null,
  familyWeather,
  onGenerateWeatherCareDraft,
  onSendWeatherCare,
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
  const [activePhotoMessageId, setActivePhotoMessageId] = useState<string | null>(null);
  const [activePhotoGroupIndex, setActivePhotoGroupIndex] = useState(0);
  const [retriedMessageIds, setRetriedMessageIds] = useState<string[]>([]);
  const [isPhotoCaptionExiting, setIsPhotoCaptionExiting] = useState(false);
  const [confirmSOS, setConfirmSOS] = useState(false);
  const [isMessageStackExpanded, setIsMessageStackExpanded] = useState(true);
  const [visibleMessageIds, setVisibleMessageIds] = useState<string[]>(() =>
    messages.filter((item) => !item.played && item.sender !== "您 (我)" && (item.type === "voice" || item.type === "photo")).map((item) => item.id)
  );
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [replyingMessageId, setReplyingMessageId] = useState<string | null>(null);
  const [exitingMessageIds, setExitingMessageIds] = useState<string[]>([]);
  const [isChimePlaying, setIsChimePlaying] = useState(false);
  const [isWeatherOpen, setIsWeatherOpen] = useState(false);
  const [selectedWeatherId, setSelectedWeatherId] = useState("");
  const [weatherReminderStage, setWeatherReminderStage] = useState<WeatherReminderStage>("idle");
  const [weatherProgress, setWeatherProgress] = useState(0);
  const [weatherDraft, setWeatherDraft] = useState<WeatherCareDraft | null>(null);
  const [weatherSendRequestId, setWeatherSendRequestId] = useState<string | null>(null);
  const [weatherError, setWeatherError] = useState("");
  const [weatherCareRecords, setWeatherCareRecords] = useState(() => new Map(
    familyWeather.children.flatMap((member) => member.dailyCare ? [[member.id, member.dailyCare] as const] : [])
  ));
  const [isWeatherOnline, setIsWeatherOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const homeVideoRef = useRef<HTMLVideoElement | null>(null);
  const notificationAudioRef = useRef<HTMLAudioElement | null>(null);
  const playbackTimerRef = useRef<number | null>(null);
  const replySpeechTimerRef = useRef<number | null>(null);
  const replyExitTimerRef = useRef<number | null>(null);
  const photoControlsTimerRef = useRef<number | null>(null);
  const heartFeedbackTimerRef = useRef<number | null>(null);
  const heartFailureToastTimerRef = useRef<number | null>(null);
  const photoMessageTimerRef = useRef<number | null>(null);
  const photoMessageExitTimerRef = useRef<number | null>(null);
  const weatherProgressTimerRef = useRef<number | null>(null);
  const weatherSpeechFallbackRef = useRef<number | null>(null);
  const weatherSendInFlightRef = useRef(false);
  const swipeStartXRef = useRef<number | null>(null);
  const swipeStartTimeRef = useRef<number | null>(null);
  const swipePointerIdRef = useRef<number | null>(null);
  const activeMessageRef = useRef<MessageItem | null>(null);
  const acceptanceMessagesRef = useRef(messages);
  acceptanceMessagesRef.current = messages;
  const previousUnreadIdsRef = useRef(
    messages.filter((item) => !item.played && item.sender !== "您 (我)" && (item.type === "voice" || item.type === "photo")).map((item) => item.id)
  );
  const replyConfirmationActiveRef = useRef(false);
  const isVoicePlaybackActive = playingMessageId !== null;
  const homePhotoPool = useMemo(() => {
    let photos = [
      {
        id: "home-featured-family",
        url: "/assets/family-dashboard-source.png",
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
    const prefersVideo = acceptanceAlbumScenario === "notice-video"
      || acceptanceAlbumScenario === "video-cover"
      || acceptanceAlbumScenario === "video-viewed"
      || acceptanceAlbumScenario === "video-failure";
    if (prefersVideo) {
      const firstVideo = photos.find((photo) => photo.type === "video");
      if (firstVideo) photos = [firstVideo, ...photos.filter((photo) => photo.id !== firstVideo.id)];
    }
    if (acceptanceAlbumScenario === "notice-photo") {
      const firstSharedPhoto = photos.find((photo) => photo.type !== "video" && photo.id !== "home-featured-family");
      if (firstSharedPhoto) photos = [firstSharedPhoto, ...photos.filter((photo) => photo.id !== firstSharedPhoto.id)];
    }
    if (acceptanceAlbumScenario === "single") return photos.slice(0, 1);
    if (acceptanceAlbumScenario === "load-failure") {
      return [{ ...photos[0], url: "/assets/acceptance-missing-photo.jpg" }];
    }
    if (acceptanceAlbumScenario === "video-failure") {
      return photos.map((photo, index) => index === 0 && photo.type === "video"
        ? { ...photo, videoUrl: "/assets/acceptance-missing-family-video.mp4" }
        : photo);
    }
    return photos;
  }, [albumPhotos, acceptanceAlbumScenario]);
  const isAlbumEmpty = acceptanceAlbumScenario === "empty";
  const isAcceptanceVideoScenario = ["notice-video", "video-cover", "video-viewed", "video-failure"]
    .includes(acceptanceAlbumScenario);
  const currentPhoto = homePhotoPool[photoIndex] ?? homePhotoPool[0];
  const isCurrentVideo = currentPhoto?.type === "video";
  const currentVideoViewed = Boolean(currentPhoto && viewedVideoIds.includes(currentPhoto.id))
    || acceptanceAlbumScenario === "video-viewed";
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
  const currentPhotoLiked = acceptanceHeartScenario === "liked"
    || (acceptanceHeartScenario !== "not-liked" && Boolean(photoHeartStates[currentPhoto.url]));
  const unreadPhotoMessage = messages.find((item) => item.type === "photo" && !item.played && item.sender !== "您 (我)" && item.photoUrl);
  const currentPhotoMessage = messages.find((item) => item.type === "photo" && item.sender !== "您 (我)" && item.photoUrl === currentPhoto.url);
  const activePhotoMessage = messages.find((item) => item.id === activePhotoMessageId && item.type === "photo" && item.photoUrl);
  const activePhotoUrls = activePhotoMessage?.photoUrls?.length
    ? activePhotoMessage.photoUrls
    : activePhotoMessage?.photoUrl
      ? [activePhotoMessage.photoUrl]
      : [];
  const activePhotoUrl = activePhotoUrls[activePhotoGroupIndex] ?? activePhotoUrls[0];
  const boundWeatherChildren = useMemo(() => familyWeather.children
    .filter((member) => member.relationStatus === "active")
    .sort((first, second) => second.priority - first.priority
      || new Date(second.recentInteractionAt).getTime() - new Date(first.recentInteractionAt).getTime()
      || first.displayName.localeCompare(second.displayName, "zh-CN")), [familyWeather.children]);
  const usableWeatherChildren = useMemo(() => boundWeatherChildren.filter((member) => (
    member.location?.status === "valid"
    && member.weather
    && (member.weather.queryState === "success" || member.weather.queryState === "cached")
  )), [boundWeatherChildren]);
  const homeWeatherChildren = usableWeatherChildren.slice(0, 2);
  const selectedWeather = boundWeatherChildren.find((item) => item.id === selectedWeatherId) ?? boundWeatherChildren[0];
  const elderLocation = familyWeather.elder.location;
  const elderWeather = familyWeather.elder.weather;
  const elderWeatherAvailable = familyWeather.elder.location?.status === "valid"
    && familyWeather.elder.weather
    && (familyWeather.elder.weather.queryState === "success" || familyWeather.elder.weather.queryState === "cached");
  const selectedWeatherAvailable = selectedWeather ? hasUsableWeather(selectedWeather) : false;
  const selectedWeatherCareRecord = selectedWeather
    ? weatherCareRecords.get(selectedWeather.id) ?? selectedWeather.dailyCare
    : undefined;
  const selectedWeatherHasCareToday = Boolean(
    selectedWeather
    && selectedWeather.location
    && selectedWeatherCareRecord
    && selectedWeatherCareRecord.locationId === selectedWeather.location.id
    && selectedWeatherCareRecord.targetLocalDate === getWeatherLocalDate(selectedWeather.location.timeZone)
  );

  useEffect(() => {
    if (acceptanceTimeOverride) {
      const [hours, minutes] = acceptanceTimeOverride.split(":").map(Number);
      const acceptanceNow = new Date();
      acceptanceNow.setHours(hours, minutes, 0, 0);
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
    const initialRecords = new Map(
      familyWeather.children.flatMap((member) => member.dailyCare ? [[member.id, member.dailyCare] as const] : [])
    );
    setWeatherCareRecords(initialRecords);
    const firstMember = familyWeather.children
      .filter((member) => member.relationStatus === "active")
      .sort((first, second) => second.priority - first.priority)[0];
    setSelectedWeatherId(firstMember?.id ?? "");
    setWeatherReminderStage(firstMember?.dailyCare ? "blocked" : "idle");
    setWeatherDraft(null);
    setWeatherSendRequestId(null);
    setWeatherError("");
  }, [familyWeather.loadedAt, familyWeather.scenario]);

  useEffect(() => {
    if (isAlbumEmpty || isAcceptanceVideoScenario || isVoicePlaybackActive || isPhotoHeld || isWeatherOpen || activePhotoMessageId !== null || homeVideoState === "playing" || homePhotoPool.length <= 1) return;
    const timer = window.setTimeout(() => {
      setPhotoIndex((current) => (current + 1) % homePhotoPool.length);
    }, 8000);
    return () => window.clearTimeout(timer);
  }, [isAlbumEmpty, isAcceptanceVideoScenario, isVoicePlaybackActive, isPhotoHeld, isWeatherOpen, activePhotoMessageId, homeVideoState, photoIndex, homePhotoPool.length]);

  useEffect(() => {
    setPhotoIndex(0);
    setPhotoLoadFailedId(null);
    const targetVideo = homePhotoPool.find((photo) => photo.type === "video");
    if (targetVideo && ["notice-video", "video-cover", "video-viewed", "video-failure"].includes(acceptanceAlbumScenario)) {
      setViewedVideoIds((ids) => acceptanceAlbumScenario === "video-viewed"
        ? (ids.includes(targetVideo.id) ? ids : [...ids, targetVideo.id])
        : ids.filter((id) => id !== targetVideo.id));
    }
  }, [acceptanceAlbumScenario]);

  useEffect(() => {
    homeVideoRef.current?.pause();
    setHomeVideoState(acceptanceAlbumScenario === "video-failure" ? "failed" : "cover");
  }, [acceptanceAlbumScenario, photoIndex]);

  useEffect(() => () => homeVideoRef.current?.pause(), []);

  useEffect(() => {
    if (["notice-video", "video-cover", "video-viewed", "video-failure"].includes(acceptanceAlbumScenario)) return;
    if (!unreadPhotoMessage?.photoUrl) return;
    const incomingPhotoIndex = homePhotoPool.findIndex((photo) => photo.url === unreadPhotoMessage.photoUrl);
    if (incomingPhotoIndex >= 0) setPhotoIndex(incomingPhotoIndex);
  }, [acceptanceAlbumScenario, unreadPhotoMessage?.id, unreadPhotoMessage?.photoUrl, homePhotoPool.length]);

  useEffect(() => {
    if (photoIndex >= homePhotoPool.length) setPhotoIndex(0);
  }, [homePhotoPool.length, photoIndex]);

  useEffect(() => {
    const newUnreadIds = messages
      .filter((item) => !item.played && item.sender !== "您 (我)" && (item.type === "voice" || item.type === "photo"))
      .map((item) => item.id);
    const hasNewMessage = newUnreadIds.some((id) => !previousUnreadIdsRef.current.includes(id));
    setVisibleMessageIds((currentIds) => {
      const missingIds = messages
        .filter((item) => newUnreadIds.includes(item.id) && (item.type === "voice" || item.type === "photo") && !currentIds.includes(item.id))
        .map((item) => item.id);
      return missingIds.length > 0 ? [...missingIds, ...currentIds] : currentIds;
    });
    previousUnreadIdsRef.current = newUnreadIds;
    if (hasNewMessage) playMessageChime();
  }, [messages]);

  useEffect(() => {
    if (isMessageStackExpanded) return;
    setVisibleMessageIds((currentIds) => {
      const nextIds = currentIds.filter((id) => {
        const message = messages.find((item) => item.id === id);
        const isActive = id === playingMessageId || id === replyingMessageId || exitingMessageIds.includes(id);
        return !message?.played || isActive;
      });
      return nextIds.length === currentIds.length ? currentIds : nextIds;
    });
  }, [isMessageStackExpanded, messages, playingMessageId, replyingMessageId, exitingMessageIds]);

  useEffect(() => {
    if (acceptanceRevision === 0) return;
    audioRef.current?.pause();
    window.speechSynthesis?.cancel();
    if (playbackTimerRef.current) window.clearTimeout(playbackTimerRef.current);
    activeMessageRef.current = null;
    playbackTimerRef.current = null;
    setPlayingMessageId(null);
    setReplyingMessageId(null);
    setExitingMessageIds([]);
    setActivePhotoMessageId(null);
    setActivePhotoGroupIndex(0);
    setRetriedMessageIds([]);
    setIsPhotoCaptionExiting(false);
    setVisibleMessageIds(
      acceptanceMessagesRef.current
        .filter((item) => !item.played && item.sender !== "您 (我)" && (item.type === "voice" || item.type === "photo"))
        .map((item) => item.id)
    );
  }, [acceptanceRevision]);

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
      audioRef.current?.pause();
      window.speechSynthesis?.cancel();
      if (playbackTimerRef.current) window.clearTimeout(playbackTimerRef.current);
      if (replySpeechTimerRef.current) window.clearTimeout(replySpeechTimerRef.current);
      if (replyExitTimerRef.current) window.clearTimeout(replyExitTimerRef.current);
      if (photoControlsTimerRef.current) window.clearTimeout(photoControlsTimerRef.current);
      if (heartFeedbackTimerRef.current) window.clearTimeout(heartFeedbackTimerRef.current);
      if (heartFailureToastTimerRef.current) window.clearTimeout(heartFailureToastTimerRef.current);
      if (photoMessageTimerRef.current) window.clearTimeout(photoMessageTimerRef.current);
      if (photoMessageExitTimerRef.current) window.clearTimeout(photoMessageExitTimerRef.current);
      if (weatherProgressTimerRef.current) window.clearInterval(weatherProgressTimerRef.current);
      if (weatherSpeechFallbackRef.current) window.clearTimeout(weatherSpeechFallbackRef.current);
      replyConfirmationActiveRef.current = false;
    };
  }, []);

  const visibleMessages = messages.filter((item) => visibleMessageIds.includes(item.id));
  const visibleUnreadCount = visibleMessages.filter((item) => !item.played).length;
  const unreadCount = messages.filter((item) => !item.played && item.sender !== "您 (我)").length;

  const dateText = useMemo(() => {
    return new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric" }).format(now);
  }, [now]);

  const weekText = useMemo(() => {
    return new Intl.DateTimeFormat("zh-CN", { weekday: "short" }).format(now);
  }, [now]);

  function playMessageChime() {
    const chime = notificationAudioRef.current;
    if (!chime) return;
    chime.currentTime = 0;
    chime.volume = 0.72;
    setIsChimePlaying(true);
    void chime.play().catch(() => setIsChimePlaying(false));
  }

  function clearWeatherSpeechTimers() {
    if (weatherProgressTimerRef.current) {
      window.clearInterval(weatherProgressTimerRef.current);
      weatherProgressTimerRef.current = null;
    }
    if (weatherSpeechFallbackRef.current) {
      window.clearTimeout(weatherSpeechFallbackRef.current);
      weatherSpeechFallbackRef.current = null;
    }
  }

  function finishWeatherReading() {
    clearWeatherSpeechTimers();
    setWeatherProgress(100);
    setWeatherReminderStage("confirm");
  }

  function readWeatherDraft(draft = weatherDraft) {
    if (!draft) return;
    const speechEngine = (window as Window & { speechSynthesis?: SpeechSynthesis }).speechSynthesis;
    speechEngine?.cancel();
    clearWeatherSpeechTimers();
    setWeatherProgress(8);
    setWeatherReminderStage("reading");

    weatherProgressTimerRef.current = window.setInterval(() => {
      setWeatherProgress((current) => Math.min(current + 9, 92));
    }, 360);

    const estimatedDuration = Math.max(4200, Math.min(7600, draft.text.length * 150));
    weatherSpeechFallbackRef.current = window.setTimeout(finishWeatherReading, estimatedDuration);
    if (!speechEngine) return;

    const utterance = new SpeechSynthesisUtterance(draft.text);
    utterance.lang = "zh-CN";
    utterance.rate = 0.84;
    utterance.volume = 1;
    utterance.onend = finishWeatherReading;
    utterance.onerror = finishWeatherReading;
    speechEngine.speak(utterance);
  }

  async function generateWeatherReminder() {
    if (!selectedWeather || selectedWeatherHasCareToday) {
      setWeatherReminderStage("blocked");
      return;
    }
    const hasWeatherContext = selectedWeather.location?.status === "valid"
      && selectedWeather.weather
      && (selectedWeather.weather.queryState === "success" || selectedWeather.weather.queryState === "cached");
    if (!hasWeatherContext) return;

    window.speechSynthesis?.cancel();
    clearWeatherSpeechTimers();
    setWeatherError("");
    setWeatherReminderStage("generating");
    try {
      const draft = await onGenerateWeatherCareDraft({
        elderId: familyWeather.elder.userId,
        elderName: familyWeather.elder.displayName,
        recipient: selectedWeather,
        direction: "daily",
        variant: 0,
      });
      setWeatherDraft(draft);
      setWeatherSendRequestId(null);
      readWeatherDraft(draft);
    } catch {
      setWeatherError("关怀内容暂时无法生成，请稍后再试");
      setWeatherReminderStage("failure");
    }
  }

  function cancelWeatherReminder(clearDraft = true) {
    window.speechSynthesis?.cancel();
    clearWeatherSpeechTimers();
    setWeatherProgress(0);
    setWeatherError("");
    setWeatherSendRequestId(null);
    if (clearDraft) setWeatherDraft(null);
    setWeatherReminderStage("idle");
  }

  async function confirmWeatherReminder() {
    if (!selectedWeather || !weatherDraft || weatherReminderStage === "sending" || weatherSendInFlightRef.current) return;
    window.speechSynthesis?.cancel();
    clearWeatherSpeechTimers();
    const requestId = weatherSendRequestId ?? `weather-care-${selectedWeather.id}-${Date.now()}`;
    if (!isWeatherOnline) {
      setWeatherSendRequestId(requestId);
      setWeatherError("网络异常，连接网络后可以重新发送");
      setWeatherReminderStage("failure");
      return;
    }

    setWeatherSendRequestId(requestId);
    setWeatherError("");
    setWeatherReminderStage("sending");
    weatherSendInFlightRef.current = true;
    let result: SendWeatherCareResult;
    try {
      result = await onSendWeatherCare({ requestId, draft: weatherDraft, scenario: familyWeather.scenario });
    } finally {
      weatherSendInFlightRef.current = false;
    }

    if (result.status === "failed") {
      setWeatherError(result.message);
      setWeatherReminderStage("failure");
      return;
    }

    setWeatherCareRecords((records) => new Map(records).set(selectedWeather.id, result.record));
    setWeatherReminderStage(result.status === "already-sent" ? "blocked" : "success");
    if (result.status === "success") onQuickReply(selectedWeather.displayName, weatherDraft.text);

    const speechEngine = (window as Window & { speechSynthesis?: SpeechSynthesis }).speechSynthesis;
    if (!speechEngine) return;
    const utterance = new SpeechSynthesisUtterance(result.status === "already-sent"
      ? `今天已经给${selectedWeather.relationship}发送过天气关怀了`
      : `已给${selectedWeather.relationship}发送天气关怀`);
    utterance.lang = "zh-CN";
    utterance.rate = 0.88;
    utterance.volume = 1;
    speechEngine.speak(utterance);
  }

  function selectWeatherRecipient(weather: FamilyWeatherMember) {
    window.speechSynthesis?.cancel();
    clearWeatherSpeechTimers();
    setSelectedWeatherId(weather.id);
    setWeatherProgress(0);
    setWeatherDraft(null);
    setWeatherSendRequestId(null);
    setWeatherError("");
    const record = weatherCareRecords.get(weather.id) ?? weather.dailyCare;
    const hasCareToday = Boolean(
      weather.location
      && record
      && record.locationId === weather.location.id
      && record.targetLocalDate === getWeatherLocalDate(weather.location.timeZone)
    );
    setWeatherReminderStage(hasCareToday ? "blocked" : "idle");
  }

  function closeWeatherOverview() {
    if (weatherReminderStage === "reading") cancelWeatherReminder();
    setIsWeatherOpen(false);
  }

  function showPhotoMessageAsBackground(message: MessageItem) {
    if (!message.photoUrl) return;
    const incomingPhotoIndex = homePhotoPool.findIndex((photo) => photo.url === message.photoUrl);
    if (incomingPhotoIndex >= 0) setPhotoIndex(incomingPhotoIndex);
  }

  function schedulePhotoMessageReturn(message: MessageItem) {
    if (photoMessageTimerRef.current) window.clearTimeout(photoMessageTimerRef.current);
    if (photoMessageExitTimerRef.current) window.clearTimeout(photoMessageExitTimerRef.current);
    showPhotoMessageAsBackground(message);
    setIsPhotoCaptionExiting(false);
    photoMessageTimerRef.current = window.setTimeout(() => {
      setIsPhotoCaptionExiting(true);
      photoMessageExitTimerRef.current = window.setTimeout(() => {
        setActivePhotoMessageId(null);
        setIsPhotoCaptionExiting(false);
        photoMessageTimerRef.current = null;
        photoMessageExitTimerRef.current = null;
      }, 300);
    }, 8000);
  }

  function dismissMessageCard(messageId: string) {
    if (replyExitTimerRef.current) window.clearTimeout(replyExitTimerRef.current);
    setExitingMessageIds((currentIds) => currentIds.includes(messageId) ? currentIds : [...currentIds, messageId]);
    replyExitTimerRef.current = window.setTimeout(() => {
      setVisibleMessageIds((currentIds) => currentIds.filter((id) => id !== messageId));
      setExitingMessageIds((currentIds) => currentIds.filter((id) => id !== messageId));
      replyExitTimerRef.current = null;
    }, 300);
  }

  function finishMessagePlayback() {
    const playedMessage = activeMessageRef.current;
    if (!playedMessage) return;

    activeMessageRef.current = null;
    if (playbackTimerRef.current) window.clearTimeout(playbackTimerRef.current);
    playbackTimerRef.current = null;
    setPlayingMessageId(null);
    onPlayMessage(playedMessage.id);
    if (playedMessage.type === "photo") {
      dismissMessageCard(playedMessage.id);
      schedulePhotoMessageReturn(playedMessage);
    }
  }

  function playWithDeviceVoice(content: string) {
    const estimatedDuration = Math.max(6000, Math.min(10000, content.length * 220));
    const speechEngine = (window as Window & { speechSynthesis?: SpeechSynthesis }).speechSynthesis;
    if (!speechEngine) {
      playbackTimerRef.current = globalThis.setTimeout(finishMessagePlayback, estimatedDuration);
      return;
    }

    speechEngine.cancel();
    const utterance = new SpeechSynthesisUtterance(content);
    utterance.lang = "zh-CN";
    utterance.rate = 0.86;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.onend = finishMessagePlayback;
    utterance.onerror = () => {
      // Some embedded browsers do not expose an audio voice. Keep the visual
      // playback state for the estimated message duration instead of flashing.
    };
    speechEngine.speak(utterance);
    playbackTimerRef.current = window.setTimeout(finishMessagePlayback, estimatedDuration);
  }

  function handlePlayMessage(message: MessageItem) {
    if (playingMessageId || replyingMessageId) return;
    if (message.type === "photo") {
      if (photoMessageTimerRef.current) window.clearTimeout(photoMessageTimerRef.current);
      if (photoMessageExitTimerRef.current) window.clearTimeout(photoMessageExitTimerRef.current);
      photoMessageTimerRef.current = null;
      photoMessageExitTimerRef.current = null;
      setIsPhotoCaptionExiting(false);
    }
    activeMessageRef.current = message;
    setPlayingMessageId(message.id);

    if (message.audioUrl) {
      const audio = new Audio(message.audioUrl);
      let fallbackStarted = false;
      const fallbackToDeviceVoice = () => {
        if (fallbackStarted) return;
        fallbackStarted = true;
        playWithDeviceVoice(message.content);
      };
      audioRef.current = audio;
      audio.onended = finishMessagePlayback;
      audio.onerror = fallbackToDeviceVoice;
      audio.play().catch(fallbackToDeviceVoice);
      return;
    }

    playWithDeviceVoice(message.content);
  }

  const handleQuickReply = (message: MessageItem) => {
    if (playingMessageId || replyingMessageId) return;
    onPlayMessage(message.id);
    onQuickReply(message.sender, "我收到了");
    setReplyingMessageId(message.id);
    replyConfirmationActiveRef.current = true;
    if (message.type === "photo" && activePhotoMessageId === message.id) schedulePhotoMessageReturn(message);

    const finishConfirmation = () => {
      if (!replyConfirmationActiveRef.current) return;
      replyConfirmationActiveRef.current = false;
      if (replySpeechTimerRef.current) window.clearTimeout(replySpeechTimerRef.current);
      replySpeechTimerRef.current = null;
      setReplyingMessageId(null);
      dismissMessageCard(message.id);
    };

    const speechEngine = (window as Window & { speechSynthesis?: SpeechSynthesis }).speechSynthesis;
    if (!speechEngine) {
      replySpeechTimerRef.current = window.setTimeout(finishConfirmation, 1600);
      return;
    }

    speechEngine.cancel();
    const relation = message.sender.includes("女儿") ? "女儿" : message.sender;
    const utterance = new SpeechSynthesisUtterance(`已告诉${relation}我收到了`);
    utterance.lang = "zh-CN";
    utterance.rate = 0.88;
    utterance.volume = 1;
    utterance.onend = finishConfirmation;
    utterance.onerror = () => {
      // Keep the visual confirmation long enough to be understood when the
      // embedded browser cannot access a system voice.
    };
    speechEngine.speak(utterance);
    replySpeechTimerRef.current = window.setTimeout(finishConfirmation, 2800);
  };

  const openPhotoMessage = (message: MessageItem) => {
    if (!message.photoUrl) return;
    if (photoMessageTimerRef.current) window.clearTimeout(photoMessageTimerRef.current);
    if (photoMessageExitTimerRef.current) window.clearTimeout(photoMessageExitTimerRef.current);
    showPhotoMessageAsBackground(message);
    setIsPhotoCaptionExiting(false);
    setActivePhotoGroupIndex(0);
    setActivePhotoMessageId(message.id);
    window.setTimeout(() => handlePlayMessage(message), 0);
  };

  const closePhotoMessage = () => {
    if (photoMessageTimerRef.current) window.clearTimeout(photoMessageTimerRef.current);
    if (photoMessageExitTimerRef.current) window.clearTimeout(photoMessageExitTimerRef.current);
    photoMessageTimerRef.current = null;
    photoMessageExitTimerRef.current = null;
    if (activeMessageRef.current?.id === activePhotoMessageId) {
      audioRef.current?.pause();
      window.speechSynthesis?.cancel();
      if (playbackTimerRef.current) window.clearTimeout(playbackTimerRef.current);
      playbackTimerRef.current = null;
      activeMessageRef.current = null;
      setPlayingMessageId(null);
    }
    if (activePhotoMessage && !isAcceptanceVideoScenario) showPhotoMessageAsBackground(activePhotoMessage);
    setIsPhotoCaptionExiting(false);
    setActivePhotoMessageId(null);
  };

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

    if (!isVoicePlaybackActive && !replyingMessageId && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const confirmation = new SpeechSynthesisUtterance("已把爱心送给家人");
      confirmation.lang = "zh-CN";
      confirmation.rate = 0.9;
      window.speechSynthesis.speak(confirmation);
    }
  };

  const handlePhotoPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    revealPhotoControls();
    swipeStartXRef.current = event.clientX;
    swipeStartTimeRef.current = performance.now();
    swipePointerIdRef.current = event.pointerId;
    setIsPhotoHeld(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePhotoPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (swipeStartXRef.current === null) return;
    const deltaX = event.clientX - swipeStartXRef.current;
    const pressDuration = performance.now() - (swipeStartTimeRef.current ?? performance.now());
    const swipeThreshold = window.innerWidth / 5;
    if (Math.abs(deltaX) >= swipeThreshold) stepPhoto(deltaX < 0 ? 1 : -1);
    const shouldOpenPhotoMessage = Math.abs(deltaX) < 12
      && pressDuration < 600
      && currentPhotoMessage?.photoUrl === currentPhoto.url;

    swipeStartXRef.current = null;
    swipeStartTimeRef.current = null;
    swipePointerIdRef.current = null;
    setIsPhotoHeld(false);
    schedulePhotoControlsHide();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (shouldOpenPhotoMessage && currentPhotoMessage) openPhotoMessage(currentPhotoMessage);
  };

  const cancelPhotoInteraction = () => {
    swipeStartXRef.current = null;
    swipeStartTimeRef.current = null;
    swipePointerIdRef.current = null;
    setIsPhotoHeld(false);
    schedulePhotoControlsHide();
  };

  useEffect(() => {
    if (!acceptanceCommand) return;

    if (acceptanceCommand.type === "reset-home-overlays") {
      setConfirmSOS(false);
      setIsWeatherOpen(false);
      closePhotoMessage();
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
    if (acceptanceCommand.type === "expand-messages") {
      setIsMessageStackExpanded(true);
      return;
    }
    if (acceptanceCommand.type === "collapse-messages") {
      setIsMessageStackExpanded(false);
      return;
    }
    if (acceptanceCommand.type === "play-message-chime") {
      playMessageChime();
      return;
    }
    if (acceptanceCommand.type === "open-weather") {
      setIsWeatherOpen(true);
      return;
    }
    if (acceptanceCommand.type === "open-weather-care") {
      setIsWeatherOpen(true);
      void generateWeatherReminder();
      return;
    }
    if (acceptanceCommand.type === "play-first-message") {
      const firstMessage = visibleMessages.find((message) => !message.played) ?? visibleMessages[0];
      if (!firstMessage) return;
      if (firstMessage.type === "photo") openPhotoMessage(firstMessage);
      else handlePlayMessage(firstMessage);
    }
  }, [acceptanceCommand?.id]);

  return (
    <main
      className="control-center"
      aria-label="高龄智慧中控屏首页"
    >
      <audio
        ref={notificationAudioRef}
        src="/assets/message-chime.wav"
        preload="auto"
        onEnded={() => setIsChimePlaying(false)}
        onError={() => setIsChimePlaying(false)}
      />
      <header className="control-header">
        <div className="clock-block" aria-label="当前时间">
          <time className="clock-time">
            {now.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false })}
          </time>
          <div className="clock-date">
            <strong>{weekText}</strong>
            <span>{dateText}</span>
          </div>
        </div>

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
                <i>更新 {formatWeatherUpdatedAt(elderWeather.lastSuccessAt, elderLocation.timeZone)}</i>
              </span>
            </span>
          ) : (
            <span className="weather-local weather-local--unavailable">
              <span className="weather-sun" aria-hidden="true"><CloudSun /></span>
              <span className="weather-main"><b>天气暂时无法显示</b><small>请联系家人或服务人员完善地址</small></span>
            </span>
          )}
          <span className="weather-divider" />
          <span className="family-weather-list">
            {homeWeatherChildren.length > 0 ? homeWeatherChildren.map((member) => (
              <span className="family-weather" key={member.id}>
                <span className="family-weather-temperature">
                  <span aria-hidden="true">{weatherIcon(member.weather?.conditionCode)}</span>
                  <b>{member.weather?.temperatureC}°C</b>
                  {member.weather?.riskText && <em>{member.weather.conditionText}</em>}
                </span>
                <span className="family-weather-meta">
                  <small>{member.location?.cityName} · {member.relationship}</small>
                  <i>当地 {member.location ? formatWeatherLocalTime(member.location.timeZone) : "--"}</i>
                </span>
              </span>
            )) : <span className="family-weather-empty">暂无可用的子女天气</span>}
          </span>
          <span className="weather-details">家庭天气<ChevronDown aria-hidden="true" /></span>
        </button>

        <button className="sos-button" type="button" onClick={() => setConfirmSOS(true)}>
          <Phone aria-hidden="true" />
          <span>紧急呼叫</span>
        </button>
      </header>

      <section className="control-workspace">
        <div className={`family-stage ${visibleMessages.length > 0 && isMessageStackExpanded ? "has-expanded-messages" : ""} ${arePhotoControlsVisible ? "show-photo-controls" : ""}`}>
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
                <span className="home-video-badge"><Video aria-hidden="true" />家庭视频{currentVideoViewed ? " · 已查看" : " · 未查看"}</span>
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

          {visibleMessages.length > 0 && (
            <section className={`message-stack ${isMessageStackExpanded ? "" : "is-collapsed"}`} aria-label={`${visibleUnreadCount}条未读家庭留言`} aria-live="polite">
              <header className="message-stack__header">
                <span className="message-stack__icon"><Heart fill="currentColor" aria-hidden="true" /></span>
                <span className="message-stack__title">
                  <strong>
                    {visibleUnreadCount > 0
                      ? `${visibleMessages[0].sender.includes("女儿") ? "女儿" : visibleMessages[0].sender}发来 ${visibleUnreadCount} 条新留言`
                      : "留言均已收听"}
                  </strong>
                  <small>
                    {playingMessageId ? "正在播放留言..." : replyingMessageId ? "正在发送回复..." : isMessageStackExpanded ? "逐条播放，逐条回复" : "按一下展开查看"}
                  </small>
                </span>
                {isMessageStackExpanded && (
                  <button
                    type="button"
                    className="message-stack__sound"
                    onClick={playMessageChime}
                    disabled={isChimePlaying}
                    aria-label="试听留言提示音"
                  >
                    <Volume2 aria-hidden="true" />
                    <span>{isChimePlaying ? "播放中" : "试听"}</span>
                  </button>
                )}
                <button
                  type="button"
                  className="message-stack__toggle"
                  onClick={() => setIsMessageStackExpanded((expanded) => !expanded)}
                  aria-expanded={isMessageStackExpanded}
                >
                  {isMessageStackExpanded ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
                  <span>{isMessageStackExpanded ? "收起" : "展开"}</span>
                </button>
              </header>

              {isMessageStackExpanded && <div className="message-stack__list">
                {visibleMessages.map((message) => {
                  const isPlaying = playingMessageId === message.id;
                  const isReplying = replyingMessageId === message.id;
                  const isExiting = exitingMessageIds.includes(message.id);
                  const isBusy = playingMessageId !== null || replyingMessageId !== null;
                  const isPhotoMessage = message.type === "photo" && Boolean(message.photoUrl);
                  const photoCount = message.photoUrls?.length ?? (message.photoUrl ? 1 : 0);
                  const isPhotoGroup = isPhotoMessage && photoCount > 1;
                  const isLoadFailed = Boolean(message.loadFailed) && !retriedMessageIds.includes(message.id);
                  const relation = message.sender.includes("女儿") ? "女儿" : message.sender;

                  return (
                    <article key={message.id} className={`message-card ${isPhotoMessage ? "is-photo" : ""} ${isPlaying ? "is-playing" : ""} ${isReplying ? "is-replying" : ""} ${isExiting ? "is-exiting" : ""}`}>
                      <div className="message-card__meta">
                        <span className="message-card__sender">{relation}的{isPhotoGroup ? "照片组留言" : isPhotoMessage ? "照片留言" : "留言"}</span>
                        <span className="message-card__time">{message.timestamp ?? "刚刚"}</span>
                        <span className={`message-card__status ${message.played ? "is-read" : ""}`}>
                          {isPlaying ? "正在播放" : isReplying ? "已回复" : message.played ? "已收听" : "新留言"}
                        </span>
                      </div>
                      {isPhotoMessage && !isLoadFailed && (
                        <button
                          type="button"
                          className="message-card__photo-preview"
                          onClick={() => openPhotoMessage(message)}
                          disabled={isBusy}
                          aria-label={`查看${relation}发来的${isPhotoGroup ? `${photoCount}张照片` : "照片"}并收听留言`}
                        >
                          <img src={message.photoUrl} alt="孩子们在雪地里堆雪人" />
                          {isPhotoGroup && <strong className="message-card__photo-count">共 {photoCount} 张</strong>}
                          <span><Image aria-hidden="true" />{isPhotoGroup ? "按一下查看这组照片" : "按一下查看大图并收听"}</span>
                        </button>
                      )}
                      {isLoadFailed ? (
                        <div className="message-card__load-failed">
                          <WifiOff aria-hidden="true" />
                          <div><strong>留言暂时无法加载</strong><span>请检查网络后重新加载</span></div>
                          <button type="button" onClick={() => setRetriedMessageIds((ids) => [...ids, message.id])}><RefreshCw aria-hidden="true" />重新加载</button>
                        </div>
                      ) : <p>{message.content}</p>}
                      {!isLoadFailed && (
                      <div className="message-card__actions">
                        <button
                          type="button"
                          className="message-play-button"
                          onClick={() => isPhotoMessage ? openPhotoMessage(message) : handlePlayMessage(message)}
                          disabled={isBusy}
                        >
                          {isPhotoMessage ? (
                            <Image aria-hidden="true" />
                          ) : isPlaying ? (
                            <Lottie
                              animationData={voiceWaveAnimation}
                              autoplay={!window.matchMedia("(prefers-reduced-motion: reduce)").matches}
                              loop
                              aria-hidden="true"
                              className="message-card__lottie"
                            />
                          ) : (
                            <Volume2 aria-hidden="true" />
                          )}
                          <span>{isPhotoGroup ? "查看这组照片" : isPhotoMessage ? "查看照片" : isPlaying ? "正在播放" : message.played ? "再听一次" : "播放留言"}</span>
                        </button>
                        <button type="button" className="message-reply-button" onClick={() => handleQuickReply(message)} disabled={isBusy}>
                          {isReplying ? <CheckCircle2 aria-hidden="true" /> : <MessageCircleHeart aria-hidden="true" />}
                          <span>{isReplying ? "已回复：我收到了" : "回复“我收到了”"}</span>
                        </button>
                      </div>
                      )}
                    </article>
                  );
                })}
              </div>}
            </section>
          )}

          <div className="home-album-actions">
            <button className="album-label" type="button" onClick={openAlbumFromHome}>
              <Image aria-hidden="true" />
              <span>{isAlbumEmpty ? "进入家庭相册" : `家庭相册 · ${photoIndex + 1} / ${homePhotoPool.length}`}</span>
            </button>
            {!isAlbumEmpty && photoLoadFailedId !== currentPhoto.id && <button
              className={`home-photo-heart${currentPhotoLiked ? " is-liked" : ""}${heartFeedbackPhotoId === currentPhoto.id ? " is-sent" : ""}`}
              type="button"
              onClick={sendPhotoHeart}
              disabled={acceptanceHeartScenario === "sending"}
              aria-label={currentPhotoLiked ? "取消这张照片的爱心" : "给这张照片送个爱心"}
            >
              <Heart aria-hidden="true" />
              <span>{acceptanceHeartScenario === "sending" ? "爱心发送中" : currentPhotoLiked ? "已送爱心" : "送个爱心"}</span>
            </button>}
          </div>
          {isHeartFailureToastVisible && (
            <div className="home-heart-toast is-error" role="status" aria-live="polite">
              <AlertTriangle aria-hidden="true" />
              <span>爱心发送失败，请稍后重试</span>
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
          records={fulfillmentRecords}
          securityUnreadCount={securityUnreadCount}
          onCompleteReminder={onCompleteReminder}
          onOpenTodayOverview={onOpenTodayOverview}
          onOpenSchedule={onOpenSchedule}
          onOpenMessageBox={onOpenMessageBox}
          onOpenCommunity={onOpenCommunity}
          onOpenSpecialServices={onOpenSpecialServices}
          onOpenRecommendation={onOpenRecommendation}
          acceptanceCareRegion={acceptanceCareRegion}
          acceptanceCareTime={acceptanceCareTime}
          acceptanceCareMode={acceptanceCareMode}
          acceptanceCareScenario={acceptanceCareScenario}
          acceptanceDisasterScenario={acceptanceDisasterScenario}
        />
      </section>

      <nav className="control-dock" aria-label="常用功能">
        <div className="dock-group">
          <button type="button" onClick={openAlbumFromHome}><span className="dock-icon"><Image /></span><strong>家庭相册</strong></button>
          <button type="button" onClick={onOpenContacts} className="has-badge"><span className="dock-icon"><MessageCircleHeart /></span><strong>通讯录</strong>{unreadCount > 0 && <i>{unreadCount}</i>}</button>
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
                    aria-label={`查看${member.displayName}的天气${isAvailable ? "并送句关心" : "状态"}`}
                    aria-pressed={isSelected}
                    onClick={() => selectWeatherRecipient(member)}
                  >
                    {cardContent}
                  </button>
                );
              })}
            </div>

            <section className={`weather-reminder-panel is-${weatherReminderStage}`} aria-live="polite">
              {!selectedWeather && <div className="weather-reminder-unavailable"><p>暂无已绑定的子女天气</p></div>}

              {selectedWeather && !selectedWeatherAvailable && (
                <div className="weather-reminder-unavailable">
                  <AlertTriangle aria-hidden="true" />
                  <div><strong>{weatherUnavailableText(selectedWeather)}</strong><span>天气异常不会影响相册、提醒事项、通讯录等其他功能。</span></div>
                  <button type="button" onClick={() => { closeWeatherOverview(); onOpenContacts(); }}>去通讯录留言</button>
                </div>
              )}

              {selectedWeather && selectedWeatherAvailable && weatherReminderStage === "idle" && (
                <div className="weather-reminder-intro">
                  <span><AlertTriangle aria-hidden="true" /></span>
                  <p><strong>{selectedWeather.location?.cityName}{selectedWeather.weather?.conditionText}，{selectedWeather.weather?.temperatureC}℃。</strong>按一下，先听听准备发给{selectedWeather.relationship}的关怀内容。</p>
                  <button type="button" onClick={() => generateWeatherReminder()}><Send aria-hidden="true" />送句关心</button>
                </div>
              )}

              {selectedWeather && selectedWeatherAvailable && weatherReminderStage === "generating" && (
                <div className="weather-reminder-loading"><RefreshCw aria-hidden="true" /><strong>正在准备关怀内容…</strong></div>
              )}

              {selectedWeather && selectedWeatherAvailable && weatherReminderStage === "reading" && weatherDraft && (
                <div className="weather-reminder-reading">
                  <div><Volume2 aria-hidden="true" /><strong>正在朗读发送内容…</strong></div>
                  <blockquote>“{weatherDraft.text}”</blockquote>
                  <div className="weather-reading-progress" role="progressbar" aria-label="语音朗读进度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={weatherProgress}>
                    <span style={{ width: `${weatherProgress}%` }} />
                  </div>
                </div>
              )}

              {selectedWeather && selectedWeatherAvailable && weatherReminderStage === "confirm" && weatherDraft && (
                <div className="weather-reminder-confirm">
                  <header>
                    <span>发送给：{selectedWeather.displayName}</span>
                    <b>{formatMemberLocation(selectedWeather, familyWeather.elder.location?.countryCode)} · {selectedWeather.weather?.conditionText} {selectedWeather.weather?.temperatureC}℃</b>
                  </header>
                  <blockquote>“{weatherDraft.text}”</blockquote>
                  <div className="weather-reminder-primary-actions">
                    <button type="button" onClick={confirmWeatherReminder}><CheckCircle2 aria-hidden="true" />确认发送给{selectedWeather.relationship}</button>
                    <button type="button" onClick={() => cancelWeatherReminder()}>取消</button>
                  </div>
                </div>
              )}

              {selectedWeather && weatherReminderStage === "sending" && (
                <div className="weather-reminder-loading"><RefreshCw aria-hidden="true" /><strong>正在发送给{selectedWeather.relationship}…</strong><span>请不要重复点击</span></div>
              )}

              {selectedWeather && weatherReminderStage === "success" && weatherDraft && (
                <div className="weather-reminder-sent">
                  <CheckCircle2 aria-hidden="true" />
                  <div>
                    <strong>已发送给{selectedWeather.relationship}</strong>
                    <span>对方会在家庭留言中收到这句关怀。</span>
                    <blockquote>“{weatherDraft.text}”</blockquote>
                    <button type="button" className="weather-reminder-complete" onClick={closeWeatherOverview}><CheckCircle2 aria-hidden="true" />完成并返回首页</button>
                  </div>
                </div>
              )}

              {selectedWeather && weatherReminderStage === "failure" && (
                <div className="weather-reminder-failed">
                  <AlertTriangle aria-hidden="true" />
                  <div>
                    <strong>没有发送成功</strong>
                    <span>{weatherError || "请稍后再试"}</span>
                    {weatherDraft && <blockquote>原发送内容：“{weatherDraft.text}”</blockquote>}
                  </div>
                  <button type="button" onClick={() => weatherDraft ? confirmWeatherReminder() : generateWeatherReminder()}><RefreshCw aria-hidden="true" />重新发送</button>
                  <button type="button" onClick={() => cancelWeatherReminder()}>取消</button>
                </div>
              )}

              {selectedWeather && weatherReminderStage === "blocked" && selectedWeatherCareRecord && (
                <div className="weather-reminder-sent is-already-sent">
                  <CheckCircle2 aria-hidden="true" />
                  <div><strong>今天已经给{selectedWeather.relationship}发送过天气关怀了</strong><span>按{selectedWeather.location?.cityName}当地日期 {selectedWeatherCareRecord.targetLocalDate} 计算，每天一次。</span><blockquote>“{selectedWeatherCareRecord.text}”</blockquote></div>
                </div>
              )}
            </section>
          </section>
        </div>
      )}

      {activePhotoMessage && (
        <section className="photo-message-viewer" role="dialog" aria-modal="true" aria-label="查看女儿发来的照片留言">
          <img className="photo-message-viewer__image" src={activePhotoUrl} alt={`照片组第 ${activePhotoGroupIndex + 1} 张`} />
          <div className="photo-message-viewer__shade" aria-hidden="true" />
          <button type="button" className="photo-message-viewer__close" onClick={closePhotoMessage}>
            <X aria-hidden="true" />
            <span>收起</span>
          </button>
          {activePhotoUrls.length > 1 && (
            <>
              <button type="button" className="photo-message-viewer__nav is-previous" onClick={() => setActivePhotoGroupIndex((index) => (index - 1 + activePhotoUrls.length) % activePhotoUrls.length)} aria-label="上一张照片"><ChevronLeft aria-hidden="true" /></button>
              <span className="photo-message-viewer__count">{activePhotoGroupIndex + 1} / {activePhotoUrls.length}</span>
              <button type="button" className="photo-message-viewer__nav is-next" onClick={() => setActivePhotoGroupIndex((index) => (index + 1) % activePhotoUrls.length)} aria-label="下一张照片"><ChevronRight aria-hidden="true" /></button>
            </>
          )}

          <section className={`photo-message-viewer__card ${isPhotoCaptionExiting ? "is-exiting" : ""}`} aria-live="polite">
            <div className="photo-message-viewer__message">
              <MessageCircleHeart aria-hidden="true" />
              <p>“{activePhotoMessage.content}”</p>
            </div>
            <div className="photo-message-viewer__status">
              {playingMessageId === activePhotoMessage.id ? (
                <Lottie
                  animationData={voiceWaveAnimation}
                  autoplay={!window.matchMedia("(prefers-reduced-motion: reduce)").matches}
                  loop
                  aria-hidden="true"
                  className="photo-message-viewer__wave"
                />
              ) : replyingMessageId === activePhotoMessage.id ? (
                <CheckCircle2 aria-hidden="true" />
              ) : (
                <Volume2 aria-hidden="true" />
              )}
              <span>
                {playingMessageId === activePhotoMessage.id
                  ? "正在播报女儿的留言..."
                  : replyingMessageId === activePhotoMessage.id
                    ? "已告诉女儿我收到了"
                    : "留言已播报"}
              </span>
            </div>
            <div className="photo-message-viewer__actions">
              <button
                type="button"
                onClick={() => handlePlayMessage(activePhotoMessage)}
                disabled={playingMessageId !== null || replyingMessageId !== null}
              >
                <Volume2 aria-hidden="true" />
                <span>{playingMessageId === activePhotoMessage.id ? "正在播放" : "重新播放"}</span>
              </button>
              <button
                type="button"
                className="photo-message-viewer__reply"
                onClick={() => handleQuickReply(activePhotoMessage)}
                disabled={playingMessageId !== null || replyingMessageId !== null}
              >
                <MessageCircleHeart aria-hidden="true" />
                <span>{replyingMessageId === activePhotoMessage.id ? "已回复：我收到了" : "回复“我收到了”"}</span>
              </button>
            </div>
          </section>
        </section>
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
