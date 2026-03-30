import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ZakiyPanel } from "@/components/ZakiyPanel";
import { useAppDhikrCount, useAppIncrementDhikr } from "@/hooks/use-app-data";
import type { IncrementDhikrRequestDhikrType } from "@workspace/api-client-react";
import { recordEvent } from "@/components/live-stats";
import { RotateCcw, CircleDot } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getSessionId } from "@/lib/session";

type DhikrTab = {
  id: IncrementDhikrRequestDhikrType;
  label: string;
  target: number;
  text: string;
  completionMsg: string;
  completionAyah: string;
};

const TABS: DhikrTab[] = [
  {
    id: "istighfar",
    label: "الاستغفار",
    target: 100,
    text: "أستغفر الله العظيم وأتوب إليه",
    completionMsg: "ما أجمل التوبة! أتممت ١٠٠ استغفار",
    completionAyah: "«التائبُ مِنَ الذنبِ كمَنْ لا ذنبَ له»",
  },
  {
    id: "tasbih",
    label: "التسبيح",
    target: 33,
    text: "سبحان الله وبحمده سبحان الله العظيم",
    completionMsg: "بارك الله فيك! أتممت ٣٣ تسبيحة",
    completionAyah: "«كلمتان خفيفتان على اللسان، ثقيلتان في الميزان»",
  },
  {
    id: "sayyid",
    label: "سيد الاستغفار",
    target: 1,
    text: "اللَّهُمَّ أَنْتَ رَبِّي لا إِلَهَ إِلا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ...",
    completionMsg: "أحسنت! قرأت سيد الاستغفار",
    completionAyah: "«من قالها موقناً بها حين يمسي أو يصبح فمات من يومه دخل الجنة»",
  },
];

function CompletionOverlay({ tab, onDismiss }: { tab: DhikrTab; onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-6"
      onClick={onDismiss}
    >
      <motion.div
        initial={{ scale: 0.7, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 20 }}
        transition={{ type: "spring", bounce: 0.45 }}
        className="bg-card rounded-3xl p-8 text-center shadow-2xl border border-primary/20 max-w-xs w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.3, 1] }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-6xl mb-5"
        >
          🌿
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-bold text-foreground mb-2">{tab.completionMsg}</h2>
          <p className="text-xs text-muted-foreground leading-relaxed italic mb-6">
            {tab.completionAyah}
          </p>
        </motion.div>

        {/* Pulse ring */}
        <motion.div
          className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center mx-auto mb-6"
          animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <span className="text-primary font-bold text-lg">{tab.target}</span>
        </motion.div>

        <button
          onClick={onDismiss}
          className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm active:scale-95 transition-all"
        >
          حفظ الله قلبك ✦ استمر
        </button>
      </motion.div>
    </motion.div>
  );
}

