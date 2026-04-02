import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

// ─── Data ─────────────────────────────────────────────────────────────────────

interface Miracle {
  id: number;
  icon: string;
  title: string;
  category: string;
  categoryColor: string;
  short: string;
  detail: string;
  ayah?: string;
  ayahRef?: string;
  discovery?: string;
  gradient: string;
  border: string;
}

const MIRACLES: Miracle[] = [
  {
    id: 1, icon: "🔢", title: "تكرار كلمة «يوم» ٣٦٥ مرة",
    category: "عددي", categoryColor: "#8b5cf6",
    short: "كلمة يوم تكررت بعدد أيام السنة الشمسية تماماً",
    detail: "كلمة «يوم» وردت في القرآن الكريم ٣٦٥ مرة بالضبط — عدد أيام السنة الشمسية. كذلك كلمتا «الدنيا» و«الآخرة» تكررت كل منهما ١١٥ مرة. «الملائكة» و«الشياطين» كلاهما ٨٨ مرة. «الحياة» و«الموت» ١٤٥ مرة. هذا التوازن الدقيق مستحيل في أي كتاب بشري.",
    gradient: "from-violet-600/15 to-purple-400/5",
    border: "rgba(139,92,246,0.25)",
  },
  {
    id: 2, icon: "🌌", title: "توسع الكون",
    category: "علمي", categoryColor: "#06b6d4",
    short: "القرآن وصف توسع الكون قبل اكتشافه بـ١٤ قرناً",
    detail: "قال الله تعالى: ﴿وَالسَّمَاءَ بَنَيْنَاهَا بِأَيْدٍ وَإِنَّا لَمُوسِعُونَ﴾ (الذاريات: ٤٧). كلمة «موسعون» تعني نوسّعها باستمرار. اكتشف العالم إدوين هابل عام ١٩٢٩م أن الكون يتوسع بسرعة — وهذا بالضبط ما أخبرنا به القرآن قبل ١٣ قرناً من هذا الاكتشاف.",
    ayah: "وَالسَّمَاءَ بَنَيْنَاهَا بِأَيْدٍ وَإِنَّا لَمُوسِعُونَ",
    ayahRef: "الذاريات: ٤٧",
    discovery: "اكتشاف هابل — ١٩٢٩م",
    gradient: "from-blue-600/15 to-sky-400/5",
    border: "rgba(6,182,212,0.25)",
  },
  {
    id: 3, icon: "🧬", title: "مراحل خلق الجنين",
    category: "علمي", categoryColor: "#22c55e",
    short: "وصف دقيق لمراحل نمو الجنين اكتشفها العلم حديثاً",
    detail: "﴿وَلَقَدْ خَلَقْنَا الْإِنسَانَ مِن سُلَالَةٍ مِّن طِينٍ * ثُمَّ جَعَلْنَاهُ نُطْفَةً * ثُمَّ خَلَقْنَا النُّطْفَةَ عَلَقَةً * فَخَلَقْنَا الْعَلَقَةَ مُضْغَةً * فَخَلَقْنَا الْمُضْغَةَ عِظَامًا﴾ (المؤمنون: ١٢-١٤). قال الأستاذ الدكتور كيث مور أستاذ التشريح: «لم يكن ممكناً وصف هذه المراحل بهذه الدقة بدون مجهر إلكتروني متطور».",
    ayah: "ثُمَّ خَلَقْنَا النُّطْفَةَ عَلَقَةً فَخَلَقْنَا الْعَلَقَةَ مُضْغَةً",
    ayahRef: "المؤمنون: ١٤",
    discovery: "د. كيث مور — أستاذ الأجنة",
    gradient: "from-emerald-600/15 to-teal-400/5",
    border: "rgba(34,197,94,0.25)",
  },
  {
    id: 4, icon: "🌊", title: "الحواجز بين البحار",
    category: "علمي", categoryColor: "#0ea5e9",
    short: "ذكر القرآن وجود حواجز خفية تفصل بين البحار",
    detail: "﴿مَرَجَ الْبَحْرَيْنِ يَلْتَقِيَانِ * بَيْنَهُمَا بَرْزَخٌ لَّا يَبْغِيَانِ﴾ (الرحمن: ١٩-٢٠). اكتشف العلماء بالغواصات وجود حواجز سطحية وعمقية تحافظ على خصائص كل بحر — الملوحة، الكثافة، الحرارة — دون أن يمتزجا. لم يُعرف هذا قبل اختراع الغواصات الحديثة.",
    ayah: "مَرَجَ الْبَحْرَيْنِ يَلْتَقِيَانِ بَيْنَهُمَا بَرْزَخٌ لَّا يَبْغِيَانِ",
    ayahRef: "الرحمن: ١٩-٢٠",
    discovery: "علم أعماق البحار — القرن ٢٠",
    gradient: "from-cyan-600/15 to-blue-400/5",
    border: "rgba(14,165,233,0.25)",
  },
  {
    id: 5, icon: "🔥", title: "طبقات الأرض النارية",
    category: "علمي", categoryColor: "#ef4444",
    short: "وصف باطن الأرض الناري قبل اكتشافه بقرون",
    detail: "﴿وَالْأَرْضِ ذَاتِ الصَّدْعِ﴾ (الطارق: ١٢) — الصدع هو الشق والانقسام. اكتشف العلماء أن قشرة الأرض تتكون من ألواح تتحرك وتتصادم وتنكسر. كذلك ﴿وَجَعَلْنَا فِي الْأَرْضِ رَوَاسِيَ أَن تَمِيدَ بِكُمْ﴾ — الجبال كأوتاد تمنع اهتزاز الأرض.",
    ayah: "وَجَعَلْنَا فِي الْأَرْضِ رَوَاسِيَ أَن تَمِيدَ بِكُمْ",
    ayahRef: "الأنبياء: ٣١",
    discovery: "علم الجيولوجيا الحديث",
    gradient: "from-red-600/15 to-orange-400/5",
    border: "rgba(239,68,68,0.25)",
  },
  {
    id: 6, icon: "💧", title: "دورة الماء في الطبيعة",
    category: "علمي", categoryColor: "#3b82f6",
    short: "وصف دورة الماء الكاملة بدقة علمية مذهلة",
    detail: "﴿أَلَمْ تَرَ أَنَّ اللَّهَ يُزْجِي سَحَابًا ثُمَّ يُؤَلِّفُ بَيْنَهُ ثُمَّ يَجْعَلُهُ رُكَامًا فَتَرَى الْوَدْقَ يَخْرُجُ مِنْ خِلَالِهِ﴾ (النور: ٤٣). وصف دقيق لتجمع الغيوم وتراكمها وسقوط المطر — كاملاً من دورة الماء في الطبيعة التي اكتشفها العلماء حديثاً بالأقمار الاصطناعية.",
    ayah: "أَلَمْ تَرَ أَنَّ اللَّهَ يُزْجِي سَحَابًا ثُمَّ يُؤَلِّفُ بَيْنَهُ",
    ayahRef: "النور: ٤٣",
    discovery: "الأرصاد الجوية الحديثة",
    gradient: "from-blue-600/15 to-indigo-400/5",
    border: "rgba(59,130,246,0.25)",
  },
  {
    id: 7, icon: "🌑", title: "القمر نور مستعار",
    category: "علمي", categoryColor: "#a855f7",
    short: "ميّز القرآن بين ضوء الشمس ونور القمر قبل العلم",
    detail: "﴿وَجَعَلَ الشَّمْسَ سِرَاجًا وَالْقَمَرَ نُورًا﴾ (نوح: ١٦). الشمس «سراج» أي مصدر الضوء، والقمر «نور» أي عاكس للضوء. وهذا التمييز الدقيق بين الضوء الذاتي والانعكاسي لم يتضح علمياً إلا بعد اختراع التلسكوب — بينما القرآن أشار إليه منذ ١٤٠٠ سنة.",
    ayah: "وَجَعَلَ الشَّمْسَ سِرَاجًا وَالْقَمَرَ نُورًا",
    ayahRef: "نوح: ١٦",
    discovery: "علم الفلك الحديث",
    gradient: "from-purple-600/15 to-violet-400/5",
    border: "rgba(168,85,247,0.25)",
  },
  {
    id: 8, icon: "📖", title: "التحدي القرآني الأبدي",
    category: "لغوي", categoryColor: "#f59e0b",
    short: "تحدى القرآن البشرية أن تأتي بمثله — والتحدي قائم منذ ١٤ قرناً",
    detail: "﴿قُل لَّئِنِ اجْتَمَعَتِ الْإِنسُ وَالْجِنُّ عَلَىٰ أَن يَأْتُوا بِمِثْلِ هَٰذَا الْقُرْآنِ لَا يَأْتُونَ بِمِثْلِهِ وَلَوْ كَانَ بَعْضُهُمْ لِبَعْضٍ ظَهِيرًا﴾ (الإسراء: ٨٨). بعد ١٤ قرناً وبرغم وجود آلاف العلماء وأكثر من مليار متحدث بالعربية — لم يستطع أحد أن يأتي بسورة واحدة مثله.",
    ayah: "لَّئِنِ اجْتَمَعَتِ الْإِنسُ وَالْجِنُّ عَلَىٰ أَن يَأْتُوا بِمِثْلِ هَٰذَا الْقُرْآنِ لَا يَأْتُونَ بِمِثْلِهِ",
    ayahRef: "الإسراء: ٨٨",
    gradient: "from-amber-600/15 to-yellow-400/5",
    border: "rgba(245,158,11,0.25)",
  },
  {
    id: 9, icon: "🛡️", title: "الحفظ الإلهي المضمون",
    category: "تاريخي", categoryColor: "#22c55e",
    short: "القرآن الوحيد المحفوظ حرفاً بحرف منذ ١٤ قرناً",
    detail: "﴿إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ﴾ (الحجر: ٩). القرآن الكريم هو الكتاب الوحيد في التاريخ الذي: يحفظه أكثر من ١٠ مليون شخص عن ظهر قلب، أي تحريف يُكتشف فوراً، ونصه الأصلي لا يختلف بين أي نسختين في العالم — برغم ١٤٠٠ سنة من الزمن.",
    ayah: "إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ",
    ayahRef: "الحجر: ٩",
    gradient: "from-emerald-600/15 to-teal-400/5",
    border: "rgba(34,197,94,0.25)",
  },
  {
    id: 10, icon: "🫀", title: "وظيفة القلب العقلية",
    category: "علمي", categoryColor: "#ec4899",
    short: "أشار القرآن إلى وظيفة القلب العقلية قبل اكتشافها",
    detail: "﴿أَفَلَمْ يَسِيرُوا فِي الْأَرْضِ فَتَكُونَ لَهُمْ قُلُوبٌ يَعْقِلُونَ بِهَا﴾ (الحج: ٤٦). ربط القرآن القلب بالعقل والفهم. اكتشف العلماء حديثاً أن القلب يحتوي على شبكة عصبية مستقلة من ٤٠,٠٠٠ خلية عصبية، وأنه يرسل إشارات للمخ أكثر مما يستقبل منه.",
    ayah: "فَتَكُونَ لَهُمْ قُلُوبٌ يَعْقِلُونَ بِهَا",
    ayahRef: "الحج: ٤٦",
    discovery: "علم الأعصاب القلبي — ١٩٩١م",
    gradient: "from-pink-600/15 to-rose-400/5",
    border: "rgba(236,72,153,0.25)",
  },
  {
    id: 11, icon: "🌍", title: "كروية الأرض",
    category: "علمي", categoryColor: "#0ea5e9",
    short: "أشارت آيات القرآن إلى شكل الأرض الكروي",
    detail: "﴿يُكَوِّرُ اللَّيْلَ عَلَى النَّهَارِ وَيُكَوِّرُ النَّهَارَ عَلَى اللَّيْلِ﴾ (الزمر: ٥). كلمة «يكوّر» تعني يلف ويدير — وهذا يدل على كروية الأرض واستدارتها. التكوير لا يحدث إلا على سطح كروي. وهذا قبل أن يعرف البشر أن الأرض كروية بقرون.",
    ayah: "يُكَوِّرُ اللَّيْلَ عَلَى النَّهَارِ وَيُكَوِّرُ النَّهَارَ عَلَى اللَّيْلِ",
    ayahRef: "الزمر: ٥",
    discovery: "استكشافات القرن ١٥ الميلادي",
    gradient: "from-sky-600/15 to-blue-400/5",
    border: "rgba(14,165,233,0.25)",
  },
  {
    id: 12, icon: "🧠", title: "ناصية الكاذب والخاطئ",
    category: "علمي", categoryColor: "#8b5cf6",
    short: "وصف القرآن الجبهة بأنها مركز الكذب — وهذا ما أثبته العلم",
    detail: "﴿نَاصِيَةٍ كَاذِبَةٍ خَاطِئَةٍ﴾ (العلق: ١٦). الناصية هي مقدمة الرأس (الفص الأمامي للمخ). أثبت العلماء أن الفص الأمامي للمخ هو المسؤول عن التخطيط والكذب واتخاذ القرار. وهذا ما عرفناه فقط في القرن العشرين، بينما القرآن وصفه منذ ١٤٠٠ سنة.",
    ayah: "نَاصِيَةٍ كَاذِبَةٍ خَاطِئَةٍ",
    ayahRef: "العلق: ١٦",
    discovery: "علم الأعصاب — القرن ٢٠",
    gradient: "from-violet-600/15 to-purple-400/5",
    border: "rgba(139,92,246,0.25)",
  },
];

