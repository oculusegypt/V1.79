import { motion } from "framer-motion";
import { Star, ArrowLeft, CheckCircle2 } from "lucide-react";

interface Props {
  dayTitle: string;
  dayEmoji: string;
  verse: string;
  nextDayNum: number;
  onNext: () => void;
  isLoading: boolean;
}

export function CompletionCard({
  dayTitle,
  dayEmoji,
  verse,
  nextDayNum,
  onNext,
  isLoading,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 20 }}
      className="relative rounded-3xl overflow-hidden"
      style={{
        background:
          "linear-gradient(145deg, rgba(5,150,105,0.14) 0%, rgba(4,120,87,0.07) 50%, rgba(251,191,36,0.10) 100%)",
        border: "1px solid rgba(5,150,105,0.3)",
        boxShadow: "0 8px 32px rgba(5,150,105,0.18)",
      }}
    >
      {/* shimmer top line */}
      <div
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{
          background:
            "linear-gradient(90deg, transparent, #fbbf24 30%, #10b981 70%, transparent)",
        }}
      />

      <div className="p-5">
        {/* Stars */}
        <div className="flex justify-center gap-1.5 mb-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.08 * i, type: "spring", stiffness: 400, damping: 16 }}
            >
              <Star size={17} className="text-amber-400 fill-amber-400" />
            </motion.div>
          ))}
        </div>

        {/* Day icon + name */}
        <div className="flex flex-col items-center gap-2 mb-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.25, type: "spring", stiffness: 260 }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-md"
            style={{
              background: "rgba(5,150,105,0.12)",
              border: "1px solid rgba(5,150,105,0.25)",
            }}
          >
            {dayEmoji}
          </motion.div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 mb-0.5">
              <CheckCircle2 size={13} className="text-emerald-500" />
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 tracking-wide">
                اكتمل بنجاح
              </span>
            </div>
            <p className="text-[20px] font-black text-foreground leading-tight">{dayTitle}</p>
          </div>
        </div>

        {/* Verse */}
        <div
          className="rounded-2xl px-4 py-3 mb-4 text-center"
          style={{
            background: "rgba(0,0,0,0.12)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <p
            className="text-[14px] leading-relaxed text-primary"
            style={{ fontFamily: "'Amiri Quran', 'Amiri', serif" }}
          >
            {verse}
          </p>
        </div>

        {/* Next day button */}
        {nextDayNum <= 30 ? (
          <motion.button
            onClick={onNext}
            disabled={isLoading}
            whileTap={{ scale: 0.97 }}
            animate={{
              boxShadow: [
                "0 4px 20px rgba(5,150,105,0.35)",
                "0 6px 28px rgba(5,150,105,0.60)",
                "0 4px 20px rgba(5,150,105,0.35)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-full h-[52px] rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2.5 disabled:opacity-60 text-white"
            style={{ background: "linear-gradient(to left, #059669, #047857)" }}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>الانتقال إلى اليوم {nextDayNum}</span>
                <ArrowLeft size={17} />
              </>
            )}
          </motion.button>
        ) : (
          <p className="text-center text-sm font-bold text-emerald-600 dark:text-emerald-400">
            🎉 أتممت الرحلة كاملة!
          </p>
        )}
      </div>
    </motion.div>
  );
}
