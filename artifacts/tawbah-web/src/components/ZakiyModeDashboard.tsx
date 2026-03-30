import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useZakiyMode } from "@/context/ZakiyModeContext";
import { useUserProgress } from "@/hooks/use-progress";
import { setZakiyState } from "@/core/theme";
import {
  Sparkles, Loader2, ArrowLeft, Flame, Shield,
  AlertTriangle, ChevronDown, ChevronUp, X,
} from "lucide-react";
import { ZakiyEmergencyOverlay } from "./ZakiyEmergencyOverlay";

export function ZakiyModeDashboard() {
  const {
    decision, fetchDecision, navigateToDecision,
    isLoading, error, clearError, trustLevel,
  } = useZakiyMode();
  const { progress } = useUserProgress();
  const [started, setStarted] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Emergency overlay: only trustLevel >= 3 allows auto-trigger
  useEffect(() => {
    if (decision?.urgency === "emergency" && trustLevel >= 3) {
      setShowEmergency(true);
    }
  }, [decision, trustLevel]);

  // Clear zakiy visual state when this dashboard unmounts (user navigates away)
  useEffect(() => {
    return () => {
      setZakiyState(null);
    };
  }, []);

  const handleStart = async () => {
    setStarted(true);
    clearError();
    await fetchDecision();
  };

  // Urgency config — intentional dark-themed colours for Zakiy AI cards
  const urgencyConfig = {
    low:       { color: "from-emerald-900/60 to-emerald-950/80", border: "border-emerald-500/20", icon: Shield,        iconColor: "text-emerald-400", label: "مستقر" },
    medium:    { color: "from-amber-900/60 to-amber-950/80",     border: "border-amber-500/30",   icon: Flame,         iconColor: "text-amber-400",   label: "تحتاج متابعة" },
    high:      { color: "from-orange-900/60 to-orange-950/80",   border: "border-orange-500/40",  icon: Flame,         iconColor: "text-orange-400",  label: "يحتاج اهتمام" },
    emergency: { color: "from-red-900/70 to-red-950/90",         border: "border-red-500/50",     icon: AlertTriangle, iconColor: "text-red-400",     label: "طوارئ" },
  };

  const cfg = urgencyConfig[decision?.urgency ?? "low"];
  const UrgencyIcon = cfg.icon;

  return (
    <>
      <ZakiyEmergencyOverlay
        visible={showEmergency}
        message={decision?.message ?? ""}
        onDismiss={() => setShowEmergency(false)}
      />

      <div className="min-h-screen flex flex-col items-center justify-center px-5 pb-24" dir="rtl">
        <div className="w-full max-w-sm space-y-5">

          {/* Error toast */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-red-950/60 border border-red-500/30"
              >
                <p className="text-sm text-red-300">{error}</p>
                <button onClick={clearError} className="text-white/40 hover:text-white/70 shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* User state summary */}
          {progress && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-3"
            >
              <p className="text-xs text-white/40 text-center">حالتك الآن</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-2xl font-bold text-white">{progress.streakDays}</p>
                  <p className="text-xs text-white/50">يوم متواصل</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{progress.currentPhase}</p>
                  <p className="text-xs text-white/50">المرحلة</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {progress.covenantSigned ? "✓" : "—"}
                  </p>
                  <p className="text-xs text-white/50">العهد</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Trust level indicator */}
          {trustLevel === 0 && (
            <p className="text-center text-xs text-white/30 pb-1">
              مستوى الثقة: 0 — الاقتراحات تلقائية متوقفة
            </p>
          )}

          {/* Main decision card */}
          {!started ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-3xl bg-gradient-to-b from-indigo-900/60 to-indigo-950/80 border border-indigo-500/20 p-8 text-center space-y-6"
            >
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8 text-indigo-300" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-white">وضع زكي</h2>
                <p className="text-sm text-indigo-200/70 leading-relaxed">
                  زكي سيحلل وضعك ويقترح خطوتك التالية
                </p>
              </div>
              <button
                onClick={handleStart}
                disabled={isLoading}
                className="w-full py-4 rounded-2xl bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white font-bold text-lg transition-colors active:scale-95"
              >
                ابدأ الآن
              </button>
            </motion.div>

          ) : isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-3xl bg-white/5 border border-white/10 p-10 flex flex-col items-center gap-4"
            >
              <Loader2 className="w-10 h-10 animate-spin text-white/40" />
              <p className="text-white/50 text-sm">زكي يفكر…</p>
            </motion.div>

          ) : decision ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`rounded-3xl bg-gradient-to-b ${cfg.color} border ${cfg.border} p-6 space-y-5`}
            >
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <UrgencyIcon className={`w-5 h-5 ${cfg.iconColor}`} />
                </div>
                <div>
                  <p className="text-xs text-white/40">توجيه زكي</p>
                  <p className={`text-xs font-semibold ${cfg.iconColor}`}>{cfg.label}</p>
                </div>
              </div>

              {/* Message */}
              <p className="text-white leading-relaxed text-base">{decision.message}</p>

              {/* CTA */}
              <button
                onClick={navigateToDecision}
                className="w-full py-4 rounded-2xl bg-white/15 hover:bg-white/20 text-white font-semibold flex items-center justify-between px-5 transition-colors active:scale-95"
              >
                <span>{decision.actionLabel}</span>
                <ArrowLeft className="w-5 h-5" />
              </button>

              {/* Why this suggestion */}
              {decision.riskTriggers?.length > 0 && (
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="w-full flex items-center justify-center gap-1 text-xs text-white/30 hover:text-white/50 transition-colors"
                >
                  <span>{showDetails ? "إخفاء التفاصيل" : "لماذا هذا الاقتراح؟"}</span>
                  {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              )}

              <AnimatePresence>
                {showDetails && decision.riskTriggers?.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-1"
                  >
                    {decision.riskTriggers.map((t, i) => (
                      <p key={i} className="text-xs text-white/40 flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-white/30 inline-block" />
                        {t}
                      </p>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Re-fetch */}
              <button
                onClick={handleStart}
                disabled={isLoading}
                className="w-full text-center text-xs text-white/25 hover:text-white/40 disabled:opacity-30 transition-colors"
              >
                {isLoading ? "جارٍ التحديث…" : "اسأل زكي من جديد"}
              </button>
            </motion.div>

          ) : null}
        </div>
      </div>
    </>
  );
}
