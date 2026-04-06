import { Link } from "wouter";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSessionId } from "@/lib/session";
import { apiUrl, isNativeApp } from "@/lib/api-base";
import { useSettings } from "@/context/SettingsContext";
import { getAuthHeader } from "@/lib/auth-client";
import {
  StarDots,
  BentoCompassWidget,
  VerseCellBento,
} from "../bento-cells";

interface Journey30Summary {
  completedCount: number;
  currentDay: number;
  streakDays: number;
}

export function Journey30HeroCard() {
  const sessionId = getSessionId();
  const { theme } = useSettings();
  const isDark = theme === "dark";

  const { data: j30 } = useQuery<Journey30Summary>({
    queryKey: ["journey30-home", sessionId],
    queryFn: async () => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 12_000);
      try {
        const res = await fetch(
          apiUrl(`/api/journey30?sessionId=${encodeURIComponent(sessionId || "")}`),
          {
            signal: controller.signal,
            headers: { ...getAuthHeader() },
          },
        );
        if (!res.ok) return { completedCount: 0, currentDay: 1, streakDays: 0 };
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
        return { completedCount: 0, currentDay: 1, streakDays: 0 };
      } finally {
        clearTimeout(id);
      }
    },
    enabled: !!sessionId,
    staleTime: 60 * 1000,
    retry: 1,
  });

  const completed = j30?.completedCount ?? 0;
  const currentDay = j30?.currentDay ?? 1;
  const streak = j30?.streakDays ?? 0;
  const progress = Math.round((completed / 30) * 100);
  const isFinished = completed >= 30;

  useEffect(() => {
    try {
      localStorage.setItem("tawbah_streak", String(streak));
      localStorage.setItem("tawbah_last_activity", "journey30");
    } catch {}
  }, [streak]);

  return (
    <div
      className="relative overflow-hidden rounded-[24px]"
      style={{
        background: isDark
          ? "linear-gradient(160deg, #0d1a12 0%, #162512 45%, #0a1510 100%)"
          : "linear-gradient(160deg, #ecfdf5 0%, #d1fae5 40%, #a7f3d0 100%)",
        border: isDark
          ? "1px solid rgba(255,255,255,0.07)"
          : "1px solid rgba(5,150,105,0.15)",
        boxShadow: isDark
          ? "0 12px 40px rgba(0,0,0,0.45), 0 3px 10px rgba(0,0,0,0.25)"
          : "0 12px 40px rgba(5,150,105,0.2), 0 3px 10px rgba(5,150,105,0.1)",
      }}
    >
      {isDark && <StarDots />}
      <div
        className="absolute top-[-30px] left-[30%] right-[30%] h-[100px] pointer-events-none"
        style={{
          background: isDark
            ? "radial-gradient(ellipse, rgba(251,191,36,0.14) 0%, transparent 70%)"
            : "radial-gradient(ellipse, rgba(251,191,36,0.2) 0%, transparent 70%)",
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
                background: isDark
                  ? "linear-gradient(90deg, #ffffff 0%, #fde68a 55%, #f59e0b 100%)"
                  : "linear-gradient(90deg, #065f46 0%, #059669 50%, #047857 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              رحلة الـ ٣٠ يوماً
            </h2>
            <p
              className="text-[11px] mt-0.5"
              style={{
                color: isDark ? "rgba(255,255,255,0.4)" : "#065f46",
              }}
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
              background: isDark
                ? "linear-gradient(145deg, rgba(251,191,36,0.15) 0%, rgba(217,119,6,0.06) 100%)"
                : "linear-gradient(145deg, rgba(5,150,105,0.12) 0%, rgba(16,185,129,0.06) 100%)",
              border: isDark
                ? "1px solid rgba(251,191,36,0.22)"
                : "1px solid rgba(5,150,105,0.2)",
            }}
          >
            <div className="relative w-[72px] h-[72px]">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 72 72">
                <circle
                  cx="36"
                  cy="36"
                  r="30"
                  fill={isDark ? "rgba(0,0,0,0.18)" : "rgba(5,150,105,0.08)"}
                  stroke={isDark ? "rgba(255,255,255,0.14)" : "rgba(5,150,105,0.2)"}
                  strokeWidth="5"
                />
                <motion.circle
                  cx="36"
                  cy="36"
                  r="30"
                  fill="none"
                  stroke={isDark ? "#fbbf24" : "#059669"}
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
                  style={{ color: isDark ? "#fbbf24" : "#059669" }}
                >
                  {progress}%
                </span>
                <span
                  className="text-[8px] leading-none mt-0.5"
                  style={{
                    color: isDark ? "rgba(255,255,255,0.5)" : "#065f46",
                  }}
                >
                  تقدّم
                </span>
              </div>
            </div>
            <div className="flex justify-between w-full px-3">
              <span
                className="text-[9px]"
                style={{
                  color: isDark ? "rgba(255,255,255,0.55)" : "#065f46",
                }}
              >
                {30 - completed} متبقٍ
              </span>
              <span
                className="text-[9px]"
                style={{
                  color: isDark ? "rgba(255,255,255,0.55)" : "#065f46",
                }}
              >
                {completed} مكتمل
              </span>
            </div>
          </div>
          {/* Streak */}
          <div
            className="flex-[2] flex flex-col items-center justify-center gap-1 rounded-[18px]"
            style={{
              background: isDark
                ? "linear-gradient(145deg, rgba(16,185,129,0.15) 0%, rgba(5,150,105,0.06) 100%)"
                : "linear-gradient(145deg, rgba(5,150,105,0.1) 0%, rgba(16,185,129,0.04) 100%)",
              border: isDark
                ? "1px solid rgba(16,185,129,0.2)"
                : "1px solid rgba(5,150,105,0.15)",
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
              style={{ color: isDark ? "#10b981" : "#059669" }}
            >
              {streak}
            </p>
            <p
              className="text-[9px]"
              style={{
                color: isDark ? "rgba(16,185,129,0.65)" : "#065f46",
              }}
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
            background: isDark
              ? "linear-gradient(135deg, #fbbf24 0%, #d97706 100%)"
              : "linear-gradient(135deg, #059669 0%, #047857 100%)",
            color: isDark ? "#1c0f00" : "#ffffff",
            boxShadow: isDark
              ? "0 4px 20px rgba(251,191,36,0.38), 0 2px 8px rgba(0,0,0,0.3)"
              : "0 4px 20px rgba(5,150,105,0.3), 0 2px 8px rgba(5,150,105,0.15)",
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
