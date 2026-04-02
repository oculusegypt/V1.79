import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, BookOpen, Hand } from "lucide-react";
import {
  buildDuaWindows,
  getPowerLabel,
  calcDuaPower,
  incrementDuaPeakAmeenCount,
  getDuaPeakAmeenCount,
} from "@/lib/dua-power";

// Determine nearest prayer based on current hour
function getNearestPrayer(): { name: string; arabicName: string } {
  const h = new Date().getHours();
  if (h < 5)  return { name: "fajr",   arabicName: "الفجر" };
  if (h < 12) return { name: "dhuhr",  arabicName: "الضحى" };
  if (h < 15) return { name: "dhuhr",  arabicName: "الظهر" };
  if (h < 18) return { name: "asr",    arabicName: "العصر" };
  if (h < 20) return { name: "maghrib",arabicName: "المغرب" };
  return       { name: "isha",         arabicName: "العشاء" };
}

const PRAYER_DUAS: Record<string, string> = {
  fajr:    "اللهم إني أسألك علماً نافعاً ورزقاً طيباً وعملاً متقبلاً — اللهم بارك لي في يومي",
  dhuhr:   "اللهم اغفر لي ذنبي كله دقه وجله، أوله وآخره، علانيته وسره",
  asr:     "اللهم إني أعوذ بك من الهم والحزن، وأعوذ بك من العجز والكسل",
  maghrib: "اللهم هذا إقبال ليلك وإدبار نهارك وأصوات دعاتك — اغفر لي",
  isha:    "اللهم إني أسألك الهدى والتقى والعفاف والغنى",
};

const DUA_ETIQUETTE = [
  { text: "ابدأ بالحمد والثناء على الله", color: "bg-amber-400" },
  { text: "صلِّ على النبي ﷺ قبل الدعاء وبعده", color: "bg-emerald-400" },
  { text: "استقبل القبلة وارفع يديك", color: "bg-blue-400" },
  { text: "ادعُ بيقين وقلب حاضر", color: "bg-violet-400" },
  { text: "كرِّر الدعاء ثلاث مرات", color: "bg-rose-400" },
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function DuaPeakModal({ visible, onClose }: Props) {
  const [ameenPressed, setAmeenPressed] = useState(false);
  const [ameenCount, setAmeenCount] = useState(() => getDuaPeakAmeenCount());

  const score = calcDuaPower();
  const powerInfo = getPowerLabel(score);
  const activeWindows = buildDuaWindows().filter((w) => w.active || w.alwaysActive);
  const topWindow = activeWindows[0];
  const prayer = getNearestPrayer();
  const bestDua = topWindow?.bestDua ?? PRAYER_DUAS[prayer.name] ?? PRAYER_DUAS["dhuhr"]!;
  const topHadith = topWindow?.hadith;

  function handleAmeen() {
    if (ameenPressed) return;
    const next = incrementDuaPeakAmeenCount();
    setAmeenCount(next);
    setAmeenPressed(true);
  }

  function handleClose() {
    setAmeenPressed(false);
    onClose();
  }

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.88, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: "spring", damping: 22, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none px-5"
          >
            <div
              className="pointer-events-auto w-full max-w-sm rounded-3xl border border-yellow-400/30 bg-card shadow-2xl shadow-yellow-500/20 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header glow strip */}
              <div className="relative bg-gradient-to-br from-yellow-500/20 via-amber-400/10 to-transparent px-5 pt-5 pb-4">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 to-transparent pointer-events-none" />

                {/* Close button */}
                <button
                  onClick={handleClose}
                  className="absolute top-4 left-4 w-8 h-8 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
                >
                  <X size={15} />
                </button>

                {/* Pulsing dot + score */}
                <div className="flex flex-col items-center gap-2 pt-1">
                  <div className="relative flex items-center justify-center w-16 h-16">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-yellow-400/30 animate-ping" />
                    <span className="relative inline-flex rounded-full h-12 w-12 bg-gradient-to-br from-yellow-400 to-amber-500 items-center justify-center shadow-lg shadow-yellow-500/40">
                      <Star size={22} className="text-white" fill="white" />
                    </span>
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] text-muted-foreground font-medium">قوة الدعاء الآن</p>
                    <p className={`text-xl font-bold ${powerInfo.color}`}>{powerInfo.label}</p>
                    <p className="text-4xl font-black text-yellow-500 leading-none mt-0.5">{score}%</p>
                  </div>
                </div>
              </div>

              <div className="px-5 pb-5 space-y-4">

                {/* Active windows */}
                {activeWindows.length > 0 && (
                  <div>
                    <p className="text-[11px] text-muted-foreground font-semibold mb-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block animate-pulse" />
                      نوافذ الإجابة المفتوحة الآن
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {activeWindows.map((w) => (
                        <span
                          key={w.id}
                          className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border border-yellow-400/20"
                        >
                          {w.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hadith */}
                {topHadith && (
                  <div className="rounded-2xl bg-primary/5 border border-primary/10 p-3.5">
                    <p className="text-[11px] text-muted-foreground font-semibold mb-1.5 flex items-center gap-1.5">
                      <BookOpen size={11} />
                      الفضل والدليل
                    </p>
                    <p className="text-xs leading-relaxed text-foreground/80 italic font-arabic">{topHadith}</p>
                  </div>
                )}

                {/* Best dua now */}
                <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 to-yellow-500/5 border border-amber-400/20 p-3.5">
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold mb-1.5 flex items-center gap-1.5">
                    <Star size={11} />
                    أفضل دعاء قُرب {prayer.arabicName}
                  </p>
                  <p className="text-xs leading-relaxed text-foreground/90 font-arabic">{bestDua}</p>
                </div>

                {/* Etiquette */}
                <div>
                  <p className="text-[11px] text-muted-foreground font-semibold mb-2">آداب الدعاء</p>
                  <div className="space-y-1.5">
                    {DUA_ETIQUETTE.map((e, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${e.color} shrink-0`} />
                        <p className="text-[11px] text-muted-foreground">{e.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ameen button */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAmeen}
                  disabled={ameenPressed}
                  className={`w-full py-3.5 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2 ${
                    ameenPressed
                      ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-400/30 cursor-default"
                      : "bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-lg shadow-amber-500/30 hover:shadow-amber-500/40 active:shadow-none"
                  }`}
                >
                  <Hand size={18} className={ameenPressed ? "text-emerald-500" : "text-white"} />
                  {ameenPressed ? `آمين ✓ — دعيت ${ameenCount} ${ameenCount === 1 ? "مرة" : "مرة"} في لحظة قمة الإجابة` : "آمين — سجّل دعائي"}
                </motion.button>

                {ameenCount > 0 && !ameenPressed && (
                  <p className="text-center text-[10px] text-muted-foreground">
                    دعوت في لحظة قمة الإجابة {ameenCount} {ameenCount === 1 ? "مرة" : "مرة"} — ستجدها في صفحة تقدمك
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
