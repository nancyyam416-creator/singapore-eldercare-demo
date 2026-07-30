import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BadgeCheck,
  Check,
  ChevronLeft,
  Headphones,
  Pause,
  RotateCcw,
  ShieldAlert,
  Users,
  Volume2,
  WifiOff,
} from "lucide-react";
import type { AntiScamTip } from "../types";
import SecondaryPageHeader from "./SecondaryPageHeader";
import "./security-information-page.css";

interface SecurityInformationPageProps {
  isOpen: boolean;
  autoPlayFeatured?: boolean;
  tips: AntiScamTip[];
  readIds: string[];
  onRead: (tipId: string) => void;
  onClose: () => void;
  onContactFamily: () => void;
}

interface SpeechChunk {
  text: string;
  paragraphIndex: number;
}

const getParagraphs = (content: string) => content
  .split(/\n\s*\n/)
  .map((paragraph) => paragraph.trim())
  .filter(Boolean);

const getReadingMinutes = (tip: AntiScamTip) => Math.max(
  1,
  Math.ceil(`${tip.title}${tip.summary ?? ""}${tip.description}`.length / 260),
);

const buildSpeechChunks = (tip: AntiScamTip): SpeechChunk[] => {
  const paragraphs = [
    tip.title,
    ...(tip.summary ? [tip.summary] : []),
    ...getParagraphs(tip.description),
  ];

  return paragraphs.flatMap((paragraph, paragraphIndex) => {
    const sentences = paragraph.match(/[^。！？；]+[。！？；]?/g) ?? [paragraph];
    const chunks: string[] = [];
    let current = "";

    sentences.forEach((sentence) => {
      if (current && current.length + sentence.length > 140) {
        chunks.push(current);
        current = sentence;
      } else {
        current += sentence;
      }
    });
    if (current) chunks.push(current);

    return chunks.map((text) => ({ text, paragraphIndex }));
  });
};