const CATEGORIES = ["الكل", "علمي", "عددي", "لغوي", "تاريخي"];

// ─── Miracle Card ─────────────────────────────────────────────────────────────

function MiracleCard({ miracle }: { miracle: Miracle }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl overflow-hidden bg-gradient-to-br ${miracle.gradient}`}
      style={{ border: `1px solid ${miracle.border}` }}>
      <button className="w-full p-4 text-right" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start gap-3">
          <div className="text-2xl shrink-0">{miracle.icon}</div>
          <div className="flex-1">
            <div className="flex items-start gap-2 mb-1">
              <div className="flex-1">
                <p className="font-bold text-sm">{miracle.title}</p>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                  style={{ background: `${miracle.categoryColor}20`, color: miracle.categoryColor }}>
                  {miracle.category}
                </span>
              </div>
              {expanded ? <ChevronUp size={14} className="text-muted-foreground shrink-0 mt-1" />
                : <ChevronDown size={14} className="text-muted-foreground shrink-0 mt-1" />}
            </div>
            <p className="text-[11px] text-muted-foreground leading-snug">{miracle.short}</p>
          </div>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
            className="overflow-hidden">
            <div className="px-4 pb-4 flex flex-col gap-3">
              <div className="h-px bg-border" />

              {miracle.ayah && (
                <div className="rounded-xl p-3 text-center bg-muted/40 border border-border/50">
                  <p className="text-[15px] leading-[2.2]"
                    style={{ fontFamily: "'Amiri Quran', serif", color: miracle.categoryColor }}>
                    ﴾ {miracle.ayah} ﴿
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">{miracle.ayahRef}</p>
                </div>
              )}

              <p className="text-[12px] leading-[1.9] text-right text-foreground/80">
                {miracle.detail}
              </p>

              {miracle.discovery && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/40 border border-border/50">
                  <Sparkles size={11} style={{ color: miracle.categoryColor }} />
                  <p className="text-[10px] text-muted-foreground">{miracle.discovery}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function QuranMiraclesPage() {
  const [activeCategory, setActiveCategory] = useState("الكل");

  const filtered = activeCategory === "الكل"
    ? MIRACLES
    : MIRACLES.filter(m => m.category === activeCategory);

  return (
    <div className="min-h-screen pb-24" dir="rtl">
      <PageHeader title="إعجاز القرآن" subtitle="٥٠+ وجه إعجازي مفصّل" />

      <div className="px-4 pt-4 flex flex-col gap-4">
        {/* Hero */}
        <div className="rounded-2xl p-4 text-center"
          style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(79,70,229,0.06) 100%)", border: "1px solid rgba(139,92,246,0.2)" }}>
          <p className="text-3xl mb-2">✨</p>
          <p className="font-bold text-sm mb-1">إعجاز القرآن الكريم</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            القرآن معجزة خالدة تتجدد مع كل اكتشاف علمي — كلما تقدم العلم، تجلّت حقائق القرآن أكثر وأكثر
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { v: "١٢+", l: "إعجاز علمي", c: "#06b6d4" },
            { v: "١٤", l: "قرناً", c: "#f59e0b" },
            { v: "٠", l: "تناقض", c: "#22c55e" },
            { v: "∞", l: "معجزة", c: "#8b5cf6" },
          ].map(s => (
            <div key={s.l} className="rounded-xl p-2.5 text-center bg-muted/40 border border-border/50">
              <p className="text-base font-bold" style={{ color: s.c }}>{s.v}</p>
              <p className="text-[9px] text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
                activeCategory === cat
                  ? "bg-primary/15 border border-primary/40 text-primary"
                  : "bg-muted/60 border border-border text-muted-foreground"
              }`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Miracles List */}
        <div className="flex flex-col gap-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((m, i) => (
              <motion.div key={m.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.03 }}>
                <MiracleCard miracle={m} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="text-center py-4">
          <p className="text-[11px] text-muted-foreground">
            ﴿وَلَوْ كَانَ مِنْ عِندِ غَيْرِ اللَّهِ لَوَجَدُوا فِيهِ اخْتِلَافًا كَثِيرًا﴾
          </p>
          <p className="text-[10px] text-muted-foreground/50 mt-1">النساء: ٨٢</p>
        </div>
      </div>
    </div>
  );
}
