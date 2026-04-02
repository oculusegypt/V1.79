import { motion } from "framer-motion";
import { useEffect } from "react";

export function SosReturnToast({ onDismiss }: { onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, [onDismiss]);
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-4 inset-x-4 z-50 max-w-md mx-auto"
    >
      <div
        className="bg-emerald-600 text-white rounded-2xl px-5 py-3.5 shadow-xl flex items-center gap-3"
        onClick={onDismiss}
      >
        <span className="text-xl shrink-0">🌿</span>
        <div className="flex-1">
          <p className="font-bold text-sm">أحسنت — الله يثبّتك</p>
          <p className="text-emerald-100 text-xs">
            قاومت ونجحت. استمر في رحلتك.
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="text-white/70 hover:text-white text-lg leading-none"
        >
          ×
        </button>
      </div>
    </motion.div>
  );
}
