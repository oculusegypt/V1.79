import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, X } from "lucide-react";
import { useState } from "react";
import { getEidStatus, type EidPeriod } from "@/lib/eid-utils";

export function EidEntryCard() {
  const eid = getEidStatus();
  const dismissKey = `eid_banner_dismissed_${eid.period}`;
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(dismissKey) === "1";
    } catch {
      return false;
    }
  });
  if (eid.period !== "eid_fitr" && eid.period !== "eid_adha") return null;
  if (dismissed) return null;
  const period = eid.period as EidPeriod;
  const isEidDay = period === "eid_fitr" || period === "eid_adha";
  const isAdha = eid.eidType === "adha";
  const isPreAdha = period === "pre_adha_dhul_hijja" || period === "arafah";
  const gradientClass = isAdha
    ? "from-emerald-600/15 to-teal-500/5 border-emerald-500/30"
    : "from-violet-600/15 to-purple-500/5 border-violet-400/30";
  const iconBg = isAdha ? "bg-emerald-500" : "bg-violet-600";
  const title = isEidDay
    ? isAdha
      ? "عيد الأضحى المبارك 🐑"
      : "عيد الفطر المبارك 🌙"
    : period === "arafah"
      ? "يوم عرفة اليوم 🤲"
      : isPreAdha
        ? `العشر من ذي الحجة — ${eid.daysUntilEid === 1 ? "العيد غداً" : `العيد بعد ${eid.daysUntilEid} أيام`}`
        : `العيد ${eid.daysUntilEid === 1 ? "غداً" : `بعد ${eid.daysUntilEid} أيام`} 🌙`;
  const subtitle = isEidDay
    ? "تقبّل الله منا ومنكم — اضغط لصفحة العيد الكاملة"
    : period === "arafah"
      ? "صُم واستغفر وادعُ — اكتشف صفحة العيد"
      : isPreAdha
        ? "أفضل أيام السنة — أكثر من الطاعة والتوبة"
        : "استعد وأخرج زكاة الفطر — اكتشف صفحة العيد";
  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDismissed(true);
    try {
      localStorage.setItem(dismissKey, "1");
    } catch {}
  };
  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          transition={{ duration: 0.35 }}
          className={`flex items-center gap-3 bg-gradient-to-l ${gradientClass} border rounded-2xl p-3.5 shadow-sm`}
        >
          <div
            className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shadow-md shrink-0`}
          >
            <span className="text-lg">
              {isAdha ? "🐑" : isPreAdha ? "✨" : "🌙"}
            </span>
          </div>
          <Link
            href="/eid"
            className="flex-1 min-w-0 active:opacity-70 transition-opacity"
          >
            <h3 className="font-bold text-sm leading-tight">{title}</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
              {subtitle}
            </p>
          </Link>
          <div className="flex items-center gap-1.5 shrink-0">
            <Link
              href="/eid"
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-background/60 hover:bg-background border border-border/40 text-foreground/70 hover:text-foreground transition-colors"
              aria-label="الذهاب لصفحة العيد"
            >
              <ArrowLeft size={15} />
            </Link>
            <button
              onClick={handleDismiss}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-background/60 hover:bg-background border border-border/40 text-foreground/70 hover:text-foreground transition-colors"
              aria-label="إغلاق"
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
