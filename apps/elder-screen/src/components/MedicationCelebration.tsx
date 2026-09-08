import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Star, CheckCircle, X } from "lucide-react";
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

  const isDailyReminder = reminder.category === "schedule";
  const completionTitle = isDailyReminder ? "本次事项已完成" : "本次用药已完成";
  const statusLabel = isDailyReminder ? "已确认完成" : "已确认服用";

  return (
    <AnimatePresence>
      <div className="absolute inset-0 bg-[#02070d]/82 backdrop-blur-md z-50 flex items-center justify-center p-6 select-none">
        
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
          className="w-[500px] bg-[#0B1724] border-2 border-[#2B8B62] rounded-[28px] p-8 shadow-[0_28px_90px_rgba(0,0,0,0.72),0_0_36px_rgba(46,204,113,0.15)] relative overflow-hidden flex flex-col items-center"
        >
          {/* Close corner button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center bg-[#17283A] hover:bg-[#223A50] border border-[#334A60] rounded-full text-[#DCE8F2] transition-all cursor-pointer"
            title="关闭"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Golden Badge */}
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-yellow-300 via-amber-400 to-amber-500 shadow-[0_0_28px_rgba(251,191,36,0.5)] border-2 border-amber-200 mb-5 shrink-0">
            <Star className="w-10 h-10 text-white fill-white animate-pulse" />
          </div>

          {/* Core Information */}
          <div className="text-center w-full">
            <h2 className="text-[30px] font-black text-white tracking-wide leading-tight flex items-center justify-center gap-2">
              <span>{completionTitle}</span>
              <span>👍</span>
            </h2>
            
            {/* Medication Card Details */}
            <div className="mt-6 p-5 bg-[#132335] border border-[#31506A] rounded-2xl text-left shadow-inner">
              <span className="text-sm font-black text-[#72E39E] bg-[#123A2B] px-3 py-1 rounded-full border border-[#2B8B62]">
                {statusLabel}
              </span>
              <p className="text-[25px] font-black text-white mt-3 leading-snug">
                {reminder.name}
              </p>
            </div>
          </div>

          {/* Bottom CTA Button */}
          <button
            onClick={onClose}
            className="mt-7 w-full min-h-16 py-3 bg-[#16834F] hover:bg-[#1B9A5E] border border-[#48C985] text-white text-[20px] font-black rounded-2xl shadow-[0_10px_28px_rgba(22,131,79,0.32)] transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <CheckCircle className="w-5 h-5" />
            <span>好的，我知道了</span>
          </button>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
