import React, { useEffect, useMemo, useRef, useState } from "react";
import Lottie from "lottie-react";
import {
  Check,
  CheckCircle2,
  Clock3,
  Image,
  MessageCircleHeart,
  Mic,
  Phone,
  PhoneOff,
  RotateCcw,
  UserPlus,
  Users,
  Video,
  Volume2,
  X,
} from "lucide-react";
import voiceWaveAnimation from "../animations/voiceWave";
import { speakText, stopSpeech } from "../audio/speech";
import type { FamilyMessage } from "../types";
import FamilyInvitationModal from "./FamilyInvitationModal";
import SecondaryPageHeader from "./SecondaryPageHeader";
import "./contacts-communication.css";

interface ContactsCommunicationPageProps {
  isOpen: boolean;
  onClose: () => void;
  hasBoundFamily?: boolean;
  messages: FamilyMessage[];
  onAddMessage: (message: FamilyMessage) => void;
  onMarkRead: (messageId: string) => void;
}

interface CommunicationContact {
  id: string;
  name: string;
  relation: string;
  avatar: string;
  group: "family" | "service";
  online: boolean;
  contactHint: string;
}

type RecorderState = "idle" | "recording" | "sent";
type CallState = "idle" | "dialing" | "fallback";

const CONTACTS: CommunicationContact[] = [
  {
    id: "daughter",
    name: "女儿小敏",
    relation: "女儿",
    avatar: "https://picsum.photos/seed/xiaomin/240/240",
    group: "family",
    online: true,
    contactHint: "当前可联系",
  },
  {
    id: "son",
    name: "儿子小刚",
    relation: "儿子",
    avatar: "https://picsum.photos/seed/xiaogang/240/240",
    group: "family",
    online: true,
    contactHint: "当前可联系",
  },
  {
    id: "nurse",
    name: "专属健康管家",
    relation: "王护士",
    avatar: "https://picsum.photos/seed/nurse/240/240",
    group: "service",
    online: true,
    contactHint: "工作时间在线",
  },
  {
    id: "community",
    name: "社区服务站",
    relation: "清华园社区",
    avatar: "https://picsum.photos/seed/community-center/240/240",
    group: "service",
    online: false,
    contactHint: "服务时间 08:00–18:00",
  },
];

const formatSeconds = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
};

