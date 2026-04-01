import { motion } from "framer-motion";
import { Star, Trophy } from "lucide-react";

interface Props {
  dayTitle: string;
  nextDayNum: number;
  onNavigateNext: () => void;
  isNavigating: boolean;
}

export function CompletionBanner({ dayTitle, nextDayNum, onNavigateNext, isNavigating }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -24, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className="rounded-3xl overflow-hidden relative"
      style={{
        background:
          "linear-gradient(135deg, rgba(5,150,105,0.18) 0%, rgba(4,120,87,0.1) 50%, rgba(251,191,36,0.12) 100%)",
        border: "1px solid rgba(5,150,105,0.35)",
        boxShadow: "0 8px 32px rgba(5,150,105,0.25), 0 0 0 1px rgba(255,255,255,0.04)",
      }}
    >
      <div
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{
          background:
            "linear-gradient(90deg, transparent, #fbbf24, #10b981, #fbbf24, transparent)",
        }}
      />

      <div className="relative p-5 text-center">
        <div className="flex justify-center gap-1.5 mb-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.1 + i * 0.08, type: "spring", stiffness: 400, damping: 14 }}
            >
              <Star size={18} className="text-amber-400 fill-amber-400" />
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-[11px] font-bold tracking-widest mb-1"
          style={{ color: "rgba(16,185,129,0.85)" }}
        >
          أحسنت! اكتمل
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}
          className="text-[22px] font-black mb-2 leading-tight"
          style={{
            background: "linear-gradient(135deg, #ffffff 0%, #fde68a 50%, #10b981 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {dayTitle}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-[12px] leading-relaxed mb-4"
          style={{ color: "rgba(255,255,255,0.55)", fontFamily: "'Amiri Quran', serif" }}
        >
          ﴿إِنَّ اللَّهَ مَعَ الصَّابِرِينَ﴾
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.62 }}
          className="flex items-center justify-center gap-3"
        >
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.3)" }}
          >
            <Trophy size={20} className="text-amber-400" />
          </div>

          {nextDayNum <= 30 && (
            <motion.button
              onClick={onNavigateNext}
              disabled={isNavigating}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-[13px] text-white disabled:opacity-60"
              style={{ background: "linear-gradient(to left, #059669, #047857)" }}
            >
              {isNavigating ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>الانتقال إلى اليوم {nextDayNum}</span>
              )}
            </motion.button>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
