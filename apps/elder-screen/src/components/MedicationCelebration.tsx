import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Star, CheckCircle, X, Volume2 } from "lucide-react";
import { speakText, stopSpeech } from "../audio/speech";
import { MedicationReminder } from "../types";

interface MedicationCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  reminder: MedicationReminder | null;
  totalCompleted: number;
  totalReminders: number;
}

interface ConfettiItem {
  id: number;
  char: string;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
}

export default function MedicationCelebration({
  isOpen,
  onClose,
  reminder,
  totalCompleted,
  totalReminders,
}: MedicationCelebrationProps) {
  const [particles, setParticles] = useState<ConfettiItem[]>([]);

  // Trigger simple celebratory particle burst on open
  useEffect(() => {
    if (isOpen) {
      const items = ["❤️", "🌸", "✨", "👍", "👏"];
      const newParticles: ConfettiItem[] = Array.from({ length: 20 }).map((_, i) => ({
        id: Date.now() + i,
        char: items[Math.floor(Math.random() * items.length)],
        x: Math.random() * 80 + 10,
        y: Math.random() * 20 + 80,
        size: Math.floor(Math.random() * 20) + 24, // Legible for elderly
        delay: Math.random() * 0.3,
        duration: Math.random() * 1.5 + 1.5,
      }));
      setParticles(newParticles);
    }
  }, [isOpen, reminder]);

  useEffect(() => {
    if (!isOpen || !reminder) return;
    const isDailyReminder = reminder.category === "schedule";
    speakText(
      isDailyReminder
        ? `本次事项已完成。做得很好，${reminder.name}已经完成。慢慢来，注意安全。`
        : `本次用药已完成。${reminder.name}已经确认服用，请安心休息。`,
      {
        fallbackKey: isDailyReminder ? "daily-complete" : "medication-complete",
        rate: 0.86,
      },
    );
    return stopSpeech;
  }, [isOpen, reminder]);

  if (!isOpen || !reminder) return null;

  const isGrandSlam = totalCompleted === totalReminders;
  const isDailyReminder = reminder.category === "schedule";
  const completionTitle = isDailyReminder ? "本次事项已完成" : "本次用药已完成";
  const statusLabel = isDailyReminder ? "已确认完成" : "已确认服用";
  const progressTitle = isDailyReminder ? "今日日常提醒进度：" : "今日服药进度：";
  const progressValue = isDailyReminder
    ? `已完成 ${totalCompleted} / ${totalReminders} 件`
    : `已服 ${totalCompleted} / ${totalReminders} 次`;
  const completedAllCopy = isDailyReminder
    ? "太棒了！今天的日常事项都已顺利完成！"
    : "太棒了！今天所有的服药任务都已顺利完成！";
  const assistantCopy = isDailyReminder
    ? `“做得很好，${reminder.name}已经完成。慢慢来，注意安全哦！”`
    : "“温水送服最适宜。记得按时服用，好好保重身体，保持好心情哦！”";

  return (
    <AnimatePresence>
      <div className="absolute inset-0 bg-[#121915]/85 backdrop-blur-md z-50 flex items-center justify-center p-6 select-none">
        
        {/* Simple Particle Overlay */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: `${p.x}vw`, y: "100vh" }}
              animate={{ 
                opacity: [0, 1, 1, 0],
                y: "-10vh",
                x: `${p.x + (Math.random() * 15 - 7.5)}vw`,
                rotate: Math.random() * 180 - 90,
              }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                ease: "easeOut",
              }}
              style={{ fontSize: `${p.size}px` }}
              className="absolute select-none z-40 drop-shadow-md"
            >
              {p.char}
            </motion.div>
          ))}
        </div>

        {/* Clean, Focused Dialog */}
        <motion.div
          initial={{ scale: 0.95, y: 15, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 15, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="w-[520px] bg-[#FAF8F5] border-4 border-[#C3E6D2] rounded-2xl p-7 shadow-2xl relative overflow-hidden flex flex-col items-center"
        >
          {/* Close corner button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-[#E5DFD5]/60 hover:bg-[#D0C9BC] rounded-full text-gray-700 transition-all cursor-pointer"
            title="关闭"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Golden Badge */}
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-yellow-300 via-amber-400 to-amber-500 shadow-lg border-2 border-white mb-4 shrink-0">
            <Star className="w-10 h-10 text-white fill-white animate-pulse" />
          </div>

          {/* Core Information */}
          <div className="text-center w-full">
            <h2 className="text-[28px] font-black text-[#1C2C24] tracking-wide leading-tight flex items-center justify-center gap-2">
              <span>{completionTitle}</span>
              <span className="text-brand-green">👍</span>
            </h2>
            
            {/* Medication Card Details */}
            <div className="mt-4 p-4.5 bg-white border border-[#C3E6D2] rounded-xl text-left shadow-sm">
              <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {statusLabel}
              </span>
              <p className="text-[24px] font-black text-[#1C2C24] mt-1.5 leading-snug">
                {reminder.name}
              </p>
              <div className="flex justify-between items-center mt-3 text-sm text-gray-500 font-bold border-t border-[#EBE6DD]/60 pt-2.5">
                <span>设定时间：{reminder.time}</span>
                <span className="text-brand-green">确认于：{reminder.takenAt}</span>
              </div>
            </div>
          </div>

          {/* Today's Medication Progress */}
          <div className="w-full bg-[#E5DFD5]/40 rounded-xl p-4 mt-4 border border-[#EBE6DD] text-left">
            <div className="flex justify-between items-center mb-2 text-sm font-bold text-gray-600">
              <span>{progressTitle}</span>
              <span className="text-brand-green font-black">
                {progressValue}
              </span>
            </div>
            
            <div className="w-full bg-[#E5DFD5]/80 h-4 rounded-full overflow-hidden flex p-0.5 relative">
              <div 
                style={{ width: `${(totalCompleted / totalReminders) * 100}%` }} 
                className="bg-brand-green h-full rounded-full transition-all duration-500" 
              />
            </div>

            {isGrandSlam && (
              <p className="text-xs font-black text-amber-700 mt-2 text-center flex items-center justify-center gap-1">
                ⭐ {completedAllCopy}
              </p>
            )}
          </div>

          {/* Warm Audio Assistant Voice Banner */}
          <div className="w-full bg-[#EAF6EF] border border-[#C3E6D2] rounded-xl p-3.5 mt-4 text-left flex items-start gap-2.5">
            <Volume2 className="w-5 h-5 text-brand-green shrink-0 mt-0.5" />
            <div className="text-sm font-bold text-[#1C2C24] leading-relaxed">
              <p className="text-brand-green font-black mb-0.5 text-xs">小U语音叮嘱：</p>
              {assistantCopy}
            </div>
          </div>

          {/* Bottom CTA Button */}
          <button
            onClick={onClose}
            className="mt-6 w-full py-3 bg-brand-green hover:bg-brand-green-hover text-white text-[18px] font-black rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            <span>好的，我知道了</span>
          </button>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
