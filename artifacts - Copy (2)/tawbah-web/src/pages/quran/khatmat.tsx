import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Check, Star, Calendar, Trophy, ChevronDown, ChevronUp } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

// ─── Data ─────────────────────────────────────────────────────────────────────

interface HistoricalKhatma {
  id: string;
  title: string;
  icon: string;
  description: string;
  period: string;
  gradient: string;
  border: string;
  accentColor: string;
  details: string;
  virtues: string[];
  schedule: { day: string; target: string }[];
  tips: string[];
}

const KHATMAT: HistoricalKhatma[] = [
  {
    id: "ramadan",
    title: "الختمة الرمضانية",
    icon: "🌙",
    description: "ختمة القرآن كاملاً خلال شهر رمضان المبارك — جزء يومياً",
    period: "شهر رمضان",
    gradient: "from-amber-600/15 to-yellow-400/5",
    border: "rgba(245,158,11,0.25)",
    accentColor: "#f59e0b",
    details: "رمضان شهر القرآن. قال تعالى: ﴿شَهْرُ رَمَضَانَ الَّذِي أُنزِلَ فِيهِ الْقُرْآنُ﴾. كان جبريل عليه السلام يدارس النبي ﷺ القرآن كل رمضان. وكان السلف يختمون القرآن مرات عديدة في رمضان — فمنهم من يختمه في سبع، ومنهم في ثلاث.",
    virtues: [
      "شهر نزول القرآن الكريم",
      "مدارسة جبريل للنبي ﷺ القرآن في رمضان",
      "كان السلف يختمون عدة ختمات",
      "الأجر مضاعف في الشهر المبارك",
    ],
    schedule: [
      { day: "١-١٠", target: "جزء يومياً (الأول إلى العاشر)" },
      { day: "١١-٢٠", target: "جزء يومياً (الحادي عشر إلى العشرين)" },
      { day: "٢١-٢٩", target: "جزء يومياً (الحادي والعشرون إلى التاسع والعشرين)" },
      { day: "٣٠", target: "الجزء الثلاثون + إكمال الختمة" },
    ],
    tips: [
      "اقرأ جزءاً بعد الفجر وجزءاً بعد التراويح",
      "استمع لختمة تراويح الحرمين",
      "خصص وقتاً ثابتاً كل يوم",
      "ادعُ عند ختم القرآن — دعوة مستجابة",
    ],
  },
  {
    id: "dhul_hijja",
    title: "ختمة العشر من ذي الحجة",
    icon: "🕌",
    description: "ختمة القرآن في أفضل عشرة أيام في السنة",
    period: "١-١٠ ذي الحجة",
    gradient: "from-emerald-600/15 to-teal-400/5",
    border: "rgba(34,197,94,0.25)",
    accentColor: "#22c55e",
    details: "قال النبي ﷺ: «ما من أيام العمل الصالح فيها أحب إلى الله من هذه الأيام العشر». وقراءة القرآن في هذه الأيام من أعظم القربات. كان السلف يجتهدون في هذه الأيام وليالي بالقراءة والذكر.",
    virtues: [
      "أفضل أيام السنة عند الله",
      "العمل الصالح فيها أحب إلى الله",
      "تجمع أركان الإسلام (الحج، الصيام، الصدقة، الصلاة)",
      "يوم عرفة فيها أعظم أيام العام",
    ],
    schedule: [
      { day: "اليوم ١-٣", target: "الأجزاء ١-٩ (٣ أجزاء يومياً)" },
      { day: "اليوم ٤-٦", target: "الأجزاء ١٠-١٨ (٣ أجزاء يومياً)" },
      { day: "اليوم ٧-٩", target: "الأجزاء ١٩-٢٧ (٣ أجزاء يومياً)" },
      { day: "يوم عرفة", target: "الأجزاء ٢٨-٣٠ + دعاء الختمة" },
    ],
    tips: [
      "ابدأ ليلة الأول من ذي الحجة",
      "اجمع بين القراءة والصيام والتكبير",
      "ختم القرآن يوم عرفة له فضل خاص",
      "شارك عائلتك في الختمة",
    ],
  },
  {
    id: "laylatul_qadr",
    title: "ختمة ليلة القدر",
    icon: "⭐",
    description: "ختمة القرآن في العشر الأواخر من رمضان — ليلة خير من ألف شهر",
    period: "العشر الأواخر من رمضان",
    gradient: "from-violet-600/15 to-purple-400/5",
    border: "rgba(139,92,246,0.25)",
    accentColor: "#8b5cf6",
    details: "ليلة القدر خير من ألف شهر — ٨٣ سنة وأربعة أشهر. من قرأ القرآن في ليلة القدر فكأنما قرأه في أكثر من ٨٣ سنة من الليالي. كان النبي ﷺ يشد مئزره في العشر الأواخر ويحيي ليله.",
    virtues: [
      "خير من ألف شهر (٨٣ سنة وأكثر)",
      "تنزل الملائكة والروح فيها",
      "سلام هي حتى مطلع الفجر",
      "من قامها إيماناً واحتساباً غُفر له",
    ],
    schedule: [
      { day: "الليلة ٢١", target: "الأجزاء ١-٦" },
      { day: "الليلة ٢٣", target: "الأجزاء ٧-١٢" },
      { day: "الليلة ٢٥", target: "الأجزاء ١٣-١٨" },
      { day: "الليلة ٢٧", target: "الأجزاء ١٩-٢٤" },
      { day: "الليلة ٢٩", target: "الأجزاء ٢٥-٣٠ + الختمة" },
    ],
    tips: [
      "تهيأ قبل العشر الأواخر جيداً",
      "صلِّ التراويح واستمع للختمة الكاملة",
      "أحيِ ليالي الأوتار بالقيام والقراءة",
      "ادعُ بدعاء الختمة كل ليلة",
    ],
  },
];

