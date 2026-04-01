import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useLocation } from "wouter";

type Mood = {
  id: string;
  emoji: string;
  label: string;
  sublabel: string;
  href: string;
  glowColor: string;
  borderColor: string;
  bgGradient: string;
  textColor: string;
  rippleColor: string;
};

const MOODS: Mood[] = [
  {
    id: "broken",
    emoji: "💔",
    label: "محطّم",
    sublabel: "أدعية الجبر",
    href: "/relapse",
    glowColor: "rgba(244,63,94,0.35)",
    borderColor: "rgba(244,63,94,0.35)",
    bgGradient: "linear-gradient(135deg, rgba(244,63,94,0.18) 0%, rgba(244,63,94,0.06) 100%)",
    textColor: "#f43f5e",
    rippleColor: "rgba(244,63,94,0.2)",
  },
  {
    id: "istighfar",
    emoji: "🤲",
    label: "مستغفر",
    sublabel: "عداد الاستغفار",
    href: "/dhikr",
    glowColor: "rgba(251,191,36,0.4)",
    borderColor: "rgba(251,191,36,0.38)",
    bgGradient: "linear-gradient(135deg, rgba(251,191,36,0.2) 0%, rgba(251,191,36,0.07) 100%)",
    textColor: "#d97706",
    rippleColor: "rgba(251,191,36,0.22)",
  },
  {
    id: "lost",
    emoji: "🌫️",
    label: "تائه",
    sublabel: "البوت الزكي",
    href: "/zakiy",
    glowColor: "rgba(99,102,241,0.38)",
    borderColor: "rgba(99,102,241,0.35)",
    bgGradient: "linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(99,102,241,0.06) 100%)",
    textColor: "#6366f1",
    rippleColor: "rgba(99,102,241,0.2)",
  },
  {
    id: "grateful",
    emoji: "🌿",
    label: "شاكر",
    sublabel: "مكتبة الرجاء",
    href: "/rajaa",
    glowColor: "rgba(16,185,129,0.38)",
    borderColor: "rgba(16,185,129,0.35)",
    bgGradient: "linear-gradient(135deg, rgba(16,185,129,0.18) 0%, rgba(16,185,129,0.06) 100%)",
    textColor: "#059669",
    rippleColor: "rgba(16,185,129,0.22)",
  },
];

function MoodCard({ mood, onSelect, selected }: { mood: Mood; onSelect: (m: Mood) => void; selected: boolean }) {
  const [ripple, setRipple] = useState(false);

  const handleTap = () => {
    setRipple(true);
    setTimeout(() => setRipple(false), 400);
    onSelect(mood);
  };

  return (
    <motion.button
      onClick={handleTap}
      whileTap={{ scale: 0.92 }}
      className="relative flex flex-col items-center justify-center gap-1 rounded-2xl overflow-hidden"
      style={{
        flex: 1,
        minWidth: 0,
        paddingTop: 14,
        paddingBottom: 12,
        background: mood.bgGradient,
        border: `1px solid ${selected ? mood.borderColor : "rgba(255,255,255,0.12)"}`,
        boxShadow: selected
          ? `0 0 18px ${mood.glowColor}, 0 4px 12px rgba(0,0,0,0.12)`
          : "0 2px 8px rgba(0,0,0,0.07)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        transition: "box-shadow 0.3s, border-color 0.3s",
      }}
    >
      {/* Ripple */}
      <AnimatePresence>
        {ripple && (
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{ background: mood.rippleColor, transformOrigin: "center" }}
          />
        )}
      </AnimatePresence>

      {/* Shine */}
      <div
        className="absolute top-0 inset-x-0 h-[40%] pointer-events-none rounded-t-2xl"
        style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.13) 0%, transparent 100%)" }}
      />

      {/* Selected indicator */}
      {selected && (
        <motion.div
          layoutId="mood-selected"
          className="absolute top-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
          style={{ background: mood.textColor }}
        />
      )}

      <span className="text-[22px] leading-none">{mood.emoji}</span>
      <p className="font-bold text-[11px] leading-none mt-0.5" style={{ color: mood.textColor }}>
        {mood.label}
      </p>
      <p className="text-[9px] leading-none mt-0.5 opacity-70" style={{ color: mood.textColor }}>
        {mood.sublabel}
      </p>
    </motion.button>
  );
}

export function MoodSelector() {
  const [selected, setSelected] = useState<string | null>(null);
  const [, navigate] = useLocation();

  const handleSelect = (mood: Mood) => {
    setSelected(mood.id);
    setTimeout(() => {
      navigate(mood.href);
    }, 280);
  };

  return (
    <div className="px-0">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2.5 px-1">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
        <p className="text-[11px] font-semibold text-muted-foreground tracking-wide">كيف أنت الآن؟</p>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent via-border to-transparent" />
      </div>

      {/* Cards row */}
      <div className="flex gap-2">
        {MOODS.map((mood) => (
          <MoodCard
            key={mood.id}
            mood={mood}
            onSelect={handleSelect}
            selected={selected === mood.id}
          />
        ))}
      </div>
    </div>
  );
}
