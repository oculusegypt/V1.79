import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Share2, RefreshCw, Palette, Type, ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

// ─── Data ─────────────────────────────────────────────────────────────────────

const AYAHS = [
  { arabic: "إِنَّ مَعَ الْعُسْرِ يُسْرًا", surah: "الشرح", ayah: 6, meaning: "إن مع الشدة فرجاً" },
  { arabic: "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ", surah: "الطلاق", ayah: 3, meaning: "من يعتمد على الله كفاه" },
  { arabic: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا", surah: "الشرح", ayah: 5, meaning: "مع كل شدة سهولة" },
  { arabic: "وَبَشِّرِ الصَّابِرِينَ", surah: "البقرة", ayah: 155, meaning: "الصبر طريق النجاح" },
  { arabic: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ", surah: "البقرة", ayah: 255, meaning: "آية الكرسي — سيدة القرآن" },
  { arabic: "وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ", surah: "البقرة", ayah: 186, meaning: "الله قريب يسمع الدعاء" },
  { arabic: "قُلْ هُوَ اللَّهُ أَحَدٌ", surah: "الإخلاص", ayah: 1, meaning: "التوحيد الخالص" },
  { arabic: "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ", surah: "البقرة", ayah: 153, meaning: "الله مع الصابرين" },
  { arabic: "وَلَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ", surah: "الزمر", ayah: 53, meaning: "رحمة الله واسعة" },
  { arabic: "حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ", surah: "آل عمران", ayah: 173, meaning: "الله يكفي من يتوكل عليه" },
  { arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً", surah: "البقرة", ayah: 201, meaning: "دعاء الدنيا والآخرة" },
  { arabic: "وَهُوَ مَعَكُمْ أَيْنَ مَا كُنتُمْ", surah: "الحديد", ayah: 4, meaning: "الله معنا في كل مكان" },
];

const THEMES = [
  {
    id: "violet",
    label: "بنفسجي",
    bg: "linear-gradient(135deg, #4c1d95 0%, #7c3aed 50%, #8b5cf6 100%)",
    text: "#fff",
    accent: "rgba(255,255,255,0.3)",
    pattern: "geometric",
  },
  {
    id: "gold",
    label: "ذهبي",
    bg: "linear-gradient(135deg, #78350f 0%, #b45309 50%, #d97706 100%)",
    text: "#fef3c7",
    accent: "rgba(254,243,199,0.3)",
    pattern: "stars",
  },
  {
    id: "emerald",
    label: "زمردي",
    bg: "linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)",
    text: "#d1fae5",
    accent: "rgba(209,250,229,0.3)",
    pattern: "waves",
  },
  {
    id: "night",
    label: "ليلي",
    bg: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)",
    text: "#e2e8f0",
    accent: "rgba(226,232,240,0.2)",
    pattern: "dots",
  },
  {
    id: "rose",
    label: "وردي",
    bg: "linear-gradient(135deg, #881337 0%, #be123c 50%, #e11d48 100%)",
    text: "#fff1f2",
    accent: "rgba(255,241,242,0.3)",
    pattern: "geometric",
  },
  {
    id: "teal",
    label: "فيروزي",
    bg: "linear-gradient(135deg, #134e4a 0%, #0f766e 50%, #14b8a6 100%)",
    text: "#ccfbf1",
    accent: "rgba(204,251,241,0.3)",
    pattern: "dots",
  },
];

// ─── SVG Patterns ─────────────────────────────────────────────────────────────

function GeometricPattern({ color }: { color: string }) {
  return (
    <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.08 }}>
      <defs>
        <pattern id="geo" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <polygon points="20,0 40,20 20,40 0,20" fill="none" stroke={color} strokeWidth="0.5" />
          <polygon points="20,5 35,20 20,35 5,20" fill="none" stroke={color} strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#geo)" />
    </svg>
  );
}

function DotsPattern({ color }: { color: string }) {
  return (
    <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.1 }}>
      <defs>
        <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="10" cy="10" r="1.5" fill={color} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dots)" />
    </svg>
  );
}

// ─── Card Preview ─────────────────────────────────────────────────────────────

