import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckSquare, Square, Sparkles, BookOpen, Flame,
  ChevronRight, Share2, Star, Zap, Trophy, Check,
} from "lucide-react";
import { Link } from "wouter";
import { useAppHabits, useAppCompleteHabit, useAppUserProgress } from "@/hooks/use-app-data";

// ─── مكتبة العادات الكاملة (50 عادة) مع التفاصيل ──────────────────────────

type HabitLevel = "easy" | "medium" | "advanced";

interface HabitInfo {
  key: string;
  nameAr: string;
  level: HabitLevel;
  icon: string;
  timing: string;
  reason: string;
}

const HABITS_LIBRARY: HabitInfo[] = [
  // ── سهل (18) ──────────────────────────────────────────────────────────────
  { key: "wudu",             nameAr: "الوضوء قبل النوم",                       level: "easy",     icon: "💧", timing: "قبل النوم",           reason: "يُبقيك على طهارة وتُصبح في حراسة الملائكة" },
  { key: "salat_tawba",      nameAr: "ركعتا التوبة",                           level: "easy",     icon: "🤲", timing: "عند الشعور بالذنب",    reason: "من أحسن التوبة أن تُصلي ركعتين وتستغفر" },
  { key: "bismillah",        nameAr: "البسملة قبل كل عمل",                     level: "easy",     icon: "✨", timing: "طوال اليوم",           reason: "تجعل أعمالك العادية عبادة مبروكة" },
  { key: "fatiha_3x",       nameAr: "قراءة الفاتحة 3 مرات صباحاً",            level: "easy",     icon: "📖", timing: "بعد الفجر",             reason: "الفاتحة شفاء لكل داء — رَقية للقلب والبدن" },
  { key: "istighfar_10",     nameAr: "الاستغفار 10 مرات بعد الصلاة",           level: "easy",     icon: "🌿", timing: "بعد كل صلاة",          reason: "النبي ﷺ كان يستغفر 70 مرة يومياً — فكيف بنا؟" },
  { key: "salawat_10",       nameAr: "الصلاة على النبي ﷺ 10 مرات",             level: "easy",     icon: "☀️", timing: "في أي وقت",             reason: "من صلّى عليه مرة صلى الله عليه عشراً" },
  { key: "no_phone_fajr",    nameAr: "عدم استخدام الهاتف بعد الفجر ساعة",      level: "easy",     icon: "📵", timing: "بعد الفجر",             reason: "ساعة الفجر من أبرك الأوقات — أعطِها لله" },
  { key: "sadaqa_small",     nameAr: "صدقة ولو بكلمة طيبة",                   level: "easy",     icon: "💚", timing: "في أي وقت",             reason: "«كلمة طيبة صدقة» — أسهل باب للجنة" },
  { key: "quran_page",       nameAr: "قراءة صفحة واحدة من القرآن",              level: "easy",     icon: "📗", timing: "بعد الفجر",             reason: "صفحة يومياً = ختمة كاملة كل سنتين" },
  { key: "subhana_33",       nameAr: "سبحان الله 33 مرة بعد الصلاة",           level: "easy",     icon: "⭐", timing: "بعد كل صلاة",          reason: "تُعبّئ ميزان حسناتك بكلمات خفيفة على اللسان" },
  { key: "ayah_kursi",       nameAr: "آية الكرسي قبل النوم",                    level: "easy",     icon: "🌙", timing: "قبل النوم",           reason: "من قرأها لا يقربه شيطان حتى الصباح" },
  { key: "muawwizatain",     nameAr: "المعوذتين قبل النوم",                     level: "easy",     icon: "🛡️", timing: "قبل النوم",           reason: "دِرع النبي ﷺ الذي كان ينفث به كل ليلة" },
  { key: "smile_sadaqa",     nameAr: "الابتسامة في وجه المسلم",                 level: "easy",     icon: "😊", timing: "طوال اليوم",           reason: "«تبسّمك في وجه أخيك صدقة»" },
  { key: "water_niyyah",     nameAr: "شرب الماء بنية الاستعانة على العبادة",    level: "easy",     icon: "🫗", timing: "طوال اليوم",           reason: "نية صادقة تحوّل الفعل الطبيعي إلى قربة" },
  { key: "morning_azkar",    nameAr: "أذكار الصباح المختصرة",                   level: "easy",     icon: "🌅", timing: "بعد الفجر",             reason: "حصن يوميٌّ يبدأ بذِكر الله" },
  { key: "evening_azkar",    nameAr: "أذكار المساء المختصرة",                   level: "easy",     icon: "🌆", timing: "بعد العصر",             reason: "إغلاق يومك بالذكر يُهدّئ القلب ويُنيمك راضياً" },
  { key: "no_haram_look",    nameAr: "غض البصر طوال اليوم",                     level: "easy",     icon: "👁️", timing: "طوال اليوم",           reason: "الغضّ يُورث نوراً في القلب لا يعرفه إلا من جرّبه" },
  { key: "dua_before_sleep", nameAr: "الدعاء عند النوم باسم الله",              level: "easy",     icon: "🤍", timing: "قبل النوم",           reason: "ختم يومك بالدعاء يجعلك تصحو على رضا الله" },

  // ── متوسط (17) ────────────────────────────────────────────────────────────
  { key: "istighfar_100",    nameAr: "ورد الاستغفار 100 مرة يومياً",             level: "medium",   icon: "🌿", timing: "في أي وقت",             reason: "«من لزم الاستغفار جعل الله له من كل ضيق مخرجاً»" },
  { key: "quran_2pages",     nameAr: "قراءة صفحتين من القرآن",                  level: "medium",   icon: "📖", timing: "بعد الفجر",             reason: "صفحتان يومياً تُوصلك لختمة كل عام" },
  { key: "witr",             nameAr: "صلاة الوتر قبل النوم",                    level: "medium",   icon: "🌙", timing: "قبل النوم",           reason: "ختم الليل بوتر — وصية النبي ﷺ التي لم يتركها" },
  { key: "sayyid_morning",   nameAr: "سيد الاستغفار صباحاً",                    level: "medium",   icon: "🌅", timing: "بعد الفجر",             reason: "«من قالها موقناً فمات من يومه دخل الجنة»" },
  { key: "sayyid_evening",   nameAr: "سيد الاستغفار مساءً",                     level: "medium",   icon: "🌆", timing: "بعد العصر",             reason: "درع مضاعفة — حافظ عليها صباحاً ومساءً" },
  { key: "full_azkar",       nameAr: "أذكار الصباح والمساء كاملة",               level: "medium",   icon: "📋", timing: "صباحاً ومساءً",        reason: "كاملها يُمسي الإنسان محاطاً برحمة الله" },
  { key: "rawatib_prayers",  nameAr: "السنن الرواتب (12 ركعة يومياً)",           level: "medium",   icon: "🕌", timing: "مع كل صلاة",           reason: "«بنى الله له بيتاً في الجنة»" },
  { key: "quran_tafsir",     nameAr: "قراءة آية مع تفسيرها",                    level: "medium",   icon: "🔍", timing: "بعد الفجر أو العشاء",  reason: "فهم كلام الله يغيّر كيف تتعامل مع الحياة" },
  { key: "sadaqa_daily",     nameAr: "الصدقة اليومية ولو درهماً",                level: "medium",   icon: "💰", timing: "في أي وقت",             reason: "«الصدقة تطفئ الخطيئة كما يطفئ الماء النار»" },
  { key: "no_sin_hour",      nameAr: "ساعة خالية من الذنوب والغفلة",             level: "medium",   icon: "⏳", timing: "في أي وقت",             reason: "تدريب النفس على اليقظة يُوسّع الساعة لتصبح يوماً" },
  { key: "duha_pray",        nameAr: "صلاة الضحى (ركعتان على الأقل)",            level: "medium",   icon: "☀️", timing: "ضحىً",                 reason: "كفارة عن كل مفصل في جسدك — 360 صدقة يومياً" },
  { key: "hadith_read",      nameAr: "قراءة حديث شريف والعمل به",                level: "medium",   icon: "📜", timing: "في أي وقت",             reason: "حديث واحد بنية العمل يُنوّر القلب ويُصلح السلوك" },
  { key: "parents_dua",      nameAr: "الدعاء للوالدين بعد كل صلاة",             level: "medium",   icon: "❤️", timing: "بعد كل صلاة",          reason: "«ربِّ اغفر لي ولوالديَّ» — صلتك بهم بعد مماتهم" },
  { key: "zikr_100",         nameAr: "ذكر (سبحان الله وبحمده) 100 مرة",         level: "medium",   icon: "💎", timing: "في أي وقت",             reason: "«من قالها في اليوم غُفرت ذنوبه وإن كانت مثل زبد البحر»" },
  { key: "fasting_white",    nameAr: "صيام الأيام البيض (13, 14, 15)",           level: "medium",   icon: "🌕", timing: "منتصف كل شهر",         reason: "كصيام الدهر كله — ثلاثة أيام تعدل بالعشر" },
  { key: "journal_tawbah",   nameAr: "كتابة يومية في مفكرة التوبة",              level: "medium",   icon: "✍️", timing: "قبل النوم",           reason: "محاسبة النفس يومياً — سرّ الاستمرار في التوبة" },
  { key: "tahajjud_2rak",    nameAr: "ركعتا تهجد في آخر الليل",                 level: "medium",   icon: "🌟", timing: "آخر الليل",            reason: "أقرب ما يكون العبد من ربه في جوف الليل" },

  // ── متقدم (15) ────────────────────────────────────────────────────────────
  { key: "juz_daily",        nameAr: "قراءة جزء كامل من القرآن يومياً",          level: "advanced", icon: "📚", timing: "على مدار اليوم",        reason: "ختمة كل شهر — القرآن هو الشفاء الحقيقي" },
  { key: "tahajjud_full",    nameAr: "قيام الليل (ثلث الليل الأخير)",            level: "advanced", icon: "🌌", timing: "آخر الليل",            reason: "«ينزل ربنا إلى السماء الدنيا حين يبقى ثلث الليل»" },
  { key: "fasting_weekly",   nameAr: "صيام الاثنين والخميس",                     level: "advanced", icon: "📅", timing: "الاثنين والخميس",      reason: "«تُعرض الأعمال فأحب أن يُعرض عملي وأنا صائم»" },
  { key: "sadaqa_10pct",     nameAr: "الصدقة بعُشر الدخل اليومي",                level: "advanced", icon: "💸", timing: "يومياً",               reason: "ما نقصت صدقة من مال — وهي تُطفئ غضب الرب" },
  { key: "no_sin_day",       nameAr: "يوم كامل خالٍ من الذنوب الظاهرة",          level: "advanced", icon: "🏆", timing: "طوال اليوم",           reason: "اليوم الكامل في طاعة الله — هذا هو الهدف الحقيقي" },
  { key: "memorize_ayah",    nameAr: "حفظ آية كريمة جديدة يومياً",              level: "advanced", icon: "🧠", timing: "بعد الفجر",             reason: "ختمة حفظاً كل عام — بيتٌ شُيِّد في صدرك لا يُهدم" },
  { key: "istighfar_1000",   nameAr: "الاستغفار 1000 مرة في اليوم",              level: "advanced", icon: "♾️", timing: "على مدار اليوم",        reason: "فعل بعض السلف — يُصفّي القلب ويُرقّق النفس" },
  { key: "complete_azkar",   nameAr: "جميع الأذكار المسنونة طوال اليوم",          level: "advanced", icon: "🔮", timing: "طوال اليوم",           reason: "حياة في ذِكر الله — «ألا بذكر الله تطمئن القلوب»" },
  { key: "silat_rahim",      nameAr: "صلة رحم بالزيارة أو المكالمة",             level: "advanced", icon: "👨‍👩‍👧", timing: "أسبوعياً",               reason: "«من أحب أن يُبسط له في رزقه وينسأ له في أجله فليصل رحمه»" },
  { key: "repent_immediately",nameAr: "التوبة الفورية عند أي ذنب",               level: "advanced", icon: "⚡", timing: "فور وقوع الذنب",        reason: "لا تؤجل التوبة — التأجيل ذنب يُضاف إلى ذنب" },
  { key: "nawafil_extra",    nameAr: "20 ركعة نافلة إضافية",                     level: "advanced", icon: "🕋", timing: "موزعة على اليوم",       reason: "النوافل تُعوّض نقص الفرائض وترفع الدرجات" },
  { key: "surah_baqarah",    nameAr: "قراءة سورة البقرة كاملة",                  level: "advanced", icon: "📔", timing: "أسبوعياً",              reason: "«اقرؤوا سورة البقرة فإن أخذها بركة وتركها حسرة»" },
  { key: "itikaaf_hour",     nameAr: "ساعة اعتكاف في المسجد",                   level: "advanced", icon: "🕌", timing: "يومياً أو أسبوعياً",    reason: "خلوة مقدسة مع الله — تُذهب التشتت وتُجمّع القلب" },
  { key: "khushu_salat",     nameAr: "الصلاة بخشوع تام (تدبّر كل ركعة)",         level: "advanced", icon: "🙏", timing: "عند كل صلاة",          reason: "الخشوع هو روح الصلاة — بدونه تطير الكلمات بلا أثر" },
  { key: "dawah_share",      nameAr: "مشاركة نصيحة إسلامية مع شخص آخر",          level: "advanced", icon: "💬", timing: "يومياً",               reason: "«بلّغوا عني ولو آية» — أجر الدلالة على الخير" },
];