export default function Dhikr() {
  const [activeTab, setActiveTab] = useState<IncrementDhikrRequestDhikrType>("istighfar");
  const { data: counts } = useAppDhikrCount();
  const increment = useAppIncrementDhikr();
  const queryClient = useQueryClient();
  const [clickEffect, setClickEffect] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);
  const [celebratedAt, setCelebratedAt] = useState<Record<string, number>>({});

  const reset = useMutation({
    mutationFn: async () => {
      const BASE = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
      await fetch(`${BASE}/api/dhikr/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: getSessionId(), dhikrType: activeTab }),
      });
    },
    onSuccess: () => {
      setCelebratedAt(prev => ({ ...prev, [activeTab]: -1 }));
      queryClient.invalidateQueries({ queryKey: ["/api/dhikr/count"] });
    },
  });

  const currentTab = TABS.find(t => t.id === activeTab)!;
  const currentCount = counts?.[activeTab] || 0;
  const progress = Math.min(100, (currentCount / currentTab.target) * 100);
  const isComplete = currentCount >= currentTab.target;

  useEffect(() => {
    if (
      isComplete &&
      (celebratedAt[activeTab] ?? -1) < currentTab.target &&
      currentCount >= currentTab.target
    ) {
      setShowCompletion(true);
      setCelebratedAt(prev => ({ ...prev, [activeTab]: currentCount }));
    }
  }, [isComplete, activeTab, currentCount, currentTab.target, celebratedAt]);

  const handleTap = () => {
    if (isComplete) return;
    setClickEffect(true);
    setTimeout(() => setClickEffect(false), 150);
    increment.mutate({ dhikrType: activeTab, amount: 1 });
    if (navigator.vibrate) navigator.vibrate(50);
    setTapCount((prev) => {
      const next = prev + 1;
      if (next % 10 === 0) recordEvent("dhikr");
      return next;
    });
  };

  return (
    <>
      <AnimatePresence>
        {showCompletion && (
          <CompletionOverlay
            tab={currentTab}
            onDismiss={() => setShowCompletion(false)}
          />
        )}
      </AnimatePresence>

      <PageHeader
        title="مسبحة الذكر"
        subtitle="استغفار وتسبيح وذكر الله"
        icon={<CircleDot size={16} />}
        right={
          <button
            onClick={() => reset.mutate()}
            disabled={reset.isPending || (counts?.[activeTab] ?? 0) === 0}
            className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-muted/70 active:scale-95 transition-all text-muted-foreground hover:text-destructive disabled:opacity-30"
            aria-label="تصفير العداد"
            title="تصفير العداد"
          >
            <RotateCcw size={18} />
          </button>
        }
      />
      <div className="flex-1 flex flex-col bg-background p-6">

        <div className="flex bg-muted/50 p-1.5 rounded-xl mb-8">
          {TABS.map(tab => {
            const isActive = tab.id === activeTab;
            const tabCount = counts?.[tab.id] || 0;
            const tabDone = tabCount >= tab.target;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all relative ${
                  isActive ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
                {tabDone && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-primary rounded-full text-[8px] text-primary-foreground flex items-center justify-center">✓</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex-1 flex flex-col items-center justify-center relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="text-center mb-10 w-full"
            >
              <p className="text-xl font-display text-foreground leading-loose px-4">
                {currentTab.text}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="relative mb-8">
            {/* Progress Ring */}
            <svg className="w-64 h-64 transform -rotate-90">
              <circle
                cx="128" cy="128" r="120"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-muted"
              />
              <motion.circle
                cx="128" cy="128" r="120"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={120 * 2 * Math.PI}
                initial={{ strokeDashoffset: 120 * 2 * Math.PI }}
                animate={{
                  strokeDashoffset: (120 * 2 * Math.PI) - ((progress / 100) * (120 * 2 * Math.PI)),
                }}
                className={`transition-all duration-500 ease-out ${isComplete ? "text-emerald-500" : "text-primary"}`}
                strokeLinecap="round"
              />
            </svg>

            {/* Tap Button */}
            <button
              onClick={handleTap}
              disabled={isComplete}
              className={`absolute inset-4 rounded-full shadow-xl flex flex-col items-center justify-center border-4 border-background transition-colors tap-highlight-transparent ${
                isComplete
                  ? "bg-emerald-50 dark:bg-emerald-950/30 cursor-default"
                  : "bg-card active:bg-muted/30"
              }`}
            >
              <motion.div
                animate={clickEffect ? { scale: 0.9 } : { scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="flex flex-col items-center"
              >
                {isComplete ? (
                  <>
                    <span className="text-4xl mb-1">🌿</span>
                    <span className="text-xs text-emerald-600 font-bold">تمّ بحمد الله</span>
                  </>
                ) : (
                  <>
                    <span className="text-5xl font-display font-bold text-primary mb-1">
                      {currentCount}
                    </span>
                    <span className="text-xs text-muted-foreground font-bold">
                      من {currentTab.target}
                    </span>
                  </>
                )}
              </motion.div>
            </button>
          </div>

          {isComplete && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setShowCompletion(true)}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw size={13} />
              عرض التهنئة مجدداً
            </motion.button>
          )}
        </div>
      </div>
      <ZakiyPanel pageName="الذكر" />
    </>
  );
}
