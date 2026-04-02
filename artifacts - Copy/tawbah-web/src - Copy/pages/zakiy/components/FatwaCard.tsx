import { useState } from "react";
import { Scale, ExternalLink } from "lucide-react";
import type { MessageSegment } from "../types";

export function FatwaCard({ seg }: { seg: MessageSegment }) {
  const [expanded, setExpanded] = useState(false);
  const preview = (seg.text?.length ?? 0) > 120 ? seg.text!.slice(0, 120) + "..." : seg.text;

  return (
    <div
      className="my-2.5 rounded-2xl overflow-hidden"
      style={{ boxShadow: "0 2px 16px rgba(5,150,105,0.1), 0 1px 3px rgba(0,0,0,0.06)", border: "1px solid rgba(16,185,129,0.2)" }}
    >
      <div
        className="px-4 py-2.5 flex items-center gap-2"
        style={{ background: "linear-gradient(135deg,#047857,#0f766e)" }}
      >
        <div className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
          <Scale size={12} className="text-white" />
        </div>
        <span className="text-[12px] font-bold text-white tracking-wide">حكم شرعي</span>
        {seg.source && <span className="mr-auto text-[10px] text-white/65 truncate">📚 {seg.source}</span>}
      </div>
      <div className="bg-white px-4 py-3.5">
        <p className="text-[13px] leading-relaxed text-stone-700 text-right">
          {expanded ? seg.text : preview}
        </p>
        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-stone-100">
          {(seg.text?.length ?? 0) > 120 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-[11px] font-semibold px-3 py-1 rounded-full transition-all active:scale-95"
              style={{ background: "rgba(5,150,105,0.08)", color: "#047857" }}
            >
              {expanded ? "إخفاء ↑" : "عرض الكامل ↓"}
            </button>
          )}
          {seg.url && (
            <a href={seg.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full mr-auto transition-all"
              style={{ background: "rgba(5,150,105,0.08)", color: "#047857" }}
            >
              <ExternalLink size={11} /> المصدر
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
