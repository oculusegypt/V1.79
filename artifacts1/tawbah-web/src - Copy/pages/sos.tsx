import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, ShieldAlert, Droplets, Wind, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Phase = "alert" | "breathe" | "dua";

const EMERGENCY_DUAS = [
  { arabic: "أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ", transliteration: "أعوذ بالله من الشيطان الرجيم" },
  { arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ شَرِّ نَفْسِي وَمِنْ شَرِّ الشَّيْطَانِ وَشَرَكِهِ", transliteration: "اللهم إني أعوذ بك من شر نفسي" },
  { arabic: "رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ إِنَّكَ أَنتَ التَّوَّابُ الرَّحِيمُ", transliteration: "رب اغفر لي وتب علي" },
  { arabic: "حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ", transliteration: "حسبنا الله ونعم الوكيل" },
  { arabic: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ الْعَلِيِّ الْعَظِيمِ", transliteration: "لا حول ولا قوة إلا بالله العلي العظيم" },
];

function trackSosUsage() {
  try {
    const prev = parseInt(localStorage.getItem("sos_count") || "0", 10);
    localStorage.setItem("sos_count", String(prev + 1));
    localStorage.setItem("sos_last", new Date().toISOString());
  } catch {}
}

function markSosReturn() {
  try {
    localStorage.setItem("sos_return", "1");
  } catch {}
}

export default function Sos() {
  const [phase, setPhase] = useState<Phase>("alert");
  const [breathStep, setBreathStep] = useState<"inhale" | "hold" | "exhale">("inhale");
  const [breathCount, setBreathCount] = useState(0);
  const [countdown, setCountdown] = useState(4);
  const [duaIndex, setDuaIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [, navigate] = useLocation();

  useEffect(() => {
    trackSosUsage();
  }, []);

  const clearTimer = () => { if (timerRef.current) clearTimeout(timerRef.current); };

  useEffect(() => {
    if (phase !== "breathe") return;
    const steps: { step: "inhale" | "hold" | "exhale"; duration: number; label: string }[] = [
      { step: "inhale", duration: 4, label: "استنشق" },
      { step: "hold", duration: 4, label: "أمسك" },
      { step: "exhale", duration: 4, label: "أخرج" },
    ];

    let currentStep = 0;
    let currentCount = 4;
    let cycle = 0;

    const runStep = () => {
      setBreathStep(steps[currentStep].step);
      setCountdown(currentCount);

      if (currentCount > 1) {
        currentCount--;
        timerRef.current = setTimeout(runStep, 1000);
      } else {
        currentStep = (currentStep + 1) % steps.length;
        if (currentStep === 0) {
          cycle++;
          if (cycle >= 3) {
            setPhase("dua");
            return;
          }
        }
        currentCount = steps[currentStep].duration;
        timerRef.current = setTimeout(runStep, 1000);
      }
    };

    timerRef.current = setTimeout(runStep, 300);
    return clearTimer;
  }, [phase]);

  const handleReturn = () => {
    markSosReturn();
    navigate("/");
  };

  const breathLabels = { inhale: "استنشق ببطء...", hold: "أمسك نفسك...", exhale: "أخرج ببطء..." };

  return (
    <div className="fixed inset-0 z-50 bg-destructive/95 backdrop-blur-md flex flex-col p-6 text-destructive-foreground overflow-y-auto max-w-md mx-auto">
      <AnimatePresence mode="wait">

        {phase === "alert" && (
          <motion.div
            key="alert"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse"
            >
              <ShieldAlert size={48} className="text-white" />
            </motion.div>

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="text-center mb-8">
              <h1 className="text-5xl font-display font-bold mb-4 drop-shadow-md">توقف!</h1>
              <p className="text-xl font-medium text-white/90 leading-relaxed drop-shadow">
                الله يراك الآن، وهو أرحم بك من نفسك.
              </p>
            </motion.div>

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="bg-white/10 p-5 rounded-2xl border border-white/20 mb-8 backdrop-blur-sm text-center">
              <p className="text-base font-display leading-loose font-bold mb-3">
                "إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا ۚ إِنَّهُ هُوَ الْغَفُورُ الرَّحِيمُ"
              </p>
              <p className="text-white/70 text-xs">سورة الزمر - 53</p>
            </motion.div>

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="space-y-3">
              <button
                onClick={() => setPhase("breathe")}
                className="w-full py-4 bg-white text-destructive font-bold text-base rounded-xl shadow-lg hover:bg-white/90 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <Wind size={22} />
                <span>تمرين التنفس (3 دقائق)</span>
              </button>

              <button className="w-full py-3.5 bg-white/20 border border-white/30 text-white font-bold text-base rounded-xl hover:bg-white/30 active:scale-95 transition-all flex items-center justify-center gap-3">
                <Droplets size={22} />
                <span>قم الآن وتوضأ</span>
              </button>

              <button
                onClick={() => setPhase("dua")}
                className="w-full py-3.5 bg-transparent border border-white/20 text-white/80 font-bold text-sm rounded-xl hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <BookOpen size={18} />
                <span>أدعية الاستعاذة</span>
              </button>

              <button onClick={handleReturn} className="w-full py-3 bg-transparent text-white/60 font-medium text-sm rounded-xl hover:text-white transition-all flex items-center justify-center gap-2">
                <span>العودة للرئيسية</span>
                <ArrowLeft size={16} />
              </button>
            </motion.div>
          </motion.div>
        )}

        {phase === "breathe" && (
          <motion.div
            key="breathe"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full text-center"
          >
            <h2 className="text-2xl font-bold mb-2">تنفس معي</h2>
            <p className="text-white/70 text-sm mb-10">3 دورات ستُهدئ نفسك بإذن الله</p>

            <div className="relative flex items-center justify-center mb-10">
              <motion.div
                animate={{
                  scale: breathStep === "inhale" ? 1.4 : breathStep === "hold" ? 1.4 : 1,
                }}
                transition={{ duration: breathStep === "inhale" ? 4 : breathStep === "exhale" ? 4 : 0.2 }}
                className="w-40 h-40 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center"
              >
                <div className="text-center">
                  <div className="text-4xl font-bold">{countdown}</div>
                  <div className="text-sm text-white/80 mt-1">{breathLabels[breathStep]}</div>
                </div>
              </motion.div>
            </div>

            <div className="flex justify-center gap-4 mb-10">
              {["inhale", "hold", "exhale"].map((s) => (
                <div key={s} className={`w-3 h-3 rounded-full border-2 transition-all ${breathStep === s ? "bg-white border-white scale-125" : "bg-transparent border-white/40"}`} />
              ))}
            </div>

            <button onClick={() => { clearTimer(); setPhase("dua"); }} className="py-3 text-white/60 text-sm hover:text-white transition-colors">
              تخطي إلى الأدعية
            </button>
          </motion.div>
        )}

        {phase === "dua" && (
          <motion.div
            key="dua"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full"
          >
            <div className="text-center mb-8">
              <div className="text-4xl mb-3">🌿</div>
              <h2 className="text-2xl font-bold mb-2">أدعية الاستعاذة</h2>
              <p className="text-white/70 text-sm">رددها بقلبك وأنت مستحضر لمعناها</p>
            </div>

            <div className="bg-white/10 rounded-2xl border border-white/20 p-5 mb-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={duaIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-center"
                >
                  <p className="font-display text-xl leading-loose mb-4">{EMERGENCY_DUAS[duaIndex].arabic}</p>
                  <p className="text-white/60 text-sm">{EMERGENCY_DUAS[duaIndex].transliteration}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex gap-2 mb-6">
              {EMERGENCY_DUAS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setDuaIndex(i)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${i === duaIndex ? "bg-white text-destructive" : "bg-white/20 text-white"}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => setPhase("breathe")}
              className="w-full py-3.5 bg-white/20 border border-white/30 text-white font-bold rounded-xl mb-3 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Wind size={18} />
              إعادة تمرين التنفس
            </button>

            <button
              onClick={handleReturn}
              className="w-full py-3.5 bg-white text-destructive font-bold rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>العودة والمضي في رحلتي</span>
              <ArrowLeft size={18} />
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
