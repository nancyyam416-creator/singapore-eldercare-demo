/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  CheckCheck,
  ChevronRight,
  CircleAlert,
  Eye,
  Heart,
  ImagePlus,
  Images,
  MessageCircle,
  Mic,
  Pause,
  Phone,
  Play,
  RefreshCw,
  Send,
  Square,
  X
} from 'lucide-react';
import { FamilyConversation, FamilyMessage, FamilyMessageScenario, FamilyPhotoScenario, PublishedPhotoBatch } from '../types';

export type FamilySection = 'messages' | 'photos';

interface H5FamilyTabProps {
  conversations: FamilyConversation[];
  messages: FamilyMessage[];
  photoBatches: PublishedPhotoBatch[];
  activeSection: FamilySection;
  messageScenario: FamilyMessageScenario;
  photoScenario: FamilyPhotoScenario;
  initialConversationId?: string | null;
  onSectionChange: (section: FamilySection) => void;
  onMessagesChange: React.Dispatch<React.SetStateAction<FamilyMessage[]>>;
  onOpenPhotoShare: () => void;
  onContactElder: () => void;
}

type PlaybackState = 'idle' | 'playing' | 'paused' | 'completed' | 'failed';

const formatTime = (utc: string) => new Intl.DateTimeFormat('zh-CN', {
  month: 'numeric',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
}).format(new Date(utc));

const formatBubbleTime = (utc: string) => new Intl.DateTimeFormat('zh-CN', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
}).format(new Date(utc));

const isIncomingUnread = (message: FamilyMessage) => message.sender === 'elder' && message.status === 'delivered';

const feedbackMeta = {
  published: { label: '已发布', className: 'bg-blue-50 text-blue-700', icon: CheckCheck },
  viewed: { label: '已查看', className: 'bg-violet-50 text-violet-700', icon: Eye },
  liked: { label: '已查看并点赞', className: 'bg-rose-50 text-rose-700', icon: Heart }
} as const;

const describeMediaCount = (batch: PublishedPhotoBatch) => {
  const photoCount = batch.items.filter(item => item.type === 'photo').length;
  const videoCount = batch.items.length - photoCount;
  return [photoCount ? `${photoCount}张` : '', videoCount ? `${videoCount}段视频` : ''].filter(Boolean).join(' · ');
};

const deliveryLabel = (message: FamilyMessage) => {
  if (message.status === 'sending') return '发送中…';
  if (message.status === 'failed') return '发送失败';
  if (message.status === 'viewed') return '老人已查看';
  if (message.status === 'listened') return '老人已听';
  return '已送达';
};

