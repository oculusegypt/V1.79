import { Fragment, useState, useEffect, useCallback, useMemo } from "react";
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
  useDroppable,
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
import { QuickAccessBar } from "./QuickAccessBar";
import { SortableUnifiedItem } from "./SortableUnifiedItem";
import { SectionHeader } from "./SectionHeader";
import { Bot, BookOpen, Zap, CircleDot, Users } from "lucide-react";

// Section organization for visual hierarchy
const DEFAULT_PRIMARY_ITEMS = ["journey-card", "tawbah-card"] as const;
const DEFAULT_DAILY_TOOLS = ["quran-card", "islamic-programs", "adhkar", "prayer-times", "notifications", "dhikr", "rajaa"] as const;
const DEFAULT_GROWTH_ITEMS = ["journey30", "journal"] as const;
const DEFAULT_COMMUNITY_ITEMS = ["dhikr-rooms"] as const;

type HomeBucket = "primary" | "daily" | "growth" | "community";
type HomeBucketOrOther = HomeBucket | "other";

const HOME_BUCKET_KEY = "home_bucket_map_v1";

function getDefaultBucket(id: SectionId): HomeBucketOrOther {
  if ((DEFAULT_PRIMARY_ITEMS as readonly string[]).includes(id)) return "primary";
  if ((DEFAULT_DAILY_TOOLS as readonly string[]).includes(id)) return "daily";
  if ((DEFAULT_GROWTH_ITEMS as readonly string[]).includes(id)) return "growth";
  if ((DEFAULT_COMMUNITY_ITEMS as readonly string[]).includes(id)) return "community";
  return "other";
}

function isBucketId(id: unknown): id is `bucket:${HomeBucket}` {
  return typeof id === "string" && id.startsWith("bucket:");
}

function parseBucketId(id: `bucket:${HomeBucket}`): HomeBucket {
  return id.split(":")[1] as HomeBucket;
}

function getBucketForItem(id: SectionId, bucketMap: Partial<Record<SectionId, HomeBucket>>): HomeBucketOrOther {
  return bucketMap[id] ?? getDefaultBucket(id);
}

function moveItemToBucketEnd({
  order,
  activeId,
  targetBucket,
  bucketMap,
}: {
  order: SectionId[];
  activeId: SectionId;
  targetBucket: HomeBucket;
  bucketMap: Partial<Record<SectionId, HomeBucket>>;
}): SectionId[] {
  const without = order.filter((x) => x !== activeId);
  const lastIdxInBucket = (() => {
    for (let i = without.length - 1; i >= 0; i--) {
      const id = without[i]!;
      if (getBucketForItem(id, bucketMap) === targetBucket) return i;
    }
    return -1;
  })();

  const insertAt = lastIdxInBucket === -1 ? without.length : lastIdxInBucket + 1;
  const next = [...without.slice(0, insertAt), activeId, ...without.slice(insertAt)];
  return next;
}

function BucketDroppable({
  bucket,
  children,
}: {
  bucket: HomeBucket;
  children: (opts: { isOver: boolean }) => React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: `bucket:${bucket}` as const });
  return <div ref={setNodeRef}>{children({ isOver })}</div>;
}

