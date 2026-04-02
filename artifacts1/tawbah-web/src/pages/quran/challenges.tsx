import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Trophy, Star, Check, BookOpen, Clock, ChevronRight, Lock } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Challenge {
  id: string;
  title: string;
  icon: string;
  description: string;
  color: string;
  border: string;
  target: number;
  unit: string;
  tasks: string[];
  points: number;
  locked?: boolean;
}

interface Progress {
  [id: string]: {
    done: number;
    streak: number;
    lastDate: string;
    completedTasks: number[];
  };
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const CHALLENGES: Challenge[] = [
  {
    id: "ramadan_khatma",
    title: "ختمة رمضان",
    icon: "🌙",
    description: "اختم القرآن كاملاً خلال شهر رمضان المبارك — جزء في كل يوم",
    color: "from-amber-500/15 to-yellow-400/5",
    border: "border-amber-400/25",
    target: 30,
    unit: "جزء",
    tasks: [
      "اقرأ جزءاً واحداً كل يوم بعد الفجر",
      "استمع لجزء آخر أثناء النوم",
      "راجع ما قرأت في رمضان الماضي",
      "اختم الجزء قبل المغرب كل يوم",
    ],
    points: 1000,
  },
  {
    id: "juz_amma",
    title: "حفظ جزء عمّ",
    icon: "⭐",
    description: "احفظ جزء عمّ كاملاً (٣٧ سورة) خطوة بخطوة",
    color: "from-violet-500/15 to-purple-400/5",
    border: "border-violet-400/25",
    target: 37,
    unit: "سورة",
    tasks: [
      "احفظ سورة جديدة كل يومين",
      "راجع المحفوظ قبل النوم",
      "اسمع للسورة مرة قبل حفظها",
      "اختبر نفسك أسبوعياً",
    ],
    points: 800,
  },
  {
    id: "kahf_friday",
    title: "تحدي سورة الكهف",
    icon: "🌊",
    description: "اقرأ سورة الكهف كل جمعة لمدة شهر متواصل",
    color: "from-cyan-500/15 to-blue-400/5",
    border: "border-cyan-400/25",
    target: 4,
    unit: "جمعة",
    tasks: [
      "اقرأ الكهف بعد صلاة الجمعة",
      "افهم تفسير آياتها",
      "تأمل الدروس الأربعة في الكهف",
      "شارك آية منها مع صديق",
    ],
    points: 400,
  },
  {
    id: "morning_ayahs",
    title: "أذكار الصباح القرآنية",
    icon: "🌅",
    description: "اقرأ آية الكرسي والمعوذات والإخلاص كل صباح لمدة ٣٠ يوماً",
    color: "from-rose-500/15 to-pink-400/5",
    border: "border-rose-400/25",
    target: 30,
    unit: "يوم",
    tasks: [
      "آية الكرسي بعد كل صلاة",
      "المعوذتان والإخلاص ٣ مرات صباحاً",
      "البقرة الآيتان الأخيرتان قبل النوم",
      "الفاتحة في كل صلاة بتدبر",
    ],
    points: 300,
  },
  {
    id: "tafsir_daily",
    title: "تدبر آية يومياً",
    icon: "💡",
    description: "تأمل وتعلم تفسير آية قرآنية واحدة كل يوم لمدة شهر",
    color: "from-emerald-500/15 to-teal-400/5",
    border: "border-emerald-400/25",
    target: 30,
    unit: "آية",
    tasks: [
      "اختر آية من صلاتك اليومية",
      "اقرأ تفسيرها من كتاب موثوق",
      "اكتب ما استفدته منها",
      "شارك معنى الآية مع شخص",
    ],
    points: 300,
  },
  {
    id: "quran_night",
    title: "قيام ليل القرآن",
    icon: "🌙",
    description: "اقرأ جزءاً في قيام الليل كل أسبوع لمدة شهر",
    color: "from-indigo-500/15 to-blue-400/5",
    border: "border-indigo-400/25",
    target: 4,
    unit: "أسبوع",
    tasks: [
      "قم الثلث الأخير من الليل",
      "اقرأ جزءاً كاملاً في قيامك",
      "ادعُ بعد القراءة بما تريد",
      "واظب على هذا كل أسبوع",
    ],
    points: 500,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadProgress(): Progress {
  try { return JSON.parse(localStorage.getItem("quran_challenges_progress") || "{}"); } catch { return {}; }
}
function saveProgress(p: Progress) { localStorage.setItem("quran_challenges_progress", JSON.stringify(p)); }

// ─── Leaderboard ─────────────────────────────────────────────────────────────

const MOCK_LEADERS = [
  { rank: 1, name: "أبو عمر", points: 1850, badge: "🏆" },
  { rank: 2, name: "أنت", points: 0, badge: "⭐", isMe: true },
  { rank: 3, name: "محمد", points: 1200, badge: "🥉" },
  { rank: 4, name: "عبدالله", points: 980, badge: "💪" },
  { rank: 5, name: "يوسف", points: 750, badge: "📖" },
];

// ─── Challenge Card ───────────────────────────────────────────────────────────

function ChallengeCard({ challenge, progress, onUpdate }: {
  challenge: Challenge;
  progress: Progress;
  onUpdate: (id: string, done: number, tasks: number[]) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cp = progress[challenge.id] || { done: 0, streak: 0, lastDate: "", completedTasks: [] };
  const pct = Math.min(100, Math.round((cp.done / challenge.target) * 100));
  const isComplete = cp.done >= challenge.target;

  const toggleTask = (idx: number) => {
    const tasks = cp.completedTasks.includes(idx)
      ? cp.completedTasks.filter(t => t !== idx)
      : [...cp.completedTasks, idx];
    const done = Math.min(challenge.target, tasks.length * Math.ceil(challenge.target / challenge.tasks.length));
    onUpdate(challenge.id, done, tasks);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl overflow-hidden bg-gradient-to-br ${challenge.color} border ${challenge.border}`}
    >
      <button className="w-full p-4 text-right" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0"
            style={{ background: "rgba(255,255,255,0.08)" }}>
            {challenge.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-bold text-sm">{challenge.title}</p>
              {isComplete && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                  style={{ background: "rgba(34,197,94,0.2)", color: "#22c55e" }}>مكتمل ✓</span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground leading-snug">{challenge.description}</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                  className="h-full rounded-full"
                  style={{ background: "rgba(139,92,246,0.8)" }}
                />
              </div>
              <span className="text-[10px] font-bold" style={{ color: "#8b5cf6" }}>{cp.done}/{challenge.target}</span>
              <span className="text-[10px] text-muted-foreground">{challenge.unit}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: "rgba(251,191,36,0.15)", color: "#f59e0b" }}>
              +{challenge.points} نقطة
            </span>
            {expanded ? <ChevronRight size={14} className="text-muted-foreground rotate-90" /> : <ChevronRight size={14} className="text-muted-foreground -rotate-90" />}
          </div>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4" dir="rtl">
              <div className="h-px mb-3" style={{ background: "rgba(255,255,255,0.07)" }} />
              <p className="text-[11px] font-bold text-muted-foreground mb-2">خطوات التحدي:</p>
              <div className="flex flex-col gap-2">
                {challenge.tasks.map((task, idx) => {
                  const done = cp.completedTasks.includes(idx);
                  return (
                    <button key={idx} onClick={() => toggleTask(idx)}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl text-right active:scale-[0.98] transition-all"
                      style={{
                        background: done ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.03)",
                        border: done ? "1px solid rgba(34,197,94,0.2)" : "1px solid rgba(255,255,255,0.05)",
                      }}>
                      <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                        style={{
                          background: done ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.06)",
                          border: done ? "1px solid rgba(34,197,94,0.5)" : "1px solid rgba(255,255,255,0.1)",
                        }}>
                        {done && <Check size={10} style={{ color: "#22c55e" }} />}
                      </div>
                      <p className="text-[12px] leading-snug" style={{ color: done ? "rgba(255,255,255,0.5)" : "var(--foreground)", textDecoration: done ? "line-through" : "none" }}>
                        {task}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function QuranChallengesPage() {
  const [progress, setProgress] = useState<Progress>({});
  const [tab, setTab] = useState<"challenges" | "leaderboard">("challenges");

  useEffect(() => { setProgress(loadProgress()); }, []);

  const updateChallenge = (id: string, done: number, tasks: number[]) => {
    const today = new Date().toDateString();
    const cp = progress[id] || { done: 0, streak: 0, lastDate: "", completedTasks: [] };
    const streak = cp.lastDate === new Date(Date.now() - 86400000).toDateString() ? cp.streak + 1 : 1;
    const updated = { ...progress, [id]: { done, streak, lastDate: today, completedTasks: tasks } };
    setProgress(updated);
    saveProgress(updated);
  };

  const totalPoints = CHALLENGES.reduce((sum, c) => {
    const cp = progress[c.id];
    if (!cp || cp.done < c.target) return sum;
    return sum + c.points;
  }, 0);

  const leaders = MOCK_LEADERS.map(l => l.isMe ? { ...l, points: totalPoints } : l)
    .sort((a, b) => b.points - a.points)
    .map((l, i) => ({ ...l, rank: i + 1 }));

  return (
    <div className="min-h-screen pb-24" dir="rtl">
      <PageHeader title="تحديات القرآن" subtitle="تحدَّ نفسك وتقدّم روحياً" />

      <div className="px-4 pt-4 flex flex-col gap-4">
        {/* Stats bar */}
        <div className="rounded-2xl p-4"
          style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(79,70,229,0.06) 100%)", border: "1px solid rgba(139,92,246,0.2)" }}>
          <div className="flex justify-between">
            {[
              { label: "نقاطي", value: totalPoints, icon: "⭐" },
              { label: "مكتملة", value: CHALLENGES.filter(c => (progress[c.id]?.done || 0) >= c.target).length, icon: "✅" },
              { label: "جارية", value: CHALLENGES.filter(c => (progress[c.id]?.done || 0) > 0 && (progress[c.id]?.done || 0) < c.target).length, icon: "🔥" },
            ].map(s => (
              <div key={s.label} className="text-center flex-1">
                <p className="text-lg mb-0.5">{s.icon}</p>
                <p className="text-base font-bold" style={{ color: "#8b5cf6" }}>{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          {[{ id: "challenges", label: "التحديات", icon: <Flame size={13} /> }, { id: "leaderboard", label: "المتصدرون", icon: <Trophy size={13} /> }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              className="flex-1 py-2.5 flex items-center justify-center gap-1.5 text-[12px] font-bold transition-all"
              style={{
                background: tab === t.id ? "rgba(139,92,246,0.2)" : "transparent",
                color: tab === t.id ? "#8b5cf6" : "var(--muted-foreground)",
              }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === "challenges" ? (
            <motion.div key="challenges" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col gap-3">
              {CHALLENGES.map((c, i) => (
                <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <ChallengeCard challenge={c} progress={progress} onUpdate={updateChallenge} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div key="leaderboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col gap-2">
              <p className="text-[11px] text-muted-foreground text-center mb-2">لوحة المتصدرين الشهرية</p>
              {leaders.map((l, i) => (
                <motion.div key={l.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{
                    background: l.isMe ? "rgba(139,92,246,0.1)" : "rgba(255,255,255,0.03)",
                    border: l.isMe ? "1px solid rgba(139,92,246,0.25)" : "1px solid rgba(255,255,255,0.06)",
                  }}>
                  <span className="text-lg w-7 text-center">{l.badge}</span>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: "rgba(139,92,246,0.15)", color: "#8b5cf6" }}>
                    {l.name[0]}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold">{l.name} {l.isMe && <span className="text-[10px]" style={{ color: "#8b5cf6" }}>(أنت)</span>}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold" style={{ color: "#f59e0b" }}>{l.points}</p>
                    <p className="text-[10px] text-muted-foreground">نقطة</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
