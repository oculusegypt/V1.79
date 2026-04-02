import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, BookOpen, ChevronDown, Scale, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { getSelectedSins, CATEGORY_META } from "@/lib/sins-data";

export function SinPanel({ journeyComplete = false }: { journeyComplete?: boolean }) {
  const [sins, setSins] = useState(() => getSelectedSins());
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setSins(getSelectedSins());
    setDismissed(localStorage.getItem("journey30_sin_panel_dismissed") === "1");
  }, []);

  if (sins.length === 0) return null;

  const hasKaffarah = sins.some((s) => s.kaffarahId);
  const allConditions = Array.from(new Set(sins.flatMap((s) => s.conditions)));

  if (journeyComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl px-4 py-5 text-center border border-emerald-400/30"
        style={{ background: "linear-gradient(135deg, rgba(5,150,105,0.10), rgba(4,120,87,0.05))" }}
      >
        <div className="text-3xl mb-2">🕊️</div>
        <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 leading-snug">
          تحررت من أثقال ذنوبك
        </p>
        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
          أتممت رحلتك — سجّل الله لك هذا الجهد وقبل منك التوبة إن شاء الله
        </p>
      </motion.div>
    );
  }

  if (dismissed) {
    return (
      <div className="flex items-center gap-2 flex-wrap bg-muted/30 rounded-xl px-3 py-2 border border-border/50">
        <Sparkles size={12} className="text-primary shrink-0" />
        <span className="text-[11px] text-muted-foreground">ذنوبك المختارة:</span>
        {sins.slice(0, 2).map((sin) => (
          <span key={sin.id} className="text-[10px] font-bold">
            {sin.icon} {sin.name}
          </span>
        ))}
        {sins.length > 2 && (
          <span className="text-[10px] text-muted-foreground">+{sins.length - 2}</span>
        )}
        <button
          onClick={() => {
            setDismissed(false);
            localStorage.removeItem("journey30_sin_panel_dismissed");
          }}
          className="mr-auto text-[10px] text-primary underline underline-offset-2"
        >
          عرض خطتي الشخصية
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-primary/25 rounded-2xl overflow-hidden shadow-sm"
    >
      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/15">
        <Sparkles size={15} className="text-primary shrink-0" />
        <div className="flex-1">
          <p className="font-bold text-sm">رحلتك الشخصية المخصصة</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">مدمجة مع ذنوبك المختارة</p>
        </div>
        <Link href="/sins" className="text-[10px] text-primary/70 hover:text-primary transition-colors">
          تعديل
        </Link>
        <button
          onClick={() => {
            setDismissed(true);
            localStorage.setItem("journey30_sin_panel_dismissed", "1");
          }}
          className="p-1 text-muted-foreground/50 hover:text-muted-foreground"
        >
          <X size={14} />
        </button>
      </div>

      <div className="px-4 pt-3 pb-2">
        <div className="flex flex-wrap gap-1.5 mb-3">
          {sins.map((sin) => {
            const meta = CATEGORY_META[sin.category];
            return (
              <span
                key={sin.id}
                className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${meta.bg} ${meta.color} ${meta.borderColor}`}
              >
                {sin.icon} {sin.name}
              </span>
            );
          })}
        </div>

        {hasKaffarah && (
          <Link
            href="/kaffarah"
            className="flex items-center gap-2 bg-red-500/8 border border-red-400/25 rounded-xl px-3 py-2.5 mb-3 hover:bg-red-500/12 transition-colors"
          >
            <Scale size={14} className="text-red-500 shrink-0" />
            <p className="text-xs font-bold text-red-600 dark:text-red-400 flex-1 leading-snug">
              ذنوبك تستلزم كفارة شرعية — اضغط لمتابعة خطواتها
            </p>
            <ChevronRight size={13} className="text-red-400 shrink-0" />
          </Link>
        )}

        <button
          onClick={() => setExpanded((e) => !e)}
          className="w-full flex items-center gap-2 py-2 text-primary text-xs font-bold"
        >
          <BookOpen size={13} />
          {expanded
            ? "إخفاء شروط التوبة"
            : `شروط توبتك الخاصة (${allConditions.length} خطوة)`}
          <ChevronDown
            size={13}
            className={`mr-auto transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          />
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-1.5 pb-3">
                {allConditions.map((cond, i) => (
                  <div key={i} className="flex items-start gap-2 bg-muted/40 rounded-lg px-3 py-2">
                    <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-[11px] leading-relaxed flex-1">{cond}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