export default function Home() {
  const { isLoading } = useAppUserProgress();
  const { aiMode, toggleAiMode, decision } = useZakiyMode();
  const [showSosToast, setShowSosToast] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);

  const [bucketMap, setBucketMap] = useState<Partial<Record<SectionId, HomeBucket>>>(() => {
    try {
      const raw = localStorage.getItem(HOME_BUCKET_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw) as Partial<Record<string, HomeBucket>>;
      const next: Partial<Record<SectionId, HomeBucket>> = {};
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v === "string" && (v === "primary" || v === "daily" || v === "growth" || v === "community")) {
          next[k as SectionId] = v;
        }
      }
      return next;
    } catch {
      return {};
    }
  });

  const persistBucketMap = useCallback((next: Partial<Record<SectionId, HomeBucket>>) => {
    setBucketMap(next);
    try {
      localStorage.setItem(HOME_BUCKET_KEY, JSON.stringify(next));
    } catch {}
  }, []);

  useEffect(() => {
    if (decision?.urgency === "emergency") {
      setShowEmergency(true);
    }
  }, [decision?.urgency]);

  const [combinedOrder, setCombinedOrder] =
    useState<SectionId[]>(loadCombinedOrder);
  const [activeId, setActiveId] = useState<SectionId | null>(null);

  const HOME_SECTIONS = useMemo(
    () =>
      [
        {
          id: "primary" as const,
          title: "الأهم",
          icon: <Bot size={16} />,
          subtitle: "محادثة الزكي والورد اليومي",
        },
        {
          id: "daily" as const,
          title: "أدواتك اليومية",
          icon: <CircleDot size={16} />,
          subtitle: "أذكار • صلاة • قرآن",
        },
        {
          id: "growth" as const,
          title: "النمو والمحتوى",
          icon: <BookOpen size={16} />,
          subtitle: "برامج • يوميات • تلاوات",
        },
        {
          id: "community" as const,
          title: "المجتمع والمزيد",
          icon: <Users size={16} />,
          subtitle: undefined,
        },
      ] as const,
    [],
  );

  const itemsBySection = useMemo(() => {
    const primary: SectionId[] = [];
    const daily: SectionId[] = [];
    const growth: SectionId[] = [];
    const community: SectionId[] = [];
    const other: SectionId[] = [];

    for (const id of combinedOrder) {
      const bucket = getBucketForItem(id, bucketMap);
      if (bucket === "primary") primary.push(id);
      else if (bucket === "daily") daily.push(id);
      else if (bucket === "growth") growth.push(id);
      else if (bucket === "community") community.push(id);
      else other.push(id);
    }

    return { primary, daily, growth, community, other };
  }, [combinedOrder, bucketMap]);

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
    if (!over) return;

    const activeItem = active.id as SectionId;
    const overId = over.id;
    const currentBucket = getBucketForItem(activeItem, bucketMap);

    const targetBucket: HomeBucketOrOther = (() => {
      if (isBucketId(overId)) return parseBucketId(overId);
      if (typeof overId === "string") {
        return getBucketForItem(overId as SectionId, bucketMap);
      }
      return "other";
    })();

    if (targetBucket !== "other" && currentBucket !== targetBucket) {
      const nextBucketMap: Partial<Record<SectionId, HomeBucket>> = {
        ...bucketMap,
        [activeItem]: targetBucket,
      };
      persistBucketMap(nextBucketMap);

      setCombinedOrder((prev) => {
        // If dropped on a bucket container, append to end of that bucket segment.
        if (isBucketId(overId)) {
          const next = moveItemToBucketEnd({
            order: prev,
            activeId: activeItem,
            targetBucket,
            bucketMap: nextBucketMap,
          });
          saveCombinedOrder(next);
          return next;
        }

        // Dropped on an item: normal reordering.
        const oldIndex = prev.indexOf(activeItem);
        const newIndex = prev.indexOf(overId as SectionId);
        if (oldIndex === -1 || newIndex === -1) return prev;
        const next = arrayMove(prev, oldIndex, newIndex);
        saveCombinedOrder(next);
        return next;
      });

      return;
    }

    // Same bucket: normal reorder if dropped on another item
    if (active.id !== overId && !isBucketId(overId)) {
      setCombinedOrder((prev) => {
        const oldIndex = prev.indexOf(activeItem);
        const newIndex = prev.indexOf(overId as SectionId);
        if (oldIndex === -1 || newIndex === -1) return prev;
        const next = arrayMove(prev, oldIndex, newIndex);
        saveCombinedOrder(next);
        return next;
      });
    }
  }, [bucketMap, persistBucketMap]);

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
          <div className="px-4 relative z-10 flex flex-col gap-5 mt-[-88px]">
            {/* Quick Access Bar */}
            <QuickAccessBar />

            <EidEntryCard />

            {/* Mood Selector */}
            <MoodSelector />

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

            {/* Unified sortable section with section headers */}
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
                <div className="flex flex-col gap-8">
                  {HOME_SECTIONS.map((section) => {
                    const ids =
                      section.id === "primary"
                        ? itemsBySection.primary
                        : section.id === "daily"
                          ? itemsBySection.daily
                          : section.id === "growth"
                            ? itemsBySection.growth
                            : itemsBySection.community;

                    const isGridish = section.id === "daily" || section.id === "community";

                    return (
                      <BucketDroppable key={section.id} bucket={section.id}>
                        {({ isOver }) => (
                          <div
                            className={editMode && isOver ? "outline-2 outline-dashed outline-primary/45 outline-offset-4 rounded-3xl" : ""}
                          >
                            <SectionHeader
                              title={section.title}
                              icon={section.icon}
                              subtitle={section.subtitle}
                            />
                            <div className={isGridish ? "flex flex-wrap gap-3" : "flex flex-col gap-3"}>
                              {ids.map((id) => (
                                <div
                                  key={id}
                                  className={
                                    isGridish && isGridItem(id)
                                      ? "w-[calc(50%-6px)]"
                                      : "w-full"
                                  }
                                >
                                  <SortableUnifiedItem id={id} editMode={editMode} />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </BucketDroppable>
                    );
                  })}

                  {itemsBySection.other.length > 0 && (
                    <div>
                      <SectionHeader title="أخرى" icon={<Zap size={16} />} />
                      <div className="flex flex-wrap gap-3">
                        {itemsBySection.other.map((id) => (
                          <div
                            key={id}
                            className={isGridItem(id) ? "w-[calc(50%-6px)]" : "w-full"}
                          >
                            <SortableUnifiedItem id={id} editMode={editMode} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
