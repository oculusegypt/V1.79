import { motion } from "framer-motion";
import { STARTER_QUESTIONS, STARTER_ICONS } from "../constants";

export function StarterCards({ onSelect }: { onSelect: (q: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="px-1 py-3"
    >
      <div className="flex items-center gap-2 mb-3.5 px-1">
        <div className="h-px flex-1" style={{ background: "linear-gradient(90deg,transparent,rgba(5,150,105,0.25))" }} />
        <span className="text-[11px] font-bold text-stone-400 tracking-wider">ابدأ بسؤال</span>
        <div className="h-px flex-1" style={{ background: "linear-gradient(90deg,rgba(5,150,105,0.25),transparent)" }} />
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {STARTER_QUESTIONS.map((q, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.12 + i * 0.055 }}
            onClick={() => onSelect(q)}
            className="text-right transition-all active:scale-95 leading-snug overflow-hidden rounded-2xl"
            style={{
              background: "#fff",
              border: "1.5px solid rgba(5,150,105,0.12)",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <div
              className="h-[3px] w-full"
              style={{ background: `linear-gradient(90deg,${["#059669","#0d9488","#10b981","#065f46","#0891b2","#047857"][i % 6]},transparent)` }}
            />
            <div className="px-3.5 pt-2.5 pb-3">
              <span className="text-lg block mb-1">{STARTER_ICONS[i % STARTER_ICONS.length]}</span>
              <span className="text-[12px] font-semibold text-stone-700 leading-snug block">{q}</span>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
