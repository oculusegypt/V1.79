import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Map, ChevronRight, X, BookOpen, Clock } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

// ─── Data ─────────────────────────────────────────────────────────────────────

interface JuzInfo {
  num: number;
  startSurah: string;
  startAyah: number;
  endSurah: string;
  endAyah: number;
  highlight: string;
}

interface SurahGroup {
  label: string;
  color: string;
  gradient: string;
  border: string;
  surahs: { id: number; name: string; ayahCount: number; revelation: "مكية" | "مدنية"; juz: number; meaning: string }[];
  event?: string;
  period?: string;
}

const SURAH_GROUPS: SurahGroup[] = [
  {
    label: "الطوال السبع",
    color: "#8b5cf6",
    gradient: "from-violet-600/20 to-purple-500/5",
    border: "rgba(139,92,246,0.3)",
    period: "مدنية في الغالب",
    event: "نزلت بعد هجرة النبي ﷺ للمدينة",
    surahs: [
      { id: 2, name: "البقرة", ayahCount: 286, revelation: "مدنية", juz: 1, meaning: "البقرة" },
      { id: 3, name: "آل عمران", ayahCount: 200, revelation: "مدنية", juz: 3, meaning: "آل عمران" },
      { id: 4, name: "النساء", ayahCount: 176, revelation: "مدنية", juz: 4, meaning: "النساء" },
      { id: 5, name: "المائدة", ayahCount: 120, revelation: "مدنية", juz: 6, meaning: "المائدة" },
      { id: 6, name: "الأنعام", ayahCount: 165, revelation: "مكية", juz: 7, meaning: "الأنعام" },
      { id: 7, name: "الأعراف", ayahCount: 206, revelation: "مكية", juz: 8, meaning: "الأعراف" },
      { id: 9, name: "التوبة", ayahCount: 129, revelation: "مدنية", juz: 10, meaning: "التوبة" },
    ],
  },
  {
    label: "سور الأنبياء",
    color: "#f59e0b",
    gradient: "from-amber-600/20 to-yellow-500/5",
    border: "rgba(245,158,11,0.3)",
    period: "مكية في الغالب",
    event: "تروي قصص الأنبياء والمرسلين",
    surahs: [
      { id: 10, name: "يونس", ayahCount: 109, revelation: "مكية", juz: 11, meaning: "يونس" },
      { id: 11, name: "هود", ayahCount: 123, revelation: "مكية", juz: 11, meaning: "هود" },
      { id: 12, name: "يوسف", ayahCount: 111, revelation: "مكية", juz: 12, meaning: "يوسف" },
      { id: 14, name: "إبراهيم", ayahCount: 52, revelation: "مكية", juz: 13, meaning: "إبراهيم" },
      { id: 19, name: "مريم", ayahCount: 98, revelation: "مكية", juz: 16, meaning: "مريم" },
      { id: 21, name: "الأنبياء", ayahCount: 112, revelation: "مكية", juz: 17, meaning: "الأنبياء" },
    ],
  },
  {
    label: "سور التسبيح",
    color: "#06b6d4",
    gradient: "from-cyan-600/20 to-blue-500/5",
    border: "rgba(6,182,212,0.3)",
    period: "مكية ومدنية",
    event: "تبدأ بتسبيح الله أو الحمد له",
    surahs: [
      { id: 17, name: "الإسراء", ayahCount: 111, revelation: "مكية", juz: 15, meaning: "الإسراء" },
      { id: 57, name: "الحديد", ayahCount: 29, revelation: "مدنية", juz: 27, meaning: "الحديد" },
      { id: 59, name: "الحشر", ayahCount: 24, revelation: "مدنية", juz: 28, meaning: "الحشر" },
      { id: 61, name: "الصف", ayahCount: 14, revelation: "مدنية", juz: 28, meaning: "الصف" },
      { id: 62, name: "الجمعة", ayahCount: 11, revelation: "مدنية", juz: 28, meaning: "الجمعة" },
      { id: 64, name: "التغابن", ayahCount: 18, revelation: "مدنية", juz: 28, meaning: "التغابن" },
    ],
  },
  {
    label: "المفصّل الطوال",
    color: "#22c55e",
    gradient: "from-emerald-600/20 to-green-500/5",
    border: "rgba(34,197,94,0.3)",
    period: "مكية في الغالب",
    event: "قصيرة نسبياً من جزء ٢٩ و٣٠",
    surahs: [
      { id: 67, name: "الملك", ayahCount: 30, revelation: "مكية", juz: 29, meaning: "المانعة" },
      { id: 78, name: "النبأ", ayahCount: 40, revelation: "مكية", juz: 30, meaning: "النبأ العظيم" },
      { id: 87, name: "الأعلى", ayahCount: 19, revelation: "مكية", juz: 30, meaning: "الأعلى" },
      { id: 97, name: "القدر", ayahCount: 5, revelation: "مكية", juz: 30, meaning: "ليلة القدر" },
      { id: 108, name: "الكوثر", ayahCount: 3, revelation: "مكية", juz: 30, meaning: "نهر الجنة" },
    ],
  },
  {
    label: "المعوذات والإخلاص",
    color: "#ec4899",
    gradient: "from-pink-600/20 to-rose-500/5",
    border: "rgba(236,72,153,0.3)",
    period: "مكية",
    event: "آخر ما نزل من القرآن — الملاذ من الشر",
    surahs: [
      { id: 112, name: "الإخلاص", ayahCount: 4, revelation: "مكية", juz: 30, meaning: "ثلث القرآن" },
      { id: 113, name: "الفلق", ayahCount: 5, revelation: "مكية", juz: 30, meaning: "الفلق" },
      { id: 114, name: "الناس", ayahCount: 6, revelation: "مكية", juz: 30, meaning: "الناس" },
    ],
  },
];

