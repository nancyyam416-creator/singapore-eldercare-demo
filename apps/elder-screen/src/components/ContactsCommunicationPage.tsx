import React, { useEffect, useMemo, useRef, useState } from "react";
import Lottie from "lottie-react";
import {
  Check,
  CheckCircle2,
  CircleAlert,
  CloudRain,
  CloudSun,
  Clock3,
  Image,
  MessageCircleHeart,
  Mic,
  MicOff,
  Phone,
  PhoneMissed,
  PhoneOff,
  RotateCcw,
  Send,
  UserPlus,
  Users,
  Video,
  VideoOff,
  Volume2,
  Wind,
  X,
} from "lucide-react";
import voiceWaveAnimation from "../animations/voiceWave";
import { speakText, stopSpeech } from "../audio/speech";
import type { FamilyMessage } from "../types";
import { SERVICE_COMMUNICATION_FIXTURES } from "../service-communication-fixture";
import { getActiveFamilyRelationships } from "../elder-profile";
import {
  familyWeatherMockApi,
  type FamilyWeatherMember,
} from "../weather/familyWeather";
import FamilyInvitationModal from "./FamilyInvitationModal";
import SecondaryPageHeader from "./SecondaryPageHeader";
import "./contacts-communication.css";

interface ContactsCommunicationPageProps {
  isOpen: boolean;
  onClose: () => void;
  hasBoundFamily?: boolean;
  messages: FamilyMessage[];
  missedCallCount: number;
  onAddMessage: (message: FamilyMessage) => void;
  onMarkRead: (messageId: string) => void;
  onClearMissedCalls: () => void;
  familyMediaFocusRequest?: { id: number; contactId: string; mediaId: string } | null;
  onFamilyMediaViewed?: (mediaId: string) => void;
  onOpenFamilyMedia?: (mediaId: string) => void;
  acceptanceScenario?: ServiceConversationAcceptanceScenario;
  acceptanceActionSignal?: number;
}

export type ServiceConversationAcceptanceScenario =
  | "off"
  | "normal"
  | "empty"
  | "playback-failure"
  | "send-failure"
  | "incoming-voice"
  | "incoming-video"
  | "call-timeout";

interface CommunicationContact {
  id: string;
  name: string;
  relation: string;
  avatar: string;
  group: "family" | "service";
  detail?: string;
  serviceHours?: string;
  phone?: string;
  weatherUserId?: string;
}

type RecorderState = "idle" | "recording" | "review" | "sending" | "sent" | "failed";
type CallState = "idle" | "incoming" | "dialing" | "connected" | "fallback";

const CARE_SERVICE_FIXTURE = SERVICE_COMMUNICATION_FIXTURES.find((conversation) => conversation.id === "CONV-CARE-001")!;
const STATION_SERVICE_FIXTURE = SERVICE_COMMUNICATION_FIXTURES.find((conversation) => conversation.id === "CONV-STATION-001")!;

const CONTACTS: CommunicationContact[] = [
  ...getActiveFamilyRelationships().map((relationship) => ({
    id: relationship.id,
    name: relationship.displayName,
    relation: relationship.relationship,
    avatar: relationship.avatar,
    group: "family" as const,
    weatherUserId: relationship.weatherUserId,
  })),
  {
    id: "nurse",
    name: CARE_SERVICE_FIXTURE.staffName,
    relation: CARE_SERVICE_FIXTURE.contactName,
    avatar: "https://picsum.photos/seed/nurse/240/240",
    group: "service",
    detail: CARE_SERVICE_FIXTURE.contactType,
    serviceHours: "服务时间 09:00–18:00",
    phone: CARE_SERVICE_FIXTURE.contactPhone,
  },
  {
    id: "community",
    name: STATION_SERVICE_FIXTURE.contactName,
    relation: STATION_SERVICE_FIXTURE.contactType,
    avatar: "https://picsum.photos/seed/community-center/240/240",
    group: "service",
    detail: "机构联系人",
    serviceHours: "服务时间 08:00–18:00",
    phone: STATION_SERVICE_FIXTURE.contactPhone,
  },
];

const formatSeconds = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
};

const formatContactLocalTime = (timeZone: string) => new Intl.DateTimeFormat("zh-CN", {
  timeZone,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
}).format(new Date());

const getWeatherSummary = (member: FamilyWeatherMember | undefined, elderTimeZone: string | undefined) => {
  if (!member?.location || member.location.status !== "valid") {
    return { primary: "暂未设置所在地", secondary: "", state: "missing" as const };
  }

  const { weather, location } = member;
  const isCrossTimeZone = Boolean(elderTimeZone && location.timeZone !== elderTimeZone);
  const pronoun = member.relationship.includes("女") ? "她" : "他";
  const secondary = isCrossTimeZone ? `${pronoun}那里现在 ${formatContactLocalTime(location.timeZone)}` : "";
  if (!weather || !["success", "cached"].includes(weather.queryState) || weather.temperatureC === undefined) {
    return {
      primary: `${location.cityName} · 天气暂不可用`,
      secondary,
      state: "unavailable" as const,
    };
  }

  return {
    primary: `${location.cityName} · ${weather.conditionText ?? "天气"} ${weather.temperatureC}℃`,
    secondary,
    state: weather.conditionCode ?? "cloudy",
  };
};

