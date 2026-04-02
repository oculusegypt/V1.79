import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Handshake, CheckSquare } from "lucide-react";
import { getApiBase } from "@/lib/api-base";
import type { MessageSegment } from "../types";

export function PromiseCard({ seg, sessionId }: { seg: MessageSegment; sessionId: string }) {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  async function handlePromise() {
    setState("loading");
    try {
      await fetch(`${getApiBase()}/zakiy/promise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, promiseText: seg.text }),
      });
      setState("done");
    } catch {
      setState("idle");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="my-3 rounded-2xl overflow-hidden"
      style={{ boxShadow: "0 4px 20px rgba(217,119,6,0.18), 0 1px 3px rgba(0,0,0,0.06)", border: "1px solid rgba(245,158,11,0.3)" }}
    >
      <div
        className="px-4 py-3 flex items-center gap-2"
        style={{ background: "linear-gradient(135deg,#b45309,#d97706)" }}
      >
        <div className="w-7 h-7 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
          <Handshake size={14} className="text-white" />
        </div>
        <span className="text-[13px] font-bold text-white tracking-wide">وعد أمام الله</span>
        <span className="mr-auto text-lg">🤝</span>
      </div>
      <div className="bg-white px-4 py-5">
        <div
          className="relative px-4 py-3 rounded-xl mb-4 text-right"
          style={{ background: "linear-gradient(135deg,#fffbeb,#fef3c7)", border: "1px solid rgba(245,158,11,0.2)" }}
        >
          <span className="absolute top-1 right-2 text-amber-200/60 text-3xl font-serif leading-none">"</span>
          <p className="text-[13px] leading-relaxed text-stone-700 font-medium relative z-10 pt-2">
            {seg.text}
          </p>
        </div>
        {state === "done" ? (
          <div
            className="flex items-center justify-center gap-2 rounded-xl py-3"
            style={{ background: "linear-gradient(135deg,#d1fae5,#a7f3d0)" }}
          >
            <CheckSquare size={17} className="text-emerald-600" strokeWidth={2.5} />
            <span className="text-[13px] font-bold text-emerald-800">وعدتَ الله — والله شاهد على وعدك</span>
          </div>
        ) : (
          <button
            onClick={handlePromise}
            disabled={state === "loading"}
            className="w-full flex items-center justify-center gap-2 text-white rounded-xl py-3 font-bold text-[13px] transition-all active:scale-95"
            style={{ background: "linear-gradient(135deg,#b45309,#d97706)", boxShadow: "0 2px 10px rgba(180,83,9,0.3)" }}
          >
            {state === "loading"
              ? <><Loader2 size={14} className="animate-spin" /> لحظة...</>
              : <><Handshake size={14} /> أعدك بالله</>
            }
          </button>
        )}
      </div>
    </motion.div>
  );
}
