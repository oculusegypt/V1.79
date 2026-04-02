import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { X, BookText, Sparkles, Moon, Sun, Star, BookMarked, MessageCircle } from "lucide-react";
import { BANNER_SLIDES, TYPE_STYLES } from "./banner-data";
import type { BannerItem } from "./types";

const SLIDE_DURATION = 8;

const ICON_MAP = {
  sparkles: Sparkles,
  moon: Moon,
  sun: Sun,
  star: Star,
  book: BookMarked,
  chat: MessageCircle,
};

// ─── TafsirSheet ──────────────────────────────────────────────────────────────

export function TafsirSheet({
  item,
  onClose,
}: {
  item: BannerItem;
  onClose: () => void;
}) {
  const styles = TYPE_STYLES[item.type];
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 260 }}
          className="w-full max-w-md bg-card rounded-t-3xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-muted-foreground/25 rounded-full" />
          </div>
          <div
            className={`flex items-center justify-between px-5 py-3 bg-gradient-to-r ${styles.gradient} border-b ${styles.border}`}
          >
            <div className="flex items-center gap-2">
              <BookText size={16} className={styles.iconColor} />
              <span className={`font-bold text-sm ${styles.iconColor}`}>
                التفسير الميسر
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-background/60 hover:bg-background/90 transition-colors"
            >
              <X size={14} className="text-muted-foreground" />
            </button>
          </div>
          <div className="px-5 pt-4 pb-2">
            <p className="text-sm font-semibold text-foreground leading-loose text-center font-arabic mb-3">
              {item.content}
            </p>
            <div className="h-px bg-border/60 my-3" />
            <p
              className="text-sm text-foreground/80 leading-relaxed text-right"
              dir="rtl"
            >
              {item.tafsir}
            </p>
          </div>
          <div className="px-5 py-4 flex justify-end">
            <button
              onClick={onClose}
              className={`px-5 py-2 rounded-xl text-xs font-bold ${styles.iconColor} bg-gradient-to-r ${styles.gradient} border ${styles.border}`}
            >
              حفظ الله قلبك
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── DynamicBanner ────────────────────────────────────────────────────────────

export function DynamicBanner() {
  const [idx, setIdx] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setIdx((i) => (i + 1) % BANNER_SLIDES.length);
    }, SLIDE_DURATION * 1000);
    return () => clearInterval(timer);
  }, []);

  if (dismissed) return null;

  const slide = BANNER_SLIDES[idx]!;
  const IconComp = ICON_MAP[slide.icon];

  return (
    <div
      className="rounded-2xl overflow-hidden shadow-sm"
      style={{ background: slide.bg, border: `1px solid ${slide.borderColor}` }}
    >
      <div className="flex items-center gap-1.5 px-4 pt-3 pb-1.5">
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: 6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.22 }}
            className="flex items-center gap-1.5 flex-1"
          >
            <IconComp
              size={13}
              style={{ color: slide.accent }}
              className="shrink-0"
            />
            <span
              className="font-bold text-[11px]"
              style={{ color: slide.labelColor }}
            >
              {slide.label}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-start gap-3 px-4 pb-3">
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={idx}
              initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -12, filter: "blur(6px)" }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="text-[12.5px] leading-relaxed text-foreground/80"
              dir="rtl"
            >
              {slide.text}
            </motion.p>
          </AnimatePresence>
        </div>

        <button
          onClick={() => setDismissed(true)}
          aria-label="إغلاق"
          className="mt-0.5 w-6 h-6 flex items-center justify-center rounded-full shrink-0 transition-all active:scale-90"
          style={{ background: "rgba(0,0,0,0.08)" }}
        >
          <X size={11} className="text-foreground/50" />
        </button>
      </div>

      <div
        className="h-[3px] w-full"
        style={{ background: "rgba(0,0,0,0.07)" }}
      >
        <motion.div
          key={idx}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: SLIDE_DURATION, ease: "linear" }}
          className="h-full origin-right"
          style={{ background: slide.accent, opacity: 0.55 }}
        />
      </div>
    </div>
  );
}