const WeatherGlyph = ({ state }: { state: ReturnType<typeof getWeatherSummary>["state"] }) => {
  if (state === "rain" || state === "storm" || state === "snow") return <CloudRain aria-hidden="true" />;
  if (state === "wind" || state === "cold") return <Wind aria-hidden="true" />;
  return <CloudSun aria-hidden="true" />;
};

export default function ContactsCommunicationPage({
  isOpen,
  onClose,
  hasBoundFamily = true,
  messages,
  missedCallCount,
  onAddMessage,
  onMarkRead,
  onClearMissedCalls,
  familyMediaFocusRequest = null,
  onFamilyMediaViewed,
  onOpenFamilyMedia,
  acceptanceScenario = "off",
  acceptanceActionSignal = 0,
}: ContactsCommunicationPageProps) {
  const [selectedContactId, setSelectedContactId] = useState("daughter");
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [photoMessage, setPhotoMessage] = useState<FamilyMessage | null>(null);
  const [recorderState, setRecorderState] = useState<RecorderState>("idle");
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recorderHighlighted, setRecorderHighlighted] = useState(false);
  const [playbackFailedMessageId, setPlaybackFailedMessageId] = useState<string | null>(null);
  const [scenarioHeardMessageIds, setScenarioHeardMessageIds] = useState<Set<string>>(() => new Set());
  const [callState, setCallState] = useState<CallState>("idle");
  const [callMode, setCallMode] = useState<"video" | "voice">("video");
  const [callContact, setCallContact] = useState<CommunicationContact | null>(null);
  const [callSeconds, setCallSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isFamilyInvitationOpen, setIsFamilyInvitationOpen] = useState(false);
  const [missedCallHistoryCount, setMissedCallHistoryCount] = useState(0);
  const [highlightedFamilyMediaId, setHighlightedFamilyMediaId] = useState<string | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const recordingTimerRef = useRef<number | null>(null);
  const playbackTimerRef = useRef<number | null>(null);
  const callTimerRef = useRef<number | null>(null);
  const callDurationTimerRef = useRef<number | null>(null);
  const sentTimerRef = useRef<number | null>(null);
  const lastAcceptanceActionSignalRef = useRef(0);
  const localMessageSequenceRef = useRef(1);
  const familyWeatherSnapshot = useMemo(() => familyWeatherMockApi.getSnapshot("default"), []);
  const familyWeatherByUserId = useMemo(
    () => new Map(familyWeatherSnapshot.children.map((member) => [member.userId, member])),
    [familyWeatherSnapshot],
  );
  const elderTimeZone = familyWeatherSnapshot.elder.location?.timeZone;

  const isMessageViewed = (message: FamilyMessage) => message.played
    && !(acceptanceScenario === "playback-failure" && message.id === "MSG-002" && !scenarioHeardMessageIds.has(message.id));

  const contactsWithUnread = useMemo(() => CONTACTS.map((contact, index) => {
    const unread = messages.filter((message) => message.sender === contact.name && message.deliveryStatus !== "failed" && !isMessageViewed(message)).length;
    const missedCalls = contact.id === "daughter" ? missedCallCount : 0;
    return { ...contact, unread, missedCalls, originalIndex: index };
  }), [acceptanceScenario, messages, missedCallCount, scenarioHeardMessageIds]);

  const visibleContacts = useMemo(
    () => hasBoundFamily ? contactsWithUnread : contactsWithUnread.filter((contact) => contact.group !== "family"),
    [contactsWithUnread, hasBoundFamily],
  );

  const familyContacts = useMemo(() => visibleContacts
    .filter((contact) => contact.group === "family")
    .sort((first, second) => (second.missedCalls + second.unread) - (first.missedCalls + first.unread) || first.originalIndex - second.originalIndex), [visibleContacts]);
  const serviceContacts = useMemo(() => visibleContacts.filter((contact) => contact.group === "service"), [visibleContacts]);
  const selectedContact = visibleContacts.find((contact) => contact.id === selectedContactId) ?? visibleContacts[0];
  const contactMessages = messages.filter((message) =>
    message.sender === selectedContact.name || (message.sender === "您 (我)" && message.recipient === selectedContact.name)
  );
  const selectedMessages = selectedContact.group === "service" && acceptanceScenario === "empty"
    ? []
    : contactMessages;
  const visibleUnreadServiceTextIds = selectedMessages
    .filter((message) => selectedContact.group === "service" && message.sender !== "您 (我)" && message.type === "text" && !isMessageViewed(message))
    .map((message) => message.id)
    .join("|");
  const selectedMissedCallHistoryCount = selectedContact.id === "daughter" ? missedCallHistoryCount : 0;

  const runOutgoingCall = (contact: CommunicationContact, mode: "video" | "voice") => {
    setCallContact(contact);
    setCallMode(mode);
    setCallState("dialing");
    speakText(`正在呼叫${contact.name}`, { rate: 0.86 });
    if (callTimerRef.current) window.clearTimeout(callTimerRef.current);
    callTimerRef.current = window.setTimeout(() => {
      if (acceptanceScenario === "call-timeout") {
        setCallState("fallback");
        speakText("对方暂时无人接听", { rate: 0.86 });
        return;
      }
      beginConnectedCall();
    }, acceptanceScenario === "call-timeout" ? 1800 : 1500);
  };

  useEffect(() => {
    if (missedCallCount > 0) setMissedCallHistoryCount(missedCallCount);
  }, [missedCallCount]);

  useEffect(() => {
    if (!isOpen || selectedContactId !== "daughter" || missedCallCount <= 0) return;
    const timer = window.setTimeout(onClearMissedCalls, 900);
    return () => window.clearTimeout(timer);
  }, [isOpen, selectedContactId, missedCallCount, onClearMissedCalls]);

  useEffect(() => {
    if (!isOpen || acceptanceScenario === "off") return;
    const isFamilyScenario = ["incoming-voice", "incoming-video", "call-timeout"].includes(acceptanceScenario);
    setSelectedContactId(isFamilyScenario ? "daughter" : "nurse");
    stopSpeech();
    if (recordingTimerRef.current) window.clearInterval(recordingTimerRef.current);
    if (sentTimerRef.current) window.clearTimeout(sentTimerRef.current);
    if (playbackTimerRef.current) window.clearTimeout(playbackTimerRef.current);
    if (callTimerRef.current) window.clearTimeout(callTimerRef.current);
    if (callDurationTimerRef.current) window.clearInterval(callDurationTimerRef.current);
    recordingTimerRef.current = null;
    sentTimerRef.current = null;
    playbackTimerRef.current = null;
    callTimerRef.current = null;
    callDurationTimerRef.current = null;
    setRecorderState(acceptanceScenario === "send-failure" ? "failed" : "idle");
    setRecordingSeconds(acceptanceScenario === "send-failure" ? 8 : 0);
    setPlayingMessageId(null);
    setPhotoMessage(null);
    setPlaybackFailedMessageId(null);
    setScenarioHeardMessageIds(new Set());
    setCallState("idle");
    setCallContact(null);
    setCallSeconds(0);
    if (acceptanceScenario === "incoming-voice" || acceptanceScenario === "incoming-video") {
      const daughter = CONTACTS.find((contact) => contact.id === "daughter") ?? CONTACTS[0];
      setCallContact(daughter);
      setCallMode(acceptanceScenario === "incoming-video" ? "video" : "voice");
      setCallState("incoming");
      setCallSeconds(0);
      speakText(`${daughter.name}正在发起${acceptanceScenario === "incoming-video" ? "视频" : "语音"}通话`, { rate: 0.86 });
    }
  }, [acceptanceScenario, isOpen]);

  useEffect(() => {
    if (acceptanceActionSignal <= 0) {
      lastAcceptanceActionSignalRef.current = 0;
      return;
    }
    if (
      !isOpen
      || acceptanceScenario !== "call-timeout"
      || lastAcceptanceActionSignalRef.current === acceptanceActionSignal
    ) return;
    lastAcceptanceActionSignalRef.current = acceptanceActionSignal;
    const daughter = CONTACTS.find((contact) => contact.id === "daughter") ?? CONTACTS[0];
    setSelectedContactId(daughter.id);
    runOutgoingCall(daughter, "voice");
  }, [acceptanceActionSignal, acceptanceScenario, isOpen]);

  useEffect(() => {
    if (isOpen || acceptanceScenario !== "off") return;
    setSelectedContactId("daughter");
    setRecorderState("idle");
    setRecordingSeconds(0);
    setPlaybackFailedMessageId(null);
  }, [acceptanceScenario, isOpen]);

  useEffect(() => {
    if (!isOpen || selectedContact.group !== "service" || !visibleUnreadServiceTextIds) return;
    const timeline = timelineRef.current;
    if (!timeline) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || entry.intersectionRatio < 0.6) return;
        const messageId = (entry.target as HTMLElement).dataset.messageId;
        if (messageId) onMarkRead(messageId);
        observer.unobserve(entry.target);
      });
    }, { root: timeline, threshold: 0.6 });
    timeline.querySelectorAll<HTMLElement>("[data-service-unread-text='true']").forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [isOpen, onMarkRead, selectedContact.group, selectedContact.name, visibleUnreadServiceTextIds]);

  useEffect(() => {
    if (!isOpen || !familyMediaFocusRequest) return;
    if (!visibleContacts.some((contact) => contact.id === familyMediaFocusRequest.contactId)) return;
    setSelectedContactId(familyMediaFocusRequest.contactId);
    setHighlightedFamilyMediaId(familyMediaFocusRequest.mediaId);

    let observer: IntersectionObserver | null = null;
    const timer = window.setTimeout(() => {
      const timeline = timelineRef.current;
      const target = timeline?.querySelector<HTMLElement>(`[data-family-media-id="${familyMediaFocusRequest.mediaId}"]`);
      if (!timeline || !target) return;
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      observer = new IntersectionObserver((entries) => {
        const visibleEntry = entries.find((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.6);
        if (!visibleEntry) return;
        onFamilyMediaViewed?.(familyMediaFocusRequest.mediaId);
        observer?.disconnect();
      }, { root: timeline, threshold: 0.6 });
      observer.observe(target);
    }, 120);
    const highlightTimer = window.setTimeout(() => setHighlightedFamilyMediaId(null), 3600);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(highlightTimer);
      observer?.disconnect();
    };
  }, [familyMediaFocusRequest?.id, isOpen]);

  useEffect(() => () => {
    stopSpeech();
    if (recordingTimerRef.current) window.clearInterval(recordingTimerRef.current);
    if (playbackTimerRef.current) window.clearTimeout(playbackTimerRef.current);
    if (callTimerRef.current) window.clearTimeout(callTimerRef.current);
    if (callDurationTimerRef.current) window.clearInterval(callDurationTimerRef.current);
    if (sentTimerRef.current) window.clearTimeout(sentTimerRef.current);
  }, []);

  if (!isOpen) return null;

  const speak = (content: string, onEnd?: () => void) => {
    speakText(content, { rate: 0.86, onEnd });
  };

  const selectContact = (contact: CommunicationContact) => {
    stopSpeech();
    if (playbackTimerRef.current) window.clearTimeout(playbackTimerRef.current);
    setPlayingMessageId(null);
    setPhotoMessage(null);
    setSelectedContactId(contact.id);
    setRecorderState("idle");
    setRecordingSeconds(0);
    setPlaybackFailedMessageId(null);
    window.setTimeout(() => {
      const firstUnread = timelineRef.current?.querySelector<HTMLElement>("[data-unread='true']");
      firstUnread?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const finishPlayback = (message: FamilyMessage) => {
    if (playbackTimerRef.current) window.clearTimeout(playbackTimerRef.current);
    playbackTimerRef.current = null;
    setPlayingMessageId(null);
    if (!isMessageViewed(message)) {
      setScenarioHeardMessageIds((current) => new Set(current).add(message.id));
      onMarkRead(message.id);
    }
  };

  const playMessage = (message: FamilyMessage, retry = false) => {
    if (playingMessageId) return;
    if (
      selectedContact.group === "service"
      && acceptanceScenario === "playback-failure"
      && !retry
    ) {
      setPlaybackFailedMessageId(message.id);
      return;
    }
    setPlaybackFailedMessageId(null);
    setPlayingMessageId(message.id);
    speak(message.content, () => finishPlayback(message));
    playbackTimerRef.current = window.setTimeout(() => finishPlayback(message), Math.max((message.duration ?? 5) * 900, 2600));
  };

  const openPhotoMessage = (message: FamilyMessage) => {
    setPhotoMessage(message);
    window.setTimeout(() => playMessage(message), 0);
  };

  const startCall = (mode: "video" | "voice") => {
    runOutgoingCall(selectedContact, mode);
  };

  const beginConnectedCall = () => {
    if (callTimerRef.current) window.clearTimeout(callTimerRef.current);
    callTimerRef.current = null;
    setCallState("connected");
    setCallSeconds(0);
    setIsMuted(false);
    setIsSpeakerOn(true);
    setIsCameraOn(true);
    if (callDurationTimerRef.current) window.clearInterval(callDurationTimerRef.current);
    callDurationTimerRef.current = window.setInterval(() => setCallSeconds((seconds) => seconds + 1), 1000);
  };

  const addCallRecord = (content: string, viewed = true) => {
    if (!callContact) return;
    onAddMessage({
      id: `CALL-LOCAL-${Date.now()}`,
      sender: viewed ? "您 (我)" : callContact.name,
      recipient: viewed ? callContact.name : undefined,
      avatar: callContact.avatar,
      type: "call_log",
      content,
      timestamp: "刚刚",
      played: viewed,
    });
  };

  const endConnectedCall = () => {
    addCallRecord(`${callMode === "video" ? "视频" : "语音"}通话 · 已接听 · ${formatSeconds(callSeconds)}`);
    closeCall();
  };

  const rejectIncomingCall = () => {
    addCallRecord(`${callMode === "video" ? "视频" : "语音"}通话 · 已拒绝`, false);
    closeCall();
  };

  const closeCall = () => {
    if (callTimerRef.current) window.clearTimeout(callTimerRef.current);
    if (callDurationTimerRef.current) window.clearInterval(callDurationTimerRef.current);
    callTimerRef.current = null;
    callDurationTimerRef.current = null;
    setCallState("idle");
    setCallContact(null);
  };

  const startRecording = () => {
    if (recordingTimerRef.current) window.clearInterval(recordingTimerRef.current);
    if (sentTimerRef.current) window.clearTimeout(sentTimerRef.current);
    setRecorderHighlighted(false);
    setRecordingSeconds(0);
    setRecorderState("recording");
    speak(`开始给${selectedContact.name}录制语音留言`);
    recordingTimerRef.current = window.setInterval(() => setRecordingSeconds((seconds) => seconds + 1), 1000);
  };

  const cancelRecording = () => {
    if (recordingTimerRef.current) window.clearInterval(recordingTimerRef.current);
    if (sentTimerRef.current) window.clearTimeout(sentTimerRef.current);
    recordingTimerRef.current = null;
    sentTimerRef.current = null;
    setRecordingSeconds(0);
    setRecorderState("idle");
  };

  const finishRecording = () => {
    if (recordingTimerRef.current) window.clearInterval(recordingTimerRef.current);
    recordingTimerRef.current = null;
    setRecordingSeconds((seconds) => Math.max(seconds, 1));
    setRecorderState("review");
  };

  const sendRecording = (retry = false) => {
    if (
      selectedContact.group === "service"
      && acceptanceScenario === "send-failure"
      && !retry
    ) {
      setRecorderState("failed");
      speak("语音发送失败，请重试");
      return;
    }
    const duration = Math.max(recordingSeconds, 1);
    setRecorderState("sending");
    if (sentTimerRef.current) window.clearTimeout(sentTimerRef.current);
    sentTimerRef.current = window.setTimeout(() => {
      const localMessageId = `MSG-LOCAL-${String(localMessageSequenceRef.current).padStart(3, "0")}`;
      localMessageSequenceRef.current += 1;
      onAddMessage({
        id: localMessageId,
        sender: "您 (我)",
        recipient: selectedContact.name,
        avatar: "https://picsum.photos/seed/grandfather/120/120",
        type: "voice",
        content: `给${selectedContact.name}的语音回复`,
        duration,
        timestamp: "刚刚",
        played: true,
        deliveryStatus: "delivered",
        elderViewedAt: null,
      });
      setRecorderState("sent");
      speak(`语音已发送给${selectedContact.name}`);
      sentTimerRef.current = window.setTimeout(() => {
        setRecordingSeconds(0);
        setRecorderState("idle");
      }, 2600);
    }, 650);
  };

  const renderContact = (contact: typeof contactsWithUnread[number]) => {
    const weather = contact.group === "family"
      ? getWeatherSummary(contact.weatherUserId ? familyWeatherByUserId.get(contact.weatherUserId) : undefined, elderTimeZone)
      : null;
    const contactSummary = contact.missedCalls > 0
      ? `${contact.missedCalls}次未接来电${contact.unread > 0 ? ` · ${contact.unread}条未读留言` : ""}`
      : contact.unread > 0 ? `${contact.unread}条新留言` : contact.group === "service"
        ? `${contact.relation} · ${contact.serviceHours?.replace("服务时间 ", "")}`
        : contact.detail;
    const weatherLabel = weather ? [weather.primary, weather.secondary].filter(Boolean).join("，") : "";

    return (
      <button
      key={contact.id}
      type="button"
      className={`communication-contact is-${contact.group} ${selectedContact.id === contact.id ? "is-selected" : ""}`}
      onClick={() => selectContact(contact)}
      aria-label={`${contact.name}，${weatherLabel ? `${weatherLabel}，` : ""}${contact.missedCalls > 0 ? `${contact.missedCalls}次未接来电，` : ""}${contact.unread > 0 ? `${contact.unread}条未读留言` : "没有未读留言"}`}
    >
      <span className="communication-contact__avatar">
        <img src={contact.avatar} alt="" referrerPolicy="no-referrer" />
      </span>
      <span className="communication-contact__copy">
        <strong>{contact.name}</strong>
        {contactSummary && <small className={contact.missedCalls > 0 ? "is-missed" : ""}>{contactSummary}</small>}
        {weather && (
          <span className={`communication-contact__weather is-${weather.state}`}>
            <WeatherGlyph state={weather.state} />
            <span><b>{weather.primary}</b>{weather.secondary && <em>{weather.secondary}</em>}</span>
          </span>
        )}
      </span>
      <span className="communication-contact__alerts">
        {contact.missedCalls > 0 && <b className="communication-contact__missed"><PhoneMissed aria-hidden="true" />未接 {contact.missedCalls}</b>}
        {contact.unread > 0 && <b className="communication-contact__badge" aria-label={`${contact.unread}条未读留言`}>{contact.unread}</b>}
      </span>
      </button>
    );
  };

  const selectedWeather = selectedContact.group === "family"
    ? getWeatherSummary(selectedContact.weatherUserId ? familyWeatherByUserId.get(selectedContact.weatherUserId) : undefined, elderTimeZone)
    : null;

  return (
    <main className="contacts-communication" aria-label="通讯录">
      <SecondaryPageHeader
        title="通讯录"
        icon={<Users aria-hidden="true" />}
        onBack={onClose}
      />

      <div className="contacts-communication__workspace">
        <aside className="communication-sidebar" aria-label="联系人列表">
          <section>
            <h3>亲情圈</h3>
            <div>
              {familyContacts.length > 0
                ? familyContacts.map(renderContact)
                : <div className="communication-family-empty"><UserPlus aria-hidden="true" /><strong>暂无已绑定家人</strong><span>可通过下方入口邀请家人</span></div>}
            </div>
            <button type="button" className="communication-invite-family" onClick={() => setIsFamilyInvitationOpen(true)}>
              <UserPlus aria-hidden="true" />
              邀请家人
            </button>
          </section>
          <section className="communication-contact-group--service">
            <h3>服务保障</h3>
            <div>{serviceContacts.map(renderContact)}</div>
          </section>
        </aside>

        <section className="communication-main" aria-label={`${selectedContact.name}的沟通记录`}>
          <header className="communication-main__header">
            <span className="communication-main__identity">
              <span className="communication-main__avatar"><img src={selectedContact.avatar} alt="" referrerPolicy="no-referrer" /></span>
              <span>
                <strong>{selectedContact.name}</strong>
                {selectedWeather && (
                  <span className={`communication-main__weather is-${selectedWeather.state}`}>
                    <WeatherGlyph state={selectedWeather.state} />
                    <span>
                      <b>{selectedWeather.primary}</b>
                      {selectedWeather.secondary && <em>{selectedWeather.secondary}</em>}
                    </span>
                  </span>
                )}
                {selectedContact.group === "service" && (
                  <span className="communication-main__service-meta">
                    <b>{selectedContact.relation}</b>
                    <em>{selectedContact.detail}</em>
                    <small><Clock3 aria-hidden="true" />{selectedContact.serviceHours}</small>
                    <small><Phone aria-hidden="true" />联系电话 {selectedContact.phone}</small>
                  </span>
                )}
              </span>
            </span>
            {selectedContact.group === "family" && (
              <div className="communication-call-actions">
                <button type="button" className="communication-call-secondary" onClick={() => startCall("voice")}><Phone aria-hidden="true" />语音通话</button>
                <button type="button" className="communication-call-primary" onClick={() => startCall("video")}><Video aria-hidden="true" />视频通话</button>
              </div>
            )}
          </header>

          <div className="communication-timeline" ref={timelineRef}>
            <div className="communication-timeline__label"><Clock3 aria-hidden="true" />{selectedContact.group === "service" ? "留言记录" : "通话与留言"}</div>
            {Array.from({ length: selectedMissedCallHistoryCount }, (_, index) => (
              <article key={`missed-${index}`} className="communication-message communication-call-history" data-unread={selectedContact.missedCalls > 0 ? "true" : "false"}>
                <img className="communication-message__avatar" src={selectedContact.avatar} alt="" referrerPolicy="no-referrer" />
                <div className="communication-message__body">
                  <div className="communication-message__meta">
                    <strong>{selectedContact.name}</strong>
                    <span>{index === 0 ? "刚刚" : `${index + 1}小时前`}</span>
                    <i>未接来电</i>
                  </div>
                  <div className="communication-call-history__content">
                    <span><PhoneMissed aria-hidden="true" /></span>
                    <p><strong>1次未接来电</strong><small>您没有接听</small></p>
                    <button type="button" onClick={() => startCall("voice")}><Phone aria-hidden="true" />回拨语音</button>
                  </div>
                </div>
              </article>
            ))}
            {selectedMessages.length === 0 && selectedMissedCallHistoryCount === 0 ? (
              <div className="communication-empty"><MessageCircleHeart aria-hidden="true" /><strong>还没有留言</strong><span>{selectedContact.group === "service" ? "可以在下方录制一段语音咨询。" : "可以直接打电话，或在下方给对方留段语音。"}</span></div>
            ) : selectedMessages.map((message) => {
              const isMine = message.sender === "您 (我)";
              const isPlaying = playingMessageId === message.id;
              const isViewed = isMessageViewed(message);
              return (
                <article
                  key={message.id}
                  className={`communication-message ${isMine ? "is-mine" : ""}${message.familyMediaId ? " is-family-media" : ""}${message.familyMediaId === highlightedFamilyMediaId ? " is-highlighted-family-media" : ""}`}
                  data-message-id={message.id}
                  data-family-media-id={message.familyMediaId}
                  data-service-unread-text={selectedContact.group === "service" && !isMine && message.type === "text" && !isViewed ? "true" : "false"}
                  data-unread={!isViewed && !isMine ? "true" : "false"}
                >
                  {!isMine && <img className="communication-message__avatar" src={selectedContact.group === "service" ? selectedContact.avatar : message.avatar || selectedContact.avatar} alt="" referrerPolicy="no-referrer" />}
                  <div className="communication-message__body">
                    <div className="communication-message__meta">
                      <strong>{isMine ? "您发送的留言" : selectedContact.name}</strong>
                      <span>{message.timestamp}</span>
                      {!isViewed && !isMine && <i>{message.type === "voice" ? "未听" : "未查看"}</i>}
                      {isMine && <i className="is-sent">已发送</i>}
                    </div>

                    {message.type === "call_log" ? (
                      <div className="communication-call-log"><Phone aria-hidden="true" /><strong>{message.content}</strong></div>
                    ) : message.type === "photo" && message.photoUrl ? (
                      <button
                        type="button"
                        className="communication-photo-message"
                        onClick={() => {
                          if (message.familyMediaId && onOpenFamilyMedia) {
                            onFamilyMediaViewed?.(message.familyMediaId);
                            onOpenFamilyMedia(message.familyMediaId);
                            return;
                          }
                          openPhotoMessage(message);
                        }}
                      >
                        <img src={message.photoUrl} alt={message.content} />
                        <span>{message.familyMediaType === "video" ? <Video aria-hidden="true" /> : <Image aria-hidden="true" />}{message.familyMediaId ? "查看家庭影像" : "点一下看大图并听留言"}</span>
                        <p>{message.content}</p>
                      </button>
                    ) : message.type === "text" ? (
                      <div className="communication-text-message">
                        <p>{message.content}</p>
                        <button type="button" onClick={() => playMessage(message)} disabled={playingMessageId !== null}>
                          {isPlaying ? <Lottie animationData={voiceWaveAnimation} loop className="communication-message-wave" /> : <Volume2 aria-hidden="true" />}
                          {isPlaying ? "正在朗读" : isViewed ? "再听一次" : "听留言"}
                        </button>
                      </div>
                    ) : (
                      <div className="communication-voice-message">
                        <p>{message.content}</p>
                        {message.loadFailed ? (
                          <div className="communication-message-error is-delivery-failed" role="status">
                            <CircleAlert aria-hidden="true" />
                            <span>发送失败，语音未送达</span>
                          </div>
                        ) : (
                          <button type="button" onClick={() => playMessage(message)} disabled={playingMessageId !== null}>
                            {isPlaying ? <Lottie animationData={voiceWaveAnimation} loop className="communication-message-wave" /> : <Volume2 aria-hidden="true" />}
                            {isPlaying ? "正在播放留言" : isViewed ? "再听一次" : "播放语音"}
                          </button>
                        )}
                        {playbackFailedMessageId === message.id && (
                          <div className="communication-message-error" role="alert">
                            <CircleAlert aria-hidden="true" />
                            <span>语音暂时无法播放</span>
                            <button type="button" onClick={() => playMessage(message, true)}>重试</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          <footer className={`communication-recorder is-${recorderState} ${recorderHighlighted ? "is-highlighted" : ""}`}>
            {recorderState === "idle" && (
              <button type="button" onClick={startRecording}><Mic aria-hidden="true" /><span><strong>点一下开始录制语音留言</strong><small>不用一直按住，录好后再确认发送</small></span></button>
            )}
            {recorderState === "recording" && (
              <div className="communication-recorder__active">
                <span className="communication-recorder__wave" aria-label="正在录音">{[20, 38, 56, 31, 64, 44, 24, 52, 35].map((height, index) => <i key={index} style={{ height }} />)}</span>
                <strong>{formatSeconds(recordingSeconds)}</strong>
                <button type="button" onClick={finishRecording}><Check aria-hidden="true" />完成录制</button>
                <button type="button" onClick={cancelRecording}><X aria-hidden="true" />取消</button>
              </div>
            )}
            {recorderState === "review" && (
              <div className="communication-recorder__review">
                <span><Volume2 aria-hidden="true" /><strong>已录制 {formatSeconds(recordingSeconds)}</strong></span>
                <button type="button" onClick={() => sendRecording()}><Send aria-hidden="true" />确认发送</button>
                <button type="button" onClick={startRecording}><RotateCcw aria-hidden="true" />重新录制</button>
                <button type="button" onClick={cancelRecording}><X aria-hidden="true" />取消</button>
              </div>
            )}
            {recorderState === "sending" && (
              <div className="communication-recorder__sent is-sending"><Send aria-hidden="true" /><strong>正在发送语音…</strong></div>
            )}
            {recorderState === "sent" && (
              <div className="communication-recorder__sent"><CheckCircle2 aria-hidden="true" /><strong>语音已发送给{selectedContact.name}</strong></div>
            )}
            {recorderState === "failed" && (
              <div className="communication-recorder__failed" role="alert">
                <CircleAlert aria-hidden="true" />
                <span><strong>语音发送失败</strong><small>录音已保留，可以直接重试</small></span>
                <button type="button" onClick={() => sendRecording(true)}><RotateCcw aria-hidden="true" />重试</button>
                <button type="button" onClick={cancelRecording}>取消</button>
              </div>
            )}
          </footer>
        </section>
      </div>

      {photoMessage && (
        <section className="communication-photo-viewer" role="dialog" aria-modal="true" aria-label="查看照片留言">
          <img src={photoMessage.photoUrl} alt={photoMessage.content} />
          <div className="communication-photo-viewer__shade" />
          <button type="button" className="communication-photo-viewer__close" onClick={() => { stopSpeech(); setPhotoMessage(null); setPlayingMessageId(null); }}><X aria-hidden="true" />收起</button>
          <div className="communication-photo-viewer__caption">
            <p>“{photoMessage.content}”</p>
            <span>{playingMessageId === photoMessage.id ? <Lottie animationData={voiceWaveAnimation} loop /> : <Volume2 aria-hidden="true" />}{playingMessageId === photoMessage.id ? "正在播放家属留言…" : "留言已播放"}</span>
            <button type="button" onClick={() => playMessage(photoMessage)} disabled={playingMessageId !== null}><RotateCcw aria-hidden="true" />重新播放</button>
          </div>
        </section>
      )}

      {callState !== "idle" && callContact && (
        <section className="communication-call-overlay" role="dialog" aria-modal="true" aria-label={`正在呼叫${callContact.name}`}>
          <button type="button" className="communication-call-overlay__close" onClick={closeCall}><X aria-hidden="true" /></button>
          <img src={callContact.avatar} alt="" referrerPolicy="no-referrer" />
          {callState === "incoming" ? (
            <div className="communication-incoming-call">
              <h2>{callContact.name}正在呼叫您</h2>
              <p>{callMode === "video" ? "视频通话" : "语音通话"}</p>
              <div><button type="button" className="is-reject" onClick={rejectIncomingCall}><PhoneOff aria-hidden="true" />拒绝</button><button type="button" className="is-accept" onClick={beginConnectedCall}><Phone aria-hidden="true" />接听</button></div>
            </div>
          ) : callState === "dialing" ? (
            <>
              <span className="communication-call-pulse" aria-hidden="true" />
              <h2>正在呼叫{callContact.name}…</h2>
              <p>{callMode === "video" ? "视频通话" : "语音通话"} · 正在等待对方接听</p>
              <button type="button" className="communication-hangup" onClick={closeCall}><PhoneOff aria-hidden="true" />取消呼叫</button>
            </>
          ) : callState === "connected" ? (
            <div className="communication-connected-call">
              <h2>正在与{callContact.name}通话</h2>
              <p>{callMode === "video" ? "视频通话" : "语音通话"} · {formatSeconds(callSeconds)}</p>
              <div className="communication-call-controls">
                <button type="button" className={isMuted ? "is-active" : ""} onClick={() => setIsMuted((value) => !value)}>{isMuted ? <MicOff aria-hidden="true" /> : <Mic aria-hidden="true" />}<span>{isMuted ? "取消静音" : "静音"}</span></button>
                <button type="button" className={isSpeakerOn ? "is-active" : ""} onClick={() => setIsSpeakerOn((value) => !value)}><Volume2 aria-hidden="true" /><span>扬声器</span></button>
                {callMode === "video" && <button type="button" className={!isCameraOn ? "is-active" : ""} onClick={() => setIsCameraOn((value) => !value)}>{isCameraOn ? <Video aria-hidden="true" /> : <VideoOff aria-hidden="true" />}<span>{isCameraOn ? "关闭画面" : "打开画面"}</span></button>}
                <button type="button" className="is-hangup" onClick={endConnectedCall}><PhoneOff aria-hidden="true" /><span>结束通话</span></button>
              </div>
            </div>
          ) : (
            <div className="communication-call-fallback">
              <h2>对方暂时无人接听</h2>
              <p>本次呼叫已自动结束</p>
              <button type="button" onClick={closeCall}>返回会话</button>
            </div>
          )}
        </section>
      )}

      <FamilyInvitationModal
        isOpen={isFamilyInvitationOpen}
        onClose={() => setIsFamilyInvitationOpen(false)}
      />
    </main>
  );
}
