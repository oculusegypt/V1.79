import type { Program } from "./types";

export function ProgramCard({ program, onClick }: { program: Program; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="relative rounded-xl overflow-hidden flex flex-col justify-end active:scale-95 transition-transform"
      style={{
        width: CARD_W,
        height: CARD_H,
        background: `linear-gradient(135deg, ${program.color}, ${program.colorTo})`,
      }}
    >
      <div className="absolute top-[-12px] right-[-12px] w-[50px] h-[50px] rounded-full opacity-15 bg-white" />
      <div className="absolute top-2 right-2 text-[22px] opacity-35 select-none">{program.icon}</div>
      {program.badge && (
        <div
          className="absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
          style={{ background: "rgba(251,191,36,0.9)", color: "#1c0f00" }}
        >
          {program.badge}
        </div>
      )}
      <div className="relative z-10 p-2.5 text-right">
        <p className="text-white font-bold text-[11px] leading-tight line-clamp-2">{program.name}</p>
        {program.host && (
          <p className="text-white/55 text-[9px] mt-0.5 truncate">{program.host}</p>
        )}
      </div>
    </button>
  );
}

const CARD_W = 118;
const CARD_H = 86;
