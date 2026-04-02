import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, ChevronDown, ChevronUp, Volume2, BookOpen } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TajweedRule {
  id: number;
  icon: string;
  title: string;
  category: string;
  categoryColor: string;
  short: string;
  detail: string;
  example?: string;
  exampleRef?: string;
  tip?: string;
  gradient: string;
  border: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const RULES: TajweedRule[] = [
  {
    id: 1,
    icon: "🔤",
    title: "مخارج الحروف",
    category: "أساسيات",
    categoryColor: "#10b981",
    short: "الموضع الذي يخرج منه الصوت عند النطق بالحرف",
    detail:
      "مخارج الحروف هي الأماكن التي تنشأ منها أصوات الحروف العربية. وهي خمسة مخارج رئيسية: الجوف (الألف المدية والواو والياء)، الحلق (3 حروف)، اللسان (18 حرفاً)، الشفتان (4 حروف)، والخيشوم (الغنة). إتقان المخارج هو أساس تلاوة القرآن الكريم تلاوةً صحيحة.",
    tip: "تدرّب أمام المرآة على النطق الصحيح للحروف المتشابهة كـ ع/غ وق/ك وس/ص",
    gradient: "from-emerald-500/15 to-teal-400/5",
    border: "rgba(16,185,129,0.25)",
  },
  {
    id: 2,
    icon: "🔊",
    title: "أحكام النون الساكنة والتنوين",
    category: "أحكام",
    categoryColor: "#8b5cf6",
    short: "أربعة أحكام: الإظهار — الإدغام — الإخفاء — الإقلاب",
    detail:
      "إذا جاء بعد النون الساكنة أو التنوين حرف من حروف الحلق الستة (أ هـ ع ح غ خ) وجب الإظهار الحلقي. وإذا جاء بعدها الياء والواو والميم والنون وجب الإدغام. وإذا جاء الباء وجب الإقلاب (تُقلب النون ميماً). وإذا جاء أي حرف آخر من الحروف الخمسة عشر وجب الإخفاء الحقيقي.",
    example: "مَن يَقُولُ — فَمَن يَعمَل",
    exampleRef: "مثال على الإدغام",
    tip: "حروف الإخفاء: صف ذا ثنا كم جاد شخص قد سما — اجمعها لتحفظ أحكامها",
    gradient: "from-violet-500/15 to-purple-400/5",
    border: "rgba(139,92,246,0.25)",
  },
  {
    id: 3,
    icon: "💨",
    title: "أحكام الميم الساكنة",
    category: "أحكام",
    categoryColor: "#3b82f6",
    short: "ثلاثة أحكام: الإخفاء الشفوي — الإدغام الشفوي — الإظهار الشفوي",
    detail:
      "الإخفاء الشفوي: إذا وقعت الميم الساكنة قبل الباء أُخفيت مع غنة. الإدغام الشفوي (المتماثل): إذا وقعت الميم الساكنة قبل ميم متحركة أُدغمت. الإظهار الشفوي: إذا وقعت قبل أي حرف غير الباء والميم وجب إظهارها بيّناً.",
    example: "أَم بِظُلمٍ — وَهُم مِنهَا",
    exampleRef: "أمثلة إخفاء وإدغام",
    tip: "تذكّر: الميم الساكنة تتأثر بالحرف الذي بعدها — خاصةً الباء والميم",
    gradient: "from-blue-500/15 to-sky-400/5",
    border: "rgba(59,130,246,0.25)",
  },
  {
    id: 4,
    icon: "⏸️",
    title: "المدود وأنواعها",
    category: "مدود",
    categoryColor: "#f59e0b",
    short: "المد الطبيعي — المد الفرعي — أنواع المد الفرعي",
    detail:
      "المد الطبيعي أو الأصلي: مدّ حروف اللين (ا و ي) بمقدار حركتين دائماً. المد الفرعي ينقسم إلى: مد متصل (همزة بعد حرف المد في كلمة واحدة، يُمد 4-5 حركات)، ومد منفصل (همزة بعد حرف المد في كلمتين، 4-5 حركات)، ومد لازم (ساكن بعد حرف المد، 6 حركات وجوباً).",
    example: "جَاءَ — السَّمَاءَ — ءَآلآنَ",
    exampleRef: "أمثلة على المدود المختلفة",
    tip: "الحركة = عدد زمن النطق بحرف واحد — تمرّن على الإيقاع المنتظم",
    gradient: "from-amber-500/15 to-yellow-400/5",
    border: "rgba(245,158,11,0.25)",
  },
  {
    id: 5,
    icon: "🌀",
    title: "الإدغام",
    category: "أحكام",
    categoryColor: "#ec4899",
    short: "إدماج حرفين متجاورين ليصيرا حرفاً واحداً مشدداً",
    detail:
      "الإدغام هو إدخال حرف في حرف بحيث يصيران حرفاً واحداً مشدداً يرتفع اللسان عنهما ارتفاعاً واحداً. ينقسم إلى: إدغام مثلين (حرفان متماثلان مثل ب+ب)، إدغام متجانسين (متفقان في المخرج مختلفان في الصفة مثل ت+ط)، إدغام متقاربين (متقاربان في المخرج أو الصفة).",
    example: "اضرِب بِعَصَاكَ — قُل لَّهُ",
    exampleRef: "أمثلة الإدغام",
    tip: "الإدغام بغنة: في (يومنون) — الإدغام بغير غنة: في (لام وراء)",
    gradient: "from-pink-500/15 to-rose-400/5",
    border: "rgba(236,72,153,0.25)",
  },
  {
    id: 6,
    icon: "✋",
    title: "الوقف والابتداء",
    category: "وقف",
    categoryColor: "#06b6d4",
    short: "علامات الوقف في المصحف ومراتبه وأحكامه",
    detail:
      "الوقف لغةً: الكف والحبس. واصطلاحاً: قطع الصوت على الكلمة زمناً يُتنفس فيه عادةً بنية استئناف القراءة. علامات الوقف في المصحف: م (وقف لازم)، لا (لا يُوقف)، قلى (الوقف أحسن)، ج (جائز)، ز (مجوّز للضرورة)، ص (مرخص). والابتداء يكون من مكان يحسن المعنى ابتداءً.",
    example: "بِسمِ اللَّهِ الرَّحمَٰنِ الرَّحِيمِ ۝",
    exampleRef: "البسملة — نهاية الآية",
    tip: "لا تقف وقفاً يُخلّ بالمعنى — مثل الوقف على 'لا' في قوله 'لا إله إلا الله'",
    gradient: "from-cyan-500/15 to-teal-400/5",
    border: "rgba(6,182,212,0.25)",
  },
  {
    id: 7,
    icon: "🎵",
    title: "صفات الحروف",
    category: "أساسيات",
    categoryColor: "#a855f7",
    short: "الخصائص الصوتية التي تميّز كل حرف عن غيره",
    detail:
      "لكل حرف عربي صفات تميّزه. الصفات ذات الأضداد: الجهر/الهمس، الشدة/الرخاوة، الاستعلاء/الاستفال، الإطباق/الانفتاح، الإذلاق/الإصمات. والصفات التي لا ضد لها: الصفير، القلقلة، اللين، الانحراف، التكرير، التفشي، الاستطالة. القلقلة أبرزها: تتميز بها حروف (قطب جد).",
    example: "قَالَ — دَارٌ — بَابٌ",
    exampleRef: "أمثلة على حروف القلقلة",
    tip: "حفظ حروف كل صفة يساعدك على الأداء الصحيح — ابدأ بالقلقلة والصفير",
    gradient: "from-purple-500/15 to-violet-400/5",
    border: "rgba(168,85,247,0.25)",
  },
  {
    id: 8,
    icon: "☀️",
    title: "اللام الشمسية والقمرية",
    category: "أحكام",
    categoryColor: "#f97316",
    short: "لام التعريف تُدغم مع حروف شمسية وتُظهر مع قمرية",
    detail:
      "حروف الشمسية ١٤ حرفاً مجموعة في: (طب ثم صل رحم فزن دع سوء تقى). عند دخول ال التعريف على كلمة تبدأ بأحدها يُدغم اللام فيه. مثل: الشمس ← اش-شمس. أما الحروف القمرية وهي الباقية ١٤ حرفاً فيُظهر اللام معها. مثل: القمر ← اَل-قمر.",
    example: "الشَّمسُ — اَلقَمَرُ",
    exampleRef: "مثال شمسية وقمرية",
    tip: "ابحث عن التشديد في المصحف — إذا وجدت شدة على أول الكلمة بعد ال فهي شمسية",
    gradient: "from-orange-500/15 to-amber-400/5",
    border: "rgba(249,115,22,0.25)",
  },
  {
    id: 9,
    icon: "✨",
    title: "التفخيم والترقيق",
    category: "أساسيات",
    categoryColor: "#22c55e",
    short: "تفخيم حروف الاستعلاء وترقيق غيرها",
    detail:
      "التفخيم: تسمين الحرف وتغليظه بحيث يملأ الفم بصداه. والترقيق عكسه. حروف الاستعلاء السبعة (خص ضغط قظ) تُفخَّم دائماً. الراء تُفخَّم في حالات وتُرقَّق في حالات. لفظ الجلالة (الله) يُفخَّم إذا سُبق بمفتوح أو مضموم، ويُرقَّق إذا سُبق بمكسور.",
    example: "اللَّهُ — بِاللَّهِ",
    exampleRef: "لفظ الجلالة تفخيم وترقيق",
    tip: "الله بعد كسر: 'قُل بِاللِّهِ' — رقيق. وبعد ضم: 'يُحِبُّ اللَّهُ' — مفخم",
    gradient: "from-green-500/15 to-emerald-400/5",
    border: "rgba(34,197,94,0.25)",
  },
  {
    id: 10,
    icon: "🏅",
    title: "مراتب التلاوة",
    category: "ترتيل",
    categoryColor: "#c8a84b",
    short: "التحقيق — التدوير — الحدر — ثلاث مراتب للتلاوة",
    detail:
      "التحقيق: أبطأ درجات القراءة مع مراعاة كل قاعدة — للتعليم والتحفظ. التدوير: سرعة وسط بين التحقيق والحدر وهو الأكثر شيوعاً عند الحفاظ. الحدر: الإسراع في التلاوة مع عدم إخلال بالأحكام — للمتقنين. قال النبي ﷺ: «زيّنوا القرآن بأصواتكم».",
    tip: "ابدأ بالتحقيق حتى تتقن الأحكام — ثم انتقل للتدوير بعد الإتقان",
    gradient: "from-yellow-500/15 to-amber-400/5",
    border: "rgba(200,168,75,0.25)",
  },
];

const CATEGORIES = ["الكل", "أساسيات", "أحكام", "مدود", "وقف", "ترتيل"];

// ─── Rule Card ─────────────────────────────────────────────────────────────────

function RuleCard({ rule }: { rule: TajweedRule }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl overflow-hidden bg-gradient-to-br ${rule.gradient}`}
      style={{ border: `1px solid ${rule.border}` }}
    >
      <button className="w-full p-4 text-right" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start gap-3">
          <div className="text-2xl shrink-0">{rule.icon}</div>
          <div className="flex-1">
            <div className="flex items-start gap-2 mb-1">
              <div className="flex-1">
                <p className="font-bold text-sm">{rule.title}</p>
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                  style={{ background: `${rule.categoryColor}20`, color: rule.categoryColor }}
                >
                  {rule.category}
                </span>
              </div>
              {expanded
                ? <ChevronUp size={14} className="text-muted-foreground shrink-0 mt-1" />
                : <ChevronDown size={14} className="text-muted-foreground shrink-0 mt-1" />}
            </div>
            <p className="text-[11px] text-muted-foreground leading-snug">{rule.short}</p>
          </div>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 flex flex-col gap-3">
              <div className="h-px" style={{ background: "rgba(255,255,255,0.06)" }} />

              {rule.example && (
                <div
                  className="rounded-xl p-3 text-center"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <p
                    className="text-[18px] leading-[2.2]"
                    style={{ fontFamily: "'Amiri Quran', serif", color: rule.categoryColor }}
                  >
                    {rule.example}
                  </p>
                  {rule.exampleRef && (
                    <p className="text-[10px] text-muted-foreground mt-1">{rule.exampleRef}</p>
                  )}
                </div>
              )}

              <p className="text-[12px] leading-[1.9] text-right" style={{ color: "rgba(255,255,255,0.8)" }}>
                {rule.detail}
              </p>

              {rule.tip && (
                <div
                  className="flex items-start gap-2 px-3 py-2.5 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <Volume2 size={11} style={{ color: rule.categoryColor }} className="mt-0.5 shrink-0" />
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{rule.tip}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function QuranTajweedPage() {
  const [activeCategory, setActiveCategory] = useState("الكل");

  const filtered =
    activeCategory === "الكل" ? RULES : RULES.filter((r) => r.category === activeCategory);

  return (
    <div className="min-h-screen pb-24" dir="rtl">
      <PageHeader title="علم التجويد" subtitle="إتقان تلاوة القرآن الكريم" />

      <div className="px-4 pt-4 flex flex-col gap-4">
        {/* Hero */}
        <div
          className="rounded-2xl p-4 text-center"
          style={{
            background: "linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(16,185,129,0.06) 100%)",
            border: "1px solid rgba(59,130,246,0.2)",
          }}
        >
          <p className="text-3xl mb-2">🎙️</p>
          <p className="font-bold text-sm mb-1">علم التجويد</p>
          <p
            className="text-[15px] leading-[2] mb-2"
            style={{ fontFamily: "'Amiri Quran', serif", color: "#c8a84b" }}
          >
            ﴿وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا﴾
          </p>
          <p className="text-[10px] text-muted-foreground">المزمل: ٤</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed mt-2 px-2">
            التجويد هو إعطاء كل حرف حقه من الصفات والمخارج — فريضة على كل مسلم يقرأ القرآن
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { v: "٢٩", l: "حرفاً", c: "#10b981" },
            { v: "١٧", l: "صفة", c: "#3b82f6" },
            { v: "١٦", l: "مخرجاً", c: "#8b5cf6" },
            { v: "٣", l: "مراتب", c: "#f59e0b" },
          ].map((s) => (
            <div
              key={s.l}
              className="rounded-xl p-2.5 text-center"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <p className="text-base font-bold" style={{ color: s.c }}>{s.v}</p>
              <p className="text-[9px] text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all"
              style={{
                background: activeCategory === cat ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.04)",
                border: activeCategory === cat ? "1px solid rgba(59,130,246,0.4)" : "1px solid rgba(255,255,255,0.07)",
                color: activeCategory === cat ? "#3b82f6" : "var(--muted-foreground)",
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Rules List */}
        <div className="flex flex-col gap-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((rule, i) => (
              <motion.div
                key={rule.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <RuleCard rule={rule} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Learning Path */}
        <div
          className="rounded-2xl p-4"
          style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={14} style={{ color: "#3b82f6" }} />
            <p className="font-bold text-[12px]" style={{ color: "#3b82f6" }}>مسار التعلم المقترح</p>
          </div>
          {[
            "١. تعلّم مخارج الحروف أولاً — هي الأساس",
            "٢. انتقل لصفات الحروف والفرق بين المتشابهة",
            "٣. احفظ أحكام النون والميم الساكنتين",
            "٤. تعلّم المدود وأحكامها بالترتيب",
            "٥. طبّق كل ذلك في تلاوة سورة البقرة",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-2 mb-2">
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: "rgba(59,130,246,0.15)" }}
              >
                <Mic size={8} style={{ color: "#3b82f6" }} />
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{step}</p>
            </div>
          ))}
        </div>

        <div className="text-center py-4">
          <p className="text-[11px] text-muted-foreground">
            ﴿إِنَّا سَنُلْقِي عَلَيْكَ قَوْلًا ثَقِيلًا﴾
          </p>
          <p className="text-[10px] text-muted-foreground/50 mt-1">المزمل: ٥</p>
        </div>
      </div>
    </div>
  );
}
