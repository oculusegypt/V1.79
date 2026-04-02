import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, ArrowLeft, Shield, AlertTriangle, Star,
  Droplets, BookOpen, Mic2, Trash2, Wind,
  ChevronDown, ChevronUp, ArrowRight, Sparkles,
} from "lucide-react";
import { useAppUpdateProgress } from "@/hooks/use-app-data";
import {
  getSelectedSins, CATEGORY_META,
  type Sin, type SinCategory,
} from "@/lib/sins-data";

// ─── Universal day-1 tasks (always shown) ────────────────────────────────────
const UNIVERSAL_TASKS = [
  {
    id: "wudu",
    icon: <Droplets size={16} />,
    label: "توضأ الآن",
    desc: "قم فتوضأ وضوءاً كاملاً — الماء يغسل الذنوب كما يغسل الجسد.",
    color: "text-blue-500",
    bg: "bg-blue-500/8",
    border: "border-blue-400/25",
  },
  {
    id: "prayer",
    icon: <BookOpen size={16} />,
    label: "صلِّ ركعتين للتوبة",
    desc: "صل ركعتين خالصتين لله بنية التوبة الصادقة من هذه الذنوب.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/8",
    border: "border-emerald-400/25",
  },
  {
    id: "istighfar",
    icon: <Mic2 size={16} />,
    label: "قل «أستغفر الله» مئة مرة",
    desc: "ردد الاستغفار من قلبك مع حضور النية وحس الندم.",
    color: "text-violet-500",
    bg: "bg-violet-500/8",
    border: "border-violet-400/25",
  },
];

// ─── Generate environment-change tasks per category ───────────────────────────
function getEnvTask(category: SinCategory) {
  if (category === "major" || category === "with_kaffarah") {
    return {
      id: `env_${category}`,
      icon: <Trash2 size={16} />,
      label: "احذف وقطع كل ذريعة",
      desc: "احذف كل تطبيق، ملف، أو رقم قد يعيدك للذنب — لا وسط في هذه اللحظة.",
      color: "text-red-500",
      bg: "bg-red-500/8",
      border: "border-red-400/25",
    };
  }
  if (category === "huquq_ibad") {
    return {
      id: `env_${category}`,
      icon: <Wind size={16} />,
      label: "غيّر بيئتك الآن",
      desc: "ابتعد عن المجلس أو الموقف الذي ظلمت فيه — ابدأ بتصحيح الأثر.",
      color: "text-amber-500",
      bg: "bg-amber-500/8",
      border: "border-amber-400/25",
    };
  }
  return null;
}

