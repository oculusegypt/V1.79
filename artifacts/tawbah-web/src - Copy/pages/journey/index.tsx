import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ZakiyPanel } from "@/components/ZakiyPanel";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2, Star, Trophy, Flame, ChevronRight,
} from "lucide-react";
import { Link } from "wouter";
import { getSessionId } from "@/lib/session";
import { isNativeApp, getApiBase } from "@/lib/api-base";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import { getAuthHeader, setAuthToken } from "@/lib/auth-client";
import { supabase } from "@/lib/supabase";
import { JourneyData } from "./types";
import { fetchWithTimeout, buildNativeFallbackJourney } from "./utils";
import { CompletionBanner } from "./components/CompletionBanner";
import { CompletionCard } from "./components/CompletionCard";
import { JourneyTimeline } from "./components/JourneyTimeline";
import { SinPanel } from "./components/SinPanel";
import { RestoreCodePanel } from "./components/RestoreCodePanel";
import { DayTaskList } from "./components/DayTaskList";

const DAY_EMOJIS: Record<number, string> = {
  1: "🌅", 2: "📿", 3: "🤲", 4: "💧", 5: "📖",
  6: "🕌", 7: "🌱", 8: "🌙", 9: "⭐", 10: "🔑",
  11: "💎", 12: "🦋", 13: "🌊", 14: "🌿", 15: "☀️",
  16: "🕊️", 17: "🌸", 18: "🔥", 19: "🌟", 20: "🙏",
  21: "🌳", 22: "💫", 23: "🏔️", 24: "🎯", 25: "🌈",
  26: "👑", 27: "✨", 28: "🗝️", 29: "🌺", 30: "🏆",
};

