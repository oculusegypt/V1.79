import { motion } from "framer-motion";
import { Star, Flame } from "lucide-react";
import type { Program } from "./types";

const CARD_W = 118;
const CARD_H = 86;
const GAP = 10;
const FEATURED_W = 148;
const FEATURED_H = CARD_H * 2 + GAP;

export function FeaturedPosterCard({ program, onClick }: { program: Program; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="relative rounded-2xl overflow-hidden flex flex-col justify-end shrink-0 active:scale-95 transition-transform"
      style={{
        width: FEATURED_W,
        height: FEATURED_H,
        background: `linear-gradient(160deg, ${program.color}, ${program.colorTo})`,
        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
      }}
    >
      <div className="absolute top-[-25px] right-[-25px] w-[100px] h-[100px] rounded-full opacity-15 bg-white" />
      <div className="absolute bottom-[-20px] left-[-20px] w-[80px] h-[80px] rounded-full opacity-10 bg-white" />

      <div className="absolute top-5 right-0 left-0 flex justify-center text-[52px] opacity-25 select-none">{program.icon}</div>

      {program.badge && (
        <div
          className="absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: "rgba(251,191,36,0.95)", color: "#1c0f00" }}
        >
          {program.badge}
        </div>
      )}

      {program.hot && (
        <div className="absolute top-3 right-3 flex items-center gap-1" style={{ color: "#fbbf24" }}>
          <Flame size={12} fill="#fbbf24" />
        </div>
      )}

      <div
        className="absolute inset-x-0 bottom-0 h-[70px]"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65), transparent)" }}
      />

      <div className="relative z-10 p-3 text-right">
        <p className="text-white font-bold text-[13px] leading-tight">{program.name}</p>
        {program.host && (
          <p className="text-white/65 text-[10px] mt-0.5">{program.host}</p>
        )}
        <div
          className="mt-2 flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full w-fit"
          style={{ background: "rgba(255,255,255,0.18)", color: "#fff" }}
        >
          <Star size={9} fill="white" />
          <span>الأبرز</span>
        </div>
      </div>
    </button>
  );
}