const JUZ_HIGHLIGHTS: JuzInfo[] = [
  { num: 1, startSurah: "الفاتحة", startAyah: 1, endSurah: "البقرة", endAyah: 141, highlight: "افتتاح القرآن بأم الكتاب" },
  { num: 2, startSurah: "البقرة", startAyah: 142, endSurah: "البقرة", endAyah: 252, highlight: "تحويل القبلة وشعائر الحج" },
  { num: 7, startSurah: "المائدة", startAyah: 82, endSurah: "الأنعام", endAyah: 110, highlight: "التوحيد والأحكام" },
  { num: 15, startSurah: "الإسراء", startAyah: 1, endSurah: "الكهف", endAyah: 74, highlight: "الإسراء والمعراج وقصص الكهف" },
  { num: 27, startSurah: "الذاريات", startAyah: 31, endSurah: "الحديد", endAyah: 29, highlight: "عروس القرآن — سورة الرحمن" },
  { num: 28, startSurah: "المجادلة", startAyah: 1, endSurah: "التحريم", endAyah: 12, highlight: "السور المدنية الأخيرة" },
  { num: 29, startSurah: "الملك", startAyah: 1, endSurah: "المرسلات", endAyah: 50, highlight: "سورة الملك الشافعة" },
  { num: 30, startSurah: "النبأ", startAyah: 1, endSurah: "الناس", endAyah: 6, highlight: "جزء عمّ — سور قصيرة عظيمة" },
];

