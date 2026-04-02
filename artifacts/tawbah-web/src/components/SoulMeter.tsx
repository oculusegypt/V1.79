import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAppUserProgress, useAppDhikrCount, useAppHabits } from "@/hooks/use-app-data";
import { CircleDot, PenLine, TrendingUp, Heart, Sparkles, Flame, Star, ChevronDown, Bell, CheckCircle2, Route } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getSessionId } from "@/lib/session";
import { getApiBase } from "@/lib/api-base";
import { getAuthHeader } from "@/lib/auth-client";
import { useAuth } from "@/context/AuthContext";

// ─── General Daily Faith Tasks (shown when journey is NOT active) ─────────────

const DAILY_FAITH_TASKS = [
  { id: "fajr",        label: "صلاة الفجر في وقتها",      emoji: "🌅" },
  { id: "morning-dhikr", label: "أذكار الصباح",           emoji: "📿" },
  { id: "quran",       label: "ورد القرآن اليومي",         emoji: "📖" },
  { id: "istigfar",    label: "١٠٠ استغفار",              emoji: "🤲" },
  { id: "duha",        label: "صلاة الضحى",               emoji: "☀️" },
  { id: "evening-dhikr", label: "أذكار المساء",           emoji: "🌙" },
  { id: "journal",     label: "تأمل في يومياتك",           emoji: "✍️" },
];

// ─── Journey30 Summary ────────────────────────────────────────────────────────

interface Journey30Summary {
  completedCount: number;
  currentDay: number;
  streakDays: number;
}

// ─── Soul Score ───────────────────────────────────────────────────────────────

function useSoulScore() {
  const { data: progress } = useAppUserProgress();
  const { data: dhikr } = useAppDhikrCount();
  const { data: habits } = useAppHabits();

  const streak = progress?.streakDays ?? 0;
  const dhikrTotal = (dhikr?.istighfar ?? 0) + (dhikr?.tasbih ?? 0) + (dhikr?.sayyid ?? 0);
  const dhikrTarget = 99;
  const habitsTotal = habits?.length ?? 0;
  const habitsDone = habits?.filter(h => h.completed).length ?? 0;

  const streakScore = Math.min(streak * 5, 40);
  const dhikrScore = Math.min((dhikrTotal / dhikrTarget) * 35, 35);
  const habitsScore = habitsTotal > 0 ? Math.min((habitsDone / habitsTotal) * 25, 25) : 0;
  const total = Math.round(streakScore + dhikrScore + habitsScore);

  let label = "", color = "", gradient = "", tip = "";
  let tipIcon: "dhikr" | "journal" | "habit" | "journey" = "dhikr";
  let level = 0;

  if (total >= 80) {
    label = "روح مشرقة";
    color = "#16a34a"; gradient = "linear-gradient(135deg, #16a34a 0%, #10b981 50%, #34d399 100%)";
    tip = "ما شاء الله — روحك في أعلى حالاتها اليوم. واظب وثبّت حالك!";
    tipIcon = "journey"; level = 4;
  } else if (total >= 55) {
    label = "على الطريق";
    color = "#d97706"; gradient = "linear-gradient(135deg, #d97706 0%, #f59e0b 50%, #fbbf24 100%)";
    tip = dhikrTotal < 33
      ? "أضف جرعة ذكر صغيرة — 33 استغفار تحرّك المقياس كثيراً"
      : habitsTotal > 0 && habitsDone < habitsTotal
        ? "أكمل بقية عاداتك اليومية لتضيء المقياس أكثر"
        : "عظيم — واصل على هذا الطريق";
    tipIcon = dhikrTotal < 33 ? "dhikr" : "habit"; level = 3;
  } else if (total >= 25) {
    label = "تحتاج دفعة";
    color = "#ea580c"; gradient = "linear-gradient(135deg, #ea580c 0%, #f97316 50%, #fb923c 100%)";
    tip = streak === 0
      ? "ابدأ رحلتك الآن — أول خطوة هي أصعبها ثم تتيسر"
      : "سبّح الآن 33 مرة — هذا وحده يحرّك مقياسك للأمام";
    tipIcon = streak === 0 ? "journey" : "dhikr"; level = 2;
  } else {
    label = "روح تطلب النجدة";
    color = "#dc2626"; gradient = "linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f87171 100%)";
    tip = "لا تيأس — حتى التوبة الصغيرة تضيء القلب. ابدأ بالذكر الآن";
    tipIcon = "dhikr"; level = 1;
  }

  return { score: total, label, color, gradient, tip, tipIcon, streak, dhikrTotal, habitsDone, habitsTotal, level, progress };
}