function QuranCard({ ayah, theme, size = "full" }: {
  ayah: typeof AYAHS[0];
  theme: typeof THEMES[0];
  size?: "full" | "preview";
}) {
  const scale = size === "preview" ? 1 : 1;
  return (
    <div
      className="relative overflow-hidden flex flex-col items-center justify-center text-center"
      style={{
        background: theme.bg,
        borderRadius: 20,
        padding: size === "preview" ? "24px 16px" : "32px 24px",
        minHeight: size === "preview" ? 180 : 240,
        aspectRatio: "1 / 1",
      }}>
      {theme.pattern === "geometric" && <GeometricPattern color={theme.text} />}
      {theme.pattern === "dots" && <DotsPattern color={theme.text} />}

      {/* Decorative top line */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-0.5 rounded-full"
        style={{ background: theme.accent }} />

      {/* Bismillah small */}
      <p className="text-[10px] mb-3 opacity-60 relative z-10" style={{ color: theme.text, fontFamily: "'Amiri Quran', serif" }}>
        ﷽
      </p>

      {/* Ayah */}
      <p className="relative z-10 leading-[2.2] font-bold"
        style={{
          color: theme.text,
          fontFamily: "'Amiri Quran', serif",
          fontSize: size === "preview" ? 16 : 20,
          textShadow: "0 1px 3px rgba(0,0,0,0.3)",
        }}>
        ﴾ {ayah.arabic} ﴿
      </p>

      {/* Source */}
      <p className="mt-3 relative z-10 text-[11px] opacity-75" style={{ color: theme.text }}>
        سورة {ayah.surah} · آية {ayah.ayah}
      </p>

      {/* Meaning */}
      <p className="mt-1 relative z-10 text-[10px] opacity-50" style={{ color: theme.text }}>
        {ayah.meaning}
      </p>

      {/* Decorative bottom */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-1 h-1 rounded-full" style={{ background: theme.accent }} />
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function QuranCardsPage() {
  const [ayahIdx, setAyahIdx] = useState(0);
  const [themeIdx, setThemeIdx] = useState(0);

  const ayah = AYAHS[ayahIdx]!;
  const theme = THEMES[themeIdx]!;

  const nextAyah = () => setAyahIdx((ayahIdx + 1) % AYAHS.length);
  const prevAyah = () => setAyahIdx((ayahIdx - 1 + AYAHS.length) % AYAHS.length);
  const randomAyah = () => {
    let idx = ayahIdx;
    while (idx === ayahIdx) idx = Math.floor(Math.random() * AYAHS.length);
    setAyahIdx(idx);
  };

  const shareCard = async () => {
    if (navigator.share) {
      await navigator.share({
        title: "بطاقة قرآنية",
        text: `﴾ ${ayah.arabic} ﴿\nسورة ${ayah.surah} · آية ${ayah.ayah}`,
      }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(`﴾ ${ayah.arabic} ﴿\nسورة ${ayah.surah} · آية ${ayah.ayah}`).catch(() => {});
    }
  };

  return (
    <div className="min-h-screen pb-24" dir="rtl">
      <PageHeader title="بطاقات القرآن" subtitle="أنشئ بطاقة مرئية لأي آية" />

      <div className="px-4 pt-4 flex flex-col gap-4">
        {/* Card Preview */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${ayahIdx}-${themeIdx}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25 }}>
            <QuranCard ayah={ayah} theme={theme} />
          </motion.div>
        </AnimatePresence>

        {/* Ayah Navigation */}
        <div className="flex items-center gap-3">
          <button onClick={prevAyah}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <ChevronRight size={16} className="text-muted-foreground" />
          </button>
          <div className="flex-1 text-center">
            <p className="text-[11px] text-muted-foreground">الآية {ayahIdx + 1} من {AYAHS.length}</p>
          </div>
          <button onClick={nextAyah}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <ChevronLeft size={16} className="text-muted-foreground" />
          </button>
        </div>

        {/* Themes */}
        <div>
          <p className="text-[11px] font-bold text-muted-foreground mb-2 flex items-center gap-1">
            <Palette size={11} /> اختر الخلفية:
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {THEMES.map((t, i) => (
              <button key={t.id} onClick={() => setThemeIdx(i)}
                className="shrink-0 w-10 h-10 rounded-xl transition-all"
                style={{
                  background: t.bg,
                  border: themeIdx === i ? "3px solid white" : "2px solid rgba(255,255,255,0.1)",
                  transform: themeIdx === i ? "scale(1.1)" : "scale(1)",
                }} />
            ))}
          </div>
        </div>

        {/* Ayah List */}
        <div>
          <p className="text-[11px] font-bold text-muted-foreground mb-2 flex items-center gap-1">
            <Type size={11} /> اختر آية:
          </p>
          <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
            {AYAHS.map((a, i) => (
              <button key={i} onClick={() => setAyahIdx(i)}
                className="flex items-center gap-2.5 p-2.5 rounded-xl text-right transition-all active:scale-[0.98]"
                style={{
                  background: ayahIdx === i ? "rgba(139,92,246,0.12)" : "rgba(255,255,255,0.03)",
                  border: ayahIdx === i ? "1px solid rgba(139,92,246,0.3)" : "1px solid rgba(255,255,255,0.05)",
                }}>
                <p className="text-[12px] flex-1 leading-snug" style={{ color: ayahIdx === i ? "#8b5cf6" : "var(--foreground)" }}>
                  {a.arabic}
                </p>
                <p className="text-[9px] text-muted-foreground shrink-0">{a.surah}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2">
          <button onClick={randomAyah}
            className="py-3 rounded-xl flex items-center justify-center gap-2 text-[13px] font-bold"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <RefreshCw size={14} className="text-muted-foreground" />
            <span>عشوائية</span>
          </button>
          <button onClick={shareCard}
            className="py-3 rounded-xl flex items-center justify-center gap-2 text-[13px] font-bold text-white"
            style={{ background: "linear-gradient(135deg, #8b5cf6, #7c3aed)" }}>
            <Share2 size={14} />
            <span>مشاركة</span>
          </button>
        </div>

        <p className="text-[10px] text-muted-foreground text-center">
          انسخ نص الآية وشاركها على منصات التواصل الاجتماعي
        </p>
      </div>
    </div>
  );
}
