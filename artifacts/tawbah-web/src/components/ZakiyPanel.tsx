import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useZakiyMode } from "@/context/ZakiyModeContext";
import { setZakiyState } from "@/core/theme";
import { Sparkles, ArrowLeft, Loader2 } from "lucide-react";

interface ZakiyPanelProps {
  pageName?: string;
}

export function ZakiyPanel({ pageName }: ZakiyPanelProps) {
  const { aiMode, trustLevel, decision, fetchDecision, navigateToDecision, isLoading } = useZakiyMode();

  // Clear zakiy state when panel unmounts (user navigates away)
  useEffect(() => {
    return () => {
      setZakiyState(null);
    };
  }, []);

  // Level 0 → no auto suggestions (only on explicit button click in dashboard)
  // Level 1+ → show ZakiyPanel
  if (!aiMode || trustLevel < 1) return null;

  const urgencyBg: Record<string, string> = {
    low:       "border-emerald-500/30 bg-emerald-950/40",
    medium:    "border-amber-500/30 bg-amber-950/40",
    high:      "border-orange-500/40 bg-orange-950/40",
    emergency: "border-red-500/40 bg-red-950/40",
  };

  const urgencyText: Record<string, string> = {
    low:       "text-emerald-300",
    medium:    "text-amber-300",
    high:      "text-orange-300",
    emergency: "text-red-300",
  };

  const bgClass  = urgencyBg[decision?.urgency ?? "low"];
  const textClass = urgencyText[decision?.urgency ?? "low"];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className={`mx-4 mb-6 rounded-2xl border p-4 ${bgClass}`}
        dir="rtl"
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4 text-white/70" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs text-white/50 mb-1">
              زكي {pageName ? `· ${pageName}` : ""}
            </p>

            {isLoading ? (
              <div className="flex items-center gap-2 py-1">
                <Loader2 className="w-4 h-4 animate-spin text-white/40" />
                <span className="text-sm text-white/40">يفكر زكي…</span>
              </div>
            ) : decision ? (
              <>
                <p className={`text-sm leading-relaxed ${textClass}`}>
                  {decision.message}
                </p>
                {decision.action.target && (
                  <button
                    onClick={navigateToDecision}
                    className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-white/70 hover:text-white transition-colors active:scale-95"
                  >
                    <span>{decision.actionLabel}</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={fetchDecision}
                className="text-sm text-white/40 hover:text-white/70 transition-colors"
              >
                اسأل زكي عن خطوتك التالية
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
