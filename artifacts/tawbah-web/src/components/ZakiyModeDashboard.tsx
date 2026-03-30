import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useZakiyMode } from "@/context/ZakiyModeContext";
import { useUserProgress } from "@/hooks/use-progress";
import { useLocation } from "wouter";
import { Sparkles, Loader2, ArrowLeft, Flame, Shield, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { ZakiyEmergencyOverlay } from "./ZakiyEmergencyOverlay";

export function ZakiyModeDashboard() {
  const { decision, fetchDecision, isLoading, error, trustLevel } = useZakiyMode();
  const { progress } = useUserProgress();
  const [, navigate] = useLocation();
  const [started, setStarted] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (decision?.urgency === "emergency" && trustLevel >= 3) {
      setShowEmergency(true);
    }
  }, [decision, trustLevel]);

  const handleStart = async () => {
    setStarted(true);
    await fetchDecision();
  };

  const handleAction = () => {
    if (decision?.action?.target) {
      navigate(decision.action.target);
    }
  };

  const urgencyConfig = {
    low: { color: "from-emerald-900/60 to-emerald-950/80", border: "border-emerald-500/20", icon: Shield, iconColor: "text-emerald-400", label: "مستقر" },
    medium: { color: "from-amber-900/60 to-amber-950/80", border: "border-amber-500/30", icon: Flame, iconColor: "text-amber-400", label: "تحتاج متابعة" },
    high: { color: "from-orange-900/60 to-orange-950/80", border: "border-orange-500/40", icon: Flame, iconColor: "text-orange-400", label: "يحتاج اهتمام" },
    emergency: { color: "from-red-900/70 to-red-950/90", border: "border-red-500/50", icon: AlertTriangle, iconColor: "text-red-400", label: "طوارئ" },
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

          {/* Main card */}
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
                className="w-full py-4 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-lg transition-colors active:scale-95"
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
          ) : error ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-3xl bg-red-950/40 border border-red-500/20 p-8 text-center space-y-4"
            >
              <p className="text-red-300 text-sm">{error}</p>
              <button
                onClick={handleStart}
                className="px-6 py-2 rounded-xl bg-white/10 text-white text-sm"
              >
                حاول مرة أخرى
              </button>
            </motion.div>
          ) : decision ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`rounded-3xl bg-gradient-to-b ${cfg.color} border ${cfg.border} p-6 space-y-5`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <UrgencyIcon className={`w-5 h-5 ${cfg.iconColor}`} />
                </div>
                <div>
                  <p className="text-xs text-white/40">توجيه زكي</p>
                  <p className={`text-xs font-semibold ${cfg.iconColor}`}>{cfg.label}</p>
                </div>
              </div>

              <p className="text-white leading-relaxed text-base">{decision.message}</p>

              <button
                onClick={handleAction}
                className="w-full py-4 rounded-2xl bg-white/15 hover:bg-white/20 text-white font-semibold flex items-center justify-between px-5 transition-colors active:scale-95"
              >
                <span>{decision.actionLabel}</span>
                <ArrowLeft className="w-5 h-5" />
              </button>

              {/* Details toggle */}
              {decision.riskTriggers?.length > 0 && (
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="w-full flex items-center justify-center gap-1 text-xs text-white/30 hover:text-white/50 transition-colors"
                >
                  <span>{showDetails ? "إخفاء التفاصيل" : "لماذا هذا الاقتراح؟"}</span>
                  {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              )}

              {showDetails && decision.riskTriggers?.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
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

              <button
                onClick={handleStart}
                className="w-full text-center text-xs text-white/25 hover:text-white/40 transition-colors"
              >
                اسأل زكي من جديد
              </button>
            </motion.div>
          ) : null}
        </div>
      </div>
    </>
  );
}
