import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, Heart, MessageSquare, Video, Phone, Volume2, VolumeX, ArrowLeft, Mic, Sparkles, ChevronLeft, ChevronRight, X } from "lucide-react";
import { FamilyPhoto, FamilyMessage } from "../types";

interface FamilyPanelProps {
  photos: FamilyPhoto[];
  messages: FamilyMessage[];
  onPlayMessage?: (id: string) => void;
  externalCallContact?: string | null;
  onClearExternalCall?: () => void;
  externalOpenAlbum?: any;
  onClearExternalOpenAlbum?: any;
}

export default function FamilyPanel({ 
  photos, 
  messages, 
  onPlayMessage,
  externalCallContact,
  onClearExternalCall,
  externalOpenAlbum,
  onClearExternalOpenAlbum,
}: FamilyPanelProps) {
  const [currentIdx, setCurrentIdx] = useState(1); // Default to index 1 (the video "女儿小敏上传" to match the mockup!)
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoMuted, setVideoMuted] = useState(true);
  const [likedCount, setLikedCount] = useState(12);
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; left: number; size: number; delay: number; duration: number; char: string }[]>([]);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSuccess, setRecordingSuccess] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const heartIdRef = useRef(0);

  // Auto slide if it is a photo and not playing video
  useEffect(() => {
    if (photos[currentIdx]?.type === 'video' || videoPlaying) return;
    const interval = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % photos.length);
    }, 12000);
    return () => clearInterval(interval);
  }, [photos, currentIdx, videoPlaying]);

  useEffect(() => {
    if (externalOpenAlbum) {
      setCurrentIdx(0); // Show the first photo
      setVideoPlaying(false);
      if (onClearExternalOpenAlbum) onClearExternalOpenAlbum();
    }
  }, [externalOpenAlbum, onClearExternalOpenAlbum]);

  const handlePrev = () => {
    setCurrentIdx((prev) => (prev - 1 + photos.length) % photos.length);
    setVideoPlaying(false);
  };

  const handleNext = () => {
    setCurrentIdx((prev) => (prev + 1) % photos.length);
    setVideoPlaying(false);
  };

  const handlePlayToggle = () => {
    if (photos[currentIdx]?.type !== 'video') return;
    if (videoRef.current) {
      if (videoPlaying) {
        videoRef.current.pause();
        setVideoPlaying(false);
      } else {
        videoRef.current.play().catch(err => console.log(err));
        setVideoPlaying(true);
      }
    }
  };

  const triggerLike = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setLikedCount(prev => prev + 1);
    
    const emojis = ["❤️", "💖", "👍", "🌹", "⭐", "🌸", "👏", "❤️", "💖", "🌹"];
    const burstCount = 12;
    const newHearts = Array.from({ length: burstCount }).map((_, idx) => {
      const id = heartIdRef.current++;
      const randomLeft = Math.floor(Math.random() * 80) + 10;
      const size = Math.floor(Math.random() * 20) + 32; // Big font: 32px to 52px
      const duration = Math.random() * 0.8 + 1.8;
      const delay = idx * 0.05 + Math.random() * 0.05;
      const char = emojis[Math.floor(Math.random() * emojis.length)];
      return { id, left: randomLeft, size, delay, duration, char };
    });

    setFloatingHearts((prev) => [...prev, ...newHearts]);

    newHearts.forEach((h) => {
      setTimeout(() => {
        setFloatingHearts((prev) => prev.filter((item) => item.id !== h.id));
      }, (h.duration + h.delay) * 1000 + 200);
    });
  };

  // Start simulated recording
  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordingSuccess(false);
    setTimeout(() => {
      setIsRecording(false);
      setRecordingSuccess(true);
      setReplyText("好孩子，爸爸今天挺好的，血压也正常，不要担心！你跟杰杰也多穿件衣服！");
    }, 3000);
  };

  const handleSendReply = () => {
    setShowReplyModal(false);
    setRecordingSuccess(false);
    setReplyText("");
    // Trigger success flash
    triggerLike();
  };

  return (
    <div className="relative flex flex-col flex-1 h-full bg-white p-6 select-none overflow-hidden" id="family-panel">
      
      {/* 1. Warm Header for Eldercare Context */}
      <div className="mb-4 flex items-center justify-between shrink-0 pl-1">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-[#FFF1F3] text-[#D94D68] flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </span>
          <span className="text-[23px] font-black text-[#1C2C24]">家人今天的新鲜事</span>
        </div>
        {/* Explicit tactile pager */}
        <div className="flex items-center gap-2 bg-gray-50 border border-[#EBE6DD] rounded-2xl p-1.5">
          <button 
            onClick={handlePrev}
            aria-label="查看上一条家庭视听"
            className="h-10 px-3 flex items-center gap-1 hover:bg-white active:scale-95 border border-transparent hover:border-gray-200 rounded-xl text-gray-700 text-[15px] font-black transition-all cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>上一条</span>
          </button>
          <span className="text-[16px] font-black text-gray-700 min-w-[120px] text-center px-2">
            第 {currentIdx + 1} 条，共 {photos.length} 条
          </span>
          <button 
            onClick={handleNext}
            aria-label="查看下一条家庭视听"
            className="h-10 px-3 flex items-center gap-1 hover:bg-white active:scale-95 border border-transparent hover:border-gray-200 rounded-xl text-gray-700 text-[15px] font-black transition-all cursor-pointer"
          >
            <span>下一条</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. Cinematic Media Display Container */}
      <div className="relative flex-1 w-full rounded-3xl border-2 border-[#EBE6DD] bg-black overflow-hidden shadow-lg group">
        
        {/* Active Background Media (Video or Image) */}
        {photos[currentIdx]?.type === 'video' ? (
          <div className="w-full h-full flex items-center justify-center relative">
            <video
              ref={videoRef}
              src={photos[currentIdx].videoUrl}
              poster={photos[currentIdx].url}
              muted={videoMuted}
              loop
              playsInline
              className="w-full h-full object-cover"
            />
            {/* Dark overlay when paused */}
            {!videoPlaying && (
              <div className="absolute inset-0 bg-black/35 flex flex-col items-center justify-center cursor-pointer" onClick={handlePlayToggle}>
                <div className="w-24 h-24 rounded-full bg-[#14533C]/95 hover:bg-emerald-600/95 text-white flex items-center justify-center shadow-2xl transition-transform transform active:scale-95 border-4 border-white/25">
                  <Play className="w-12 h-12 fill-current translate-x-1" />
                </div>
                <span className="mt-4 px-6 py-2 bg-black/60 text-white font-extrabold text-[19px] rounded-full border border-white/10 shadow-lg tracking-wide">
                  播放家庭视频
                </span>
              </div>
            )}
          </div>
        ) : (
          <img
            src={photos[currentIdx]?.url || "https://picsum.photos/seed/familytree/800/600"}
            alt="Family Photo"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        )}

        {/* Floating Heart Fountain Canvas */}
        {floatingHearts.map((h) => (
          <div
            key={h.id}
            style={{ 
              left: `${h.left}%`,
              fontSize: `${h.size}px`,
              animationDelay: `${h.delay}s`,
              '--float-duration': `${h.duration}s`,
            } as React.CSSProperties}
            className="absolute bottom-24 select-none pointer-events-none z-40 drop-shadow-xl animate-heart-float"
          >
            {h.char}
          </div>
        ))}
      </div>

      {/* 3. Emotional Feedback Loop Bottom Panel */}
      <div className="mt-5 p-5 bg-stone-50 rounded-2xl border-2 border-[#EBE6DD] flex items-center justify-between gap-6 shadow-sm shrink-0">
        {/* Left part: Sender avatar and transcription */}
        <div className="flex items-center gap-4 text-left flex-1 min-w-0">
          <img
            src="https://picsum.photos/seed/xiaomin/120/120"
            alt="Avatar"
            referrerPolicy="no-referrer"
            className="w-16 h-16 rounded-full border-2 border-[#256f4f] shrink-0 object-cover shadow-sm"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <span className="text-[21px] font-black text-[#1C2C24]">女儿小敏</span>
              <span className="px-2.5 py-1 bg-[#EAF6EF] text-emerald-700 text-[14px] font-black rounded-md border border-[#C3E6D2]">
                语音留言 · 10秒
              </span>
            </div>
            <p className="text-[19px] font-bold text-gray-700 mt-1.5 leading-relaxed tracking-wide">
              爸，今天降温多穿件衣服，吃药了吗？周六煲黑鱼汤带杰杰去看您！
            </p>
          </div>
        </div>

        {/* Right part: Two Direct Touch Action Buttons for Emotional loop */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => {
              const latestMessage = messages.find((message) => message.sender !== "您 (我)");
              if (latestMessage) onPlayMessage?.(latestMessage.id);
            }}
            className="flex items-center gap-2.5 px-6 py-4.5 bg-[#14533C] hover:bg-[#0E3D2B] text-white text-[18px] font-black rounded-2xl shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <Volume2 className="w-5.5 h-5.5" />
            <span>听小敏的语音留言</span>
          </button>

          <button
            onClick={() => setShowReplyModal(true)}
            className="flex items-center gap-2.5 px-6 py-4.5 bg-white hover:bg-[#EAF6EF] border-2 border-[#B8D9C7] text-[#14533C] text-[18px] font-black rounded-2xl active:scale-95 transition-all cursor-pointer"
          >
            <Mic className="w-5.5 h-5.5 fill-current" />
            <span>语音回复</span>
          </button>
        </div>
      </div>

      {/* 5. Audio Reply Overlay Modal */}
      {showReplyModal && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-8">
          <div className="bg-[#FAF8F5] border border-[#EBE6DD] rounded-3xl p-8 max-w-xl w-full text-center shadow-2xl animate-fade-in relative">
            <button
              onClick={() => {
                setShowReplyModal(false);
                setIsRecording(false);
              }}
              className="absolute top-5 right-5 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 cursor-pointer transition-all"
            >
              <X className="w-6 h-6" />
            </button>

            <h3 className="text-[24px] font-black text-[#1C2C24] mb-3">语音回复给女儿小敏</h3>
            <p className="text-sm font-bold text-gray-500 mb-6">按下红色录音按钮，对准屏幕直接说话即可：</p>

            {/* Simulated Tape/Mic status */}
            <div className="flex flex-col items-center justify-center my-8">
              {isRecording ? (
                <div className="relative w-32 h-32 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                  <div className="absolute inset-0 rounded-full bg-red-400/20 blur animate-ping" />
                  <button className="w-24 h-24 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg border-4 border-white">
                    <div className="w-8 h-8 bg-white rounded" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleStartRecording}
                  className="w-28 h-28 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-xl border-4 border-white transform transition-transform active:scale-95 cursor-pointer mb-6"
                >
                  <Mic className="w-11 h-11 text-white fill-current" />
                </button>
              )}

              {isRecording && (
                <div className="text-red-600 font-extrabold text-lg flex items-center gap-1.5 animate-pulse">
                  <span>● 正在录制您的语音...</span>
                </div>
              )}

              {!isRecording && !recordingSuccess && (
                <span className="text-base font-black text-gray-700">点击按钮开始说话录音</span>
              )}

              {recordingSuccess && (
                <div className="w-full">
                  <span className="text-emerald-700 font-black text-lg block mb-3">录音成功！已为您自动转换成文字：</span>
                  <div className="bg-white p-4 rounded-xl border-2 border-emerald-500 text-[19px] font-black text-emerald-800 leading-relaxed text-left">
                    "{replyText}"
                  </div>
                  <div className="flex gap-4 mt-6">
                    <button
                      onClick={handleStartRecording}
                      className="flex-1 py-3.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-base font-black rounded-xl cursor-pointer"
                    >
                      重新录音
                    </button>
                    <button
                      onClick={handleSendReply}
                      className="flex-1 py-3.5 bg-brand-green hover:bg-brand-green-hover text-white text-base font-black rounded-xl cursor-pointer shadow-md"
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
