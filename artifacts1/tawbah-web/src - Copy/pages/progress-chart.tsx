import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, Flame, CheckCircle2, BookOpen, Moon, Star, Brain, ShieldAlert,
  TrendingDown, Target, Award, Calendar, Zap, Sparkles, BarChart3, Heart,
  ChevronRight, Trophy, Activity, ListChecks, Plus, Hand
} from "lucide-react";
import { getDuaPeakAmeenCount } from "@/lib/dua-power";
import { Link } from "wouter";
import { PageHeader } from "@/components/PageHeader";
import { useQuery } from "@tanstack/react-query";
import { useAppUserProgress, useAppDhikrCount, useAppHabits } from "@/hooks/use-app-data";
import { getSessionId } from "@/lib/session";
import { getApiBase } from "@/lib/api-base";
import { getAuthHeader } from "@/lib/auth-client";
import { BadgesSection } from "@/components/badges";

interface DayRecord {
  date: string;
  habitsCompleted: number;
  habitsTotal: number;
  istighfar: number;
}

const MOTIVATIONAL = [
  "كل يوم تلتزم فيه هو انتصار جديد",
  "المداومة على القليل خير من الانقطاع في الكثير",
  "إن الله لا يمل حتى تملوا",
  "أحب الأعمال إلى الله أدومها وإن قلّ",
  "اليوم الذي تضبطه لا يُعوَّض",
  "التوبة الحقيقية تُورِث النور في القلب",
  "كن مع الله وكن مطمئناً",
];

const DAY_NAMES = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

function getSosStats(): { count: number; lastDate: string | null } {
  try {
    return {
      count: parseInt(localStorage.getItem("sos_count") || "0", 10),
      lastDate: localStorage.getItem("sos_last"),
    };
  } catch {
    return { count: 0, lastDate: null };
  }
}

// مستوى التوبة بناءً على رحلة الـ30 يوم والأوسمة والإنجازات
function getSpiritualLevel(streak: number, avgRate: number, journey30Days: number, badgeCount: number): {
  level: number; title: string; icon: string; color: string; nextTitle: string; progress: number;
} {
  const score = streak * 2 + avgRate * 50 + journey30Days * 3 + badgeCount * 5;
  if (score >= 200) return { level: 5, title: "تائب نصوح", icon: "🌟", color: "text-yellow-500", nextTitle: "—", progress: 100 };
  if (score >= 120) return { level: 4, title: "السالك", icon: "🌿", color: "text-emerald-500", nextTitle: "تائب نصوح", progress: Math.round(((score - 120) / 80) * 100) };
  if (score >= 60)  return { level: 3, title: "المجتهد", icon: "💪", color: "text-blue-500", nextTitle: "السالك", progress: Math.round(((score - 60) / 60) * 100) };
  if (score >= 20)  return { level: 2, title: "المبتدئ", icon: "🌱", color: "text-green-500", nextTitle: "المجتهد", progress: Math.round(((score - 20) / 40) * 100) };
  return { level: 1, title: "أول الطريق", icon: "🤲", color: "text-primary", nextTitle: "المبتدئ", progress: Math.round((score / 20) * 100) };
}