const TIP_LINKS: Record<string, { href: string; label: string; icon: React.ReactNode }> = {
  dhikr:   { href: "/dhikr",    label: "افتح المسبحة", icon: <CircleDot size={13} /> },
  journal: { href: "/journal",  label: "يومياتي",       icon: <PenLine size={13} /> },
  habit:   { href: "/progress", label: "عاداتي",        icon: <TrendingUp size={13} /> },
  journey: { href: "/journey",  label: "رحلتي",         icon: <Heart size={13} /> },
};

const LEVEL_ICONS = ["", "😔", "😐", "🙂", "✨"];
const LEVEL_BG = [
  "",
  "linear-gradient(160deg, #1a0505 0%, #2c0a0a 100%)",
  "linear-gradient(160deg, #1a0c05 0%, #2c1a05 100%)",
  "linear-gradient(160deg, #1a1205 0%, #2c2005 100%)",
  "linear-gradient(160deg, #05180a 0%, #0a2c14 100%)",
];

// ─── Radial Gauge ─────────────────────────────────────────────────────────────

function RadialGauge({ score, color }: { score: number; color: string }) {
  const r = 50, circ = 2 * Math.PI * r;
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setDisplayed(score), 200);
    return () => clearTimeout(t);
  }, [score]);

  const dash = (displayed / 100) * circ;

  return (
    <div className="relative flex items-center justify-center" style={{ width: 116, height: 116 }}>
      <div className="absolute inset-0 rounded-full" style={{
        background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`,
        filter: "blur(10px)",
      }} />
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 116 116" width={116} height={116}>
        <circle cx={58} cy={58} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={10} />
        <motion.circle
          cx={58} cy={58} r={r}
          fill="none" stroke={color} strokeWidth={10} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 1.8, ease: [0.4, 0, 0.2, 1], delay: 0.3 }}
        />
      </svg>
      <div className="relative z-10 flex flex-col items-center">
        <motion.span
          key={displayed}
          initial={{ scale: 1.2, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="text-[34px] font-black leading-none"
          style={{ color }}
        >
          {displayed}
        </motion.span>
        <span className="text-[9px] font-semibold mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>/١٠٠</span>
      </div>
    </div>
  );
}

function BreakdownBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] w-20 text-right shrink-0" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.4 }}
        />
      </div>
      <span className="text-[10px] w-7 text-left shrink-0 font-bold tabular-nums" style={{ color }}>
        {Math.round(pct)}%
      </span>
    </div>
  );
}

// ─── Daily Faith Tasks (general) ──────────────────────────────────────────────

function DailyFaithTasksList({ color }: { color: string }) {
  const [done, setDone] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("daily_faith_tasks_" + new Date().toDateString());
      return new Set(saved ? JSON.parse(saved) : []);
    } catch { return new Set(); }
  });

  const toggle = (id: string) => {
    setDone(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      try {
        localStorage.setItem("daily_faith_tasks_" + new Date().toDateString(), JSON.stringify([...next]));
      } catch {}
      return next;
    });
  };

  const completedCount = done.size;
  const total = DAILY_FAITH_TASKS.length;

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-bold" style={{ color: "rgba(255,255,255,0.35)" }}>المهام الإيمانية اليومية</p>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
          style={{ background: `${color}20`, color }}>{completedCount}/{total}</span>
      </div>
      <div className="flex flex-col gap-1.5">
        {DAILY_FAITH_TASKS.map(task => {
          const isDone = done.has(task.id);
          return (
            <button
              key={task.id}
              onClick={() => toggle(task.id)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-right transition-all active:scale-[0.98]"
              style={{
                background: isDone ? `${color}12` : "rgba(255,255,255,0.04)",
                border: `1px solid ${isDone ? color + "30" : "rgba(255,255,255,0.07)"}`,
              }}
            >
              <CheckCircle2
                size={14}
                style={{ color: isDone ? color : "rgba(255,255,255,0.2)", flexShrink: 0 }}
                fill={isDone ? color : "none"}
              />
              <span className="text-[10px] font-semibold flex-1" style={{ color: isDone ? color : "rgba(255,255,255,0.6)" }}>
                {task.emoji} {task.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Journey Tasks Panel (when journey30 is active) ───────────────────────────

function JourneyTasksPanel({ j30, color }: { j30: Journey30Summary; color: string }) {
  const pct = Math.round((j30.completedCount / 30) * 100);
  const hour = new Date().getHours();
  // إشعار تذكيري قبل نهاية اليوم (بعد 8 مساءً)
  const isLateReminder = hour >= 20;

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-bold" style={{ color: "rgba(255,255,255,0.35)" }}>رحلة ٣٠ يوماً</p>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
          style={{ background: `${color}20`, color }}>
          اليوم {j30.currentDay} / ٣٠
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.35)" }}>{j30.completedCount} يوم مكتمل</span>
          <span className="text-[9px] font-bold" style={{ color }}>{pct}%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${color}, ${color}88)` }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Streak badge */}
      {j30.streakDays > 0 && (
        <div className="flex items-center gap-1.5 mb-2 p-2 rounded-xl"
          style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)" }}>
          <Flame size={12} style={{ color: "#fbbf24" }} />
          <span className="text-[10px] font-bold" style={{ color: "#fbbf24" }}>
            {j30.streakDays} يوم متتالٍ بدون انقطاع
          </span>
        </div>
      )}

      {/* Late day reminder */}
      {isLateReminder && j30.completedCount < j30.currentDay && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-2.5 rounded-xl mb-2"
          style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" }}
        >
          <Bell size={12} style={{ color: "#f87171" }} />
          <p className="text-[10px] font-bold flex-1" style={{ color: "#f87171" }}>
            تذكير — أكمل مهام اليوم {j30.currentDay} قبل منتصف الليل
          </p>
        </motion.div>
      )}

      {/* CTA */}
      <Link
        href="/journey"
        className="flex items-center justify-center gap-2 w-full py-2 rounded-xl font-bold text-[11px] active:scale-[0.97] transition-all"
        style={{ background: `linear-gradient(135deg, ${color}, ${color}99)`, color: "#fff" }}
      >
        <Route size={12} />
        متابعة اليوم {j30.currentDay}
      </Link>
    </div>
  );
}