// ─── Progress Storage ─────────────────────────────────────────────────────────

interface KhatmatProgress {
  [id: string]: {
    completedSteps: number[];
    startedAt?: string;
  };
}

function loadProgress(): KhatmatProgress {
  try { return JSON.parse(localStorage.getItem("quran_khatmat_progress") || "{}"); } catch { return {}; }
}
function saveProgress(p: KhatmatProgress) { localStorage.setItem("quran_khatmat_progress", JSON.stringify(p)); }

// ─── Khatma Detail Card ───────────────────────────────────────────────────────

function KhatmaDetailCard({ khatma, progress, onProgressUpdate }: {
  khatma: HistoricalKhatma;
  progress: KhatmatProgress;
  onProgressUpdate: (id: string, steps: number[]) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState<"details" | "schedule" | "tips">("details");
  const cp = progress[khatma.id] || { completedSteps: [] };
  const completedCount = cp.completedSteps.length;
  const totalSteps = khatma.schedule.length;
  const pct = Math.round((completedCount / totalSteps) * 100);

  const toggleStep = (idx: number) => {
    const steps = cp.completedSteps.includes(idx)
      ? cp.completedSteps.filter(s => s !== idx)
      : [...cp.completedSteps, idx];
    onProgressUpdate(khatma.id, steps);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl overflow-hidden bg-gradient-to-br ${khatma.gradient}`}
      style={{ border: `1px solid ${khatma.border}` }}>
      {/* Header */}
      <button className="w-full p-4 text-right" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start gap-3">
          <div className="text-3xl shrink-0">{khatma.icon}</div>
          <div className="flex-1">
            <p className="font-bold text-sm mb-0.5" style={{ color: khatma.accentColor }}>{khatma.title}</p>
            <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
              <Calendar size={9} /> {khatma.period}
            </p>
            <p className="text-[11px] text-muted-foreground leading-snug">{khatma.description}</p>
            {/* Progress bar */}
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-muted">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  className="h-full rounded-full"
                  style={{ background: khatma.accentColor }}
                />
              </div>
              <span className="text-[9px] font-bold" style={{ color: khatma.accentColor }}>{pct}%</span>
            </div>
          </div>
          <div className="shrink-0">
            {expanded ? <ChevronUp size={14} className="text-muted-foreground" />
              : <ChevronDown size={14} className="text-muted-foreground" />}
          </div>
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
            className="overflow-hidden">
            <div className="px-4 pb-4" dir="rtl">
              <div className="h-px mb-3 bg-border" />

              {/* Tabs */}
              <div className="flex rounded-xl overflow-hidden mb-3 bg-muted/40 border border-border/50">
                {[
                  { id: "details", label: "الفضل" },
                  { id: "schedule", label: "الجدول" },
                  { id: "tips", label: "نصائح" },
                ].map(t => (
                  <button key={t.id} onClick={() => setTab(t.id as any)}
                    className="flex-1 py-1.5 text-[11px] font-bold transition-all"
                    style={{
                      background: tab === t.id ? `${khatma.accentColor}20` : "transparent",
                      color: tab === t.id ? khatma.accentColor : "var(--muted-foreground)",
                    }}>
                    {t.label}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {tab === "details" && (
                  <motion.div key="details" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <p className="text-[12px] leading-[1.9] mb-3 text-foreground/80">
                      {khatma.details}
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {khatma.virtues.map((v, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 rounded-xl bg-muted/30">
                          <Star size={11} style={{ color: khatma.accentColor }} className="shrink-0" />
                          <p className="text-[11px]">{v}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {tab === "schedule" && (
                  <motion.div key="schedule" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex flex-col gap-2">
                    {khatma.schedule.map((s, i) => {
                      const done = cp.completedSteps.includes(i);
                      return (
                        <button key={i} onClick={() => toggleStep(i)}
                          className="flex items-center gap-3 p-3 rounded-xl text-right transition-all active:scale-[0.98] bg-muted/30 border border-border/50">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-muted border border-border">
                            {done && <Check size={11} style={{ color: khatma.accentColor }} />}
                          </div>
                          <div className="flex-1">
                            <p className="text-[11px] font-bold" style={{ color: khatma.accentColor }}>{s.day}</p>
                            <p className="text-[10px] text-muted-foreground">{s.target}</p>
                          </div>
                        </button>
                      );
                    })}
                    {completedCount === totalSteps && (
                      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className="text-center py-3 rounded-xl font-bold text-sm"
                        style={{ background: `${khatma.accentColor}15`, color: khatma.accentColor, border: `1px solid ${khatma.accentColor}30` }}>
                        🎉 أتممت الختمة! بارك الله لك
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {tab === "tips" && (
                  <motion.div key="tips" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex flex-col gap-2">
                    {khatma.tips.map((tip, i) => (
                      <div key={i} className="flex items-start gap-2 p-2.5 rounded-xl bg-muted/30 border border-border/50">
                        <span className="text-base shrink-0">💡</span>
                        <p className="text-[11px] leading-snug">{tip}</p>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function QuranKhatmatPage() {
  const [progress, setProgress] = useState<KhatmatProgress>({});

  useEffect(() => { setProgress(loadProgress()); }, []);

  const updateProgress = (id: string, steps: number[]) => {
    const updated = { ...progress, [id]: { completedSteps: steps, startedAt: progress[id]?.startedAt || new Date().toISOString() } };
    setProgress(updated);
    saveProgress(updated);
  };

  const totalCompleted = KHATMAT.reduce((sum, k) => {
    const cp = progress[k.id];
    if (!cp) return sum;
    return sum + (cp.completedSteps.length === k.schedule.length ? 1 : 0);
  }, 0);

  return (
    <div className="min-h-screen pb-24" dir="rtl">
      <PageHeader title="الختمات التاريخية" subtitle="ختمات ثابتة عن النبي ﷺ والسلف" />

      <div className="px-4 pt-4 flex flex-col gap-4">
        {/* Hero */}
        <div className="rounded-2xl p-4"
          style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(245,158,11,0.06) 100%)", border: "1px solid rgba(139,92,246,0.2)" }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="text-2xl">📅</div>
            <div>
              <p className="font-bold text-sm">الختمات المواسمية</p>
              <p className="text-[11px] text-muted-foreground">ختمات مرتبطة بأيام ومواسم فاضلة</p>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            قراءة القرآن في المواسم الفاضلة من أعظم القربات — وقد كان النبي ﷺ والصحابة والسلف يجتهدون في ختم القرآن في رمضان والعشر المباركة
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { v: KHATMAT.length, l: "ختمة", c: "#8b5cf6" },
            { v: totalCompleted, l: "مكتملة", c: "#22c55e" },
            { v: KHATMAT.filter(k => (progress[k.id]?.completedSteps.length || 0) > 0).length, l: "جارية", c: "#f59e0b" },
          ].map(s => (
            <div key={s.l} className="rounded-xl p-3 text-center bg-muted/40 border border-border/50">
              <p className="text-xl font-bold" style={{ color: s.c }}>{s.v}</p>
              <p className="text-[10px] text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>

        {/* Khatmat Cards */}
        <div className="flex flex-col gap-4">
          {KHATMAT.map((k, i) => (
            <motion.div key={k.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <KhatmaDetailCard khatma={k} progress={progress} onProgressUpdate={updateProgress} />
            </motion.div>
          ))}
        </div>

        {/* Closing */}
        <div className="text-center py-4">
          <p className="text-[11px] text-muted-foreground" style={{ fontFamily: "'Amiri Quran', serif" }}>
            ﴿الَّذِينَ يَتْلُونَ كِتَابَ اللَّهِ وَأَقَامُوا الصَّلَاةَ وَأَنفَقُوا مِمَّا رَزَقْنَاهُمْ سِرًّا وَعَلَانِيَةً يَرْجُونَ تِجَارَةً لَّن تَبُورَ﴾
          </p>
          <p className="text-[10px] text-muted-foreground/50 mt-1">فاطر: ٢٩</p>
        </div>
      </div>
    </div>
  );
}
