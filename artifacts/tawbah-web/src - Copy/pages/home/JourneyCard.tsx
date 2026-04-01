import { Link } from "wouter";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAppUserProgress } from "@/hooks/use-app-data";
import { getSessionId } from "@/lib/session";
import { isNativeApp } from "@/lib/api-base";
import { useAuth } from "@/context/AuthContext";
import { getAuthHeader } from "@/lib/auth-client";
import {
  StarDots,
  BentoCompassWidget,
  VerseCellBento,
  DhikrCounterCell,
  SecretOfTheDayCellBento,
} from "./bento-cells";

// ─── Journey30HeroCard ────────────────────────────────────────────────────────

interface Journey30Summary {
  completedCount: number;
  currentDay: number;
  streakDays: number;
}

export function Journey30HeroCard() {
  const sessionId = getSessionId();
  const { user } = useAuth();

  const { data: j30 } = useQuery<Journey30Summary>({
    queryKey: ["journey30-home", sessionId],
    queryFn: async () => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 12_000);
      try {
        const res = await fetch("/api/journey30", {
          signal: controller.signal,
          headers: { ...getAuthHeader() },
        });
        if (!res.ok) throw new Error("Failed to fetch journey summary");
        const data = (await res.json()) as Journey30Summary;
        return {
          completedCount: data.completedCount,
          currentDay: data.currentDay,
          streakDays: data.streakDays,
        };
      } catch (e) {
        if (isNativeApp()) {
          return { completedCount: 0, currentDay: 1, streakDays: 0 };
        }
        throw e;
      } finally {
        clearTimeout(id);
      }
    },
    enabled: !!sessionId && !!user,
    staleTime: 60 * 1000,
    retry: 1,
  });

  const completed = j30?.completedCount ?? 0;
  const currentDay = j30?.currentDay ?? 1;
  const streak = j30?.streakDays ?? 0;
  const progress = Math.round((completed / 30) * 100);
  const isFinished = completed >= 30;

  return (
    <div
      className="relative overflow-hidden rounded-[24px]"
      style={{
        background:
          "linear-gradient(160deg, #0d1a12 0%, #162512 45%, #0a1510 100%)",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.45), 0 3px 10px rgba(0,0,0,0.25)",
      }}
    >
      <StarDots />
      <div
        className="absolute top-[-30px] left-[30%] right-[30%] h-[100px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse, rgba(251,191,36,0.14) 0%, transparent 70%)",
          filter: "blur(18px)",
        }}
      />

      <div className="relative z-10 p-4 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2
              className="font-bold leading-tight"
              style={{
                fontSize: 20,
                background:
                  "linear-gradient(90deg, #ffffff 0%, #fde68a 55%, #f59e0b 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              رحلة الـ ٣٠ يوماً
            </h2>
            <p
              className="text-[11px] mt-0.5"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              {isFinished
                ? "🎉 أتممت الرحلة — بارك الله فيك"
                : `اليوم ${currentDay} من ٣٠`}
            </p>
          </div>
          <BentoCompassWidget />
        </div>

        {/* Verse — full width */}
        <VerseCellBento />

        {/* Progress row */}
        <div className="flex gap-2">
          {/* Circular progress */}
          <div
            className="flex-[3] flex flex-col items-center justify-center gap-1 rounded-[18px] py-3"
            style={{
              background:
                "linear-gradient(145deg, rgba(251,191,36,0.15) 0%, rgba(217,119,6,0.06) 100%)",
              border: "1px solid rgba(251,191,36,0.22)",
            }}
          >
            <div className="relative w-[72px] h-[72px]">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 72 72">
                <circle
                  cx="36"
                  cy="36"
                  r="30"
                  fill="rgba(0,0,0,0.18)"
                  stroke="rgba(255,255,255,0.14)"
                  strokeWidth="5"
                />
                <motion.circle
                  cx="36"
                  cy="36"
                  r="30"
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 30}
                  initial={{ strokeDashoffset: 2 * Math.PI * 30 }}
                  animate={{
                    strokeDashoffset: 2 * Math.PI * 30 * (1 - progress / 100),
                  }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className="text-[16px] font-bold leading-none"
                  style={{ color: "#fbbf24" }}
                >
                  {progress}%
                </span>
                <span
                  className="text-[8px] leading-none mt-0.5"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  تقدّم
                </span>
              </div>
            </div>
            <div className="flex justify-between w-full px-3">
              <span
                className="text-[9px]"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                {30 - completed} متبقٍ
              </span>
              <span
                className="text-[9px]"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                {completed} مكتمل
              </span>
            </div>
          </div>
          {/* Streak */}
          <div
            className="flex-[2] flex flex-col items-center justify-center gap-1 rounded-[18px]"
            style={{
              background:
                "linear-gradient(145deg, rgba(16,185,129,0.15) 0%, rgba(5,150,105,0.06) 100%)",
              border: "1px solid rgba(16,185,129,0.2)",
              minHeight: 100,
            }}
          >
            <motion.span
              className="text-[26px] leading-none"
              animate={{ scale: streak > 0 ? [1, 1.08, 1] : 1 }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🔥
            </motion.span>
            <p
              className="font-bold text-[18px] leading-none"
              style={{ color: "#10b981" }}
            >
              {streak}
            </p>
            <p
              className="text-[9px]"
              style={{ color: "rgba(16,185,129,0.65)" }}
            >
              يوم متتالٍ
            </p>
          </div>
        </div>

        {/* CTA */}
        <Link
          href="/journey"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-[16px] font-bold text-sm active:scale-[0.97] transition-all"
          style={{
            background: "linear-gradient(135deg, #fbbf24 0%, #d97706 100%)",
            color: "#1c0f00",
            boxShadow:
              "0 4px 20px rgba(251,191,36,0.38), 0 2px 8px rgba(0,0,0,0.3)",
          }}
        >
          {isFinished ? (
            <>
              <TrendingUp size={15} />
              <span>استعرض إنجازك</span>
            </>
          ) : (
            <>
              <span>متابعة اليوم {currentDay}</span>
              <ArrowLeft size={15} />
            </>
          )}
        </Link>
      </div>
    </div>
  );
}

// ─── SectionJourneyCard ───────────────────────────────────────────────────────

export function SectionJourneyCard() {
  const { data: progress } = useAppUserProgress();
  const hasCovenant = progress?.covenantSigned;
  const dayOneDone = progress?.firstDayTasksCompleted;

  if (hasCovenant && dayOneDone) return <Journey30HeroCard />;

  const ctaHref = !hasCovenant ? "/covenant" : "/day-one";
  const ctaLabel = !hasCovenant ? "ابدأ رحلتك الآن" : "أكمل اللحظة الأولى";

  const [joinCount, setJoinCount] = useState(
    () => 8400 + Math.floor(Math.random() * 300),
  );
  useEffect(() => {
    const t = setInterval(
      () => setJoinCount((c) => c + Math.floor(Math.random() * 2 + 1)),
      4000,
    );
    return () => clearInterval(t);
  }, []);

  const PILLARS = [
    { emoji: "🤲", label: "توبة صادقة", color: "#34d399" },
    { emoji: "📖", label: "ورد يومي", color: "#fbbf24" },
    { emoji: "🌱", label: "نمو روحي", color: "#818cf8" },
  ];

  return (
    <div
      className="relative overflow-hidden rounded-[28px]"
      style={{
        background:
          "linear-gradient(145deg, #050f0a 0%, #0a1f12 40%, #0c2518 100%)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow:
          "0 16px 48px rgba(0,0,0,0.55), 0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
    >
      <StarDots />

      <div
        className="absolute inset-x-0 top-0 h-[120px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(251,191,36,0.18) 0%, transparent 70%)",
        }}
      />

      <div
        className="absolute right-0 top-0 bottom-0 w-[3px] pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, rgba(251,191,36,0.5) 30%, rgba(251,191,36,0.5) 70%, transparent 100%)",
        }}
      />

      <div className="relative z-10 p-5 flex flex-col gap-4">
        {/* Live badge */}
        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{
              background: "rgba(251,191,36,0.12)",
              border: "1px solid rgba(251,191,36,0.28)",
            }}
          >
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-amber-400"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            />
            <span
              className="text-[10px] font-bold"
              style={{ color: "#fbbf24" }}
            >
              {joinCount.toLocaleString("ar-EG")} مسافر
            </span>
          </div>
          <BentoCompassWidget />
        </div>

        {/* Main title */}
        <div className="text-center">
          <p
            className="text-[10px] font-bold mb-1 tracking-widest"
            style={{ color: "rgba(251,191,36,0.5)", letterSpacing: "0.12em" }}
          >
            ✦ ٣٠ يوماً من النور ✦
          </p>
          <h2
            className="font-black leading-tight mb-2"
            style={{
              fontSize: 26,
              background:
                "linear-gradient(135deg, #ffffff 0%, #fde68a 40%, #f59e0b 70%, #fbbf24 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              textShadow: "none",
              fontFamily: "'Amiri Quran', serif",
            }}
          >
            رحلة العودة إلى الله
          </h2>
          <p
            className="text-[11px] leading-relaxed"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            {!hasCovenant
              ? "التوبة ليست لحظة واحدة — هي رحلة تتغيّر فيها يوماً بيوم"
              : "واصل — بقيت خطوات قليلة لبدء رحلتك"}
          </p>
        </div>

        {/* Verse */}
        <div
          className="rounded-2xl px-4 py-3 text-center"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(251,191,36,0.15)",
          }}
        >
          <p
            className="leading-loose"
            style={{
              fontFamily: "'Amiri Quran', serif",
              fontSize: 14.5,
              color: "rgba(255,255,255,0.88)",
            }}
          >
            ﴿إِنَّ اللَّهَ يُحِبُّ التَّوَّابِينَ وَيُحِبُّ الْمُتَطَهِّرِينَ﴾
          </p>
          <p
            className="text-[9px] mt-1"
            style={{ color: "rgba(251,191,36,0.5)" }}
          >
            — البقرة: ٢٢٢
          </p>
        </div>

        {/* 3 Pillars */}
        <div className="grid grid-cols-3 gap-2">
          {PILLARS.map((p) => (
            <div
              key={p.label}
              className="flex flex-col items-center gap-1.5 py-3 rounded-2xl"
              style={{
                background: `${p.color}10`,
                border: `1px solid ${p.color}25`,
              }}
            >
              <span style={{ fontSize: 22 }}>{p.emoji}</span>
              <span
                className="text-[9px] font-bold text-center"
                style={{ color: p.color }}
              >
                {p.label}
              </span>
            </div>
          ))}
        </div>

        {/* Bento row */}
        <div className="flex gap-2">
          <div className="flex-[3]">
            <DhikrCounterCell />
          </div>
          <div className="flex-[2]">
            <SecretOfTheDayCellBento />
          </div>
        </div>

        {/* CTA */}
        <Link
          href={ctaHref}
          className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-[18px] font-black text-sm active:scale-[0.97] transition-all"
          style={{
            background:
              "linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)",
            color: "#0d0700",
            boxShadow:
              "0 6px 24px rgba(251,191,36,0.5), 0 2px 8px rgba(0,0,0,0.4)",
            fontSize: 15,
          }}
        >
          <span>⚡ {ctaLabel}</span>
          <ArrowLeft size={16} />
        </Link>
      </div>
    </div>
  );
}