const PERIODS = [
  {
    label: "مكة المبكرة",
    years: "٦١٠ — ٦١٥م",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.1)",
    border: "rgba(245,158,11,0.25)",
    description: "بدأ الوحي في غار حراء. نزلت سور العقيدة والتوحيد والإيمان باليوم الآخر.",
    icon: "🌄",
    surahs: "الأعلى، المدثر، المزمل، الفجر، الضحى...",
  },
  {
    label: "مكة الوسطى",
    years: "٦١٥ — ٦٢٠م",
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.1)",
    border: "rgba(139,92,246,0.25)",
    description: "اشتداد الأذى على المسلمين. نزلت قصص الأنبياء تثبيتاً للمؤمنين.",
    icon: "🕌",
    surahs: "هود، يونس، يوسف، الكهف، مريم...",
  },
  {
    label: "مكة المتأخرة",
    years: "٦٢٠ — ٦٢٢م",
    color: "#06b6d4",
    bg: "rgba(6,182,212,0.1)",
    border: "rgba(6,182,212,0.25)",
    description: "الإسراء والمعراج وبدء التخطيط للهجرة. سور تنظيم الرحلة الروحية.",
    icon: "✈️",
    surahs: "الإسراء، الحج، القمر...",
  },
  {
    label: "المدينة المنورة",
    years: "٦٢٢ — ٦٣٢م",
    color: "#22c55e",
    bg: "rgba(34,197,94,0.1)",
    border: "rgba(34,197,94,0.25)",
    description: "بناء الدولة الإسلامية. نزلت أحكام الحلال والحرام والمعاملات والجهاد.",
    icon: "🏛️",
    surahs: "البقرة، آل عمران، النساء، المائدة...",
  },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function QuranMapPage() {
  const [activeGroup, setActiveGroup] = useState<SurahGroup | null>(null);
  const [tab, setTab] = useState<"groups" | "juz" | "periods">("groups");

  return (
    <div className="min-h-screen pb-24" dir="rtl">
      <PageHeader title="خريطة القرآن" subtitle="رحلة مرئية في كتاب الله" />

      <div className="px-4 pt-4 flex flex-col gap-4">
        {/* Intro */}
        <div className="rounded-2xl p-4 flex items-center gap-3"
          style={{ background: "linear-gradient(145deg, rgba(139,92,246,0.12) 0%, rgba(139,92,246,0.03) 100%)", border: "1px solid rgba(139,92,246,0.2)" }}>
          <div className="text-2xl">🗺️</div>
          <div>
            <p className="font-bold text-sm mb-0.5">استكشف القرآن الكريم</p>
            <p className="text-[11px] text-muted-foreground leading-snug">تعرّف على تصنيفات السور وترتيب نزولها ومواضيعها الكبرى</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { v: "١١٤", l: "سورة", c: "#8b5cf6" },
            { v: "٣٠", l: "جزءاً", c: "#f59e0b" },
            { v: "٦٢٣٦", l: "آية", c: "#22c55e" },
          ].map(s => (
            <div key={s.l} className="rounded-2xl p-3 text-center"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-lg font-bold" style={{ color: s.c, fontFamily: "'Amiri Quran', serif" }}>{s.v}</p>
              <p className="text-[10px] text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          {[
            { id: "groups", label: "مجموعات" },
            { id: "juz", label: "الأجزاء" },
            { id: "periods", label: "التسلسل" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              className="flex-1 py-2.5 text-[12px] font-bold transition-all"
              style={{
                background: tab === t.id ? "rgba(139,92,246,0.2)" : "transparent",
                color: tab === t.id ? "#8b5cf6" : "var(--muted-foreground)",
              }}>
              {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === "groups" && (
            <motion.div key="groups" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col gap-3">
              {SURAH_GROUPS.map((group, i) => (
                <motion.button
                  key={group.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setActiveGroup(group)}
                  className={`w-full p-4 rounded-2xl text-right bg-gradient-to-br ${group.gradient} active:scale-[0.98] transition-all`}
                  style={{ border: `1px solid ${group.border}` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="font-bold text-sm mb-0.5" style={{ color: group.color }}>{group.label}</p>
                      <p className="text-[10px] text-muted-foreground">{group.surahs.length} سور · {group.period}</p>
                      {group.event && <p className="text-[10px] text-muted-foreground/70 mt-0.5">{group.event}</p>}
                    </div>
                    <div className="flex -space-x-1 rtl:space-x-reverse">
                      {group.surahs.slice(0, 3).map(s => (
                        <div key={s.id} className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
                          style={{ background: `${group.color}25`, border: `1px solid ${group.border}`, color: group.color, fontFamily: "'Amiri Quran', serif" }}>
                          {s.id}
                        </div>
                      ))}
                      {group.surahs.length > 3 && (
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] text-muted-foreground bg-muted/50 border border-border">
                          +{group.surahs.length - 3}
                        </div>
                      )}
                    </div>
                    <ChevronRight size={14} className="text-muted-foreground" />
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}

          {tab === "juz" && (
            <motion.div key="juz" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col gap-2">
              <div className="grid grid-cols-5 gap-1.5">
                {Array.from({ length: 30 }, (_, i) => i + 1).map(n => {
                  const hi = JUZ_HIGHLIGHTS.find(j => j.num === n);
                  return (
                    <motion.div
                      key={n}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: n * 0.02 }}
                      className="aspect-square rounded-xl flex flex-col items-center justify-center bg-muted/40 border border-border/50">
                      <p className="text-sm font-bold" style={{ color: hi ? "#8b5cf6" : "hsl(var(--foreground))", fontFamily: "'Amiri Quran', serif" }}>
                        {n}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
              <div className="flex flex-col gap-2 mt-2">
                <p className="text-[11px] font-bold text-muted-foreground">أجزاء مميزة:</p>
                {JUZ_HIGHLIGHTS.map((juz, i) => (
                  <motion.div key={juz.num} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-[13px] shrink-0"
                      style={{ background: "rgba(139,92,246,0.2)", color: "#8b5cf6", fontFamily: "'Amiri Quran', serif" }}>
                      {juz.num}
                    </div>
                    <div className="flex-1">
                      <p className="text-[12px] font-bold">{juz.highlight}</p>
                      <p className="text-[10px] text-muted-foreground">{juz.startSurah} → {juz.endSurah}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {tab === "periods" && (
            <motion.div key="periods" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col gap-3">
              <p className="text-[11px] text-muted-foreground text-center">تسلسل نزول القرآن عبر ٢٣ سنة</p>
              {PERIODS.map((p, i) => (
                <motion.div key={p.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  className="rounded-2xl p-4"
                  style={{ background: p.bg, border: `1px solid ${p.border}` }}>
                  <div className="flex items-start gap-3">
                    <div className="text-2xl shrink-0">{p.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-sm" style={{ color: p.color }}>{p.label}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{ background: `${p.color}20`, color: p.color }}>
                          <Clock size={9} className="inline ml-1" />{p.years}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-snug mb-2">{p.description}</p>
                      <p className="text-[10px]" style={{ color: p.color, opacity: 0.8 }}>
                        <BookOpen size={9} className="inline ml-1" />{p.surahs}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Group Detail Sheet */}
      <AnimatePresence>
        {activeGroup && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
            onClick={() => setActiveGroup(null)}>
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full rounded-t-3xl overflow-hidden bg-background border-t border-border"
              onClick={e => e.stopPropagation()}
              dir="rtl">
              <div className={`p-5 bg-gradient-to-br ${activeGroup.gradient}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold" style={{ color: activeGroup.color }}>{activeGroup.label}</h3>
                  <button onClick={() => setActiveGroup(null)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center bg-muted/60">
                    <X size={15} className="text-muted-foreground" />
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground">{activeGroup.event}</p>
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: "50vh" }}>
                <div className="p-4 flex flex-col gap-1.5">
                  {activeGroup.surahs.map((s, i) => (
                    <motion.div key={s.id} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border/50">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-bold shrink-0"
                        style={{ background: `${activeGroup.color}20`, color: activeGroup.color, fontFamily: "'Amiri Quran', serif" }}>
                        {s.id}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm" style={{ fontFamily: "'Amiri Quran', serif" }}>{s.name}</p>
                        <p className="text-[10px] text-muted-foreground">{s.ayahCount} آية · {s.revelation} · جزء {s.juz}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${s.revelation === "مكية" ? "text-amber-400" : "text-emerald-400"}`}
                        style={{ background: s.revelation === "مكية" ? "rgba(245,158,11,0.1)" : "rgba(34,197,94,0.1)" }}>
                        {s.revelation}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
