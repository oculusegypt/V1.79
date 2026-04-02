import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Share2 } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiUrl } from "@/lib/api-base";
import { getAuthHeader } from "@/lib/auth-client";
import { getSessionId } from "@/lib/session";

const STAGES = [
  { min: 0,    max: 49,   emoji: "🌱", name: "بذرة",    nameEn: "Seed",     color: "#a7f3d0", bg: "#022c22", desc: "رحلتك بدأت — كل ذكر يُحيي قلبك",         size: 80  },
  { min: 50,   max: 199,  emoji: "🌿", name: "شتلة",    nameEn: "Seedling", color: "#6ee7b7", bg: "#064e3b", desc: "شتلتك تنمو — واصل الذكر والاستغفار",       size: 130 },
  { min: 200,  max: 499,  emoji: "🌳", name: "شجرة",    nameEn: "Tree",     color: "#34d399", bg: "#065f46", desc: "شجرتك باسقة — ثمارها تطول السماء",         size: 190 },
  { min: 500,  max: 999,  emoji: "🌲", name: "غابة",    nameEn: "Forest",   color: "#10b981", bg: "#047857", desc: "غابتك أينعت — قلبٌ عامرٌ بذكر الله",       size: 240 },
  { min: 1000, max: Infinity, emoji: "🏡", name: "جنّة", nameEn: "Garden",  color: "#34d399", bg: "#022c22", desc: "حديقتك من جنان الله — واصل رحلتك العظيمة", size: 240 },
];

const MOTIVATIONS = [
  "كل ضغطة ذكر تُسقط ذنباً وتُنبت نوراً",
  "«ألا بذكر الله تطمئن القلوب» — الرعد: ٢٨",
  "ابنِ حديقتك — ذكرٌ فذكرٌ، يوماً فيوماً",
  "شجرتك في الجنة تنتظر — ابدأ الآن",
  "«من قال سبحان الله وبحمده غُرست له نخلة في الجنة»",
];

function TreeVisual({ emoji, size, color }: { emoji: string; size: number; color: string }) {
  return (
    <div className="flex flex-col items-center justify-end" style={{ height: 260 }}>
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: size * 1.6, height: 40,
          background: `radial-gradient(ellipse, ${color}40 0%, transparent 75%)`,
          filter: "blur(10px)",
        }}
      />
      <motion.div
        key={emoji + size}
        initial={{ scale: 0.5, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
        style={{ fontSize: size, lineHeight: 1, filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.4))" }}
      >
        {emoji}
      </motion.div>
      <div className="w-3 rounded-full mt-1" style={{ height: 20, background: "rgba(160,100,40,0.6)" }} />
      <div className="w-[70%] rounded-full mt-1" style={{ height: 3, background: `${color}50` }} />
    </div>
  );
}

interface Journey30Summary { completedCount: number; streakDays: number; }