export const H5FamilyTab: React.FC<H5FamilyTabProps> = ({
  conversations,
  messages,
  photoBatches,
  activeSection,
  messageScenario,
  photoScenario,
  initialConversationId,
  onSectionChange,
  onMessagesChange,
  onOpenPhotoShare,
  onContactElder
}) => {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(conversations[0]?.id ?? null);
  const [selectedPhotoBatch, setSelectedPhotoBatch] = useState<PublishedPhotoBatch | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [photoListRetryRecovered, setPhotoListRetryRecovered] = useState(false);
  const [draft, setDraft] = useState('');
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(1);
  const [playbackStates, setPlaybackStates] = useState<Record<string, PlaybackState>>({});
  const [activeVoiceId, setActiveVoiceId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recordingRef = useRef(false);

  const activeConversations = useMemo(() => {
    if (messageScenario !== 'multi_elder') return conversations.slice(0, 1);
    return conversations;
  }, [conversations, messageScenario]);

  useEffect(() => {
    if (initialConversationId) setSelectedConversationId(initialConversationId);
  }, [initialConversationId]);

  useEffect(() => {
    if (messageScenario === 'multi_elder') setSelectedConversationId(null);
    else setSelectedConversationId(conversations[0]?.id ?? null);
    setDraft('');
    setPlaybackStates({});
    setActiveVoiceId(null);
  }, [messageScenario, conversations]);

  useEffect(() => setPhotoListRetryRecovered(false), [photoScenario]);

  useEffect(() => {
    if (!recording) return;
    const timer = window.setInterval(() => setRecordingSeconds(value => Math.min(value + 1, 60)), 1000);
    return () => window.clearInterval(timer);
  }, [recording]);

  useEffect(() => {
    if (!activeVoiceId || playbackStates[activeVoiceId] !== 'playing') return;
    const timer = window.setTimeout(() => {
      setPlaybackStates(current => ({ ...current, [activeVoiceId]: 'completed' }));
      onMessagesChange(current => current.map(message => message.id === activeVoiceId && message.sender === 'elder' ? { ...message, status: 'listened' } : message));
    }, 2200);
    return () => window.clearTimeout(timer);
  }, [activeVoiceId, playbackStates, onMessagesChange]);

  const visibleMessages = useMemo(() => {
    if (!selectedConversationId || messageScenario === 'empty') return [];
    return messages
      .filter(message => message.conversationId === selectedConversationId)
      .sort((left, right) => new Date(left.sentAtUtc).getTime() - new Date(right.sentAtUtc).getTime());
  }, [messages, messageScenario, selectedConversationId]);

  const unreadCount = messages.filter(isIncomingUnread).length;
  const selectedConversation = conversations.find(item => item.id === selectedConversationId) ?? null;
  const relationshipInvalid = messageScenario === 'relationship_invalid' || selectedConversation?.relationshipStatus === 'invalid';

  useEffect(() => {
    if (!selectedConversationId) return;
    onMessagesChange(current => current.map(message =>
      message.conversationId === selectedConversationId && message.sender === 'elder' && message.type === 'text' && message.status === 'delivered'
        ? { ...message, status: 'viewed' }
        : message
    ));
  }, [selectedConversationId, onMessagesChange]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: 'nearest' });
  }, [visibleMessages.length, selectedConversationId]);

  const categoryStats = useMemo(() => Array.from(photoBatches.reduce((result, batch) => {
    result.set(batch.category, (result.get(batch.category) || 0) + batch.items.length);
    return result;
  }, new Map<string, number>())), [photoBatches]);
  const effectivePhotoScenario = photoListRetryRecovered ? 'list_default' : photoScenario;
  const displayedPhotoBatches = effectivePhotoScenario === 'list_empty' || effectivePhotoScenario === 'list_offline_empty' ? [] : photoBatches;
  const visiblePhotoBatches = selectedCategory === '全部' ? displayedPhotoBatches : displayedPhotoBatches.filter(batch => batch.category === selectedCategory);

  const sendMessage = (type: 'text' | 'voice', durationSeconds?: number) => {
    if (!selectedConversation || relationshipInvalid) return;
    const text = type === 'text' ? draft.trim() : undefined;
    if (type === 'text' && !text) return;
    const id = `family-${type}-${Date.now()}`;
    const shouldFail = messageScenario === 'send_failed';
    const newMessage: FamilyMessage = {
      id,
      conversationId: selectedConversation.id,
      sender: 'child',
      senderName: '我',
      text,
      sentAtUtc: new Date().toISOString(),
      status: 'sending',
      type,
      durationSeconds
    };
    onMessagesChange(current => [...current, newMessage]);
    if (type === 'text') setDraft('');
    window.setTimeout(() => {
      onMessagesChange(current => current.map(message => message.id === id
        ? { ...message, status: shouldFail ? 'failed' : 'delivered', failureReason: shouldFail ? '网络不稳定，留言未发出' : undefined }
        : message));
    }, 700);
  };

  const retryMessage = (messageId: string) => {
    onMessagesChange(current => current.map(message => message.id === messageId ? { ...message, status: 'sending', failureReason: undefined } : message));
    window.setTimeout(() => {
      onMessagesChange(current => current.map(message => message.id === messageId ? { ...message, status: 'delivered' } : message));
    }, 700);
  };

  const toggleVoice = (message: FamilyMessage) => {
    const current = playbackStates[message.id] ?? 'idle';
    if (messageScenario === 'voice_error' && message.sender === 'elder') {
      setActiveVoiceId(null);
      setPlaybackStates(states => ({ ...states, [message.id]: 'failed' }));
      return;
    }
    setActiveVoiceId(message.id);
    setPlaybackStates(states => {
      const next = Object.fromEntries(Object.entries(states).map(([id, state]) => [id, state === 'playing' ? 'paused' : state])) as Record<string, PlaybackState>;
      next[message.id] = current === 'playing' ? 'paused' : 'playing';
      return next;
    });
  };

  const finishRecording = () => {
    if (!recordingRef.current) return;
    window.removeEventListener('pointerup', finishRecording);
    recordingRef.current = false;
    setRecording(false);
    sendMessage('voice', recordingSeconds);
    setRecordingSeconds(1);
  };

  const cancelRecording = () => {
    window.removeEventListener('pointerup', finishRecording);
    recordingRef.current = false;
    setRecording(false);
    setRecordingSeconds(1);
  };

  const startRecording = () => {
    if (relationshipInvalid) return;
    recordingRef.current = true;
    setRecordingSeconds(1);
    setRecording(true);
    window.addEventListener('pointerup', finishRecording, { once: true });
  };

  const conversationPreview = (conversation: FamilyConversation) => {
    const list = messages.filter(message => message.conversationId === conversation.id).sort((a, b) => new Date(b.sentAtUtc).getTime() - new Date(a.sentAtUtc).getTime());
    const latest = list[0];
    const count = list.filter(isIncomingUnread).length;
    return { latest, count };
  };

  const renderMessageArea = () => {
    if (!selectedConversation) {
      return (
        <div className="mt-4 space-y-3">
          {activeConversations.map(conversation => {
            const preview = conversationPreview(conversation);
            return (
              <button key={conversation.id} type="button" onClick={() => setSelectedConversationId(conversation.id)} className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-xs">
                <img src={conversation.avatar} alt="" className="h-12 w-12 rounded-full object-cover" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2"><strong className="text-sm text-slate-900">{conversation.elderName}</strong><span className="text-[9px] text-slate-400">{conversation.relationLabel}</span></span>
                  <span className="mt-1 block truncate text-[11px] text-slate-500">{preview.latest ? (preview.latest.type === 'voice' ? `[语音] ${preview.latest.durationSeconds}秒` : preview.latest.text) : '还没有留言'}</span>
                </span>
                <span className="flex flex-col items-end gap-2"><span className="text-[9px] text-slate-400">{preview.latest ? formatTime(preview.latest.sentAtUtc) : ''}</span>{preview.count > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white">{preview.count}</span>}</span>
                <ChevronRight size={15} className="text-slate-300" />
              </button>
            );
          })}
        </div>
      );
    }

    return (
      <div className="-mx-4 mt-3 flex min-h-0 flex-1 flex-col overflow-hidden border-t border-slate-200 bg-slate-100/70">
        <header className="z-10 flex shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
          {messageScenario === 'multi_elder' && <button type="button" onClick={() => setSelectedConversationId(null)} aria-label="返回会话列表" className="rounded-full bg-slate-100 p-2 text-slate-600"><ArrowLeft size={16} /></button>}
          <img src={selectedConversation.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
          <div className="min-w-0 flex-1"><strong className="block text-sm text-slate-900">{selectedConversation.elderName}</strong><span className="text-[9px] text-emerald-600">14寸中控屏在线</span></div>
          <button type="button" onClick={onContactElder} disabled={relationshipInvalid} className="flex items-center gap-1 rounded-full bg-blue-50 px-3 py-2 text-[10px] font-bold text-blue-700 disabled:bg-slate-100 disabled:text-slate-400"><Phone size={13} />联系老人</button>
        </header>

        {relationshipInvalid && <div className="m-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700"><CircleAlert size={16} className="mt-0.5 shrink-0" /><div><strong className="text-xs">家庭关系已失效</strong><p className="mt-1 text-[10px] leading-relaxed">暂时无法发送新留言，历史记录仍可查看。</p></div></div>}

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-4">
          {visibleMessages.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center text-center"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-300 shadow-xs"><MessageCircle size={24} /></span><strong className="mt-3 text-sm text-slate-700">还没有家庭留言</strong><p className="mt-1 text-[10px] text-slate-400">发句话，中控屏会为老人展示。</p></div>
          ) : visibleMessages.map((message, index) => {
            const mine = message.sender === 'child';
            const playback = playbackStates[message.id] ?? (message.status === 'listened' ? 'completed' : 'idle');
            const previousMessage = visibleMessages[index - 1];
            const nextMessage = visibleMessages[index + 1];
            const startsGroup = !previousMessage
              || previousMessage.sender !== message.sender
              || new Date(message.sentAtUtc).getTime() - new Date(previousMessage.sentAtUtc).getTime() > 5 * 60 * 1000;
            const endsGroup = !nextMessage
              || nextMessage.sender !== message.sender
              || new Date(nextMessage.sentAtUtc).getTime() - new Date(message.sentAtUtc).getTime() > 5 * 60 * 1000;
            return (
              <div key={message.id} className={`flex gap-2.5 ${mine ? 'flex-row-reverse' : ''} ${startsGroup ? 'pt-2' : ''}`}>
                {startsGroup ? <div className={`flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full text-[10px] font-black ${mine ? 'bg-blue-600 text-white' : 'bg-white text-slate-600'}`}>{mine ? '我' : <img src={selectedConversation.avatar} alt="" className="h-full w-full object-cover" />}</div> : <span className="h-8 w-8 shrink-0" aria-hidden="true" />}
                <div className={`max-w-[78%] ${mine ? 'items-end' : 'items-start'} flex flex-col`}>
                  {message.type === 'text' ? (
                    <div className={`rounded-2xl px-3 py-2.5 text-xs leading-relaxed shadow-xs ${mine ? 'rounded-tr-sm bg-blue-600 text-white' : 'rounded-tl-sm bg-white text-slate-800'}`}>{message.text}</div>
                  ) : (
                    <button type="button" onClick={() => toggleVoice(message)} className={`flex min-w-32 items-center gap-2 rounded-2xl px-3 py-2.5 text-xs font-bold shadow-xs ${mine ? 'rounded-tr-sm bg-blue-600 text-white' : playback === 'failed' ? 'rounded-tl-sm border border-rose-200 bg-rose-50 text-rose-700' : 'rounded-tl-sm bg-white text-slate-700'}`}>
                      {playback === 'playing' ? <Pause size={15} /> : playback === 'completed' ? <RefreshCw size={14} /> : playback === 'failed' ? <CircleAlert size={15} /> : <Play size={15} />}
                      <span>{playback === 'playing' ? '正在播放' : playback === 'paused' ? '继续播放' : playback === 'completed' ? '重新播放' : playback === 'failed' ? '播放失败，点击重试' : `语音 ${message.durationSeconds}秒`}</span>
                    </button>
                  )}
                  {(endsGroup || message.status === 'failed') && <div className={`mt-1 flex items-center gap-1.5 text-[9px] ${message.status === 'failed' ? 'text-rose-500' : 'text-slate-400'}`}><span>{formatBubbleTime(message.sentAtUtc)}</span>{mine && <span>· {deliveryLabel(message)}</span>}</div>}
                  {message.status === 'failed' && <button type="button" onClick={() => retryMessage(message.id)} className="mt-1 flex items-center gap-1 text-[10px] font-bold text-rose-600"><RefreshCw size={11} />重新发送</button>}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <div className="shrink-0 border-t border-slate-200 bg-white p-3">
          {recording ? (
            <div className="flex items-center gap-2 rounded-2xl bg-rose-50 p-2"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-500 text-white"><Square size={13} className="fill-current" /></span><div className="min-w-0 flex-1"><strong className="block text-xs text-rose-700">录音中 {recordingSeconds}秒</strong><span className="text-[9px] text-rose-500">松开录音按钮后发送</span></div><button type="button" onClick={cancelRecording} className="rounded-lg bg-white px-3 py-2 text-[10px] font-bold text-slate-600">取消</button></div>
          ) : (
            <div className="flex items-end gap-2">
              <div className="relative min-w-0 flex-1">
                <textarea value={draft} maxLength={300} onChange={event => setDraft(event.target.value)} disabled={relationshipInvalid} rows={1} placeholder={relationshipInvalid ? '家庭关系已失效' : `给${selectedConversation.elderName}留句话…`} className={`min-h-11 w-full resize-none rounded-xl bg-slate-100 px-3 pt-3 text-xs outline-none focus:ring-2 focus:ring-blue-100 disabled:text-slate-400 ${draft.length > 0 ? 'pb-5' : 'pb-3'}`} />
                {draft.length > 0 && <span className="absolute bottom-1 right-2 text-[8px] text-slate-400">{draft.length}/300</span>}
              </div>
              <button type="button" onPointerDown={startRecording} disabled={relationshipInvalid} aria-label="按住说话" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 disabled:bg-slate-100 disabled:text-slate-300"><Mic size={17} /></button>
              <button type="button" onClick={() => sendMessage('text')} disabled={!draft.trim() || relationshipInvalid} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white disabled:bg-slate-200"><Send size={17} /></button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={activeSection === 'messages' ? 'flex h-full min-h-0 flex-col overflow-hidden bg-slate-50 p-4 pb-0' : 'min-h-full bg-slate-50 p-4 pb-8'} id="h5-family-tab">
      <div className="grid shrink-0 grid-cols-2 rounded-xl bg-slate-200/70 p-1">
        <button type="button" onClick={() => onSectionChange('messages')} className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition ${activeSection === 'messages' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}>家庭留言{unreadCount > 0 && <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[8px] font-black text-white">{unreadCount}</span>}</button>
        <button type="button" onClick={() => onSectionChange('photos')} className={`rounded-lg py-2 text-xs font-bold transition ${activeSection === 'photos' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}>家庭影像</button>
      </div>

      {activeSection === 'messages' ? (
        <>{messageScenario === 'multi_elder' && !selectedConversation && <div className="mt-5"><h3 className="text-sm font-extrabold text-slate-900">家庭留言</h3><p className="mt-1 text-[10px] text-slate-500">选择一位老人查看一对一会话</p></div>}{renderMessageArea()}</>
      ) : (
        <>
          {effectivePhotoScenario === 'list_offline_cached' && <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5"><strong className="text-xs text-amber-800">当前无网络</strong><p className="mt-1 text-[10px] text-amber-700">正在展示上次加载的影像，查看和喜欢状态可能不是最新。</p></div>}
          {effectivePhotoScenario !== 'list_empty' && effectivePhotoScenario !== 'list_offline_empty' && categoryStats.length >= 2 && <div className="-mx-4 mt-3 overflow-x-auto px-4 pb-1"><div className="flex w-max gap-2"><button type="button" onClick={() => setSelectedCategory('全部')} className={`rounded-full px-3 py-2 text-[10px] font-bold ${selectedCategory === '全部' ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}>全部 · {photoBatches.reduce((count, batch) => count + batch.items.length, 0)}项</button>{categoryStats.map(([category, count]) => <button key={category} type="button" onClick={() => setSelectedCategory(category)} className={`rounded-full px-3 py-2 text-[10px] font-bold ${selectedCategory === category ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}>{category} · {count}项</button>)}</div></div>}
          {effectivePhotoScenario === 'list_offline_empty' ? <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-8 text-center"><CircleAlert size={24} className="mx-auto text-amber-500" /><h4 className="mt-3 text-sm font-bold text-slate-800">暂时无法加载家庭影像</h4><p className="mt-1 text-[10px] text-slate-400">请检查网络连接后重试</p><button type="button" onClick={() => setPhotoListRetryRecovered(true)} className="mt-4 rounded-full bg-slate-900 px-4 py-2 text-[10px] font-bold text-white">重新加载</button></div> : displayedPhotoBatches.length === 0 ? <div className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><Images size={22} className="mx-auto text-slate-300" /><h4 className="mt-3 text-sm font-bold text-slate-800">还没有发布影像</h4><p className="mt-1 text-[10px] text-slate-400">把照片或视频分享给老人吧</p></div> : <div className="mt-3 space-y-3">{visiblePhotoBatches.map(batch => { const meta = feedbackMeta[batch.feedback]; const StatusIcon = meta.icon; return <button key={batch.id} type="button" onClick={() => setSelectedPhotoBatch(batch)} className="relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-xs"><div className="grid h-28 grid-cols-3 gap-0.5 bg-slate-100">{batch.items.slice(0, 3).map((item, index) => <div key={item.id} className="relative overflow-hidden"><img src={item.previewUrl} alt={item.name} className="h-full w-full object-cover" />{item.type === 'video' && <span className="absolute inset-0 flex items-center justify-center"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950/65 text-white"><Play size={13} className="ml-0.5 fill-current" /></span></span>}{item.type === 'video' && item.durationSeconds && <span className="absolute bottom-1 left-1 rounded bg-slate-950/70 px-1 text-[8px] text-white">{Math.floor(item.durationSeconds / 60)}:{String(item.durationSeconds % 60).padStart(2, '0')}</span>}{index === 2 && batch.items.length > 3 && <span className="absolute inset-0 flex items-center justify-center bg-slate-950/55 text-sm font-black text-white">+{batch.items.length - 3}</span>}</div>)}</div><div className="p-3"><div className="flex items-center justify-between gap-2"><strong className="text-xs text-slate-900">{batch.category} · {describeMediaCount(batch)}</strong><span className={`flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-bold ${meta.className}`}><StatusIcon size={11} />{meta.label}</span></div><div className="mt-2 flex items-center justify-between text-[9px] text-slate-400"><span>发给{batch.elderName} · {formatTime(batch.publishedAt)}</span><span className="font-bold text-blue-600">查看影像</span></div></div></button>; })}</div>}
        </>
      )}

      {selectedPhotoBatch && (() => { const meta = feedbackMeta[selectedPhotoBatch.feedback]; const StatusIcon = meta.icon; const label = selectedPhotoBatch.feedback === 'published' ? `已发给${selectedPhotoBatch.elderName}，等待查看` : `${selectedPhotoBatch.elderName}${meta.label}`; return <div className="absolute inset-0 z-[75] flex items-end bg-slate-950/45" onClick={() => setSelectedPhotoBatch(null)}><section role="dialog" aria-modal="true" onClick={event => event.stopPropagation()} className="flex max-h-[88%] w-full flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl"><header className="flex items-start justify-between border-b border-slate-100 p-4"><div><span className="text-[10px] font-bold text-blue-600">家庭影像</span><h3 className="mt-1 text-lg font-black text-slate-900">{selectedPhotoBatch.category} · {describeMediaCount(selectedPhotoBatch)}</h3></div><button type="button" onClick={() => setSelectedPhotoBatch(null)} className="rounded-full bg-slate-100 p-2 text-slate-500"><X size={16} /></button></header><div className="flex-1 overflow-y-auto p-4"><div className="grid grid-cols-2 gap-2">{selectedPhotoBatch.items.map(item => item.type === 'video' ? <div key={item.id} className="overflow-hidden rounded-xl bg-slate-950"><video src={item.videoUrl} poster={item.previewUrl} controls preload="metadata" className="aspect-square w-full object-cover" /></div> : <img key={item.id} src={item.previewUrl} alt={item.name} className="aspect-square w-full rounded-xl object-cover" />)}</div>{selectedPhotoBatch.message && <div className="mt-4 rounded-2xl bg-orange-50 p-3"><span className="text-[9px] font-bold text-orange-600">影像附言</span><p className="mt-1 text-xs text-slate-700">“{selectedPhotoBatch.message}”</p></div>}<div className={`mt-4 flex items-center gap-2 rounded-2xl p-3 ${meta.className}`}><StatusIcon size={16} /><strong className="text-xs">{label}</strong></div><button type="button" onClick={() => { setSelectedPhotoBatch(null); onOpenPhotoShare(); }} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white"><ImagePlus size={15} />继续发照片或视频</button></div></section></div>; })()}
    </div>
  );
};