export default function SecurityInformationPage({
  isOpen,
  autoPlayFeatured = false,
  tips,
  readIds,
  onRead,
  onClose,
  onContactFamily,
}: SecurityInformationPageProps) {
  const [selectedTipId, setSelectedTipId] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speechProgress, setSpeechProgress] = useState({ current: 0, total: 0, paragraphIndex: -1 });
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const speechSessionRef = useRef(0);
  const autoPlayedRef = useRef(false);
  const selectedTip = useMemo(
    () => tips.find((tip) => tip.id === selectedTipId) ?? null,
    [selectedTipId, tips],
  );
  const unreadCount = tips.filter((tip) => !readIds.includes(tip.id)).length;
  const selectedParagraphs = selectedTip ? getParagraphs(selectedTip.description) : [];

  const stopSpeaking = useCallback(() => {
    speechSessionRef.current += 1;
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    setSpeechProgress({ current: 0, total: 0, paragraphIndex: -1 });
  }, []);

  const startSpeaking = useCallback((tip: AntiScamTip) => {
    onRead(tip.id);
    if (!("speechSynthesis" in window)) return;

    const chunks = buildSpeechChunks(tip);
    const sessionId = speechSessionRef.current + 1;
    speechSessionRef.current = sessionId;
    window.speechSynthesis.cancel();
    setIsSpeaking(true);
    setIsPaused(false);

    const playChunk = (index: number) => {
      if (speechSessionRef.current !== sessionId) return;
      if (index >= chunks.length) {
        setIsSpeaking(false);
        setIsPaused(false);
        setSpeechProgress({ current: chunks.length, total: chunks.length, paragraphIndex: -1 });
        return;
      }

      const chunk = chunks[index];
      setSpeechProgress({
        current: index + 1,
        total: chunks.length,
        paragraphIndex: chunk.paragraphIndex - (tip.summary ? 2 : 1),
      });
      const utterance = new SpeechSynthesisUtterance(chunk.text);
      utterance.lang = "zh-CN";
      utterance.rate = 0.86;
      utterance.volume = 1;
      utterance.onend = () => playChunk(index + 1);
      utterance.onerror = () => {
        setIsSpeaking(false);
        setIsPaused(false);
      };
      window.speechSynthesis.speak(utterance);
    };

    playChunk(0);
  }, [onRead]);

  const openTip = useCallback((tip: AntiScamTip, shouldSpeak = false) => {
    stopSpeaking();
    setSelectedTipId(tip.id);
    onRead(tip.id);
    if (shouldSpeak) window.setTimeout(() => startSpeaking(tip), 120);
  }, [onRead, startSpeaking, stopSpeaking]);

  const toggleSpeaking = () => {
    if (!selectedTip) return;
    if (!isSpeaking) {
      startSpeaking(selectedTip);
      return;
    }
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } else {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      autoPlayedRef.current = false;
      stopSpeaking();
      setSelectedTipId(null);
      return;
    }
    if (autoPlayFeatured && tips[0] && !autoPlayedRef.current) {
      autoPlayedRef.current = true;
      openTip(tips[0], true);
    }
  }, [autoPlayFeatured, isOpen, openTip, stopSpeaking, tips]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  if (!isOpen) return null;

  return (
    <main className="security-information-page" aria-label="安全资讯">
      <SecondaryPageHeader
        title="安全资讯"
        icon={<ShieldAlert aria-hidden="true" />}
        onBack={onClose}
        actions={(
          <div className="security-information-summary">
            <strong>{unreadCount > 0 ? `${unreadCount} 条未读` : "全部已阅读"}</strong>
            <span>内容来自可信机构</span>
          </div>
        )}
      />

      {!selectedTip ? (
        <div className="security-information-list-view">
          <section className="security-information-intro">
            <div>
              <BadgeCheck aria-hidden="true" />
              <div>
                <h2>安全资讯</h2>
                <p>选择一条查看，或者按“听一听”大声朗读</p>
              </div>
            </div>
            {!isOnline && (
              <p className="security-information-offline" role="status">
                <WifiOff aria-hidden="true" />
                当前离线，已缓存内容仍可查看
              </p>
            )}
          </section>

          <div className="security-information-list">
            {tips.map((tip) => {
              const hasRead = readIds.includes(tip.id);
              return (
                <article key={tip.id} className={`security-information-card${hasRead ? " is-read" : ""}`}>
                  <button
                    type="button"
                    className="security-information-card__main"
                    onClick={() => openTip(tip)}
                    aria-label={`${tip.title}，${hasRead ? "已阅读" : "未读"}，打开查看`}
                  >
                    <span className="security-information-card__icon" aria-hidden="true">
                      {tip.coverUrl
                        ? <img src={tip.coverUrl} alt="" referrerPolicy="no-referrer" />
                        : <ShieldAlert />}
                    </span>
                    <span className="security-information-card__copy">
                      <span className="security-information-card__meta">
                        <i>{tip.category}</i>
                        {hasRead && <b><Check aria-hidden="true" />已阅读</b>}
                      </span>
                      <strong>{tip.title}</strong>
                      <small>{tip.summary ?? tip.description}</small>
                      <span className="security-information-card__source">
                        {tip.source} · 预计朗读 {getReadingMinutes(tip)} 分钟
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    className="security-information-card__listen"
                    onClick={() => openTip(tip, true)}
                  >
                    <Headphones aria-hidden="true" />
                    听一听
                  </button>
                </article>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="security-information-detail-view">
          <button
            type="button"
            className="security-information-back-list"
            onClick={() => {
              stopSpeaking();
              setSelectedTipId(null);
            }}
          >
            <ChevronLeft aria-hidden="true" />
            返回安全资讯列表
          </button>

          <article className="security-information-article">
            <header>
              <div className="security-information-article__meta">
                <span>{selectedTip.category}</span>
                <em><Check aria-hidden="true" />已阅读</em>
              </div>
              <h2>{selectedTip.title}</h2>
              <p className="security-information-article__source">
                来源：{selectedTip.source} · 预计朗读 {getReadingMinutes(selectedTip)} 分钟
              </p>
              {selectedTip.summary && (
                <p className="security-information-article__summary">
                  <ShieldAlert aria-hidden="true" />
                  {selectedTip.summary}
                </p>
              )}
            </header>

            <section className="security-information-article__body" aria-label="资讯正文">
              {selectedParagraphs.map((paragraph, index) => (
                <p
                  key={`${selectedTip.id}-${index}`}
                  className={speechProgress.paragraphIndex === index ? "is-speaking" : ""}
                >
                  {paragraph}
                </p>
              ))}
            </section>
          </article>

          <div className="security-information-detail-actions">
            <div className="security-information-speech-status" aria-live="polite">
              <span className={isSpeaking && !isPaused ? "is-active" : ""} aria-hidden="true">
                <i /><i /><i /><i />
              </span>
              <div>
                <strong>{isPaused ? "播报已暂停" : isSpeaking ? "正在为您朗读" : "可以大声念给您听"}</strong>
                <small>
                  {speechProgress.total > 0
                    ? `播报进度 ${speechProgress.current} / ${speechProgress.total}`
                    : `预计 ${getReadingMinutes(selectedTip)} 分钟`}
                </small>
              </div>
            </div>
            <button type="button" className="is-listen" onClick={toggleSpeaking}>
              {isSpeaking && !isPaused ? <Pause aria-hidden="true" /> : <Volume2 aria-hidden="true" />}
              {isSpeaking && !isPaused ? "暂停播报" : isPaused ? "继续播报" : "大声念给我听"}
            </button>
            <button type="button" onClick={() => startSpeaking(selectedTip)}>
              <RotateCcw aria-hidden="true" />
              从头听一遍
            </button>
            {selectedTip.contactLabel && (
              <button type="button" onClick={onContactFamily}>
                <Users aria-hidden="true" />
                {selectedTip.contactLabel}
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
