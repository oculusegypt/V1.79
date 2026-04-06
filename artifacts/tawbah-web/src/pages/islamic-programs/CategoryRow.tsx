import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import type { CategoryId, Program } from "./types";
import { CATEGORIES, PROGRAMS } from "./data";
import { ProgramCard } from "./ProgramCard";
import { FeaturedPosterCard } from "./FeaturedPosterCard";

const CARD_W = 118;
const CARD_H = 86;
const GAP = 10;

export function CategoryRow({ catId, onProgramClick }: { catId: CategoryId; onProgramClick: (id: string) => void }) {
  const cat = CATEGORIES.find((c) => c.id === catId)!;
  const programs = PROGRAMS.filter((p) => p.category === catId);

  const featured = programs.find((p) => p.hot) ?? programs.find((p) => p.badge) ?? programs[0];
  const rest = programs.filter((p) => p.id !== featured.id);

  return (
    <div className="mb-7">
      <div className="flex items-center gap-2 mb-3 px-1">
        <span style={{ color: cat.color }}>{cat.icon}</span>
        <h3 className="font-bold text-[15px]">{cat.label}</h3>
        <span className="text-[11px] text-muted-foreground mr-auto">{programs.length} برنامج</span>
        <ChevronLeft size={14} className="text-muted-foreground" />
      </div>

      <div className="flex overflow-x-auto pb-2 scrollbar-hide" style={{ gap: GAP, direction: "rtl" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="shrink-0"
        >
          <FeaturedPosterCard program={featured} onClick={() => onProgramClick(featured.id)} />
        </motion.div>

        <div
          className="grid shrink-0"
          style={{
            gridTemplateRows: `repeat(2, ${CARD_H}px)`,
            gridAutoFlow: "column",
            gridAutoColumns: `${CARD_W}px`,
            gap: GAP,
          }}
        >
          {rest.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.25 }}
            >
              <ProgramCard program={p} onClick={() => onProgramClick(p.id)} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
