import React, { useState, useEffect, useRef } from "react";
import { X, Send, Mic, Sparkles, Volume2, CornerDownLeft, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ChatMessage } from "../types";

interface SmartAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatHistory: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  isChatLoading: boolean;
}

export default function SmartAssistantModal({
  isOpen,
  onClose,
  chatHistory,
  onSendMessage,
  isChatLoading,
}: SmartAssistantModalProps) {
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Large elder-friendly quick questions
  const presetPrompts = [
    "我今天该怎么吃药？",
    "今天下午气温怎么样？会降温吗？",
    "今天小区里有什么好玩的活动吗？",
    "帮我订一份健康老人营养餐上门",
  ];

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [chatHistory, isChatLoading, isOpen]);

  const handleSend = () => {
    if (!inputText.trim() || isChatLoading) return;
    onSendMessage(inputText.trim());
    setInputText("");
  };

  const handlePresetClick = (prompt: string) => {
    if (isChatLoading) return;
    onSendMessage(prompt);
  };

  // Simulate elder-friendly voice recognition with visual feedback
  const handleVoiceInputStart = () => {
    if (isChatLoading) return;
    setIsListening(true);
    
    // Simulate speaking and recognizing after 2.5 seconds
    setTimeout(() => {
      setIsListening(false);
      const voicePresetQuestions = [
        "明天下午有什么太极拳活动吗？",
        "帮我看看高血压药几点吃？",
        "我想找人来修一下家里的水管",
        "现在心率正常吗？"
      ];
      const randomQuestion = voicePresetQuestions[Math.floor(Math.random() * voicePresetQuestions.length)];
      onSendMessage(randomQuestion);
    }, 2500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-8 select-none">
          {/* Inner Dialog Box */}
          <motion.div
            initial={{ opacity: 0, y: 120, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 180 }}
            className="flex flex-col w-[1600px] h-[1000px] bg-[#0c120f] border-4 border-brand-green/40 rounded-[32px] overflow-hidden shadow-[0_30px_120px_rgba(0,0,0,0.9)]"
            id="smart-assistant-modal"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-10 py-7 bg-white border-b-2 border-[#EBE6DD] shrink-0">
              <div className="flex items-center gap-5">
                <div className="relative w-14 h-14 rounded-full bg-[#EAF6EF] flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-brand-green" />
                  <div className="absolute inset-0 rounded-full bg-emerald-400/20 blur-md animate-pulse" />
                </div>
                <div className="text-left font-sans">
                  <h2 className="text-[32px] font-black text-[#1C2C24] tracking-wide">
                    智能健康照护助理 · 小U
                  </h2>
                  <span className="text-base font-bold text-brand-green tracking-widest flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-brand-green animate-ping" />
                    语音系统已就绪 · 您可以随时大声说话提问
                  </span>
                </div>
              </div>

              {/* Close Button - Huge & Easy to Click for Seniors */}
              <button
                onClick={onClose}
                className="flex items-center gap-3 px-8 py-4.5 bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 rounded-2xl border-2 border-red-200 transition-all active:scale-95 cursor-pointer"
                id="btn-close-assistant"
              >
                <X className="w-7 h-7 stroke-[3]" />
                <span className="text-[24px] font-black">关闭 · 返回首页</span>
              </button>
            </div>

            {/* Conversation Log View - Enormous Text Sizes */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-10 py-8 space-y-8 custom-scroll bg-[#FCFAF7]"
            >
              {chatHistory.map((chat, idx) => (
                <div
                  key={idx}
                  className={`flex ${chat.sender === "user" ? "justify-end" : "justify-start"} items-end gap-3.5`}
                >
                  {chat.sender === "assistant" && (
                    <div className="w-12 h-12 rounded-full bg-[#EAF6EF] flex items-center justify-center text-brand-green shrink-0 border border-[#C3E6D2]">
                      <Sparkles className="w-6 h-6" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[80%] rounded-[24px] px-8 py-6 shadow-sm leading-normal ${
                      chat.sender === "user"
                        ? "bg-brand-green text-white font-black rounded-br-sm shadow-[0_4px_12px_rgba(37,111,79,0.15)]"
                        : "bg-white border-2 border-[#C3E6D2] text-[#1C2C24] font-black rounded-bl-sm"
                    }`}
                  >
                    {/* The critical requirement is at least 28px text for elderly clarity */}
                    <p className="text-[28px] tracking-wide leading-snug whitespace-pre-wrap">{chat.text}</p>
                    <span
                      className={`text-sm font-mono font-bold block mt-3.5 opacity-60 ${
                        chat.sender === "user" ? "text-right text-emerald-100" : "text-left text-gray-500"
                      }`}
                    >
                      时间: {chat.timestamp}
                    </span>
                  </div>
                </div>
              ))}

              {isChatLoading && (
                <div className="flex justify-start items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#EAF6EF] flex items-center justify-center text-brand-green shrink-0 animate-spin border border-[#C3E6D2]">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div className="bg-white border-2 border-[#C3E6D2] text-brand-green rounded-3xl px-8 py-5 flex items-center gap-4 shadow-sm">
                    {/* Simulated Voice Equalizer Waveforms */}
                    <div className="flex items-center gap-1.5 h-6">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className="w-1.5 bg-brand-green rounded-full animate-pulse"
                          style={{
                            height: `${Math.floor(Math.random() * 20) + 10}px`,
                            animationDelay: `${i * 0.15}s`,
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-[24px] font-black tracking-wide">
                      小U正在听、正在为您查找中...
                    </span>
                  </div>
                </div>
              )}

              {/* Simulated Voice Listening Dialog overlay */}
              {isListening && (
                <div className="flex justify-center my-8">
                  <div className="bg-[#EAF6EF] border-2 border-[#C3E6D2] rounded-[28px] p-8 flex flex-col items-center max-w-xl text-center shadow-md animate-pulse">
                    <div className="w-20 h-20 rounded-full bg-brand-green/15 flex items-center justify-center text-brand-green mb-4 animate-bounce">
                      <Mic className="w-10 h-10" />
                    </div>
                    <h3 className="text-[28px] font-black text-[#1C2C24]">正在听您说话...</h3>
                    <p className="text-lg text-brand-green mt-2 font-black">请大声说，说完我将立刻为您解答</p>
                    <div className="flex justify-center items-center gap-2 mt-5 h-8 w-60">
                      {[...Array(16)].map((_, i) => (
                        <div
                          key={i}
                          className="w-1 bg-brand-green rounded-full animate-bounce"
                          style={{
                            height: `${Math.floor(Math.random() * 32) + 8}px`,
                            animationDelay: `${i * 0.08}s`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Helper Recommendation Chips - Extremely big and touch-friendly */}
            <div className="px-10 py-5 bg-[#FCFAF7] border-t border-[#EBE6DD] shrink-0">
              <span className="text-base text-gray-500 font-black tracking-widest uppercase block text-left mb-3">
                您可以直接点击这些问题问我：
              </span>
              <div className="flex flex-wrap gap-4">
                {presetPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handlePresetClick(prompt)}
                    className="px-6 py-4 bg-white hover:bg-[#EAF6EF] text-[#256f4f] hover:text-[#1c533c] text-[22px] font-black rounded-2xl border-2 border-[#C3E6D2] hover:border-brand-green transition-all cursor-pointer whitespace-nowrap shadow-sm active:scale-95"
                  >
                    💡 {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Input Bar - Huge bar at bottom */}
            <div className="px-10 py-6 bg-white border-t-2 border-[#EBE6DD] flex items-center gap-6 shrink-0">
              {/* Giant Voice Dictation Button */}
              <button
                onClick={handleVoiceInputStart}
                disabled={isChatLoading || isListening}
                className="flex items-center gap-3 px-8 h-20 rounded-2xl bg-[#EAF6EF] hover:bg-[#C3E6D2] text-[#256f4f] border-2 border-[#C3E6D2] hover:border-brand-green transition-all duration-300 active:scale-95 cursor-pointer disabled:opacity-40 disabled:pointer-events-none font-sans"
                title="语音提问"
              >
                <Mic className="w-8 h-8 stroke-[2.5]" />
                <span className="text-[26px] font-black">点击说话</span>
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="在此输入您想问小U的问题..."
                className="flex-1 h-20 bg-[#FAF8F5] border-2 border-[#EBE6DD] focus:border-brand-green focus:bg-white text-[#1C2C24] rounded-2xl px-7 text-[26px] font-bold outline-none placeholder-gray-400 transition-all shadow-inner"
              />

              <button
                onClick={handleSend}
                disabled={!inputText.trim() || isChatLoading}
                className="w-20 h-20 rounded-2xl bg-brand-green hover:bg-brand-green-hover disabled:bg-gray-200 disabled:opacity-40 text-white flex items-center justify-center shadow-lg transition-all duration-300 active:scale-95 cursor-pointer"
                id="btn-send-assistant"
              >
                <Send className="w-9 h-9 stroke-[2.5]" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
