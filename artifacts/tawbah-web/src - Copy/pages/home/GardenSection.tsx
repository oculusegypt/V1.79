import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

const GARDEN_STAGES = [
  { min: 0,   max: 49,  emoji: "🌱", name: "بذرة",   color: "#a7f3d0", desc: "البداية — كل رحلة تبدأ بخطوة" },
  { min: 50,  max: 199, emoji: "🌿", name: "شتلة",   color: "#6ee7b7", desc: "جذورك تتعمق — واصل الذكر" },
  { min: 200, max: 499, emoji: "🌳", name: "شجرة",   color: "#34d399", desc: "شجرة راسخة — ثمارها نور" },
  { min: 500, max: 999, emoji: "🌲", name: "غابة",   color: "#10b981", desc: "غابة بركة — روح مزهرة" },
  { min: 1000, max: Infinity, emoji: "🏡", name: "جنة", color: "#059669", desc: "جنة الدنيا — تُظلّ من حولك" },
];

export function SectionGarden() {
  const count = (() => {
    try { return parseInt(localStorage.getItem("home_dhikr_count") ?? "0") || 0; }
    catch { return 0; }
  })();

  const stageIdx = GARDEN_STAGES.findIndex(s => count >= s.min && count <= s.max);
  const stage = GARDEN_STAGES[Math.max(0, stageIdx)]!;
  const nextStage = GARDEN_STAGES[stageIdx + 1];
  const pct = nextStage
    ? Math.min(((count - stage.min) / (nextStage.min - stage.min)) * 100, 100)
    : 100;

  return (
    <Link
      href="/garden"
      className="block rounded-[24px] overflow-hidden relative active:scale-[0.98] transition-all"
      style={{
        background: "linear-gradient(145deg, #031a0d 0%, #052e14 40%, #064220 100%)",
        border: "1px solid rgba(16,185,129,0.28)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      {/* Radiant glow */}
      <div className="absolute inset-x-0 top-0 h-[80px] pointer-events-none" style={{
        background: "radial-gradient(ellipse 70% 80% at 50% 0%, rgba(16,185,129,0.2) 0%, transparent 70%)",
      }} />

      <div className="relative z-10 p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
              {stage.emoji}
            </div>
            <div>
              <h3 className="font-bold text-[15px]" style={{ color: "#fff" }}>شجرة التوبة</h3>
              <p className="text-[10px]" style={{ color: "rgba(52,211,153,0.7)" }}>{stage.name} • {count.toLocaleString("ar-EG")} ذكر</p>
            </div>
          </div>
          <ArrowLeft size={15} style={{ color: "rgba(255,255,255,0.4)" }} />
        </div>

        {/* Stage desc */}
        <p className="text-[10px] mb-3 text-right" style={{ color: "rgba(255,255,255,0.5)" }}>{stage.desc}</p>

        {/* Journey lifecycle stages */}
        <div className="flex items-center gap-1 mb-3">
          {GARDEN_STAGES.map((s, i) => {
            const isCurrent = i === stageIdx;
            const isPast = i < stageIdx;
            return (
              <div key={i} className="flex items-center gap-1 flex-1">
                <div
                  className="flex flex-col items-center gap-0.5 flex-1"
                  style={{ opacity: isPast ? 0.7 : isCurrent ? 1 : 0.3 }}
                >
                  <span style={{ fontSize: isCurrent ? 18 : 13 }}>{s.emoji}</span>
                  <span className="text-[7px] font-bold" style={{ color: isCurrent ? s.color : "rgba(255,255,255,0.4)" }}>
                    {s.name}
                  </span>
                </div>
                {i < GARDEN_STAGES.length - 1 && (
                  <div className="h-[1px] flex-[0.3]" style={{
                    background: i < stageIdx ? "#10b981" : "rgba(255,255,255,0.12)",
                  }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Progress to next stage */}
        {nextStage && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                {nextStage.min - count} ذكر للمرحلة التالية {nextStage.emoji}
              </span>
              <span className="text-[9px] font-bold" style={{ color: stage.color }}>{Math.round(pct)}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${stage.color}, ${nextStage.color})` }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>
        )}

        {!nextStage && (
          <div className="flex items-center gap-2 p-2 rounded-xl"
            style={{ background: "rgba(5,150,105,0.15)", border: "1px solid rgba(5,150,105,0.3)" }}>
            <span>🏆</span>
            <p className="text-[10px] font-bold" style={{ color: "#059669" }}>بلغت أعلى المراحل — تاج التوبة</p>
          </div>
        )}
      </div>
    </Link>
  );
}