export default function Journey30() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();

  const sessionId = getSessionId();
  const queryClient = useQueryClient();
  const [showRestoreCode, setShowRestoreCode] = useState(false);
  const [localAllDone, setLocalAllDone] = useState(false);
  const [justCompleted, setJustCompleted] = useState<{ day: number; title: string } | null>(null);
  const completingDayRef = useRef<{ day: number; title: string } | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError, refetch } = useQuery<JourneyData>({
    queryKey: ["journey30", sessionId],
    queryFn: async () => {
      const doFetch = (authHeader: Record<string, string>) =>
        fetchWithTimeout(
          `${getApiBase()}/journey30?sessionId=${encodeURIComponent(sessionId ?? "")}`,
          { headers: authHeader },
        );

      try {
        let res = await doFetch(getAuthHeader());

        if (res.status === 401) {
          const { data: refreshData } = await supabase.auth.refreshSession();
          if (refreshData.session) {
            setAuthToken(refreshData.session.access_token);
            res = await doFetch(getAuthHeader());
          } else {
            res = await doFetch({});
          }
        }

        if (!res.ok) throw new Error("Failed to fetch journey");
        return res.json() as Promise<JourneyData>;
      } catch (e) {
        if (isNativeApp()) return buildNativeFallbackJourney();
        throw e;
      }
    },
    enabled: !!sessionId,
    refetchInterval: false,
    retry: false,
  });

  const completeMutation = useMutation({
    mutationFn: async (dayNumber: number) => {
      const res = await fetch(`${getApiBase()}/journey30/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ dayNumber, sessionId }),
      });
      return res.json();
    },
    onSuccess: () => {
      if (completingDayRef.current) {
        setJustCompleted(completingDayRef.current);
        completingDayRef.current = null;
        setTimeout(() => setJustCompleted(null), 7000);
      }
      setLocalAllDone(false);
      queryClient.invalidateQueries({ queryKey: ["journey30", sessionId] });
      setTimeout(() => {
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      }, 80);
    },
  });

  useEffect(() => {
    if (!authLoading && !user) setLocation("/login");
  }, [authLoading, user, setLocation]);

  if (!authLoading && !user) return null;

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center" dir="rtl">
        <p className="text-sm font-bold">تعذّر تحميل الرحلة</p>
        <p className="text-xs text-muted-foreground">تحقق من اتصال الإنترنت أو إعدادات السيرفر، ثم أعد المحاولة.</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  const currentDay = data.days.find((d) => d.isCurrent);
  const completedDays = [...data.days.filter((d) => d.completed)].reverse();
  const progress = (data.completedCount / 30) * 100;
  const tasksAllDone =
    localAllDone ||
    ((currentDay?.taskChecks?.length ?? 0) > 0 &&
      (currentDay?.taskChecks?.every(Boolean) ?? false));
  const nextDayNum = (currentDay?.day ?? 0) + 1;

  const handleCompleteDay = () => {
    if (!currentDay) return;
    completingDayRef.current = { day: currentDay.day, title: currentDay.title };
    completeMutation.mutate(currentDay.day);
  };

  if (data.completedCount === 30) {
    return (
      <div className="flex-1 flex flex-col bg-background" dir="rtl">
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/40">
          <div className="flex items-center h-14 px-4">
            <Link
              href="/"
              className="w-10 h-10 rounded-xl hover:bg-muted/70 active:scale-95 transition-all text-muted-foreground flex items-center justify-center"
            >
              <ChevronRight size={22} />
            </Link>
            <div className="flex-1 text-center">
              <p className="font-bold text-sm">رحلة ٣٠ يوماً</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">مكتملة</p>
            </div>
            <div className="w-10" />
          </div>
          <div className="h-1 bg-primary" />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            <Trophy size={72} className="text-amber-500 mx-auto" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-2xl font-black mb-2">تهانينا! أتممت الرحلة</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              أتممت رحلة الثلاثين يوماً — سجّل الله لك هذا الجهد وقبل منك التوبة إن شاء الله
            </p>
            <div className="flex justify-center gap-1 mt-4">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.1, type: "spring" }}
                >
                  <Star size={20} className="text-amber-400 fill-amber-400" />
                </motion.div>
              ))}
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="w-full bg-muted/40 rounded-2xl p-4 border border-border"
          >
            <p className="text-xs font-bold text-muted-foreground">
              ٣٠ يوماً · {data.streakDays} يوم متتالٍ
            </p>
          </motion.div>
          <SinPanel journeyComplete />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background" dir="rtl">

      {/* ── Sticky header ──────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/40">
        <div className="flex items-center h-14 px-2 relative">
          <Link
            href="/"
            className="w-10 h-10 rounded-xl hover:bg-muted/70 active:scale-95 transition-all text-muted-foreground flex items-center justify-center"
          >
            <ChevronRight size={22} />
          </Link>
          <div className="absolute inset-x-0 flex flex-col items-center pointer-events-none px-14">
            <p className="font-bold text-sm text-foreground">رحلة ٣٠ يوماً</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {currentDay ? `اليوم ${currentDay.day} من ٣٠` : "طريق التوبة"}
            </p>
          </div>
          <button
            onClick={() => setShowRestoreCode((v) => !v)}
            className="mr-auto text-[11px] text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded-lg"
          >
            استعادة
          </button>
        </div>
        {/* Overall progress bar */}
        <div className="h-1 bg-muted/40">
          <motion.div
            className="h-full rounded-full bg-primary"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* ── Scrollable content ────────────────────────────────────────────────── */}
      <div ref={scrollContainerRef} className="flex-1 px-4 pt-5 pb-36 overflow-y-auto flex flex-col gap-5">

        {/* ── Day completion celebration banner ─────────────────────────────── */}
        <AnimatePresence>
          {justCompleted && (
            <CompletionBanner
              dayTitle={justCompleted.title}
              nextDayNum={nextDayNum}
              onNavigateNext={handleCompleteDay}
              isNavigating={completeMutation.isPending}
            />
          )}
        </AnimatePresence>

        {/* ── Restore code panel ────────────────────────────────────────────── */}
        <AnimatePresence>
          {showRestoreCode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <RestoreCodePanel
                sessionId={sessionId ?? ""}
                onClose={() => setShowRestoreCode(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Stats row ─────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 bg-amber-100 dark:bg-amber-900/30 px-3 py-1.5 rounded-full">
            <Flame size={13} className="text-orange-500" />
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
              {data.streakDays} يوم متتالٍ
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-full">
            <Star size={13} className="text-primary fill-primary" />
            <span className="text-xs font-bold text-primary">
              {data.completedCount} / 30 مكتمل
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-full mr-auto">
            <span className="text-xs text-muted-foreground font-bold">
              {30 - data.completedCount} يوم متبقٍ
            </span>
          </div>
        </div>

        {/* ── Journey timeline ──────────────────────────────────────────────── */}
        <JourneyTimeline days={data.days} completedCount={data.completedCount} />

        {/* ── Sin integration panel ─────────────────────────────────────────── */}
        <SinPanel />

        {/* ── Current day hero card ─────────────────────────────────────────── */}
        {currentDay && (
          <motion.div
            key={currentDay.day}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-3xl overflow-hidden relative"
            style={{
              background: tasksAllDone
                ? "linear-gradient(135deg, rgba(5,150,105,0.15) 0%, rgba(4,120,87,0.08) 100%)"
                : "linear-gradient(135deg, rgba(var(--primary-rgb, 14,165,233), 0.12) 0%, rgba(var(--primary-rgb, 14,165,233), 0.05) 40%, rgba(245,158,11,0.08) 100%)",
              border: tasksAllDone
                ? "1px solid rgba(5,150,105,0.25)"
                : "1px solid color-mix(in srgb, var(--primary) 25%, transparent)",
            }}
          >
            <div
              className="absolute inset-0 opacity-[0.05]"
              style={{
                backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />

            <div className="relative p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {tasksAllDone ? (
                      <CheckCircle2 size={13} className="text-emerald-500" />
                    ) : (
                      <Flame size={13} className="text-primary" />
                    )}
                    <span
                      className={`text-[11px] font-bold tracking-widest uppercase ${
                        tasksAllDone ? "text-emerald-600 dark:text-emerald-400" : "text-primary"
                      }`}
                    >
                      {tasksAllDone ? "أحسنت! اكتمل اليوم" : `اليوم ${currentDay.day} من ٣٠`}
                    </span>
                  </div>
                  <h1 className="text-2xl font-black text-foreground leading-tight">
                    {currentDay.title}
                  </h1>
                </div>

                {/* Progress circle */}
                <div className="shrink-0 relative w-16 h-16 mr-3">
                  <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
                    <circle
                      cx="32" cy="32" r="27"
                      fill="none" stroke="currentColor" strokeWidth="4"
                      className="text-muted/30"
                    />
                    <motion.circle
                      cx="32" cy="32" r="27"
                      fill="none"
                      stroke={tasksAllDone ? "#10b981" : "var(--primary)"}
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 27}`}
                      animate={{ strokeDashoffset: (1 - progress / 100) * 2 * Math.PI * 27 }}
                      transition={{ duration: 0.8 }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-xs font-black ${tasksAllDone ? "text-emerald-500" : "text-primary"}`}>
                      {Math.round(progress)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Verse */}
              <div
                className="rounded-2xl px-4 py-3 border"
                style={{
                  background: "color-mix(in srgb, var(--background) 50%, transparent)",
                  borderColor: "color-mix(in srgb, var(--border) 60%, transparent)",
                }}
              >
                <p
                  className="text-sm leading-relaxed text-center text-primary"
                  style={{ fontFamily: "'Amiri Quran', 'Amiri', serif" }}
                >
                  {currentDay.verse}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Task list ─────────────────────────────────────────────────────── */}
        {currentDay && !tasksAllDone && (
          <>
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-border/60" />
              <span className="text-[10px] font-bold text-muted-foreground tracking-widest px-2">
                مهام اليوم {currentDay.day}
              </span>
              <div className="h-px flex-1 bg-border/60" />
            </div>

            <DayTaskList
              day={currentDay}
              sessionId={sessionId ?? ""}
              onAllDone={() => setLocalAllDone(true)}
            />
          </>
        )}

        {/* ── Completion card when all tasks are done ───────────────────────── */}
        <AnimatePresence>
          {tasksAllDone && currentDay && (
            <CompletionCard
              dayTitle={currentDay.title}
              dayEmoji={DAY_EMOJIS[currentDay.day] ?? "⭐"}
              verse={currentDay.verse}
              nextDayNum={nextDayNum}
              onNext={handleCompleteDay}
              isLoading={completeMutation.isPending}
            />
          )}
        </AnimatePresence>

        {/* ── Completed days history ────────────────────────────────────────── */}
        {completedDays.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-border/60" />
              <span className="text-[10px] font-bold text-muted-foreground tracking-widest px-2">
                الأيام المكتملة
              </span>
              <div className="h-px flex-1 bg-border/60" />
            </div>
            <div className="flex flex-col gap-2">
              {completedDays.map((day, idx) => (
                <motion.div
                  key={day.day}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-primary/5 border border-primary/15"
                >
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <CheckCircle2 size={16} className="text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{day.title}</p>
                    <p className="text-[10px] text-muted-foreground">اليوم {day.day}</p>
                  </div>
                  <Trophy size={13} className="text-amber-400 shrink-0" />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
      <ZakiyPanel pageName="رحلة التوبة" />
    </div>
  );
}
