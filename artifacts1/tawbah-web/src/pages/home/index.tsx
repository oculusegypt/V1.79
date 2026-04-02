import { Fragment, useState, useEffect, useCallback } from "react";
import { GripVertical, Settings2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppUserProgress } from "@/hooks/use-app-data";
import { useZakiyMode } from "@/context/ZakiyModeContext";
import { ZakiyModeDashboard } from "@/components/ZakiyModeDashboard";
import { ZakiyEmergencyOverlay } from "@/components/ZakiyEmergencyOverlay";
import { IslamicHero } from "@/components/IslamicHero";
import { KnowledgeSlider } from "@/components/KnowledgeSlider";
import { MoodSelector } from "@/components/MoodSelector";
import { CommunityTicker } from "@/components/CommunityTicker";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import {
  isGridItem,
  GRID_META,
  loadCombinedOrder,
  saveCombinedOrder,
} from "./types";
import type { SectionId, ListId } from "./types";
import { SECTION_LABELS } from "./list-sections";
import { HomeHeroBar } from "./HomeHeroBar";
import { SosReturnToast } from "./SosReturnToast";
import { EidEntryCard } from "./EidEntryCard";
import { DailyFocusCard } from "./DailyFocusCard";
import { QuickAccessBar } from "./QuickAccessBar";
import { SortableUnifiedItem } from "./SortableUnifiedItem";

export default function Home() {
  const { isLoading } = useAppUserProgress();
  const { aiMode, toggleAiMode, decision } = useZakiyMode();
  const [showSosToast, setShowSosToast] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);

  useEffect(() => {
    if (decision?.urgency === "emergency") {
      setShowEmergency(true);
    }
  }, [decision?.urgency]);

  const [combinedOrder, setCombinedOrder] =
    useState<SectionId[]>(loadCombinedOrder);
  const [activeId, setActiveId] = useState<SectionId | null>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem("sos_return") === "1") {
        localStorage.removeItem("sos_return");
        setShowSosToast(true);
      }
    } catch {}
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as SectionId);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (over && active.id !== over.id) {
      setCombinedOrder((prev) => {
        const oldIndex = prev.indexOf(active.id as SectionId);
        const newIndex = prev.indexOf(over.id as SectionId);
        const next = arrayMove(prev, oldIndex, newIndex);
        saveCombinedOrder(next);
        return next;
      });
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 pb-8">
      <ZakiyEmergencyOverlay
        visible={showEmergency}
        message={decision?.message ?? ""}
        onDismiss={() => setShowEmergency(false)}
      />

      <AnimatePresence>
        {showSosToast && (
          <SosReturnToast onDismiss={() => setShowSosToast(false)} />
        )}
      </AnimatePresence>

      {/* AI Mode replaces dashboard */}
      {aiMode ? (
        <ZakiyModeDashboard />
      ) : (
        <>
          {/* Hero + header overlay */}
          <div className="relative">
            <IslamicHero />
            <HomeHeroBar />
          </div>
          <div className="px-5 relative z-10 flex flex-col gap-4 pl-[7px] pr-[7px] mt-[-88px]">
            {/* Quick Access Bar */}
            <QuickAccessBar />

            <EidEntryCard />

            {/* Mood Selector */}
            <MoodSelector />

            {/* Daily Focus Card */}
            <DailyFocusCard />

            {/* Edit mode banner */}
            <AnimatePresence>
              {editMode && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex items-center justify-between bg-primary/10 border border-primary/25 rounded-2xl px-4 py-3"
                >
                  <div>
                    <p className="text-xs font-bold text-primary">
                      وضع الترتيب مفعّل
                    </p>
                    <p className="text-[10px] text-primary/60 mt-0.5">
                      اسحب أي بطاقة لتغيير مكانها — يمكنك خلط جميع الأنواع
                    </p>
                  </div>
                  <button
                    onClick={() => setEditMode(false)}
                    className="text-xs font-bold text-primary bg-primary/15 hover:bg-primary/25 px-4 py-1.5 rounded-xl transition-colors"
                  >
                    تم ✓
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Unified sortable section */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={combinedOrder}
                strategy={rectSortingStrategy}
              >
                <div className="flex flex-wrap gap-3">
                  {combinedOrder.map((id) => (
                    <Fragment key={id}>
                      {id === "tawbah-card" && (
                        <div className="w-full">
                          <KnowledgeSlider />
                        </div>
                      )}
                      <div
                        className={
                          isGridItem(id) ? "w-[calc(50%-6px)]" : "w-full"
                        }
                      >
                        <SortableUnifiedItem id={id} editMode={editMode} />
                      </div>
                    </Fragment>
                  ))}
                </div>
              </SortableContext>

              <DragOverlay dropAnimation={{ duration: 200, easing: "ease" }}>
                {activeId ? (
                  isGridItem(activeId) ? (
                    <div
                      className="rounded-2xl shadow-2xl border-2 border-primary/40 bg-card/95 backdrop-blur-sm rotate-2 scale-[1.05] flex flex-col items-center justify-center gap-2 px-3 py-4 text-center"
                      style={{ minHeight: "96px" }}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${GRID_META[activeId].iconBg}`}
                      >
                        {GRID_META[activeId].icon}
                      </div>
                      <p className="text-[11px] font-bold text-primary">
                        {GRID_META[activeId].label}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-2xl shadow-2xl border-2 border-primary/40 bg-card/98 backdrop-blur-sm overflow-hidden rotate-1 scale-[1.03]">
                      <div className="px-4 py-3 flex items-center gap-3 bg-primary/5">
                        <GripVertical size={16} className="text-primary" />
                        <span className="text-sm font-bold text-primary">
                          {SECTION_LABELS[activeId as ListId]}
                        </span>
                      </div>
                    </div>
                  )
                ) : null}
              </DragOverlay>
            </DndContext>

            {/* Community Ticker */}
            <CommunityTicker />

            {/* Organize toggle button */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              onClick={() => setEditMode((v) => !v)}
              className={`flex items-center justify-center gap-2 w-full py-3 rounded-2xl border text-sm font-bold transition-all ${
                editMode
                  ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                  : "bg-card text-muted-foreground border-border hover:text-foreground hover:border-primary/40"
              }`}
            >
              <Settings2 size={16} />
              {editMode ? "إنهاء التنظيم" : "إعادة ترتيب البطاقات"}
            </motion.button>
          </div>
        </>
      )}
    </div>
  );
}
