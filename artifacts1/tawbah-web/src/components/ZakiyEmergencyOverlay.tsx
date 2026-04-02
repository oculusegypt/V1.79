import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";

interface ZakiyEmergencyOverlayProps {
  visible: boolean;
  message: string;
  onDismiss: () => void;
}

export function ZakiyEmergencyOverlay({
  visible,
  message,
  onDismiss,
}: ZakiyEmergencyOverlayProps) {
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!visible) return;
    try {
      if (navigator.vibrate) {
        navigator.vibrate([300, 100, 300]);
      }
    } catch {}
  }, [visible]);

  const goSOS = () => {
    onDismiss();
    navigate("/sos");
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-red-950/95 backdrop-blur-sm px-6"
          dir="rtl"
        >
          <motion.div
            initial={{ scale: 0.8, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-sm flex flex-col items-center gap-6 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-400 flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-red-300" />
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-bold text-red-100">
                زكي يطلب انتباهك
              </h2>
              <p className="text-red-200 leading-relaxed text-base">{message}</p>
            </div>

            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={goSOS}
                className="w-full py-4 rounded-2xl bg-red-500 text-white font-bold text-lg active:scale-95 transition-transform"
              >
                افتح طوارئ التوبة الآن
              </button>
              <button
                onClick={onDismiss}
                className="w-full py-3 rounded-2xl border border-red-400/40 text-red-200 text-sm active:scale-95 transition-transform"
              >
                أنا بخير الآن
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