function SpiritualLevelCard({ streak, avgRate, journey30Days, badgeCount }: { streak: number; avgRate: number; journey30Days: number; badgeCount: number }) {
  const level = getSpiritualLevel(streak, avgRate, journey30Days, badgeCount);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="relative overflow-hidden bg-gradient-to-br from-primary/15 via-primary/8 to-accent/5 rounded-2xl border border-primary/20 p-4 mb-4"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-2xl">
          {level.icon}
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground font-medium">مستواك الروحي</p>
          <p className={`text-lg font-bold ${level.color}`}>{level.title}</p>
        </div>
        <div className="flex flex-col items-end">
          {[1,2,3,4,5].map(l => (
            <div key={l} className={`w-2 h-2 rounded-full mb-0.5 ${l <= level.level ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>
      </div>
      {level.progress < 100 && (
        <div>
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
            <span>التقدم نحو «{level.nextTitle}»</span>
            <span className="font-bold text-primary">{level.progress}%</span>
          </div>
          <div className="h-1.5 bg-primary/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${level.progress}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
            />
          </div>
        </div>
      )}
      {/* Background decoration */}
      <div className="absolute -top-6 -left-6 w-24 h-24 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
    </motion.div>
  );
}

function StatCard({ icon, value, label, color, bg, delay }: {
  icon: React.ReactNode; value: string | number; label: string;
  color: string; bg: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      className="bg-card rounded-xl border border-border p-3.5"
    >
      <div className={`w-9 h-9 rounded-xl ${bg} ${color} flex items-center justify-center mb-2.5`}>
        {icon}
      </div>
      <div className="text-xl font-bold text-foreground leading-tight">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{label}</div>
    </motion.div>
  );
}

function SmartInsights({ weekData, streakDays, sosCount }: {
  weekData: DayRecord[]; streakDays: number; sosCount: number;
}) {
  if (weekData.length === 0) return null;

  const insights: { icon: string; text: string; color: string }[] = [];
  const dayRates = weekData.map(d => d.habitsTotal > 0 ? d.habitsCompleted / d.habitsTotal : 0);
  const avgRate = dayRates.reduce((s, r) => s + r, 0) / dayRates.length;
  const lastHalf = dayRates.slice(3);
  const firstHalf = dayRates.slice(0, 3);
  const lastAvg = lastHalf.reduce((s, r) => s + r, 0) / lastHalf.length;
  const firstAvg = firstHalf.reduce((s, r) => s + r, 0) / firstHalf.length;
  const improving = lastAvg > firstAvg + 0.1;
  const declining = lastAvg < firstAvg - 0.1;
  const bestDayIndex = dayRates.indexOf(Math.max(...dayRates));
  const bestDay = weekData[bestDayIndex];
  const totalIstighfar = weekData.reduce((s, d) => s + d.istighfar, 0);

  if (improving) insights.push({ icon: "📈", text: "أداؤك يتحسن! النصف الثاني من الأسبوع أفضل من الأول.", color: "text-emerald-600 dark:text-emerald-400" });
  else if (declining) insights.push({ icon: "⚠️", text: "لاحظنا تراجعاً طفيفاً — تذكّر أن الاستمرار هو الهدف.", color: "text-amber-600 dark:text-amber-400" });
  if (avgRate >= 0.8) insights.push({ icon: "🌟", text: "معدل أسبوعك ممتاز! أنت في المسار الصحيح.", color: "text-primary" });
  else if (avgRate >= 0.5) insights.push({ icon: "💪", text: "تقوم بجهد جيد — زيادة عادة واحدة يومياً ستصنع فرقاً.", color: "text-blue-600 dark:text-blue-400" });
  else insights.push({ icon: "🤲", text: "لا تيأس — حتى الاستغفار مرة واحدة يُحتسب لك.", color: "text-violet-600 dark:text-violet-400" });
  if (bestDay && dayRates[bestDayIndex]! > 0) {
    const d = new Date(bestDay.date);
    insights.push({ icon: "🏆", text: `أفضل يوم لك: ${DAY_NAMES[d.getDay()]} — استحضر ما أعانك فيه.`, color: "text-amber-600 dark:text-amber-400" });
  }
  if (streakDays >= 7) insights.push({ icon: "🔥", text: `سلسلة ${streakDays} يوم متواصل — الله يحفظها لك في الميزان.`, color: "text-orange-500" });
  if (totalIstighfar >= 700) insights.push({ icon: "📿", text: `${totalIstighfar} استغفارة هذا الأسبوع — قلبك يصقله هذا الذكر.`, color: "text-emerald-600 dark:text-emerald-400" });
  if (sosCount > 0) insights.push({ icon: "🛡️", text: `استخدمت زر الطوارئ ${sosCount} ${sosCount === 1 ? "مرة" : "مرات"} — هذا قوة، لا ضعف.`, color: "text-rose-600 dark:text-rose-400" });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
      className="bg-card rounded-2xl border border-border p-4 mb-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <Brain size={15} className="text-primary" />
        <h2 className="font-bold text-sm">تحليل ذكي لأسبوعك</h2>
      </div>
      <div className="space-y-2.5">
        {insights.map((ins, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.07 }}
            className="flex items-start gap-2.5"
          >
            <span className="text-base shrink-0 mt-0.5">{ins.icon}</span>
            <p className={`text-xs leading-relaxed ${ins.color}`}>{ins.text}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function WeekBarChart({ weekData, type }: {
  weekData: DayRecord[];
  type: "habits" | "istighfar";
}) {
  const values = type === "habits"
    ? weekData.map(d => d.habitsTotal > 0 ? d.habitsCompleted / d.habitsTotal : 0)
    : weekData.map(d => d.istighfar);
  const max = Math.max(...values, 1);
  const isToday = (date: string) => date === new Date().toISOString().split("T")[0];

  return (
    <div className="flex items-end justify-between gap-1.5 h-28">
      {weekData.map((day, i) => {
        const val = values[i] ?? 0;
        const pct = type === "habits" ? val * 100 : (val / max) * 100;
        const height = Math.max(pct, 4);
        const today = isToday(day.date);
        const d = new Date(day.date);
        return (
          <div key={day.date} className="flex flex-col items-center gap-1 flex-1">
            <div className="flex-1 flex items-end w-full">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ delay: 0.3 + i * 0.05, duration: 0.5, ease: "easeOut" }}
                className={`w-full rounded-t-lg ${
                  type === "habits"
                    ? today ? "bg-primary" : val >= 0.8 ? "bg-emerald-500/70" : val >= 0.4 ? "bg-amber-500/70" : "bg-muted"
                    : today ? "bg-secondary" : "bg-secondary/50"
                }`}
                style={{ minHeight: "4px" }}
              />
            </div>
            <span className={`text-[9px] font-medium ${today ? "text-primary font-bold" : "text-muted-foreground"}`}>
              {DAY_NAMES[d.getDay()]!.slice(0, 2)}
            </span>
            {type === "habits" && val > 0 && (
              <span className={`text-[9px] tabular-nums ${today ? "text-primary" : "text-muted-foreground"}`}>
                {Math.round(val * 100)}%
              </span>
            )}
            {type === "istighfar" && (val as number) > 0 && (
              <span className={`text-[9px] tabular-nums ${today ? "text-secondary" : "text-muted-foreground"}`}>
                {val}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function HabitBreakdownSection({ habits }: { habits: Array<{ habitKey: string; habitNameAr: string; completed: boolean }> }) {
  const completed = habits.filter(h => h.completed);
  const pending = habits.filter(h => !h.completed);

  if (!habits.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-card rounded-2xl border border-border border-dashed p-4 mb-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <ListChecks size={15} className="text-primary" />
          <h2 className="font-bold text-sm">عاداتي اليومية</h2>
        </div>
        <div className="flex flex-col items-center text-center py-3 gap-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            لم تُضف عادات بعد.<br />أضف عاداتك من خطة اليوم لتظهر إحصائياتها هنا.
          </p>
          <Link href="/plan">
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-full text-xs font-bold shadow-sm shadow-primary/25"
            >
              <Plus size={13} />
              ابدأ عاداتي
            </motion.button>
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="bg-card rounded-2xl border border-border p-4 mb-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={15} className="text-primary" />
          <h2 className="font-bold text-sm">عادات اليوم</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
            {completed.length} / {habits.length}
          </span>
          <Link href="/plan">
            <span className="text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-0.5">
              إدارة <ChevronRight size={10} />
            </span>
          </Link>
        </div>
      </div>

      {/* Progress ring visual */}
      <div className="flex items-center gap-4 mb-3">
        <div className="relative w-16 h-16 shrink-0">
          <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
            <circle cx="32" cy="32" r="26" fill="none" stroke="hsl(var(--primary)/0.12)" strokeWidth="8" />
            <motion.circle
              cx="32" cy="32" r="26" fill="none"
              stroke="hsl(var(--primary))" strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 26}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 26 }}
              animate={{ strokeDashoffset: habits.length > 0 ? (1 - completed.length / habits.length) * 2 * Math.PI * 26 : 2 * Math.PI * 26 }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[11px] font-bold text-primary">
              {habits.length > 0 ? Math.round((completed.length / habits.length) * 100) : 0}%
            </span>
          </div>
        </div>
        <div className="flex-1 space-y-1.5">
          {completed.slice(0, 3).map((h) => (
            <div key={h.habitKey} className="flex items-center gap-1.5 text-[11px]">
              <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
              <span className="text-foreground/80 truncate">{h.habitNameAr}</span>
            </div>
          ))}
          {pending.slice(0, 2).map((h) => (
            <div key={h.habitKey} className="flex items-center gap-1.5 text-[11px]">
              <div className="w-[11px] h-[11px] rounded-full border border-muted-foreground/40 shrink-0" />
              <span className="text-muted-foreground truncate">{h.habitNameAr}</span>
            </div>
          ))}
          {(completed.length + pending.length) > 5 && (
            <p className="text-[10px] text-muted-foreground">+{habits.length - 5} عادة أخرى</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function Journey30Track({ journey30Days }: { journey30Days: number }) {
  const days = Math.min(journey30Days, 30);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="bg-card rounded-2xl border border-border p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Moon size={15} className="text-primary" />
          <h2 className="font-bold text-sm">رحلة التوبة — ٣٠ يوماً</h2>
        </div>
        <span className="text-xs text-muted-foreground font-medium">{days}/30</span>
      </div>

      {/* Weeks grid */}
      {[0,1,2,3].map(week => (
        <div key={week} className="flex gap-1.5 mb-1.5">
          {[0,1,2,3,4,5,6].map(d => {
            const day = week * 7 + d + 1;
            if (day > 30) return <div key={d} className="flex-1" />;
            const done = day <= days;
            const current = day === days + 1;
            return (
              <motion.div
                key={d}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.65 + day * 0.012 }}
                className={`flex-1 h-6 rounded-md flex items-center justify-center text-[9px] font-bold transition-all ${
                  done
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : current
                    ? "bg-primary/20 text-primary border border-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {day}
              </motion.div>
            );
          })}
        </div>
      ))}

      <p className="text-xs text-muted-foreground mt-2 text-center">
        {days >= 30
          ? "🎉 مبارك! أكملت رحلة التوبة ٣٠ يوماً"
          : `تبقّى ${30 - days} يوماً لإتمام الرحلة`}
      </p>
    </motion.div>
  );
}

