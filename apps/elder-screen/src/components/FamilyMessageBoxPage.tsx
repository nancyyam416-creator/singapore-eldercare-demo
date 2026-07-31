import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Play, Pause, Mic, Video, Volume2, VolumeX, X, Check, Sparkles, Smile, Heart, CornerDownLeft, Volume, Star } from "lucide-react";
import { speakText, stopSpeech } from "../audio/speech";
import { FamilyMessage } from "../types";

interface FamilyMessageBoxPageProps {
  isOpen: boolean;
  onClose: () => void;
  backLabel?: string;
  messages: FamilyMessage[];
  onAddMessage: (newMessage: FamilyMessage) => void;
  onMarkRead: (messageId: string) => void;
  onStartCall?: (contactName: string) => void;
}

export default function FamilyMessageBoxPage({
  isOpen,
  onClose,
  backLabel = "返回首页",
  messages,
  onAddMessage,
  onMarkRead,
  onStartCall,
}: FamilyMessageBoxPageProps) {
  // Navigation & filtering states
  const [selectedSender, setSelectedSender] = useState<string>("女儿小敏");
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  
  // Audio Player simulation states
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Text-To-Speech (TTS) simulation states
  const [readingMessageId, setReadingMessageId] = useState<string | null>(null);
  const [readingProgressWordIdx, setReadingProgressWordIdx] = useState(-1);
  const readingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Quick reply options for elders (Large clickable buttons)
  const quickReplies = [
    "好孩子，爸爸今天挺好的，血压也正常，不要担心！",
    "刚吃过药啦，中午做了面条吃，身体棒着呢！",
    "西湖樱花照太好看啦，周六等你们回来煲黑鱼汤喝！",
    "外面天气凉，你们上班多穿件衣服，别累着了！",
    "乖孙女画的父亲节贺卡爷爷看到了，画得太好啦！"
  ];

  // Reply simulation modals
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyTargetSender, setReplyTargetSender] = useState<string>("女儿小敏");
  const [replyTargetAvatar, setReplyTargetAvatar] = useState<string>("https://picsum.photos/seed/xiaomin/120/120");
  
  // Voice recording simulation states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSuccess, setRecordingSuccess] = useState(false);
  const [recordedText, setRecordedText] = useState("");
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Floating heart animations for sending reply
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [heartBurstPos, setHeartBurstPos] = useState({ x: 0, y: 0 });

  // Handle Voice message play/pause
  const handleToggleVoicePlay = (msg: FamilyMessage) => {
    if (msg.type !== 'voice') return;

    if (playingMessageId === msg.id) {
      // Pause
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
      stopSpeech();
      setPlayingMessageId(null);
    } else {
      // Stop any running TTS
      handleStopReading();

      // Start playing
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
      setPlayingMessageId(msg.id);
      setPlaybackProgress(0);
      onMarkRead(msg.id);
      speakText(msg.content, {
        rate: 0.86,
        onEnd: () => {
          setPlayingMessageId(null);
          setPlaybackProgress(0);
          onMarkRead(msg.id);
        },
      });

      const duration = msg.duration || 10;
      let elapsed = 0;
      playbackTimerRef.current = setInterval(() => {
        elapsed += 0.5;
        const progress = Math.min((elapsed / duration) * 100, 100);
        setPlaybackProgress(progress);
        
        if (progress >= 100) {
          if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
          setPlayingMessageId(null);
          setPlaybackProgress(0);
          // Auto mark as played/read
          onMarkRead(msg.id);
        }
      }, 500);
    }
  };

  // Handle Text-To-Speech recitation simulation
  const handleToggleTextReading = (msg: FamilyMessage) => {
    if (readingMessageId === msg.id) {
      handleStopReading();
    } else {
      // Stop voice messages
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
      setPlayingMessageId(null);

      setReadingMessageId(msg.id);
      setReadingProgressWordIdx(0);
      onMarkRead(msg.id);
      speakText(msg.content, {
        rate: 0.86,
        onEnd: () => {
          setReadingMessageId(null);
          setReadingProgressWordIdx(-1);
          onMarkRead(msg.id);
        },
      });

      // Simulate word-by-word highlight for elderly
      const words = msg.content.split("");
      let idx = 0;

      if (readingTimerRef.current) clearInterval(readingTimerRef.current);
      readingTimerRef.current = setInterval(() => {
        idx += 1;
        if (idx >= words.length) {
          handleStopReading();
          onMarkRead(msg.id);
        } else {
          setReadingProgressWordIdx(idx);
        }
      }, 100); // 100ms per character
    }
  };

  const handleStopReading = () => {
    if (readingTimerRef.current) clearInterval(readingTimerRef.current);
    stopSpeech();
    setReadingMessageId(null);
    setReadingProgressWordIdx(-1);
  };

  // Recording Simulation
  const startVoiceRecording = () => {
    setIsRecording(true);
    setRecordingSuccess(false);
    setRecordingSeconds(0);
    
    if (recordingTimerIntervalRef.current) clearInterval(recordingTimerIntervalRef.current);
    recordingTimerIntervalRef.current = setInterval(() => {
      setRecordingSeconds(prev => prev + 1);
    }, 1000);

    setTimeout(() => {
      // Stop and succeed automatically after 4.5 seconds
      stopVoiceRecording(true);
    }, 4500);
  };

  const stopVoiceRecording = (isSuccess = true) => {
    if (recordingTimerIntervalRef.current) clearInterval(recordingTimerIntervalRef.current);
    setIsRecording(false);
    
    if (isSuccess) {
      setRecordingSuccess(true);
      // Give a highly localized custom transcribed answer based on who we reply to
      if (replyTargetSender.includes("小敏")) {
        setRecordedText("好敏敏，爸爸今天中午吃了小敏买的面，很可口！血压刚才量了122很平稳，周末不要太累，买点西瓜带杰杰来就行啦！");
      } else {
        setRecordedText("小刚，循环扇我已经收到并安好啦，吹着很凉快，声音也极小！你在北京天气热也多喝水，防暑防晒。");
      }
    }
  };

  const handleSendRecordedVoice = () => {
    const newMsg: FamilyMessage = {
      id: `msg-reply-${Date.now()}`,
      sender: "您 (我)",
      recipient: replyTargetSender,
      avatar: "https://picsum.photos/seed/grandfather/120/120",
      type: "voice",
      content: recordedText,
      duration: recordingSeconds || 8,
      timestamp: "刚刚",
      played: true,
    };
    onAddMessage(newMsg);
    
    // Animate a heart burst feedback
    triggerHeartFeedback();
    
    // Close modal
    setShowReplyModal(false);
    setRecordingSuccess(false);
    setRecordedText("");
  };

  // Send quick response
  const handleSendQuickPhrase = (phrase: string, senderName: string, avatar: string) => {
    const newMsg: FamilyMessage = {
      id: `msg-quick-${Date.now()}`,
      sender: "您 (我)",
      recipient: senderName,
      avatar: "https://picsum.photos/seed/grandfather/120/120",
      type: "text",
      content: phrase,
      timestamp: "刚刚",
      played: true,
    };
    onAddMessage(newMsg);
    
    // Visual heart explosion
    triggerHeartFeedback();
  };

  const triggerHeartFeedback = () => {
    setShowHeartBurst(true);
    setTimeout(() => {
      setShowHeartBurst(false);
    }, 2000);
  };

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
      if (readingTimerRef.current) clearInterval(readingTimerRef.current);
      if (recordingTimerIntervalRef.current) clearInterval(recordingTimerIntervalRef.current);
      stopSpeech();
    };
  }, []);

  if (!isOpen) return null;

  // Senders list for filtering
  const senders = ["女儿小敏", "儿子小刚"];

  const filteredMessages = messages.filter(m => {
    if (m.sender === "您 (我)") {
      return m.recipient === selectedSender;
    }
    return m.sender === selectedSender;
  });

  return (
    <div className="fixed inset-0 bg-[#F5F2EB] z-[990] flex flex-col font-sans select-none overflow-hidden animate-fade-in" id="family-message-box-page">
      
      {/* ================= HEADER BAR ================= */}
      <div className="h-[140px] bg-white border-b-2 border-[#EBE6DD] px-10 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-6">
          <button
            onClick={onClose}
            className="flex items-center gap-2.5 px-6 py-4 bg-[#FAF8F5] hover:bg-[#EAF6EF] border-2 border-[#EBE6DD] hover:border-[#C3E6D2] rounded-2xl text-[#256f4f] font-black text-[22px] transition-all cursor-pointer shadow-sm active:scale-95"
            id="msg-box-back-btn"
          >
            <ArrowLeft className="w-8 h-8" />
            <span>{backLabel}</span>
          </button>

          <div className="h-10 w-0.5 bg-gray-200" />

          <div className="text-left">
            <h1 className="text-4xl font-black text-[#1C2C24] tracking-wide flex items-center gap-3">
              <span>💬</span> 家庭留言
            </h1>
            <p className="text-gray-500 font-bold text-lg mt-1">
              查看家人发来的语音和文字，支持大声播放、语音回复和直接联系留言人
            </p>
          </div>
        </div>

        {/* Statistics badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 bg-[#EAF6EF] border-2 border-[#C3E6D2] text-[#14533C] px-6 py-3.5 rounded-2xl">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[20px] font-black">
              {messages.some((message) => !message.played && message.sender !== "您 (我)")
                ? `有 ${messages.filter((message) => !message.played && message.sender !== "您 (我)").length} 条新留言`
                : `共有 ${messages.length} 条家庭留言`}
            </span>
          </div>
        </div>
      </div>

      {/* ================= MAIN INTERFACE WRAPPER ================= */}
      <div className="flex-1 overflow-hidden p-8 flex gap-8">
        
        {/* Left Area: Filter Tabs & Quick Replies (360px) */}
        <div className="w-[360px] flex flex-col gap-6 shrink-0 h-full overflow-hidden">
          
          {/* Section 1: Choose family member */}
          <div className="bg-white border-2 border-[#EBE6DD] rounded-3xl p-6 shadow-sm flex flex-col">
            <h3 className="text-[22px] font-black text-[#1C2C24] mb-4 text-left border-b border-gray-100 pb-2.5 flex items-center gap-2">
              <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
              <span>选择留言人</span>
            </h3>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => setSelectedSender("女儿小敏")}
                className={`w-full p-4 rounded-2xl border-2 text-left flex items-center justify-between transition-all cursor-pointer active:scale-95 ${
                  selectedSender === "女儿小敏"
                    ? "bg-[#EAF6EF] border-[#C3E6D2] text-[#14533C]"
                    : "bg-[#FAF8F5] border-transparent text-gray-700 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <img
                    src="https://picsum.photos/seed/xiaomin/120/120"
                    alt="Xiaomin"
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full border border-gray-200"
                  />
                  <span className="text-[19px] font-black">女儿小敏</span>
                </div>
                <span className="text-xs font-bold bg-white px-2.5 py-1 rounded-lg border border-gray-200 text-gray-500">
                  {messages.filter(m => m.sender === "女儿小敏").length}条
                </span>
              </button>

              <button
                onClick={() => setSelectedSender("儿子小刚")}
                className={`w-full p-4 rounded-2xl border-2 text-left flex items-center justify-between transition-all cursor-pointer active:scale-95 ${
                  selectedSender === "儿子小刚"
                    ? "bg-[#EAF6EF] border-[#C3E6D2] text-[#14533C]"
                    : "bg-[#FAF8F5] border-transparent text-gray-700 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <img
                    src="https://picsum.photos/seed/xiaogang/120/120"
                    alt="Xiaogang"
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full border border-gray-200"
                  />
                  <span className="text-[19px] font-black">儿子小刚</span>
                </div>
                <span className="text-xs font-bold bg-white px-2.5 py-1 rounded-lg border border-gray-200 text-gray-500">
                  {messages.filter(m => m.sender === "儿子小刚").length}条
                </span>
              </button>
            </div>
          </div>

          {/* Section 2: Elderly Fast Quick-Replies Buttons */}
          <div className="bg-white border-2 border-[#EBE6DD] rounded-3xl p-6 shadow-sm flex-1 flex flex-col overflow-hidden">
            <h3 className="text-[21px] font-black text-[#1C2C24] mb-3 text-left border-b border-gray-100 pb-2.5 flex items-center gap-2 shrink-0">
              <Smile className="w-6 h-6 text-emerald-600" />
              <span>长辈快捷大字回复</span>
            </h3>
            
            <p className="text-xs font-bold text-gray-400 mb-3 text-left shrink-0 leading-snug">
              点击以下任何一条，直接自动发出回复，孩子们手机会瞬间接到通知哦：
            </p>

            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3.5 custom-scroll">
              {quickReplies.map((phrase, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    const recipient = selectedSender;
                    const recAvatar = recipient === "女儿小敏" 
                      ? "https://picsum.photos/seed/xiaomin/120/120" 
                      : "https://picsum.photos/seed/xiaogang/120/120";
                    handleSendQuickPhrase(phrase, recipient, recAvatar);
                  }}
                  className="w-full p-4 bg-[#FAF8F5] hover:bg-emerald-50 border-2 border-[#EBE6DD] hover:border-[#C3E6D2] rounded-2xl text-left text-gray-700 hover:text-[#14533C] text-[17px] font-black transition-all cursor-pointer active:scale-95 leading-snug relative group"
                >
                  <div className="absolute top-2.5 right-3 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <CornerDownLeft className="w-5 h-5" />
                  </div>
                  “ {phrase} ”
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Area: Interactive Messaging Thread Dialogue Area */}
        <div className="flex-1 bg-white border-2 border-[#EBE6DD] rounded-[36px] p-8 shadow-sm flex flex-col h-full overflow-hidden relative">
          
          {/* Main message chat layout */}
          <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-6 custom-scroll pb-6" id="message-bubbles-stream">
            {filteredMessages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                <span className="text-6xl mb-4">💬</span>
                <h3 className="text-2xl font-black text-gray-800">暂无该分类的留言</h3>
                <p className="text-gray-500 font-bold text-base mt-2">请选择左侧留言人，查看家人发来的消息。</p>
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isMe = msg.sender === "您 (我)";
                const isPlaying = playingMessageId === msg.id;
                const isReading = readingMessageId === msg.id;

                return (
                  <div
                    key={msg.id}
                    className={`flex gap-5 max-w-[85%] ${isMe ? "self-end flex-row-reverse text-right" : "self-start text-left"}`}
                  >
                    {/* Avatar */}
                    <img
                      src={msg.avatar}
                      alt={msg.sender}
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-full border-2 border-emerald-500 shrink-0 object-cover shadow-sm"
                    />

                    {/* Dialogue content block */}
                    <div className="flex flex-col gap-2">
                      {/* Sender Meta Line */}
                      <div className="flex items-center gap-3 justify-start">
                        <span className="text-[19px] font-black text-[#1C2C24]">
                          {msg.sender}
                        </span>
                        <span className="text-xs font-bold text-gray-400">
                          {msg.timestamp}
                        </span>
                        {!isMe && !msg.played && (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-600 rounded-md text-[11px] font-extrabold tracking-wider">
                            未读
                          </span>
                        )}
                        {!isMe && msg.played && (
                          <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
                            <Check className="w-3.5 h-3.5" /> 已读
                          </span>
                        )}
                      </div>

                      {/* Bubble Body with big text and actions */}
                      <div className={`p-6 rounded-[28px] shadow-sm border-2 relative overflow-hidden ${
                        isMe 
                          ? "bg-[#EAF6EF] border-[#C3E6D2] text-[#14533C]" 
                          : "bg-gray-50/50 border-gray-100 text-gray-800"
                      }`}>
                        
                        {/* Voice message bubble */}
                        {msg.type === "voice" ? (
                          <div className="flex flex-col gap-3 min-w-[280px]">
                            <div className="flex items-center justify-between">
                              <button
                                onClick={() => handleToggleVoicePlay(msg)}
                                className={`flex items-center gap-3.5 px-6 py-3.5 rounded-full font-black text-[18px] shadow-sm transition-all active:scale-95 cursor-pointer ${
                                  isPlaying 
                                    ? "bg-[#14533C] text-white" 
                                    : "bg-emerald-50 text-[#14533C] hover:bg-emerald-100"
                                }`}
                              >
                                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                                <span>{isPlaying ? "正在播放..." : `点击播放语音 (${msg.duration || 10}秒)`}</span>
                              </button>

                              {/* Simple volume state indicator */}
                              <span className="text-sm font-bold text-emerald-700 animate-pulse bg-emerald-50 px-3 py-1 rounded-full">
                                🔊 音量已调最大
                              </span>
                            </div>

                            {/* Sound wave bar visualizer (elder friendly animation) */}
                            {isPlaying ? (
                              <div className="h-10 bg-emerald-100/50 rounded-xl flex items-center justify-around px-4 border border-emerald-200">
                                <div className="w-1.5 h-5 bg-[#14533C] rounded animate-bounce" style={{ animationDelay: '0.1s' }} />
                                <div className="w-1.5 h-8 bg-[#14533C] rounded animate-bounce" style={{ animationDelay: '0.3s' }} />
                                <div className="w-1.5 h-4 bg-[#14533C] rounded animate-bounce" style={{ animationDelay: '0s' }} />
                                <div className="w-1.5 h-7 bg-[#14533C] rounded animate-bounce" style={{ animationDelay: '0.5s' }} />
                                <div className="w-1.5 h-6 bg-[#14533C] rounded animate-bounce" style={{ animationDelay: '0.2s' }} />
                                <div className="w-1.5 h-8 bg-[#14533C] rounded animate-bounce" style={{ animationDelay: '0.4s' }} />
                                <div className="w-1.5 h-3 bg-[#14533C] rounded animate-bounce" style={{ animationDelay: '0.1s' }} />
                              </div>
                            ) : (
                              <div className="h-1 text-gray-200 rounded-full w-full bg-gray-100 relative">
                                <div className="absolute left-0 top-0 bottom-0 bg-emerald-300 rounded-full" style={{ width: `${isPlaying ? playbackProgress : 0}%` }} />
                              </div>
                            )}

                            {/* Transcription subtitles */}
                            <div className="mt-2.5 text-left bg-white/80 p-4 rounded-xl border border-gray-100">
                              <span className="text-xs font-bold text-gray-400 block mb-1">【系统已为您自动将语音转换成大字】：</span>
                              <p className="text-[19px] font-black leading-relaxed text-[#1C2C24]">
                                {msg.content}
                              </p>
                            </div>
                          </div>
                        ) : (
                          /* Text message bubble with Read Aloud option */
                          <div className="min-w-[280px]">
                            <p className="text-[20px] font-black leading-relaxed tracking-wide text-left mb-4">
                              {/* Highlight read-aloud text */}
                              {isReading ? (
                                msg.content.split("").map((char, index) => (
                                  <span
                                    key={index}
                                    className={index <= readingProgressWordIdx ? "text-emerald-700 bg-emerald-100" : ""}
                                  >
                                    {char}
                                  </span>
                                ))
                              ) : (
                                msg.content
                              )}
                            </p>

                            {!isMe && (
                              <div className="flex gap-4 border-t border-gray-100 pt-3.5">
                                <button
                                  onClick={() => handleToggleTextReading(msg)}
                                  className={`flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-base font-black transition-all cursor-pointer shadow-sm active:scale-95 ${
                                    isReading 
                                      ? "bg-[#14533C] text-white" 
                                      : "bg-gray-100 hover:bg-gray-200 text-[#14533C]"
                                  }`}
                                >
                                  <Volume className="w-5 h-5 fill-current" />
                                  <span>{isReading ? "正在用大声朗读中..." : "点击语音朗读这条留言"}</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Persistent bottom interactive actions panel for sending new message to any child */}
          <div className="border-t-2 border-[#EBE6DD] pt-6 flex items-center justify-center gap-6 bg-white shrink-0" id="bottom-interactive-actions-panel">
            <div className="flex gap-6 flex-wrap justify-center w-full">
              {/* Daughter Xiaomin Block */}
              <div className="flex items-center gap-4 bg-[#FAF8F5] border-2 border-[#EBE6DD] rounded-[22px] p-3 shadow-sm">
                <div className="flex items-center gap-2.5 pl-1">
                  <img
                    src="https://picsum.photos/seed/xiaomin/120/120"
                    alt="Xiaomin"
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full border border-gray-200 object-cover"
                  />
                  <span className="text-[18px] font-black text-[#1C2C24]">女儿小敏</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onStartCall?.("女儿小敏")}
                    className="px-5 py-3 bg-[#14533C] hover:bg-[#0D3B2B] text-white rounded-[16px] flex items-center gap-1.5 font-black text-base transition-all active:scale-95 cursor-pointer shadow-sm"
                  >
                    <Video className="w-4.5 h-4.5 fill-white text-white" />
                    <span>视频通话</span>
                  </button>
                  <button
                    onClick={() => {
                      setReplyTargetSender("女儿小敏");
                      setReplyTargetAvatar("https://picsum.photos/seed/xiaomin/120/120");
                      setShowReplyModal(true);
                    }}
                    className="px-5 py-3 bg-[#E9EDE9] hover:bg-[#DCE2DC] text-[#1C2C24] border border-[#D0D6D0]/50 rounded-[16px] flex items-center gap-1.5 font-black text-base transition-all active:scale-95 cursor-pointer"
                  >
                    <Mic className="w-4.5 h-4.5 text-[#14533C] fill-current" />
                    <span>语音回复</span>
                  </button>
                </div>
              </div>

              {/* Son Xiaogang Block */}
              <div className="flex items-center gap-4 bg-[#FAF8F5] border-2 border-[#EBE6DD] rounded-[22px] p-3 shadow-sm">
                <div className="flex items-center gap-2.5 pl-1">
                  <img
                    src="https://picsum.photos/seed/xiaogang/120/120"
                    alt="Xiaogang"
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full border border-gray-200 object-cover"
                  />
                  <span className="text-[18px] font-black text-[#1C2C24]">儿子小刚</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onStartCall?.("儿子小刚")}
                    className="px-5 py-3 bg-[#14533C] hover:bg-[#0D3B2B] text-white rounded-[16px] flex items-center gap-1.5 font-black text-base transition-all active:scale-95 cursor-pointer shadow-sm"
                  >
                    <Video className="w-4.5 h-4.5 fill-white text-white" />
                    <span>视频通话</span>
                  </button>
                  <button
                    onClick={() => {
                      setReplyTargetSender("儿子小刚");
                      setReplyTargetAvatar("https://picsum.photos/seed/xiaogang/120/120");
                      setShowReplyModal(true);
                    }}
                    className="px-5 py-3 bg-[#E9EDE9] hover:bg-[#DCE2DC] text-[#1C2C24] border border-[#D0D6D0]/50 rounded-[16px] flex items-center gap-1.5 font-black text-base transition-all active:scale-95 cursor-pointer"
                  >
                    <Mic className="w-4.5 h-4.5 text-[#14533C] fill-current" />
                    <span>语音回复</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Sweet floating heart celebration banner after sending */}
          {showHeartBurst && (
            <div className="absolute inset-x-0 bottom-32 flex justify-center pointer-events-none select-none z-50 animate-fade-in-out">
              <div className="bg-emerald-700 text-white font-black text-2xl px-8 py-4 rounded-full shadow-2xl flex items-center gap-3 border-2 border-emerald-400">
                <Heart className="w-8 h-8 fill-red-500 text-red-500 animate-bounce" />
                <span>发送回复成功！孩子们已经收到啦 ❤️</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= MODAL: VOICE RECORDING REPLY OVERLAY ================= */}
      {showReplyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[1000] flex items-center justify-center p-8 animate-fade-in">
          <div className="bg-[#FAF8F5] border border-[#EBE6DD] rounded-[36px] p-8 max-w-xl w-full text-center shadow-2xl animate-scale-up relative">
            <button
              onClick={() => {
                setShowReplyModal(false);
                setIsRecording(false);
              }}
              className="absolute top-5 right-5 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 cursor-pointer transition-all"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-3 justify-center mb-4">
              <img
                src={replyTargetAvatar}
                alt={replyTargetSender}
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-full border-2 border-emerald-500 object-cover"
              />
              <h3 className="text-[25px] font-black text-[#1C2C24]">语音回复给【{replyTargetSender}】</h3>
            </div>
            
            <p className="text-base font-bold text-gray-500 mb-6">按下红色录音大按钮，对准屏幕直接说话即可：</p>

            <div className="flex flex-col items-center justify-center my-6">
              {isRecording ? (
                <div className="relative w-32 h-32 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                  <div className="absolute inset-0 rounded-full bg-red-400/20 blur animate-ping" />
                  <button 
                    onClick={() => stopVoiceRecording(true)}
                    className="w-24 h-24 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg border-4 border-white animate-pulse"
                  >
                    <div className="w-8 h-8 bg-white rounded" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={startVoiceRecording}
                  className="w-28 h-28 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-xl border-4 border-white transform transition-transform active:scale-95 cursor-pointer mb-6"
                >
                  <Mic className="w-11 h-11 text-white fill-current" />
                </button>
              )}

              {isRecording && (
                <div className="text-red-600 font-extrabold text-lg flex flex-col items-center gap-1.5 animate-pulse">
                  <span>● 正在录制您的语音 ({recordingSeconds}秒)...</span>
                  <span className="text-xs text-gray-400 font-normal">点击屏幕中间红色按钮可提前结束并转文字</span>
                </div>
              )}

              {!isRecording && !recordingSuccess && (
                <span className="text-lg font-black text-gray-700">点击红色大麦克风按钮开始说话</span>
              )}

              {recordingSuccess && (
                <div className="w-full">
                  <span className="text-emerald-700 font-black text-lg block mb-3">录音成功！已为您自动转换成文字：</span>
                  <div className="bg-white p-5 rounded-2xl border-2 border-emerald-500 text-[20px] font-black text-[#14533C] leading-relaxed text-left">
                    “ {recordedText} ”
                  </div>
                  
                  <div className="flex gap-4 mt-6">
                    <button
                      onClick={startVoiceRecording}
                      className="flex-1 py-4 bg-gray-200 hover:bg-gray-300 text-gray-800 text-[18px] font-black rounded-xl cursor-pointer"
                    >
                      重新录音
                    </button>
                    <button
                      onClick={handleSendRecordedVoice}
                      className="flex-1 py-4 bg-emerald-700 hover:bg-emerald-800 text-white text-[18px] font-black rounded-xl cursor-pointer shadow-md"
                    >
                      发送语音回复
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
