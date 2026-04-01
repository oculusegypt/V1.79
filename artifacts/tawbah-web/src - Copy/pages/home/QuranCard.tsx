import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { BookMarked } from "lucide-react";

const QURAN_BANNER_AYAHS = [
  {
    text: "إِنَّ هَٰذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ",
    ref: "الإسراء: ٩",
  },
  {
    text: "وَنُنَزِّلُ مِنَ الْقُرْآنِ مَا هُوَ شِفَاءٌ وَرَحْمَةٌ",
    ref: "الإسراء: ٨٢",
  },
  {
    text: "كِتَابٌ أَنزَلْنَاهُ إِلَيْكَ مُبَارَكٌ لِّيَدَّبَّرُوا آيَاتِهِ",
    ref: "ص: ٢٩",
  },
  { text: "خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ", ref: "البخاري" },
];

export function SectionQuranCard() {
  const [ayahIdx, setAyahIdx] = useState(0);
  const [pages, setPages] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem("quran_pages_today") ?? "0") || 0;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    const t = setInterval(
      () => setAyahIdx((i) => (i + 1) % QURAN_BANNER_AYAHS.length),
      5500,
    );
    return () => clearInterval(t);
  }, []);

  const addPage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = pages + 1;
    setPages(next);
    try {
      localStorage.setItem("quran_pages_today", String(next));
    } catch {}
    if (navigator.vibrate) navigator.vibrate(12);
  };

  const target = 5;
  const progress = Math.min((pages / target) * 100, 100);
  const done = pages >= target;

  return (
    <Link href="/quran">
      <div
        className="relative overflow-hidden rounded-[24px] cursor-pointer active:scale-[0.985] transition-transform"
        style={{
          background:
            "linear-gradient(160deg, #040d18 0%, #071428 45%, #030b15 100%)",
          border: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "0 16px 50px rgba(0,0,0,0.55), 0 4px 14px rgba(0,0,0,0.3)",
        }}
      >
        {/* Stars */}
        {[
          [12, 8],
          [88, 5],
          [35, 15],
          [65, 7],
          [90, 18],
          [20, 22],
          [75, 12],
          [50, 4],
          [42, 20],
          [80, 24],
        ].map(([x, y], i) => (
          <motion.div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              width: i % 3 === 0 ? 2.5 : 1.5,
              height: i % 3 === 0 ? 2.5 : 1.5,
              background: i % 2 === 0 ? "#c8a84b" : "#7dd3fc",
            }}
            animate={{ opacity: [0.1, 0.65, 0.1] }}
            transition={{
              duration: 2.5 + (i % 4) * 0.7,
              repeat: Infinity,
              delay: (i * 0.4) % 3,
            }}
          />
        ))}

        {/* Top glow */}
        <div
          className="absolute inset-x-0 top-0 h-[120px] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 100% at 50% 0%, rgba(200,168,75,0.2) 0%, transparent 70%)",
            filter: "blur(18px)",
          }}
        />

        <div className="relative z-10 p-4">
          {/* Header row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(200,168,75,0.3) 0%, rgba(200,168,75,0.1) 100%)",
                  border: "1px solid rgba(200,168,75,0.45)",
                }}
              >
                <span style={{ fontSize: 20 }}>📖</span>
              </div>
              <div>
                <h2
                  className="font-bold leading-tight pt-[5px] pb-[5px]"
                  style={{
                    fontSize: 17,
                    background:
                      "linear-gradient(90deg, #ffffff 0%, #c8a84b 60%, #a07c2a 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    fontFamily: "'Amiri Quran', serif",
                  }}
                >
                  القرآن الكريم
                </h2>
                <p style={{ color: "rgba(200,168,75,0.55)", fontSize: 10 }}>
                  مكتبة شاملة — تلاوة وتفسير وعلوم
                </p>
              </div>
            </div>
            {/* Mini stats */}
            <div className="flex gap-1.5">
              {[
                ["١١٤", "سورة"],
                ["٣٠", "جزءاً"],
              ].map(([n, l]) => (
                <div
                  key={l}
                  className="flex flex-col items-center px-2.5 py-1.5 rounded-xl"
                  style={{
                    background: "rgba(200,168,75,0.1)",
                    border: "1px solid rgba(200,168,75,0.2)",
                  }}
                >
                  <span
                    style={{ fontSize: 12, fontWeight: 700, color: "#c8a84b" }}
                  >
                    {n}
                  </span>
                  <span
                    style={{ fontSize: 9, color: "rgba(255,255,255,0.35)" }}
                  >
                    {l}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Rotating Ayah */}
          <div
            className="rounded-xl px-4 py-3 mb-3"
            style={{
              background: "rgba(200,168,75,0.07)",
              border: "1px solid rgba(200,168,75,0.18)",
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={ayahIdx}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.35 }}
              >
                <p
                  className="text-center leading-loose mb-1"
                  style={{
                    fontFamily: "'Amiri Quran', serif",
                    fontSize: 14.5,
                    color: "rgba(255,255,255,0.9)",
                  }}
                >
                  ﴿{QURAN_BANNER_AYAHS[ayahIdx]!.text}﴾
                </p>
                <p
                  className="text-center"
                  style={{ fontSize: 10, color: "rgba(200,168,75,0.6)" }}
                >
                  — {QURAN_BANNER_AYAHS[ayahIdx]!.ref}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Reading Tracker row */}
          <div className="flex items-center gap-2">
            {/* Progress mini bar */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.45)" }}>
                  ورد اليوم
                </span>
                <span
                  style={{
                    fontSize: 10,
                    color: done ? "#10b981" : "rgba(200,168,75,0.7)",
                    fontWeight: 700,
                  }}
                >
                  {done ? "✓ مكتمل" : `${pages}/${target} ص`}
                </span>
              </div>
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ background: "rgba(255,255,255,0.08)" }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: done
                      ? "#10b981"
                      : "linear-gradient(90deg,#c8a84b,#f0d070)",
                  }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* +page button */}
            <button
              onClick={addPage}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-[11px] active:scale-[0.94] transition-all"
              style={{
                background: done
                  ? "rgba(16,185,129,0.2)"
                  : "linear-gradient(135deg,rgba(200,168,75,0.3),rgba(200,168,75,0.15))",
                border: `1px solid ${done ? "rgba(16,185,129,0.4)" : "rgba(200,168,75,0.4)"}`,
                color: done ? "#10b981" : "#c8a84b",
              }}
            >
              <BookMarked size={12} />+ صفحة
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