function useJourney30Data() {
  return useQuery({
    queryKey: ["/api/journey30-progress"],
    queryFn: async () => {
      const sessionId = getSessionId();
      const res = await fetch(`${getApiBase()}/journey30?sessionId=${encodeURIComponent(sessionId)}`, { headers: { ...getAuthHeader() } });
      if (!res.ok) return { completedCount: 0, currentDay: 1, streakDays: 0 };
      return res.json() as Promise<{ completedCount: number; currentDay: number; streakDays: number }>;
    },
    staleTime: 1000 * 60 * 5,
  });
}

function getBadgeCount(streakDays: number, journey30Days: number, avgHabits: number): number {
  let count = 0;
  if (streakDays >= 1) count++;
  if (streakDays >= 7) count++;
  if (streakDays >= 30) count++;
  if (journey30Days >= 1) count++;
  if (journey30Days >= 7) count++;
  if (journey30Days >= 30) count++;
  if (avgHabits >= 50) count++;
  if (avgHabits >= 80) count++;
  return count;
}

export default function ProgressChart() {
  const { data: progress } = useAppUserProgress();
  const { data: dhikr } = useAppDhikrCount();
  const { data: habits } = useAppHabits();
  const { data: journey30 } = useJourney30Data();
  const [weekData, setWeekData] = useState<DayRecord[]>([]);
  const [activeTab, setActiveTab] = useState<"habits" | "istighfar">("habits");
  const [quote] = useState(() => MOTIVATIONAL[Math.floor(Math.random() * MOTIVATIONAL.length)]);
  const sosStats = getSosStats();
  const ameenCount = getDuaPeakAmeenCount();

  useEffect(() => {
    const sessionId = getSessionId();
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split("T")[0];
    });
    Promise.all(
      last7.map(async (date) => {
        try {
          const [habRes, dhRes] = await Promise.all([
            fetch(`/api/habits?sessionId=${encodeURIComponent(sessionId)}&date=${date}`),
            fetch(`/api/dhikr/count?sessionId=${encodeURIComponent(sessionId)}&date=${date}`),
          ]);
          const habData = habRes.ok ? await habRes.json() : [];
          const dhData = dhRes.ok ? await dhRes.json() : { istighfar: 0 };
          return {
            date,
            habitsCompleted: habData.filter((h: { completed: boolean }) => h.completed).length,
            habitsTotal: habData.length || 5,
            istighfar: dhData.istighfar || 0,
          };
        } catch {
          return { date, habitsCompleted: 0, habitsTotal: 5, istighfar: 0 };
        }
      })
    ).then(setWeekData);
  }, []);

  const todayHabits = habits || [];
  const completedToday = todayHabits.filter((h) => h.completed).length;
  const totalHabits = todayHabits.length || 5;
  const journey30Days = journey30?.completedCount || 0;
  const streakDays = journey30?.streakDays || progress?.streakDays || 0;
  const totalIstighfar = weekData.reduce((s, d) => s + d.istighfar, 0);
  const avgHabits = weekData.length > 0
    ? Math.round((weekData.reduce((s, d) => s + (d.habitsTotal > 0 ? d.habitsCompleted / d.habitsTotal : 0), 0) / weekData.length) * 100)
    : 0;
  const badgeCount = getBadgeCount(streakDays, journey30Days, avgHabits);

  const dayRates = weekData.map(d => d.habitsTotal > 0 ? d.habitsCompleted / d.habitsTotal : 0);
  const lastHalf = dayRates.slice(3);
  const firstHalf = dayRates.slice(0, 3);
  const lastAvg = lastHalf.length ? lastHalf.reduce((s, r) => s + r, 0) / lastHalf.length : 0;
  const firstAvg = firstHalf.length ? firstHalf.reduce((s, r) => s + r, 0) / firstHalf.length : 0;
  const trendUp = lastAvg > firstAvg + 0.05;
  const trendDown = lastAvg < firstAvg - 0.05;

  return (
    <div className="flex flex-col flex-1 pb-8" dir="rtl">
      <PageHeader
        title="خريطة التقدم الروحي"
        subtitle={`"${quote}"`}
        icon={<BarChart3 size={16} />}
      />

      <div className="px-4 pt-4 flex flex-col">

      {/* Spiritual Level */}
      <SpiritualLevelCard streak={streakDays} avgRate={avgHabits / 100} journey30Days={journey30Days} badgeCount={badgeCount} />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <StatCard icon={<Flame size={18} />}       value={streakDays}        label="يوم متواصل"        color="text-orange-500"  bg="bg-orange-500/10"  delay={0.12} />
        <StatCard icon={<BookOpen size={18} />}    value={totalIstighfar}    label="استغفارة هذا الأسبوع" color="text-violet-500" bg="bg-violet-500/10" delay={0.17} />
        <StatCard icon={<CheckCircle2 size={18} />} value={`${completedToday}/${totalHabits}`} label="عادات اليوم" color="text-emerald-500" bg="bg-emerald-500/10" delay={0.22} />
        <StatCard icon={<Star size={18} />}        value={`${avgHabits}%`}   label="معدل الأسبوع"      color="text-amber-500"   bg="bg-amber-500/10"  delay={0.27} />
      </div>

      {/* Habit breakdown — always shown */}
      <HabitBreakdownSection habits={todayHabits as Array<{ habitKey: string; habitNameAr: string; completed: boolean }>} />

      {/* Badges */}
      <div className="mb-4">
        <BadgesSection />
      </div>

      {/* SOS warning */}
      {sosStats.count > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-rose-500/10 border border-rose-400/30 rounded-xl p-3.5 mb-4 flex items-center gap-3"
        >
          <ShieldAlert size={18} className="text-rose-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-rose-700 dark:text-rose-400">
              استخدمت زر الطوارئ {sosStats.count} {sosStats.count === 1 ? "مرة" : "مرات"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              طلبت الله في لحظة صعبة — هذا جهاد حقيقي
            </p>
          </div>
        </motion.div>
      )}

      {/* Dua Peak Ameen Counter */}
      {ameenCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.31 }}
          className="rounded-2xl border border-yellow-400/30 bg-gradient-to-br from-yellow-500/10 via-amber-400/5 to-transparent p-4 mb-4 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-yellow-500/15 flex items-center justify-center shrink-0">
            <Hand size={18} className="text-yellow-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-yellow-700 dark:text-yellow-400">
              دعوت في لحظة قمة الإجابة
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              وصل دعاؤك إلى الله في {ameenCount} {ameenCount === 1 ? "لحظة" : "لحظات"} كان فيها الدعاء مستجاباً — آمين
            </p>
          </div>
          <span className="text-2xl font-black text-yellow-500">{ameenCount}</span>
        </motion.div>
      )}

      {/* Weekly Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.33 }}
        className="bg-card rounded-2xl border border-border p-4 mb-4"
      >
        {/* Tab switcher */}
        <div className="flex gap-1.5 mb-4">
          <button
            onClick={() => setActiveTab("habits")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "habits" ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground"
            }`}
          >
            <CheckCircle2 size={12} />
            العادات
          </button>
          <button
            onClick={() => setActiveTab("istighfar")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "istighfar" ? "bg-secondary text-secondary-foreground" : "bg-muted/50 text-muted-foreground"
            }`}
          >
            <BookOpen size={12} />
            الاستغفار
          </button>
        </div>

        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-sm">
            {activeTab === "habits" ? "نسبة إتمام العادات" : "الاستغفار"} — آخر 7 أيام
          </h2>
          <div className="flex items-center gap-1">
            {trendUp && activeTab === "habits" && <TrendingUp size={12} className="text-emerald-500" />}
            {trendDown && activeTab === "habits" && <TrendingDown size={12} className="text-rose-500" />}
            {activeTab === "habits" && (
              <span className={`text-[10px] font-bold ${trendUp ? "text-emerald-500" : trendDown ? "text-rose-500" : "text-muted-foreground"}`}>
                {trendUp ? "في تحسّن" : trendDown ? "تراجع طفيف" : "مستقر"}
              </span>
            )}
            {activeTab === "istighfar" && (
              <span className="text-[10px] text-muted-foreground font-bold">الإجمالي: {totalIstighfar}</span>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: activeTab === "habits" ? -10 : 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <WeekBarChart weekData={weekData} type={activeTab} />
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Smart insights */}
      <SmartInsights weekData={weekData} streakDays={streakDays} sosCount={sosStats.count} />

      {/* 30-day journey track */}
      <Journey30Track journey30Days={journey30Days} />
      </div>
    </div>
  );
}