// ─── Task item component ──────────────────────────────────────────────────────
function TaskItem({
  task,
  checked,
  onToggle,
  index,
}: {
  task: { id: string; icon: React.ReactNode; label: string; desc: string; color: string; bg: string; border: string };
  checked: boolean;
  onToggle: () => void;
  index: number;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05 * index, duration: 0.3 }}
      onClick={onToggle}
      whileTap={{ scale: 0.98 }}
      className={`w-full text-right flex items-start gap-3 p-4 rounded-2xl border transition-all duration-250 ${
        checked
          ? "bg-primary/5 border-primary/25 shadow-sm"
          : `${task.bg} ${task.border}`
      }`}
    >
      {/* Checkbox */}
      <div
        className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
          checked ? "bg-primary border-primary shadow-md shadow-primary/25" : "border-muted-foreground/25"
        }`}
      >
        <AnimatePresence>
          {checked && (
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.18, type: "spring", stiffness: 400, damping: 18 }}
            >
              <Check size={13} strokeWidth={3} className="text-primary-foreground" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Icon */}
      <div className={`mt-0.5 shrink-0 ${checked ? "text-primary/60" : task.color}`}>
        {task.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`font-bold text-[13.5px] leading-tight ${checked ? "line-through text-muted-foreground" : "text-foreground"}`}>
          {task.label}
        </p>
        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{task.desc}</p>
      </div>
    </motion.button>
  );
}

// ─── Keywords that mark a condition as a kaffarah obligation (not a day-1 task) ─
const KAFFARAH_KEYWORDS = ["كفارة", "فدية", "دية", "عتق", "إطعام", "قضاء اليوم", "قضاء اليوم"];

function isKaffarahCondition(cond: string) {
  return KAFFARAH_KEYWORDS.some((kw) => cond.includes(kw));
}

// ─── Sin condition group ──────────────────────────────────────────────────────
function SinConditionsGroup({
  sin,
  checkedSet,
  onToggle,
}: {
  sin: Sin;
  checkedSet: Set<string>;
  onToggle: (id: string) => void;
  taskOffset?: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const meta = CATEGORY_META[sin.category];

  // Separate conditions: day-1 checkable tasks vs long-term kaffarah obligations
  const taskConds = sin.conditions.filter((c, i) =>
    !(sin.kaffarahId && isKaffarahCondition(c))
  );
  const kaffarahConds = sin.kaffarahId
    ? sin.conditions.filter((c) => isKaffarahCondition(c))
    : [];

  return (
    <div className={`rounded-2xl border overflow-hidden ${meta.borderColor}`}
      style={{ background: "var(--card)" }}>
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className={`w-full flex items-center gap-3 px-4 py-3.5 text-right ${meta.bg}`}
      >
        <span className="text-xl shrink-0">{sin.icon}</span>
        <div className="flex-1 min-w-0">
          <p className={`text-[13px] font-bold leading-tight ${meta.color}`}>{sin.name}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {taskConds.length} خطوة أولية
            {kaffarahConds.length > 0 && ` · كفارة واجبة`}
          </p>
        </div>
        <motion.div
          animate={{ rotate: expanded ? 0 : 180 }}
          transition={{ duration: 0.2 }}
          className="text-muted-foreground"
        >
          <ChevronUp size={16} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="p-3 flex flex-col gap-2">
              {/* ── Checkable day-1 tasks ── */}
              {taskConds.map((cond, i) => {
                const taskId = `${sin.id}_task_${i}`;
                const checked = checkedSet.has(taskId);
                return (
                  <motion.button
                    key={taskId}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.04 * i }}
                    onClick={() => onToggle(taskId)}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full text-right flex items-center gap-3 px-3.5 py-3 rounded-xl border transition-all duration-200 ${
                      checked
                        ? "bg-primary/5 border-primary/20"
                        : `${meta.bg} ${meta.borderColor} hover:brightness-105`
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
                      checked ? "bg-primary border-primary" : "border-muted-foreground/25"
                    }`}>
                      <AnimatePresence>
                        {checked && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                            <Check size={11} strokeWidth={3} className="text-primary-foreground" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <p className={`text-[12.5px] font-semibold flex-1 leading-snug ${
                      checked ? "line-through text-muted-foreground" : meta.color
                    }`}>
                      {cond}
                    </p>
                  </motion.button>
                );
              })}

              {/* ── Kaffarah notice (non-checkable, informational) ── */}
              {sin.kaffarahId && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 rounded-xl border border-amber-400/30 overflow-hidden"
                  style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.08), rgba(245,158,11,0.04))" }}
                >
                  <div className="flex items-center gap-2 px-3.5 py-2 border-b border-amber-400/20">
                    <AlertTriangle size={12} className="text-amber-500 shrink-0" />
                    <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 tracking-wide">
                      واجب شرعي أساسي — يُكمَل في الرحلة
                    </p>
                  </div>
                  <div className="px-3.5 py-2.5">
                    <p className="text-[11.5px] font-bold text-amber-700 dark:text-amber-300 mb-1">
                      {sin.kaffarahLabel}
                    </p>
                    {sin.warning && (
                      <p className="text-[10.5px] text-amber-600 dark:text-amber-400 leading-relaxed">
                        {sin.warning}
                      </p>
                    )}
                    {kaffarahConds.length > 0 && (
                      <ul className="mt-1.5 flex flex-col gap-1">
                        {kaffarahConds.map((c, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-amber-400 mt-0.5 shrink-0">◈</span>
                            <span className="text-[10.5px] text-muted-foreground leading-snug">{c}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="text-[9.5px] text-amber-500/70 mt-2 italic">
                      ستجد خطة الكفارة التفصيلية في صفحة الكفارات بعد انتهاء اليوم الأول.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Warning without kaffarah */}
              {!sin.kaffarahId && sin.warning && (
                <div className="mt-1 flex items-start gap-2.5 bg-amber-500/8 border border-amber-400/25 rounded-xl px-3 py-2.5">
                  <AlertTriangle size={12} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">{sin.warning}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DayOne() {
  const [, setLocation] = useLocation();
  const updateProgress = useAppUpdateProgress();

  const sins = useMemo(() => getSelectedSins(), []);
  const hasKaffarah = sins.some((s) => s.kaffarahId);
  const hasHuquq = sins.some((s) => s.category === "huquq_ibad");

  // Generate universal task IDs
  const universalTaskIds = UNIVERSAL_TASKS.map((t) => t.id);

  // Generate environment change tasks (one per unique category, non-common)
  const categorySet = new Set<SinCategory>();
  const envTasks: ReturnType<typeof getEnvTask>[] = [];
  sins.forEach((s) => {
    if (!categorySet.has(s.category)) {
      categorySet.add(s.category);
      const t = getEnvTask(s.category);
      if (t) envTasks.push(t);
    }
  });
  const envTaskIds = envTasks.map((t) => t!.id);

  // Total count: only day-1 checkable conditions (exclude kaffarah obligations)
  const sinConditionIds = sins.flatMap((s) =>
    s.conditions
      .filter((c) => !(s.kaffarahId && isKaffarahCondition(c)))
      .map((_, i) => `${s.id}_task_${i}`)
  );
  const fallbackTaskIds = sins.length === 0 ? ["s0", "s1"] : [];
  const allTaskIds = [...universalTaskIds, ...envTaskIds, ...sinConditionIds, ...fallbackTaskIds];
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const doneCount = allTaskIds.filter(id => checked.has(id)).length;
  const totalCount = allTaskIds.length;
  const progressPct = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;
  const allDone = totalCount > 0 && doneCount >= totalCount;

  const handleComplete = () => {
    if (!allDone) return;
    updateProgress.mutate({ firstDayTasksCompleted: true }, {
      onSuccess: () => setLocation("/journey"),
    });
  };

  const handleSkip = () => {
    updateProgress.mutate({ firstDayTasksCompleted: true }, {
      onSuccess: () => setLocation("/journey"),
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-background" dir="rtl">
      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/40">
        <div className="flex items-center h-14 px-2 relative">
          <button
            onClick={() => setLocation("/")}
            className="w-10 h-10 rounded-xl hover:bg-muted/70 active:scale-95 transition-all text-muted-foreground flex items-center justify-center"
          >
            <ArrowRight size={20} />
          </button>
          <div className="absolute inset-x-0 flex flex-col items-center pointer-events-none px-14">
            <p className="font-bold text-sm text-foreground">اليوم الأول</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">بداية رحلة التوبة</p>
          </div>
          <button
            onClick={handleSkip}
            className="mr-auto text-[11px] text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded-lg"
          >
            تخطّى
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-muted/40">
          <motion.div
            className="h-full rounded-full bg-primary"
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 px-4 pt-5 pb-36 overflow-y-auto flex flex-col gap-5">

        {/* ── Hero ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-3xl overflow-hidden relative"
          style={{
            background: "linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(245,158,11,0.08) 40%, rgba(5,150,105,0.10) 100%)",
            border: "1px solid rgba(251,191,36,0.20)",
          }}
        >
          {/* Decorative dots */}
          <div className="absolute inset-0 opacity-[0.06]" style={{
            backgroundImage: "radial-gradient(circle, #f59e0b 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }} />

          <div className="relative p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={13} className="text-amber-500" />
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 tracking-widest uppercase">بداية جديدة</span>
                </div>
                <h1 className="text-4xl font-black text-foreground leading-none">
                  اليوم <span className="text-amber-500">١</span>
                </h1>
                <p className="text-[12px] text-muted-foreground mt-2 leading-relaxed">
                  وقّعتَ ميثاقك مع الله — الآن تبدأ الخطوات الفعلية.<br />
                  أكمل كل مهمة لتنطلق رحلة الـ 30 يوماً.
                </p>
              </div>

              {/* Arabic numeral + progress circle */}
              <div className="shrink-0 relative w-16 h-16">
                <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
                  <circle cx="32" cy="32" r="27" fill="none" stroke="currentColor" strokeWidth="4" className="text-muted/30" />
                  <motion.circle
                    cx="32" cy="32" r="27"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 27}`}
                    animate={{ strokeDashoffset: (1 - progressPct / 100) * 2 * Math.PI * 27 }}
                    transition={{ duration: 0.5 }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-black text-amber-500">{Math.round(progressPct)}%</span>
                </div>
              </div>
            </div>

            {/* Sin chips */}
            {sins.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {sins.map((sin) => {
                  const meta = CATEGORY_META[sin.category];
                  return (
                    <span key={sin.id} className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${meta.bg} ${meta.color} ${meta.borderColor}`}>
                      {sin.icon} {sin.name}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Kaffarah / huquq notice */}
            {(hasKaffarah || hasHuquq) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-3 flex items-start gap-2 bg-red-500/10 border border-red-400/20 rounded-xl px-3 py-2.5"
              >
                <AlertTriangle size={13} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-red-600 dark:text-red-400 leading-relaxed">
                  {hasKaffarah && "بعض ذنوبك تستلزم كفارة شرعية — ستجد خطتها في صفحة الكفارات."}
                  {hasKaffarah && hasHuquq && " "}
                  {hasHuquq && "لديك ذنوب تعلقت بها حقوق العباد — يجب ردها قبل اكتمال التوبة."}
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Progress summary */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-primary" />
            <span className="text-xs font-bold text-muted-foreground">مهام اليوم الأول</span>
          </div>
          <motion.span
            key={doneCount}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="text-xs font-black text-primary"
          >
            {doneCount}/{totalCount}
          </motion.span>
        </div>

        {/* ── Section 1: Universal tasks ── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px flex-1 bg-border/60" />
            <span className="text-[10px] font-bold text-muted-foreground tracking-widest px-2">الخطوات الفورية لكل تائب</span>
            <div className="h-px flex-1 bg-border/60" />
          </div>
          <div className="flex flex-col gap-2.5">
            {UNIVERSAL_TASKS.map((task, i) => (
              <TaskItem
                key={task.id}
                task={task}
                checked={checked.has(task.id)}
                onToggle={() => toggle(task.id)}
                index={i}
              />
            ))}
            {envTasks.map((task, i) => task && (
              <TaskItem
                key={task.id}
                task={task}
                checked={checked.has(task.id)}
                onToggle={() => toggle(task.id)}
                index={UNIVERSAL_TASKS.length + i}
              />
            ))}
          </div>
        </div>

        {/* ── Section 2: Sin-specific tasks ── */}
        {sins.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-border/60" />
              <span className="text-[10px] font-bold text-muted-foreground tracking-widest px-2">خطوات خاصة بذنوبك</span>
              <div className="h-px flex-1 bg-border/60" />
            </div>
            <div className="flex flex-col gap-3">
              {sins.map((sin, i) => (
                <SinConditionsGroup
                  key={sin.id}
                  sin={sin}
                  checkedSet={checked}
                  onToggle={toggle}
                  taskOffset={i * 5}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Encouragement when all done ── */}
        <AnimatePresence>
          {allDone && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 18 }}
              className="rounded-2xl px-5 py-5 text-center border border-emerald-400/30"
              style={{ background: "linear-gradient(135deg, rgba(5,150,105,0.08), rgba(4,120,87,0.04))" }}
            >
              <div className="flex justify-center gap-1 mb-2">
                {[0, 1, 2].map((i) => (
                  <motion.div key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.1, type: "spring" }}
                  >
                    <Star size={18} className="text-amber-400 fill-amber-400" />
                  </motion.div>
                ))}
              </div>
              <p className="text-[13px] font-bold text-emerald-700 dark:text-emerald-400 mb-1">أحسنت! اكتملت مهام اليوم الأول</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                «إِنَّ اللَّهَ يُحِبُّ التَّوَّابِينَ وَيُحِبُّ الْمُتَطَهِّرِينَ» — البقرة ٢٢٢
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* fallback: show static tasks if no sins selected */}
        {sins.length === 0 && (
          <div className="flex flex-col gap-2.5">
            {[
              { id: "s0", icon: <Trash2 size={16} />, label: "احذف وتخلص من كل ذريعة", desc: "احذف أي تطبيق أو ملف يقودك للذنب.", color: "text-red-500", bg: "bg-red-500/8", border: "border-red-400/25" },
              { id: "s1", icon: <Wind size={16} />, label: "غيّر بيئتك الآن", desc: "اخرج من المكان الذي كنت تعصي فيه.", color: "text-amber-500", bg: "bg-amber-500/8", border: "border-amber-400/25" },
            ].map((t, i) => (
              <TaskItem key={t.id} task={t} checked={checked.has(t.id)} onToggle={() => toggle(t.id)} index={i + 3} />
            ))}
          </div>
        )}
      </div>

      {/* ── Floating action button ── */}
      <div
        className="fixed inset-x-0 z-[55] px-4 max-w-md mx-auto"
        style={{ bottom: "108px" }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={allDone ? "done" : "pending"}
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
          >
            <div
              className="p-2.5 rounded-2xl border border-border/60 shadow-2xl"
              style={{
                background: "color-mix(in srgb, var(--background) 88%, transparent)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
              }}
            >
              {allDone ? (
                <motion.button
                  onClick={handleComplete}
                  disabled={updateProgress.isPending}
                  whileTap={{ scale: 0.97 }}
                  animate={{
                    boxShadow: [
                      "0 4px 20px rgba(5,150,105,0.40)",
                      "0 6px 28px rgba(5,150,105,0.60)",
                      "0 4px 20px rgba(5,150,105,0.40)",
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-full h-[50px] rounded-xl font-bold text-[15px] flex items-center justify-center gap-2.5 disabled:opacity-60 active:scale-[0.98]"
                  style={{
                    background: "linear-gradient(to left, #059669, #047857)",
                    color: "#fff",
                  }}
                >
                  {updateProgress.isPending ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>انطلق في رحلة الـ ٣٠ يوماً</span>
                      <ArrowLeft size={17} className="text-white" />
                    </>
                  )}
                </motion.button>
              ) : (
                <div className="h-[50px] rounded-xl flex items-center justify-center gap-2.5 bg-muted/60 border border-border/40">
                  <Shield size={15} className="text-muted-foreground/50" />
                  <span className="text-sm text-muted-foreground font-medium">
                    أكمل {totalCount - doneCount} {totalCount - doneCount === 1 ? "مهمة" : "مهام"} للمتابعة
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
