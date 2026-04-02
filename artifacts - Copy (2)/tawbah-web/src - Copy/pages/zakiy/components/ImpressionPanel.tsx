import { motion } from "framer-motion";
import { Heart, X } from "lucide-react";

export function ImpressionPanel({ impression, onClose }: { impression: string; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      transition={{ duration: 0.25 }}
      className="mt-3 rounded-2xl overflow-hidden"
      style={{ boxShadow: "0 4px 20px rgba(225,29,72,0.15), 0 1px 3px rgba(0,0,0,0.06)", border: "1px solid rgba(251,113,133,0.3)" }}
    >
      <div
        className="px-4 py-2.5 flex items-center justify-between"
        style={{ background: "linear-gradient(135deg,#be123c,#e11d48)" }}
      >
        <div className="flex items-center gap-2">
          <Heart size={14} className="text-white fill-white/70" />
          <span className="text-[12px] font-bold text-white tracking-wide">انطباعي عنك</span>
        </div>
        <button onClick={onClose} className="text-white/70 hover:text-white transition-colors w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10">
          <X size={14} />
        </button>
      </div>
      <div className="bg-white px-4 py-4">
        <p className="text-[13px] leading-relaxed text-stone-700 text-right whitespace-pre-wrap">
          {impression}
        </p>
      </div>
    </motion.div>
  );
}