// ─── إعداد مساعد ────────────────────────────────────────────────────────────

const LEVEL_CONFIG = {
  easy:     { label: "سهل",    icon: <Star size={11} />,    color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20", badge: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
  medium:   { label: "متوسط",  icon: <Zap size={11} />,     color: "text-amber-500",   bg: "bg-amber-500/10 border-amber-500/20",     badge: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  advanced: { label: "متقدم",  icon: <Trophy size={11} />,  color: "text-primary",     bg: "bg-primary/10 border-primary/20",         badge: "bg-primary/15 text-primary" },
};

type TabType = "today" | "library";
type FilterLevel = "all" | HabitLevel;

// ─── الشارة الاحتفالية ───────────────────────────────────────────────────────

function AllDoneBanner({ completedCount, totalCount }: { completedCount: number; totalCount: number }) {
  const [shared, setShared] = useState(false);
  const handleShare = async () => {
    const text = `أتممت ${completedCount} عادة روحية اليوم في رحلة التوبة 🌿\n«أحبُّ الأعمالِ إلى اللهِ أدومُها وإن قَلَّ»\n\n#رحلة_التوبة`;
    if (navigator.share) {
      try { await navigator.share({ text, title: "رحلة التوبة" }); } catch {}
    } else {
      await navigator.clipboard.writeText(text).catch(() => {});
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  if (completedCount < totalCount) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mb-5 bg-gradient-to-l from-emerald-500/20 to-primary/10 border border-emerald-400/30 rounded-2xl p-5 text-center"
    >
      <motion.div
        animate={{ rotate: [0, -10, 10, -10, 0] }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="text-4xl mb-2"
      >
        🌿
      </motion.div>
      <h3 className="font-bold text-base text-emerald-700 dark:text-emerald-400 mb-1">
        أتممت جميع عاداتك اليوم!
      </h3>
      <p className="text-xs text-muted-foreground leading-relaxed mb-4">
        «أحبُّ الأعمالِ إلى اللهِ أدومُها وإن قَلَّ» — يُكتب لك أجر هذا اليوم
      </p>
      <button
        onClick={handleShare}
        className="flex items-center gap-2 mx-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold active:scale-95 transition-all shadow-md shadow-emerald-500/20"
      >
        <Share2 size={14} />
        {shared ? "تم النسخ! ✓" : "شارك إنجازك"}
      </button>
    </motion.div>
  );
}

// ─── كارد عادة اليوم ─────────────────────────────────────────────────────────

function HabitCard({
  habitKey, habitNameAr, completed, onToggle, isPending, idx,
}: {
  habitKey: string; habitNameAr: string; completed: boolean;
  onToggle: () => void; isPending: boolean; idx: number;
}) {
  const info = HABITS_LIBRARY.find(h => h.key === habitKey);
  const level = info?.level ?? "easy";
  const cfg = LEVEL_CONFIG[level];
  const [showReason, setShowReason] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.06 }}
      className={`rounded-2xl border overflow-hidden transition-all duration-300 ${
        completed ? "bg-primary/5 border-primary/20" : `bg-card border-border ${cfg.bg}`
      }`}
    >
      <button
        onClick={onToggle}
        disabled={isPending}
        className="flex items-center gap-3 p-4 w-full text-right active:scale-[0.98] transition-transform"
      >
        <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all duration-300 ${
          completed ? "bg-primary border-primary text-primary-foreground scale-110" : "bg-transparent border-muted-foreground/30"
        }`}>
          {completed && <Check size={15} strokeWidth={3} />}
        </div>
        <div className="flex-1 text-right min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`font-bold text-sm transition-colors duration-300 ${completed ? "text-primary line-through opacity-60" : "text-foreground"}`}>
              {info?.icon ?? "🌿"} {habitNameAr}
            </span>
          </div>
          {info && (
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${cfg.badge}`}>
                {cfg.icon} {cfg.label}
              </span>
              <span className="text-[10px] text-muted-foreground">{info.timing}</span>
            </div>
          )}
        </div>
        {info && !completed && (
          <button
            onClick={(e) => { e.stopPropagation(); setShowReason(r => !r); }}
            className="p-1.5 rounded-lg hover:bg-muted/50 shrink-0"
          >
            <ChevronRight size={14} className={`text-muted-foreground transition-transform ${showReason ? "-rotate-90" : "rotate-90"}`} />
          </button>
        )}
      </button>

      <AnimatePresence>
        {showReason && info && !completed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3">
              <div className="bg-primary/5 border border-primary/10 rounded-xl px-3 py-2.5">
                <p className="text-[11px] text-primary/80 leading-relaxed">
                  💡 {info.reason}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── كارد عادة في المكتبة ────────────────────────────────────────────────────

function LibraryHabitCard({ habit }: { habit: HabitInfo }) {
  const cfg = LEVEL_CONFIG[habit.level];
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      layout
      className={`rounded-xl border overflow-hidden ${cfg.bg}`}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-3 px-3 py-2.5 w-full text-right"
      >
        <span className="text-xl shrink-0">{habit.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-right">{habit.nameAr}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${cfg.badge}`}>
              {cfg.icon} {cfg.label}
            </span>
            <span className="text-[10px] text-muted-foreground">{habit.timing}</span>
          </div>
        </div>
        <ChevronRight size={13} className={`text-muted-foreground shrink-0 transition-transform ${open ? "-rotate-90" : "rotate-90"}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3">
              <div className="bg-background/60 rounded-lg px-3 py-2">
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  💡 {habit.reason}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── الصفحة الرئيسية ─────────────────────────────────────────────────────────

export default function HabitsPage() {
  const { data: progress } = useAppUserProgress();
  const { data: habits, isLoading } = useAppHabits();
  const completeHabit = useAppCompleteHabit();
  const [activeTab, setActiveTab] = useState<TabType>("today");
  const [filter, setFilter] = useState<FilterLevel>("all");

  const completedCount = habits?.filter(h => h.completed).length ?? 0;
  const totalCount = habits?.length ?? 0;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const streak = progress?.streakDays ?? 0;

  const filteredLibrary = filter === "all"
    ? HABITS_LIBRARY
    : HABITS_LIBRARY.filter(h => h.level === filter);

  return (
    <div className="flex-1 flex flex-col bg-background min-h-full">
      {/* ── رأس الصفحة ── */}
      <div className="bg-primary px-5 pt-10 pb-8 rounded-b-[2.5rem] text-primary-foreground shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-56 h-56 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-white mb-0.5">العادات الروحية</h1>
              <p className="text-white/70 text-xs">اليوم {progress?.day40Progress ?? 1} من رحلتك</p>
            </div>
            {streak > 0 && (
              <div className="bg-white/10 backdrop-blur border border-white/20 px-3 py-2 rounded-2xl flex items-center gap-1.5">
                <Flame size={16} className="text-orange-300" />
                <span className="font-bold text-white">{streak}</span>
              </div>
            )}
          </div>

          {/* شريط التقدم */}
          {activeTab === "today" && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-white/80">إنجاز اليوم</span>
                <span className="text-xs font-bold text-white">{completedCount}/{totalCount} عادة</span>
              </div>
              <div className="w-full h-2.5 bg-white/15 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-white rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
              <p className="text-[10px] text-white/60 mt-1 text-left">{progressPct}%</p>
            </div>
          )}

          {/* تبويبات */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("today")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "today" ? "bg-white text-primary" : "bg-white/10 text-white/80"
              }`}
            >
              <CheckSquare size={13} />
              مهام اليوم
            </button>
            <button
              onClick={() => setActiveTab("library")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "library" ? "bg-white text-primary" : "bg-white/10 text-white/80"
              }`}
            >
              <BookOpen size={13} />
              مكتبة العادات
            </button>
          </div>
        </div>
      </div>

      {/* ── المحتوى ── */}
      <AnimatePresence mode="wait">
        {activeTab === "today" ? (
          <motion.div
            key="today"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="flex-1 p-4 -mt-4 pb-28"
          >
            <AllDoneBanner completedCount={completedCount} totalCount={totalCount} />

            {isLoading ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-16 bg-muted/40 animate-pulse rounded-2xl" />
                ))}
              </div>
            ) : !habits || habits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <div className="text-5xl">🌱</div>
                <h3 className="font-bold text-base">لا عادات لهذا اليوم بعد</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                  أكمل مهام يومك في رحلة الـ30 لتُفعَّل العادات تلقائياً حسب مستواك
                </p>
                <Link
                  href="/journey"
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold active:scale-95 transition-all mt-2 shadow-md shadow-primary/20"
                >
                  <Sparkles size={14} />
                  انتقل إلى الرحلة
                  <ChevronRight size={13} />
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {habits.map((h, i) => (
                  <HabitCard
                    key={h.habitKey}
                    habitKey={h.habitKey}
                    habitNameAr={h.habitNameAr}
                    completed={h.completed}
                    onToggle={() => completeHabit.mutate({ habitKey: h.habitKey, completed: !h.completed })}
                    isPending={completeHabit.isPending}
                    idx={i}
                  />
                ))}

                <div className="mt-2 bg-muted/30 rounded-2xl p-4 border border-border/50">
                  <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                    تُختار عاداتك يومياً تلقائياً بحسب مرحلتك في الرحلة
                    <br />
                    استكشف <button onClick={() => setActiveTab("library")} className="text-primary font-bold underline underline-offset-2">مكتبة العادات الكاملة</button>
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="library"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="flex-1 p-4 -mt-4 pb-28"
          >
            {/* رأس المكتبة */}
            <div className="bg-card border border-border rounded-2xl p-4 mb-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen size={15} className="text-primary" />
                <h2 className="font-bold text-sm">مكتبة العادات الروحية</h2>
                <span className="mr-auto text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {HABITS_LIBRARY.length} عادة
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                من أبسط العادات إلى أعلى درجات المجاهدة — تُختار عاداتك يومياً بحسب مرحلتك تلقائياً
              </p>
            </div>

            {/* فلتر المستوى */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {[
                { key: "all",      label: "الكل",   count: HABITS_LIBRARY.length },
                { key: "easy",     label: "سهل",    count: HABITS_LIBRARY.filter(h => h.level === "easy").length },
                { key: "medium",   label: "متوسط",  count: HABITS_LIBRARY.filter(h => h.level === "medium").length },
                { key: "advanced", label: "متقدم",  count: HABITS_LIBRARY.filter(h => h.level === "advanced").length },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key as FilterLevel)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all border ${
                    filter === f.key
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/50 text-muted-foreground border-border"
                  }`}
                >
                  {f.label}
                  <span className={`text-[9px] px-1 py-0.5 rounded-full ${filter === f.key ? "bg-white/20" : "bg-muted"}`}>
                    {f.count}
                  </span>
                </button>
              ))}
            </div>

            {/* بطاقة وصف المستوى */}
            {filter !== "all" && (
              <motion.div
                key={filter}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center gap-3 p-3 rounded-xl border mb-4 ${LEVEL_CONFIG[filter as HabitLevel].bg}`}
              >
                <div className={`text-xl ${LEVEL_CONFIG[filter as HabitLevel].color}`}>
                  {filter === "easy" ? "🌱" : filter === "medium" ? "⚡" : "🏔️"}
                </div>
                <div>
                  <p className="font-bold text-xs">
                    {filter === "easy" && "مرحلة البداية (1-7 أيام)"}
                    {filter === "medium" && "مرحلة التثبيت (8-20 يوماً)"}
                    {filter === "advanced" && "مرحلة التعمّق (21+ يوماً)"}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {filter === "easy" && "عادات خفيفة تُؤسّس الصلة بالله"}
                    {filter === "medium" && "عادات تُرسّخ نمط الحياة الصالح"}
                    {filter === "advanced" && "عادات المجاهدة والتعمق الروحي"}
                  </p>
                </div>
              </motion.div>
            )}

            {/* قائمة العادات */}
            <div className="flex flex-col gap-2">
              <AnimatePresence>
                {filteredLibrary.map(habit => (
                  <LibraryHabitCard key={habit.key} habit={habit} />
                ))}
              </AnimatePresence>
            </div>

            <div className="mt-6 bg-muted/30 rounded-2xl p-4 border border-border/50 text-center">
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                عاداتك اليومية تُختار تلقائياً مما سبق حسب تقدّمك في رحلة التوبة
              </p>
              <button
                onClick={() => setActiveTab("today")}
                className="mt-3 flex items-center gap-1.5 mx-auto px-4 py-2 bg-primary/10 text-primary rounded-xl text-xs font-bold border border-primary/20"
              >
                <CheckSquare size={12} />
                عادات اليوم
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
