import { Play, Flame } from "lucide-react";
import type { Program } from "./types";

export function HeroBanner({ program, onClick }: { program: Program; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="relative w-full rounded-2xl overflow-hidden flex flex-col justify-end active:scale-[0.98] transition-transform text-right"
      style={{
        height: 180,
        background: `linear-gradient(135deg, ${program.color}, ${program.colorTo})`,
      }}
    >
      <div className="absolute top-[-30px] right-[-30px] w-[140px] h-[140px] rounded-full opacity-10 bg-white" />
      <div className="absolute bottom-[-40px] left-[-20px] w-[120px] h-[120px] rounded-full opacity-10 bg-white" />

      <div className="absolute top-4 right-5 text-[52px] opacity-30 select-none">{program.icon}</div>

      <div className="relative z-10 p-5">
        {program.badge && (
          <span
            className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-2"
            style={{ background: "rgba(255,255,255,0.22)", color: "#fff" }}
          >
            {program.badge}
          </span>
        )}
        <h3 className="text-white font-bold text-xl leading-tight">{program.name}</h3>
        {program.host && (
          <p className="text-white/70 text-[12px] mt-0.5">{program.host}</p>
        )}
        <div className="flex items-center gap-2 mt-3">
          <span
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold"
            style={{ background: "rgba(255,255,255,0.22)", color: "#fff" }}
          >
            <Play size={11} fill="white" />
            <span>مشاهدة البرنامج</span>
          </span>
          {program.hot && (
            <span className="flex items-center gap-1 text-[11px]" style={{ color: "#fbbf24" }}>
              <Flame size={12} fill="#fbbf24" /> رائج
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