export default function Garden() {
  const sessionId = getSessionId();

  const [dhikrCount, setDhikrCount] = useState(() => {
    try { return parseInt(localStorage.getItem("home_dhikr_count") ?? "0") || 0; } catch { return 0; }
  });
  const [tapCount, setTapCount] = useState(0);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number }[]>([]);
  const [motivIdx, setMotivIdx] = useState(0);
  const [shared, setShared] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  const { data: j30 } = useQuery<Journey30Summary>({
    queryKey: ["journey30-garden", sessionId],
    queryFn: async () => {
      const res = await fetch(apiUrl("/api/journey30"), { headers: { ...getAuthHeader() } });
      const data = await res.json();
      return { completedCount: data.completedCount ?? 0, streakDays: data.streakDays ?? 0 };
    },
    enabled: !!sessionId,
    staleTime: 60 * 1000,
  });

  const journeyDays = j30?.completedCount ?? 0;
  const journeyStreak = j30?.streakDays ?? 0;

  // Combined score: dhikr + journey bonus (each journey day = 10 dhikr)
  const count = dhikrCount + journeyDays * 10;

  const stage = STAGES.find(s => count >= s.min && count <= s.max) ?? STAGES[STAGES.length - 1]!;
  const nextStage = STAGES.find(s => s.min > count);
  const toNext = nextStage ? nextStage.min - count : 0;
  const progressPct = nextStage
    ? Math.round(((count - stage.min) / (nextStage.min - stage.min)) * 100)
    : 100;

  useEffect(() => {
    const t = setInterval(() => setMotivIdx(i => (i + 1) % MOTIVATIONS.length), 5000);
    return () => clearInterval(t);
  }, []);

  const handleDhikr = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    setParticles(prev => [...prev, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    const next = dhikrCount + 1;
    setDhikrCount(next);
    setTapCount(t => t + 1);
    try { localStorage.setItem("home_dhikr_count", String(next)); } catch {}
    if (navigator.vibrate) navigator.vibrate(12);
    setTimeout(() => setParticles(prev => prev.filter(p => p.id !== id)), 900);
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: "شجرة التوبة 🌱",
        text: `حديقتي وصلت مرحلة "${stage.name}" بعد ${dhikrCount.toLocaleString("ar-EG")} ذكر و${journeyDays} يوماً من الرحلة! انضم إلى تطبيق توبة 🌿`,
      });
    } catch {
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: `linear-gradient(160deg, ${stage.bg} 0%, #000 100%)` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <Link href="/">
          <button className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.1)" }}>
            <ArrowRight size={18} style={{ color: "rgba(255,255,255,0.8)" }} />
          </button>
        </Link>
        <div className="text-center">
          <h1 className="font-bold text-base" style={{ color: "#fff" }}>شجرة التوبة 🌱</h1>
          <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.45)" }}>حديقتك الروحية الخاصة</p>
        </div>
        <button onClick={handleShare} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.1)" }}>
          {shared ? <span className="text-[13px]">✓</span> : <Share2 size={16} style={{ color: "rgba(255,255,255,0.8)" }} />}
        </button>
      </div>

      {/* Stage badge */}
      <div className="flex justify-center mt-1 gap-2">
        <div className="px-4 py-1 rounded-full text-[11px] font-bold" style={{ background: `${stage.color}25`, border: `1px solid ${stage.color}50`, color: stage.color }}>
          مرحلة: {stage.name}
        </div>
        {journeyDays > 0 && (
          <div className="px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1"
            style={{ background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.3)", color: "#fbbf24" }}>
            🗓️ رحلة {journeyDays}/٣٠
          </div>
        )}
      </div>

      {/* Tree visual area */}
      <div className="flex-1 flex flex-col items-center justify-center relative px-6">
        {/* Stars BG */}
        {Array.from({ length: 18 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${(i * 23 + 7) % 100}%`,
              top: `${(i * 17 + 5) % 60}%`,
              width: i % 3 === 0 ? 2 : 1.5,
              height: i % 3 === 0 ? 2 : 1.5,
              background: stage.color,
            }}
            animate={{ opacity: [0.1, 0.5, 0.1] }}
            transition={{ duration: 2 + (i % 4), repeat: Infinity, delay: (i * 0.35) % 2.5 }}
          />
        ))}

        <TreeVisual emoji={stage.emoji} size={stage.size} color={stage.color} />

        {/* Journey glow badge */}
        {journeyDays >= 7 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="mt-2 px-3 py-1.5 rounded-full text-[11px] font-bold text-center"
            style={{ background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.3)", color: "#fbbf24" }}
          >
            ✨ {journeyDays >= 30 ? "أتممت الرحلة — شجرتك اكتملت!" : `${journeyDays} أيام في رحلة التوبة`}
          </motion.div>
        )}

        {/* Motivation */}
        <div className="mt-3 px-6 text-center" style={{ minHeight: 40 }}>
          <AnimatePresence mode="wait">
            <motion.p
              key={motivIdx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4 }}
              className="text-[12px] leading-relaxed"
              style={{ color: "rgba(255,255,255,0.6)", fontFamily: "'Amiri Quran', serif" }}
            >
              {MOTIVATIONS[motivIdx]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* Stats row */}
      <div className="px-4 pb-2">
        <div className="flex gap-2 justify-center mb-3">
          {[
            { label: "إجمالي الذكر", value: dhikrCount.toLocaleString("ar-EG") },
            { label: "أيام الرحلة",  value: journeyDays > 0 ? `${journeyDays}/٣٠` : "—" },
            { label: "هذه الجلسة",   value: tapCount.toLocaleString("ar-EG") },
          ].map(({ label, value }) => (
            <div key={label} className="flex-1 rounded-2xl p-3 text-center" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <p className="font-bold text-[16px]" style={{ color: stage.color }}>{value}</p>
              <p className="text-[9px] mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Progress to next */}
        {nextStage && (
          <div className="mb-3">
            <div className="flex justify-between mb-1">
              <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>{stage.name}</span>
              <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>{nextStage.name} ← {toNext} نقطة</span>
            </div>
            <div className="w-full rounded-full overflow-hidden" style={{ height: 5, background: "rgba(255,255,255,0.1)" }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: `linear-gradient(to left, ${stage.color}, ${nextStage.color})` }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}

        {/* Dhikr button */}
        <motion.button
          ref={btnRef}
          onClick={handleDhikr}
          className="relative overflow-hidden w-full py-5 rounded-[22px] font-bold text-lg active:scale-[0.97] transition-transform select-none mb-4"
          style={{
            background: `linear-gradient(135deg, ${stage.color}33 0%, ${stage.color}18 100%)`,
            border: `2px solid ${stage.color}55`,
            color: stage.color,
          }}
          whileTap={{ scale: 0.96 }}
        >
          {particles.map(p => (
            <motion.div
              key={p.id}
              className="absolute rounded-full pointer-events-none"
              style={{ left: p.x, top: p.y, x: "-50%", y: "-50%", background: `${stage.color}44` }}
              initial={{ width: 0, height: 0, opacity: 1 }}
              animate={{ width: 280, height: 280, opacity: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            />
          ))}
          <span className="relative z-10">اسقِ شجرتك — اضغط للذكر 🌿</span>
        </motion.button>

        {journeyDays < 30 && (
          <Link href="/journey">
            <button
              className="w-full py-2.5 rounded-[18px] text-sm font-bold mb-4 transition-all active:scale-[0.97]"
              style={{
                background: "rgba(251,191,36,0.12)",
                border: "1px solid rgba(251,191,36,0.25)",
                color: "#fbbf24",
              }}
            >
              🗓️ تابع رحلة التوبة ٣٠ يوماً ← اضغط هنا
            </button>
          </Link>
        )}
      </div>
    </div>
  );
}