export default function ContactsCommunicationPage({
  isOpen,
  onClose,
  hasBoundFamily = true,
  messages,
  onAddMessage,
  onMarkRead,
}: ContactsCommunicationPageProps) {
  const [selectedContactId, setSelectedContactId] = useState("daughter");
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [photoMessage, setPhotoMessage] = useState<FamilyMessage | null>(null);
  const [recorderState, setRecorderState] = useState<RecorderState>("idle");
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recorderHighlighted, setRecorderHighlighted] = useState(false);
  const [callState, setCallState] = useState<CallState>("idle");
  const [callMode, setCallMode] = useState<"video" | "voice">("video");
  const [callContact, setCallContact] = useState<CommunicationContact | null>(null);
  const [isFamilyInvitationOpen, setIsFamilyInvitationOpen] = useState(false);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const recordingTimerRef = useRef<number | null>(null);
  const playbackTimerRef = useRef<number | null>(null);
  const callTimerRef = useRef<number | null>(null);
  const sentTimerRef = useRef<number | null>(null);

  const contactsWithUnread = useMemo(() => CONTACTS.map((contact, index) => {
    const unread = messages.filter((message) => message.sender === contact.name && !message.played).length;
    return { ...contact, unread, originalIndex: index };
  }), [messages]);

  const visibleContacts = useMemo(
    () => hasBoundFamily ? contactsWithUnread : contactsWithUnread.filter((contact) => contact.group !== "family"),
    [contactsWithUnread, hasBoundFamily],
  );

  const familyContacts = useMemo(() => visibleContacts
    .filter((contact) => contact.group === "family")
    .sort((first, second) => second.unread - first.unread || first.originalIndex - second.originalIndex), [visibleContacts]);
  const serviceContacts = useMemo(() => visibleContacts.filter((contact) => contact.group === "service"), [visibleContacts]);
  const selectedContact = visibleContacts.find((contact) => contact.id === selectedContactId) ?? visibleContacts[0];
  const selectedMessages = messages.filter((message) =>
    message.sender === selectedContact.name || (message.sender === "您 (我)" && message.recipient === selectedContact.name)
  );

  useEffect(() => () => {
    stopSpeech();
    if (recordingTimerRef.current) window.clearInterval(recordingTimerRef.current);
    if (playbackTimerRef.current) window.clearTimeout(playbackTimerRef.current);
    if (callTimerRef.current) window.clearTimeout(callTimerRef.current);
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
    speak(`已切换到${contact.name}`);
    window.setTimeout(() => {
      const firstUnread = timelineRef.current?.querySelector<HTMLElement>("[data-unread='true']");
      firstUnread?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const finishPlayback = (message: FamilyMessage) => {
    if (playbackTimerRef.current) window.clearTimeout(playbackTimerRef.current);
    playbackTimerRef.current = null;
    setPlayingMessageId(null);
    if (!message.played) onMarkRead(message.id);
  };

  const playMessage = (message: FamilyMessage) => {
    if (playingMessageId) return;
    setPlayingMessageId(message.id);
    speak(message.content, () => finishPlayback(message));
    playbackTimerRef.current = window.setTimeout(() => finishPlayback(message), Math.max((message.duration ?? 5) * 900, 2600));
  };

  const openPhotoMessage = (message: FamilyMessage) => {
    setPhotoMessage(message);
    window.setTimeout(() => playMessage(message), 0);
  };

  const startCall = (mode: "video" | "voice") => {
    setCallContact(selectedContact);
    setCallMode(mode);
    setCallState("dialing");
    speak(`正在呼叫${selectedContact.name}`);
    if (callTimerRef.current) window.clearTimeout(callTimerRef.current);
    callTimerRef.current = window.setTimeout(() => {
      setCallState("fallback");
      speak(`${selectedContact.name}可能在忙，要不要给${selectedContact.relation === "儿子" ? "他" : "她"}留个语音？`);
    }, 30_000);
  };

  const closeCall = () => {
    if (callTimerRef.current) window.clearTimeout(callTimerRef.current);
    callTimerRef.current = null;
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
    recordingTimerRef.current = null;
    setRecordingSeconds(0);
    setRecorderState("idle");
  };

  const sendRecording = () => {
    if (recordingTimerRef.current) window.clearInterval(recordingTimerRef.current);
    recordingTimerRef.current = null;
    const duration = Math.max(recordingSeconds, 1);
    onAddMessage({
      id: `communication-voice-${Date.now()}`,
      sender: "您 (我)",
      recipient: selectedContact.name,
      avatar: "https://picsum.photos/seed/grandfather/120/120",
      type: "voice",
      content: `给${selectedContact.name}的语音留言`,
      duration,
      timestamp: "刚刚",
      played: true,
    });
    setRecorderState("sent");
    speak(`语音已发送给${selectedContact.name}`);
    sentTimerRef.current = window.setTimeout(() => {
      setRecordingSeconds(0);
      setRecorderState("idle");
    }, 2600);
  };

  const leaveVoiceAfterMissedCall = () => {
    closeCall();
    setRecorderHighlighted(true);
    window.setTimeout(startRecording, 160);
  };

  const renderContact = (contact: typeof contactsWithUnread[number]) => (
    <button
      key={contact.id}
      type="button"
      className={`communication-contact ${selectedContact.id === contact.id ? "is-selected" : ""}`}
      onClick={() => selectContact(contact)}
      aria-label={`${contact.name}，${contact.unread > 0 ? `${contact.unread}条未读留言` : "没有未读留言"}`}
    >
      <span className="communication-contact__avatar">
        <img src={contact.avatar} alt="" referrerPolicy="no-referrer" />
        <i className={contact.online ? "is-online" : ""} aria-label={contact.online ? "当前可联系" : "暂时离线"} />
      </span>
      <span className="communication-contact__copy">
        <strong>{contact.name}</strong>
        <small>{contact.unread > 0 ? `${contact.unread}条未读留言` : contact.contactHint}</small>
      </span>
      {contact.unread > 0 && <b className="communication-contact__badge">{contact.unread}</b>}
    </button>
  );

  return (
    <main className="contacts-communication" aria-label="通讯录">
      <SecondaryPageHeader
        title="通讯录"
        icon={<Users aria-hidden="true" />}
        onBack={onClose}
        actions={(
          <button type="button" className="communication-invite-family" onClick={() => setIsFamilyInvitationOpen(true)}>
            <UserPlus aria-hidden="true" />
            邀请家人
          </button>
        )}
      />

      <div className="contacts-communication__workspace">
        <aside className="communication-sidebar" aria-label="联系人列表">
          <div className="communication-sidebar__title"><Users aria-hidden="true" /><h2>联系人</h2></div>
          <section>
            <h3>亲情圈</h3>
            <div>
              {familyContacts.length > 0
                ? familyContacts.map(renderContact)
                : <div className="communication-family-empty"><UserPlus aria-hidden="true" /><strong>暂无已绑定家人</strong><span>点击右上角“邀请家人”开始绑定</span></div>}
            </div>
          </section>
          <section className="communication-contact-group--service">
            <h3>服务保障</h3>
            <div>{serviceContacts.map(renderContact)}</div>
          </section>
        </aside>

        <section className="communication-main" aria-label={`${selectedContact.name}的沟通记录`}>
          <header className="communication-main__header">
            <span className="communication-main__identity">
              <span className="communication-main__avatar"><img src={selectedContact.avatar} alt="" referrerPolicy="no-referrer" /><i className={selectedContact.online ? "is-online" : ""} /></span>
              <span><strong>{selectedContact.name}</strong><small>{selectedContact.relation} · {selectedContact.contactHint}</small></span>
            </span>
            <div className="communication-call-actions">
              <button type="button" className="communication-call-secondary" onClick={() => startCall("voice")}><Phone aria-hidden="true" />语音通话</button>
              <button type="button" className="communication-call-primary" onClick={() => startCall("video")}><Video aria-hidden="true" />视频通话</button>
            </div>
          </header>

          <div className="communication-timeline" ref={timelineRef}>
            <div className="communication-timeline__label"><Clock3 aria-hidden="true" />沟通与留言</div>
            {selectedMessages.length === 0 ? (
              <div className="communication-empty"><MessageCircleHeart aria-hidden="true" /><strong>还没有留言</strong><span>可以直接打电话，或在下方给对方留段语音。</span></div>
            ) : selectedMessages.map((message) => {
              const isMine = message.sender === "您 (我)";
              const isPlaying = playingMessageId === message.id;
              return (
                <article key={message.id} className={`communication-message ${isMine ? "is-mine" : ""}`} data-unread={!message.played && !isMine ? "true" : "false"}>
                  {!isMine && <img className="communication-message__avatar" src={message.avatar || selectedContact.avatar} alt="" referrerPolicy="no-referrer" />}
                  <div className="communication-message__body">
                    <div className="communication-message__meta">
                      <strong>{isMine ? "您发送的留言" : selectedContact.name}</strong>
                      <span>{message.timestamp}</span>
                      {!message.played && !isMine && <i>未读</i>}
                    </div>

                    {message.type === "photo" && message.photoUrl ? (
                      <button type="button" className="communication-photo-message" onClick={() => openPhotoMessage(message)}>
                        <img src={message.photoUrl} alt={message.content} />
                        <span><Image aria-hidden="true" />点一下看大图并听留言</span>
                        <p>{message.content}</p>
                      </button>
                    ) : (
                      <div className="communication-voice-message">
                        <p>{message.content}</p>
                        <button type="button" onClick={() => playMessage(message)} disabled={playingMessageId !== null}>
                          {isPlaying ? <Lottie animationData={voiceWaveAnimation} loop className="communication-message-wave" /> : <Volume2 aria-hidden="true" />}
                          {isPlaying ? "正在播放留言" : message.played ? "再听一次" : "播放语音"}
                        </button>
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
                <button type="button" onClick={sendRecording}><Check aria-hidden="true" />完成并发送</button>
                <button type="button" onClick={cancelRecording}><X aria-hidden="true" />取消</button>
              </div>
            )}
            {recorderState === "sent" && (
              <div className="communication-recorder__sent"><CheckCircle2 aria-hidden="true" /><strong>语音已发送给{selectedContact.name}</strong></div>
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
          {callState === "dialing" ? (
            <>
              <span className="communication-call-pulse" aria-hidden="true" />
              <h2>正在呼叫{callContact.name}…</h2>
              <p>{callMode === "video" ? "视频通话" : "语音通话"} · 正在等待对方接听</p>
              <button type="button" className="communication-hangup" onClick={closeCall}><PhoneOff aria-hidden="true" />取消呼叫</button>
            </>
          ) : (
            <div className="communication-call-fallback">
              <h2>{callContact.name}可能在忙</h2>
              <p>要不要给{callContact.relation === "儿子" ? "他" : "她"}留个语音？</p>
              <button type="button" onClick={leaveVoiceAfterMissedCall}><Mic aria-hidden="true" />现在留语音</button>
              <button type="button" onClick={closeCall}>稍后再说</button>
            </div>
          )}
        </section>
      )}

      <FamilyInvitationModal
        isOpen={isFamilyInvitationOpen}
        onClose={() => setIsFamilyInvitationOpen(false)}
        elderName="王建国"
      />
    </main>
  );
}