// ─── Soul Meter ───────────────────────────────────────────────────────────────

export function SoulMeter() {
  const { score, label, color, gradient, tip, tipIcon, streak, dhikrTotal, habitsDone, habitsTotal, level, progress } = useSoulScore();
  const tipLink = TIP_LINKS[tipIcon]!;
  const [expanded, setExpanded] = useState(false);
  const sessionId = getSessionId();

  // Check journey30 status
  const isJourneyActive = !!(progress?.covenantSigned && progress?.firstDayTasksCompleted);
  const { user } = useAuth();

  const { data: j30 } = useQuery<Journey30Summary>({
    queryKey: ["journey30-soul-meter", user?.id ?? "guest"],
    queryFn: async () => {
      const sessionIdParam = getSessionId();
      const res = await fetch(`${getApiBase()}/journey30?sessionId=${encodeURIComponent(sessionIdParam || "")}`, { headers: { ...getAuthHeader() } });
      if (!res.ok) return { completedCount: 0, currentDay: 1, streakDays: 0 };
      const data = await res.json();
      return {
        completedCount: data.completedCount,
        currentDay: data.currentDay,
        streakDays: data.streakDays,
      };
    },
    enabled: !!user,
    staleTime: 60 * 1000,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="relative overflow-hidden rounded-[24px]"
      style={{
        background: LEVEL_BG[level] || "linear-gradient(160deg, #0d0d0d 0%, #1a1a1a 100%)",
        border: `1px solid ${color}28`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.4)`,
      }}
    >
      {/* Top glow */}
      <div className="absolute inset-x-0 top-0 h-24 pointer-events-none" style={{
        background: `radial-gradient(ellipse 80% 100% at 50% 0%, ${color}18 0%, transparent 100%)`,
      }} />

      {/* Journey active badge */}
      {isJourneyActive && (
        <div className="absolute top-3 left-3 z-20">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full"
            style={{ background: "rgba(251,191,36,0.18)", border: "1px solid rgba(251,191,36,0.35)" }}>
            <motion.div className="w-1 h-1 rounded-full bg-amber-400"
              animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.4, repeat: Infinity }} />
            <span className="text-[9px] font-bold" style={{ color: "#fbbf24" }}>رحلة نشطة</span>
          </div>
        </div>
      )}

      {/* Main row */}
      <button
        className="relative z-10 w-full flex items-center gap-4 p-4 text-right"
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
      >
        <RadialGauge score={score} color={color} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sparkles size={11} style={{ color }} />
            <span className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.4)" }}>
              مقياس الروح اليومي
            </span>
          </div>

          <div className="flex items-center gap-2 mb-2.5">
            {LEVEL_ICONS[level] && <span style={{ fontSize: 15 }}>{LEVEL_ICONS[level]}</span>}
            <h3 className="text-base font-black leading-tight" style={{ color }}>{label}</h3>
          </div>

          {/* Gradient bar */}
          <div className="w-full h-2 rounded-full overflow-hidden mb-3" style={{ background: "rgba(255,255,255,0.07)" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: gradient }}
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 1.6, ease: [0.4, 0, 0.2, 1], delay: 0.2 }}
            />
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-1.5">
            {streak > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full font-bold"
                style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.28)" }}>
                <Flame size={9} />{streak} يوم
              </span>
            )}
            {dhikrTotal > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>
                ذكر ×{dhikrTotal}
              </span>
            )}
            {isJourneyActive && j30 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                style={{ background: "rgba(167,139,250,0.15)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.28)" }}>
                🗓️ يوم {j30.currentDay}
              </span>
            )}
            {!isJourneyActive && habitsTotal > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                style={{ background: "rgba(167,139,250,0.15)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.28)" }}>
                عادات {habitsDone}/{habitsTotal}
              </span>
            )}
          </div>
        </div>

        <ChevronDown
          size={16}
          className="shrink-0 text-muted-foreground transition-transform duration-200"
          style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {/* Expanded breakdown */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="relative z-10 overflow-hidden"
          >
            <div className="px-4 pb-4 pt-3" style={{ borderTop: `1px solid ${color}18` }}>
              <p className="text-[10px] font-bold mb-2.5" style={{ color: "rgba(255,255,255,0.3)" }}>تفاصيل المقياس</p>

              <div className="flex flex-col gap-2.5 mb-4">
                <BreakdownBar label="الاستمرارية 🔥" value={streak} max={8} color="#fbbf24" />
                <BreakdownBar label="الذكر 📿" value={dhikrTotal} max={99} color={color} />
                {!isJourneyActive && habitsTotal > 0 && (
                  <BreakdownBar label="العادات ✅" value={habitsDone} max={habitsTotal} color="#a78bfa" />
                )}
                {isJourneyActive && j30 && (
                  <BreakdownBar label="الرحلة 🗓️" value={j30.completedCount} max={30} color="#a78bfa" />
                )}
              </div>

              {/* Journey tasks panel OR general faith tasks */}
              {isJourneyActive && j30 ? (
                <JourneyTasksPanel j30={j30} color={color} />
              ) : (
                <DailyFaithTasksList color={color} />
              )}

              {/* Tip card */}
              {!isJourneyActive && (
                <>
                  <div className="flex items-start gap-2.5 p-3 rounded-xl mt-3 mb-3"
                    style={{ background: `${color}10`, border: `1px solid ${color}22` }}>
                    <Star size={12} style={{ color, marginTop: 1, flexShrink: 0 }} />
                    <p className="text-xs leading-relaxed flex-1" style={{ color: "rgba(255,255,255,0.72)" }}>{tip}</p>
                  </div>
                  <Link
                    href={tipLink.href}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-bold text-xs transition-all active:scale-[0.97]"
                    style={{ background: gradient, color: "#fff", boxShadow: `0 4px 16px ${color}38` }}
                  >
                    {tipLink.icon}
                    {tipLink.label}
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
