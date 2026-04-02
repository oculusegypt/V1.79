import { motion } from "framer-motion";
import { BookMarked, ExternalLink } from "lucide-react";
import type { MessageSegment } from "../types";

export function SurahLinkCard({ seg }: { seg: MessageSegment }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="my-2.5 rounded-2xl overflow-hidden"
      style={{ boxShadow: "0 2px 14px rgba(13,148,136,0.12), 0 1px 3px rgba(0,0,0,0.06)", border: "1px solid rgba(13,148,136,0.22)" }}
    >
      <div
        className="px-4 py-2.5 flex items-center gap-2"
        style={{ background: "linear-gradient(135deg,#0f766e,#0891b2)" }}
      >
        <div className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
          <BookMarked size={12} className="text-white" />
        </div>
        <span className="text-[12px] font-bold text-white tracking-wide">السورة كاملة</span>
      </div>
      <div className="bg-white px-4 py-3.5 flex items-center justify-between gap-3">
        <div>
          <p className="text-[13px] font-bold text-stone-800">سورة {seg.text}</p>
          <p className="text-[11px] text-stone-500 mt-0.5">تابع من الآية {seg.ayah}</p>
        </div>
        <a
          href={seg.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-white text-[12px] px-4 py-2 rounded-xl font-bold shrink-0 transition-all active:scale-95"
          style={{ background: "linear-gradient(135deg,#0f766e,#0891b2)", boxShadow: "0 2px 8px rgba(13,148,136,0.3)" }}
        >
          <ExternalLink size={12} />
          افتح
        </a>
      </div>
    </motion.div>
  );
}
