import { useRef, useState, useEffect } from "react";
import { Download, Share2, RefreshCw, ImageIcon, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";
import { PageHeader } from "@/components/PageHeader";

const VERSES = [
  { arabic: "قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ", source: "الزمر: ٥٣" },
  { arabic: "إِنَّ اللَّهَ يُحِبُّ التَّوَّابِينَ وَيُحِبُّ الْمُتَطَهِّرِينَ", source: "البقرة: ٢٢٢" },
  { arabic: "وَهُوَ الَّذِي يَقْبَلُ التَّوْبَةَ عَنْ عِبَادِهِ وَيَعْفُو عَنِ السَّيِّئَاتِ", source: "الشورى: ٢٥" },
  { arabic: "إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا ۚ إِنَّهُ هُوَ الْغَفُورُ الرَّحِيمُ", source: "الزمر: ٥٣" },
  { arabic: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ", source: "الرعد: ٢٨" },
  { arabic: "وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰ", source: "الضحى: ٥" },
];

const THEMES = [
  {
    id: "sapphire",
    name: "الليلة الزرقاء",
    bg: "linear-gradient(160deg, #0a1628 0%, #0f2547 60%, #071020 100%)",
    accent: "#c9a84c",
    text: "#f0ead6",
    sub: "rgba(240,234,214,0.65)",
    border: "rgba(201,168,76,0.4)",
    pattern: "radial-gradient(circle at 30% 70%, rgba(201,168,76,0.06) 0%, transparent 50%)",
    bgImage: "card-bg-1.png",
    bgOverlay: "rgba(7,16,32,0.55)",
  },
  {
    id: "emerald",
    name: "الجنة الخضراء",
    bg: "linear-gradient(160deg, #071f12 0%, #0d3320 60%, #041510 100%)",
    accent: "#d4af37",
    text: "#fefcf0",
    sub: "rgba(255,255,255,0.65)",
    border: "rgba(212,175,55,0.4)",
    pattern: "radial-gradient(circle at 20% 20%, rgba(212,175,55,0.07) 0%, transparent 50%)",
    bgImage: "card-bg-2.png",
    bgOverlay: "rgba(4,21,16,0.6)",
  },
  {
    id: "forest",
    name: "الغابة الخضراء",
    bg: "linear-gradient(135deg, #0f4c35 0%, #1a6b4a 50%, #0a3525 100%)",
    accent: "#d4af37",
    text: "#fefcf0",
    sub: "rgba(255,255,255,0.65)",
    border: "rgba(212,175,55,0.4)",
    pattern: "radial-gradient(circle at 20% 20%, rgba(212,175,55,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(212,175,55,0.06) 0%, transparent 50%)",
    bgImage: undefined,
    bgOverlay: undefined,
  },
  {
    id: "night",
    name: "الليل الهادئ",
    bg: "linear-gradient(135deg, #0d1b2a 0%, #1b2a3b 50%, #0a1520 100%)",
    accent: "#c9a84c",
    text: "#f0ead6",
    sub: "rgba(240,234,214,0.6)",
    border: "rgba(201,168,76,0.35)",
    pattern: "radial-gradient(circle at 30% 70%, rgba(201,168,76,0.07) 0%, transparent 50%)",
    bgImage: undefined,
    bgOverlay: undefined,
  },
  {
    id: "sand",
    name: "الرمال الذهبية",
    bg: "linear-gradient(135deg, #8b6914 0%, #c49a28 50%, #6b500f 100%)",
    accent: "#fff9e6",
    text: "#fff9e6",
    sub: "rgba(255,249,230,0.7)",
    border: "rgba(255,249,230,0.3)",
    pattern: "radial-gradient(circle at 70% 30%, rgba(255,255,255,0.08) 0%, transparent 50%)",
    bgImage: undefined,
    bgOverlay: undefined,
  },
  {
    id: "pearl",
    name: "اللؤلؤ الأبيض",
    bg: "linear-gradient(135deg, #f5f0e8 0%, #ede5d5 50%, #ddd4c0 100%)",
    accent: "#1a5c3a",
    text: "#1a2e1a",
    sub: "rgba(26,46,26,0.55)",
    border: "rgba(26,92,58,0.25)",
    pattern: "radial-gradient(circle at 50% 50%, rgba(26,92,58,0.04) 0%, transparent 60%)",
    bgImage: undefined,
    bgOverlay: undefined,
  },
];

function getHijriDate(): string {
  try {
    return new Date().toLocaleDateString("ar-SA-u-ca-islamic", {
      day: "numeric", month: "long", year: "numeric",
    });
  } catch {
    return new Date().toLocaleDateString("ar");
  }
}

function getDayNumber(): number {
  const stored = localStorage.getItem("tawbah_day_one_date");
  if (!stored) return 1;
  const diff = Math.floor((Date.now() - Number(stored)) / 86400000);
  return Math.max(1, diff + 1);
}

export default function TawbahCard() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [themeIdx, setThemeIdx] = useState(0);
  const [verseIdx, setVerseIdx] = useState(0);
  const [name, setName] = useState(() => localStorage.getItem("tawbah_card_name") || "");
  const [showName, setShowName] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [shared, setShared] = useState(false);
  const [dayNumber] = useState(getDayNumber());
  const [hijriDate] = useState(getHijriDate());

  const theme = THEMES[themeIdx];
  const verse = VERSES[verseIdx];

  useEffect(() => {
    if (name) localStorage.setItem("tawbah_card_name", name);
  }, [name]);

  const generateImage = async (): Promise<HTMLCanvasElement | null> => {
    if (!cardRef.current) return null;
    setGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });
      return canvas;
    } catch {
      return null;
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    const canvas = await generateImage();
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `بطاقة-توبتي-يوم-${dayNumber}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleShare = async () => {
    const canvas = await generateImage();
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], "tawbah-card.png", { type: "image/png" });
      if (navigator.share && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: "بطاقة توبتي",
            text: "أشاركك لحظة عودتي إلى الله — دليل التوبة النصوح",
          });
          setShared(true);
          setTimeout(() => setShared(false), 3000);
        } catch { }
      } else {
        handleDownload();
      }
    }, "image/png");
  };

  return (
    <div className="flex flex-col flex-1 pb-10">
      <PageHeader title="بطاقة توبتي" subtitle="اصنع بطاقتك وشاركها" icon={<ImageIcon size={16} />} />
      <div className="px-5 pt-5">

      {/* Card Preview */}
      <div className="flex justify-center mb-5">
        <div
          ref={cardRef}
          style={{
            width: 360,
            minHeight: 480,
            background: theme.bg,
            borderRadius: 24,
            padding: "40px 32px",
            position: "relative",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 25px 50px rgba(0,0,0,0.3)",
            direction: "rtl",
          }}
        >
          {/* AI-generated certificate image background */}
          {theme.bgImage && (
            <img
              src={`${import.meta.env.BASE_URL}images/${theme.bgImage}`}
              alt=""
              crossOrigin="anonymous"
              style={{
                position: "absolute", inset: 0, width: "100%", height: "100%",
                objectFit: "cover",
              }}
            />
          )}
          {/* Overlay for readability on image themes */}
          {theme.bgOverlay && (
            <div style={{ position: "absolute", inset: 0, background: theme.bgOverlay }} />
          )}
          {/* Background pattern (subtle gradient spots) */}
          <div style={{ position: "absolute", inset: 0, background: theme.pattern }} />

          {/* Decorative circles — only for non-image themes */}
          {!theme.bgImage && (
            <>
              <div style={{ position: "absolute", top: -60, left: -60, width: 200, height: 200, borderRadius: "50%", border: `1px solid ${theme.border}`, opacity: 0.5 }} />
              <div style={{ position: "absolute", bottom: -80, right: -80, width: 280, height: 280, borderRadius: "50%", border: `1px solid ${theme.border}`, opacity: 0.3 }} />
              <div style={{ position: "absolute", top: 20, right: 20, width: 80, height: 80, borderRadius: "50%", border: `1px solid ${theme.border}`, opacity: 0.4 }} />
            </>
          )}

          {/* Top badge */}
          <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
            <div style={{
              background: `rgba(255,255,255,0.1)`,
              border: `1px solid ${theme.border}`,
              borderRadius: 100,
              padding: "6px 20px",
              marginBottom: 28,
            }}>
              <span style={{ color: theme.accent, fontSize: 11, fontWeight: 700, fontFamily: "Tajawal, sans-serif", letterSpacing: 1 }}>
                دليل التوبة النصوح
              </span>
            </div>

            {/* Day badge */}
            <div style={{
              width: 90, height: 90, borderRadius: "50%",
              background: `rgba(255,255,255,0.08)`,
              border: `2px solid ${theme.accent}`,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              marginBottom: 20,
            }}>
              <span style={{ color: theme.accent, fontSize: 28, fontWeight: 900, fontFamily: "Cairo, sans-serif", lineHeight: 1 }}>
                {dayNumber}
              </span>
              <span style={{ color: theme.sub, fontSize: 10, fontFamily: "Tajawal, sans-serif" }}>يوم</span>
            </div>

            {showName && name && (
              <div style={{ marginBottom: 10 }}>
                <span style={{ color: theme.text, fontSize: 18, fontWeight: 700, fontFamily: "Amiri, serif" }}>
                  {name}
                </span>
              </div>
            )}

            <div style={{ marginBottom: 6 }}>
              <span style={{ color: theme.accent, fontSize: 13, fontFamily: "Tajawal, sans-serif", fontWeight: 600 }}>
                في رحلة العودة إلى الله
              </span>
            </div>
            <div style={{ marginBottom: 32 }}>
              <span style={{ color: theme.sub, fontSize: 11, fontFamily: "Tajawal, sans-serif" }}>
                {hijriDate}
              </span>
            </div>
          </div>

          {/* Verse section */}
          <div style={{
            position: "relative", zIndex: 1, width: "100%",
            background: "rgba(255,255,255,0.07)",
            border: `1px solid ${theme.border}`,
            borderRadius: 16, padding: "20px 18px",
            textAlign: "center",
          }}>
            <div style={{
              color: theme.accent, fontSize: 11, fontFamily: "Tajawal, sans-serif",
              marginBottom: 12, fontWeight: 700, letterSpacing: 0.5,
            }}>
              ✦ آية رحلتي ✦
            </div>
            <p style={{
              color: theme.text, fontSize: 15,
              fontFamily: "Amiri Quran, Amiri, serif",
              lineHeight: 2.0, margin: 0,
              textAlign: "center",
            }}>
              {verse.arabic}
            </p>
            <div style={{
              color: theme.accent, fontSize: 10,
              fontFamily: "Tajawal, sans-serif",
              marginTop: 10, fontWeight: 600,
            }}>
              {verse.source}
            </div>
          </div>

          {/* Bottom */}
          <div style={{
            position: "relative", zIndex: 1,
            marginTop: 24, textAlign: "center",
          }}>
            <p style={{
              color: theme.sub, fontSize: 10,
              fontFamily: "Tajawal, sans-serif", margin: 0,
            }}>
              تبت إلى الله توبة نصوحاً
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4">

        {/* Name input */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <label className="text-xs font-bold text-muted-foreground mb-2 block">اسمك في البطاقة (اختياري)</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: أخوك في الله"
              className="flex-1 bg-muted/40 border border-border rounded-xl px-3 py-2 text-sm outline-none text-right"
              dir="rtl"
              maxLength={30}
            />
            <button
              onClick={() => setShowName(!showName)}
              className={`px-3 rounded-xl border text-xs font-bold transition-all ${showName ? "bg-primary text-primary-foreground border-primary" : "bg-muted border-border text-muted-foreground"}`}
            >
              {showName ? "ظاهر" : "مخفي"}
            </button>
          </div>
        </div>

        {/* Theme selector */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs font-bold text-muted-foreground mb-3">اختر التصميم</p>
          <div className="grid grid-cols-3 gap-2">
            {THEMES.map((t, i) => (
              <button
                key={t.id}
                onClick={() => setThemeIdx(i)}
                className={`relative h-16 rounded-xl overflow-hidden border-2 transition-all ${themeIdx === i ? "border-primary scale-105" : "border-transparent opacity-80"}`}
                style={{ background: t.bg }}
              >
                {t.bgImage && (
                  <img
                    src={`${import.meta.env.BASE_URL}images/${t.bgImage}`}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ opacity: 0.7 }}
                  />
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
                  <span className="text-[10px] font-bold text-white drop-shadow-md leading-tight">{t.name}</span>
                </div>
                {themeIdx === i && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <Check size={18} className="text-white drop-shadow-lg" />
                  </div>
                )}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-2 mt-1">
            {THEMES.map((t, i) => (
              <p key={t.id} className={`text-center text-[9px] transition-all ${themeIdx === i ? "text-primary font-bold" : "text-muted-foreground"}`}>
                {t.name}
              </p>
            ))}
          </div>
        </div>

        {/* Verse selector */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-muted-foreground">الآية</p>
            <button
              onClick={() => setVerseIdx((i) => (i + 1) % VERSES.length)}
              className="flex items-center gap-1 text-xs text-primary font-bold"
            >
              <RefreshCw size={12} />
              <span>غيّر الآية</span>
            </button>
          </div>
          <p className="text-sm font-display text-foreground leading-relaxed text-right">
            {verse.arabic.slice(0, 60)}...
          </p>
          <p className="text-[11px] text-primary font-bold mt-1">{verse.source}</p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleDownload}
            disabled={generating}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {generating ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Download size={18} />
            )}
            <span>حفظ البطاقة</span>
          </button>
          <button
            onClick={handleShare}
            disabled={generating}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-secondary/20 text-secondary border border-secondary/30 font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60"
          >
            <AnimatePresence mode="wait">
              {shared ? (
                <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                  <Check size={18} />
                  <span>تمت المشاركة!</span>
                </motion.span>
              ) : (
                <motion.span key="share" className="flex items-center gap-2">
                  <Share2 size={18} />
                  <span>شارك البطاقة</span>
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Tip */}
        <div className="bg-primary/5 rounded-xl p-3 flex gap-2 items-start">
          <ImageIcon size={14} className="text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            شارك بطاقتك على السوشيال ميديا وأوقد في قلوب من حولك شعلة التوبة
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}
