import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export function SuggestionCards({ suggestions, loading, onSelect }: {
  suggestions?: string[];
  loading?: boolean;
  onSelect: (q: string) => void;
}) {
  if (!loading && (!suggestions || suggestions.length === 0)) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-2 pr-9"
    >
      {loading ? (
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
          <Loader2 size={11} className="animate-spin" />
          <span>يفكر في أسئلة...</span>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {suggestions!.map((q, i) => {
            const isContinueBtn = /^(continue|تابع|كمّل|كمل|استمر)/i.test(q.trim());
            return (
              <motion.button
                key={i}
                initial={{ opacity: 0, scale: 0.92, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => onSelect(q)}
                className="text-right text-[11.5px] px-3.5 py-2 rounded-full transition-all active:scale-95 leading-snug font-semibold"
                style={isContinueBtn
                  ? { background: "linear-gradient(135deg,#059669,#0d9488)", color: "#fff", boxShadow: "0 2px 8px rgba(5,150,105,0.3)" }
                  : { background: "#fff", color: "#374151", border: "1.5px solid rgba(5,150,105,0.2)", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }
                }
              >
                {isContinueBtn && <span className="ml-1">▶</span>}
                {q}
              </motion.button>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
