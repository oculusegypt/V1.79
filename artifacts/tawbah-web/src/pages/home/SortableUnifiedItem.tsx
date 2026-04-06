import { memo } from "react";
import { Link } from "wouter";
import { GripVertical } from "lucide-react";
import { motion } from "framer-motion";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { isGridItem, GRID_META } from "./types";
import { renderSection } from "./list-sections";
import type { SectionId, ListId } from "./types";

export const SortableUnifiedItem = memo(function SortableUnifiedItem({
  id,
  editMode,
}: {
  id: SectionId;
  editMode: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : ("auto" as const),
  };

  if (isGridItem(id)) {
    const meta = GRID_META[id];
    return (
      <div ref={setNodeRef} style={style} className="relative">
        <Link
          href={meta.href}
          className={`relative flex flex-col items-center justify-center gap-2.5 bg-gradient-to-br ${meta.bg} border ${meta.border} px-3 py-5 active:scale-[0.96] transition-all text-center overflow-hidden`}
          style={{
            minHeight: "106px",
            borderRadius: 22,
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            boxShadow:
              "0 2px 12px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.25)",
          }}
        >
          <div
            className="absolute top-0 inset-x-0 h-[40%] pointer-events-none rounded-t-[22px]"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.14) 0%, transparent 100%)",
            }}
          />
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center ${meta.iconBg}`}
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
          >
            {meta.icon}
          </div>
          <div>
            <p className="font-bold text-[11.5px] leading-tight">{meta.label}</p>
            <p className="text-[9.5px] text-muted-foreground mt-0.5 leading-tight">
              {meta.sub}
            </p>
          </div>
        </Link>
        {editMode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            {...attributes}
            {...listeners}
            className="absolute top-1.5 right-1.5 z-10 w-7 h-7 flex items-center justify-center rounded-lg bg-background/95 border border-primary/30 shadow-md cursor-grab active:cursor-grabbing touch-none"
          >
            <GripVertical size={13} className="text-primary/70" />
          </motion.div>
        )}
      </div>
    );
  }

  const listId = id as ListId;
  return (
    <div ref={setNodeRef} style={style} className="relative w-full">
      {editMode && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          {...attributes}
          {...listeners}
          className="absolute top-1/2 -translate-y-1/2 -right-1 z-10 w-10 h-10 flex items-center justify-center rounded-xl bg-background/95 border border-primary/30 shadow-md cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical size={18} className="text-primary/70" />
        </motion.div>
      )}
      <div className={editMode ? "pr-11 transition-all" : "transition-all"}>
        {renderSection(listId)}
      </div>
    </div>
  );
});

SortableUnifiedItem.displayName = "SortableUnifiedItem";
