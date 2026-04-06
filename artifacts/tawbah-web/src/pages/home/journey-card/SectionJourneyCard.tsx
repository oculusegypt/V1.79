import { Link } from "wouter";
import { ArrowLeft, BookHeart } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useUserJourney } from "@/hooks/use-app-data";
import { getSessionId } from "@/lib/session";
import { apiUrl } from "@/lib/api-base";
import { useSettings } from "@/context/SettingsContext";
import { getAuthHeader } from "@/lib/auth-client";
import {
  StarDots,
  BentoCompassWidget,
  DhikrCounterCell,
  SecretOfTheDayCellBento,
} from "../bento-cells";
import { Journey30HeroCard } from "./Journey30HeroCard";

export function SectionJourneyCard() {
  const { data: journey, isLoading: journeyLoading } = useUserJourney();
  const { theme } = useSettings();
  const isDark = theme === "dark";
  const sessionId = getSessionId();

  const { data: j30Data, isLoading: j30Loading } = useQuery({
    queryKey: ["journey30-active-check", sessionId],
    queryFn: async () => {
      const res = await fetch(
        apiUrl(`/api/journey30?sessionId=${encodeURIComponent(sessionId || "")}`),
        {
          headers: { ...getAuthHeader() },
        },
      );
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!sessionId,
    initialData: null,
  });

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

  const isLoading = journeyLoading || j30Loading;

  if (isLoading) {
    return null;
  }

  const journeyActive = journey?.active || (j30Data?.completedCount > 0 || j30Data?.currentDay > 1);
  const hasSin = journey?.hasSin ?? true;

  if (journeyActive) {
    return (
      <div className="flex flex-col gap-3">
        <Journey30HeroCard />
        {!hasSin && (
          <Link
            href="/sins?from=journey"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-bold border border-primary/30 bg-primary/8 text-primary active:scale-[0.98] transition-all"
          >
            <BookHeart size={16} />
            <span>أضف ذنبك لتخصيص الرحلة</span>
          </Link>
        )}
      </div>
    );
  }

  const ctaHref = "/sins";
  const ctaLabel = "ابدأ رحلتك الآن";

  const PILLARS = [
    { emoji: "🤲", label: "توبة صادقة", color: "#34d399" },
    { emoji: "📖", label: "ورد يومي", color: "#fbbf24" },
    { emoji: "🌱", label: "نمو روحي", color: "#818cf8" },
  ];

  return (
    <div
      className="relative overflow-hidden rounded-[28px]"
      style={{
        background: isDark
          ? "linear-gradient(145deg, #050f0a 0%, #0a1f12 40%, #0c2518 100%)"
          : "linear-gradient(145deg, #fefce8 0%, #fef9c3 40%, #ecfccb 100%)",
        border: isDark
          ? "1px solid rgba(255,255,255,0.08)"
          : "1px solid rgba(234,179,8,0.2)",
        boxShadow: isDark
          ? "0 16px 48px rgba(0,0,0,0.55), 0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)"
          : "0 16px 48px rgba(234,179,8,0.15), 0 4px 16px rgba(234,179,8,0.08)",
      }}
    >
      {isDark && <StarDots />}

      <div
        className="absolute inset-x-0 top-0 h-[120px] pointer-events-none"
        style={{
          background: isDark
            ? "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(251,191,36,0.18) 0%, transparent 70%)"
            : "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(234,179,8,0.25) 0%, transparent 70%)",
        }}
      />

      <div
        className="absolute right-0 top-0 bottom-0 w-[3px] pointer-events-none"
        style={{
          background: isDark
            ? "linear-gradient(180deg, transparent 0%, rgba(251,191,36,0.5) 30%, rgba(251,191,36,0.5) 70%, transparent 100%)"
            : "linear-gradient(180deg, transparent 0%, rgba(234,179,8,0.6) 30%, rgba(234,179,8,0.6) 70%, transparent 100%)",
        }}
      />

      <div className="relative z-10 p-5 flex flex-col gap-4">
        {/* Live badge */}
        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{
              background: isDark
                ? "rgba(251,191,36,0.12)"
                : "rgba(234,179,8,0.15)",
              border: isDark
                ? "1px solid rgba(251,191,36,0.28)"
                : "1px solid rgba(234,179,8,0.3)",
            }}
          >
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-amber-400"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            />
            <span
              className="text-[10px] font-bold"
              style={{ color: isDark ? "#fbbf24" : "#a16207" }}
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
            style={{
              color: isDark
                ? "rgba(251,191,36,0.5)"
                : "rgba(161,98,7,0.6)",
              letterSpacing: "0.12em",
            }}
          >
            ✦ ٣٠ يوماً من النور ✦
          </p>
          <h2
            className="font-black leading-tight mb-2"
            style={{
              fontSize: 26,
              background: isDark
                ? "linear-gradient(135deg, #ffffff 0%, #fde68a 40%, #f59e0b 70%, #fbbf24 100%)"
                : "linear-gradient(135deg, #713f12 0%, #a16207 40%, #ca8a04 70%, #eab308 100%)",
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
            style={{
              color: isDark
                ? "rgba(255,255,255,0.45)"
                : "rgba(113,63,18,0.6)",
            }}
          >
            {"التوبة ليست لحظة واحدة — هي رحلة تتغيّر فيها يوماً بيوم"}
          </p>
        </div>

        {/* Verse */}
        <div
          className="rounded-2xl px-4 py-3 text-center"
          style={{
            background: isDark ? "rgba(255,255,255,0.04)" : "rgba(234,179,8,0.15)",
            border: isDark
              ? "1px solid rgba(251,191,36,0.15)"
              : "1px solid rgba(234,179,8,0.4)",
          }}
        >
          <p
            className="leading-loose text-center"
            style={{
              fontFamily: "'Amiri Quran', serif",
              fontSize: 14.5,
              color: isDark ? "rgba(255,255,255,0.88)" : "#713f12",
            }}
          >
            ﴿إِنَّ اللَّهَ يُحِبُّ التَّوَّابِينَ وَيُحِبُّ الْمُتَطَهِّرِينَ﴾
          </p>
          <p
            className="text-[9px] mt-1"
            style={{ color: isDark ? "rgba(251,191,36,0.5)" : "#92400e" }}
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
                background: isDark ? `${p.color}10` : `${p.color}15`,
                border: `1px solid ${isDark ? p.color + "25" : p.color + "30"}`,
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
            background: isDark
              ? "linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)"
              : "linear-gradient(135deg, #eab308 0%, #ca8a04 50%, #a16207 100%)",
            color: isDark ? "#0d0700" : "#ffffff",
            boxShadow: isDark
              ? "0 6px 24px rgba(251,191,36,0.5), 0 2px 8px rgba(0,0,0,0.4)"
              : "0 6px 24px rgba(234,179,8,0.35), 0 2px 8px rgba(234,179,8,0.15)",
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
