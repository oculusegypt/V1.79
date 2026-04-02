import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Lock, Flame, Star } from "lucide-react";
import { JourneyDay } from "../types";

const MILESTONES: Record<number, { emoji: string; label: string }> = {
  7:  { emoji: "🌱", label: "أسبوع" },
  14: { emoji: "🌿", label: "نصف الطريق" },
  21: { emoji: "🌳", label: "٢١ يوماً" },
  30: { emoji: "🏆", label: "اكتمال" },
};

interface Props {
  days: JourneyDay[];
  completedCount: number;
}

export function JourneyTimeline({ days, completedCount }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentIdx = days.findIndex((d) => d.isCurrent);
    if (currentIdx < 0 || !scrollRef.current) return;
    const nodeWidth = 60;
    const gap = 8;
    const offset = (nodeWidth + gap) * currentIdx - scrollRef.current.clientWidth / 2 + nodeWidth / 2;
    scrollRef.current.scrollTo({ left: offset, behavior: "smooth" });
  }, [days]);

  return (
    <div className="rounded-2xl overflow-hidden border border-border/60 bg-card shadow-sm">
      <div className="px-4 pt-3 pb-1 flex items-center justify-between">
        <p className="text-[11px] font-bold text-muted-foreground tracking-widest">خط سير الرحلة</p>
        <span className="text-[11px] font-bold text-primary">{completedCount} / ٣٠</span>
      </div>

      {/* Progress bar */}
      <div className="px-4 pb-2">
        <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-l from-emerald-400 to-primary"
            animate={{ width: `${(completedCount / 30) * 100}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Timeline nodes */}
      <div
        ref={scrollRef}
        className="overflow-x-auto pb-4 pt-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <div className="flex gap-2 px-4 min-w-max">
          {days.map((day) => {
            const milestone = MILESTONES[day.day];
            const isCompleted = day.completed;
            const isCurrent = day.isCurrent;
            const isLocked = day.isLocked;

            return (
              <div key={day.day} className="flex flex-col items-center gap-1" style={{ width: 52 }}>
                {/* Milestone badge */}
                {milestone ? (
                  <div className="text-[10px] font-bold text-amber-500 mb-0.5">
                    {milestone.emoji}
                  </div>
                ) : (
                  <div className="h-4" />
                )}

                {/* Node */}
                <div className="relative flex flex-col items-center">
                  {isCurrent && (
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{ background: "rgba(var(--primary-rgb, 14,165,233), 0.2)" }}
                      animate={{ scale: [1, 1.35, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                  )}

                  <div
                    className={`
                      relative w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all
                      ${isCompleted
                        ? "bg-emerald-500 border-emerald-400 shadow-[0_0_12px_rgba(5,150,105,0.45)]"
                        : isCurrent
                          ? "bg-primary border-primary shadow-[0_0_14px_rgba(14,165,233,0.5)]"
                          : "bg-muted/50 border-border/50"
                      }
                    `}
                  >
                    {isCompleted ? (
                      <Check size={18} className="text-white" strokeWidth={3} />
                    ) : isCurrent ? (
                      <Flame size={17} className="text-white" />
                    ) : isLocked ? (
                      <Lock size={13} className="text-muted-foreground/40" />
                    ) : (
                      <Star size={13} className="text-muted-foreground/50" />
                    )}
                  </div>
                </div>

                {/* Day number */}
                <span
                  className={`text-[9px] font-bold mt-0.5 ${
                    isCompleted
                      ? "text-emerald-500"
                      : isCurrent
                        ? "text-primary"
                        : "text-muted-foreground/40"
                  }`}
                >
                  {day.day}
                </span>

                {/* Milestone label under node */}
                {milestone && (
                  <span className="text-[8px] text-amber-500/80 font-bold -mt-0.5 whitespace-nowrap">
                    {milestone.label}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Connecting line overlay (visual only, behind nodes) */}
      <style>{`
        .journey-scroll::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
