import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { Heart } from "lucide-react";

type TickerItem = {
  id: string;
  name: string;
  city: string;
  country: string;
  action: string;
  flag: string;
  color: string;
};

const POOL: Omit<TickerItem, "id">[] = [
  { name: "أحمد", city: "الرياض",    country: "السعودية", action: "استغفر الله الآن",         flag: "🇸🇦", color: "#10b981" },
  { name: "فاطمة",city: "القاهرة",    country: "مصر",      action: "تطلب منكم الدعاء",         flag: "🇪🇬", color: "#f59e0b" },
  { name: "عمر",  city: "كندا",       country: "كندا",     action: "يقرأ القرآن الآن",          flag: "🇨🇦", color: "#6366f1" },
  { name: "مريم", city: "إسطنبول",    country: "تركيا",    action: "تائبة ومُقبِلة على الله",   flag: "🇹🇷", color: "#ec4899" },
  { name: "يوسف", city: "لندن",       country: "بريطانيا", action: "يذكر الله في سفره",        flag: "🇬🇧", color: "#0ea5e9" },
  { name: "آمنة", city: "دبي",        country: "الإمارات", action: "تشكر الله على نعمه",       flag: "🇦🇪", color: "#a855f7" },
  { name: "خالد", city: "كوالالمبور", country: "ماليزيا",  action: "يصلي الضحى الآن",          flag: "🇲🇾", color: "#f97316" },
  { name: "نور",  city: "باريس",      country: "فرنسا",    action: "تسأل الله العفو",           flag: "🇫🇷", color: "#14b8a6" },
  { name: "سعد",  city: "بغداد",      country: "العراق",   action: "يدعو ربه في السحر",        flag: "🇮🇶", color: "#eab308" },
  { name: "هدى",  city: "الخرطوم",   country: "السودان",   action: "تستغفر وتتوب",             flag: "🇸🇩", color: "#f43f5e" },
  { name: "بلال", city: "جاكرتا",    country: "إندونيسيا", action: "أنهى حزبه اليومي",         flag: "🇮🇩", color: "#06b6d4" },
  { name: "زينب", city: "المغرب",     country: "المغرب",   action: "تدعو لأهلها بالهداية",     flag: "🇲🇦", color: "#8b5cf6" },
];

function shuffleItems(): TickerItem[] {
  const shuffled = [...POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 6).map((item, i) => ({ ...item, id: `${i}-${Date.now()}` }));
}

function TickerCard({
  item,
  onAmeen,
}: {
  item: TickerItem;
  onAmeen: (id: string) => void;
}) {
  const x = useMotionValue(0);
  const opacity = useTransform(x, [0, 60], [1, 0]);
  const scale = useTransform(x, [0, 60], [1, 1.04]);
  const bgOpacity = useTransform(x, [0, 60], [0, 1]);
  const [swiped, setSwiped] = useState(false);
  const [ameen, setAmeen] = useState(false);

  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    if (info.offset.x > 55) {
      setAmeen(true);
      setTimeout(() => {
        setSwiped(true);
        onAmeen(item.id);
      }, 600);
    } else {
      x.set(0);
    }
  };

  if (swiped) return null;

  return (
    <AnimatePresence>
      {!swiped && (
        <motion.div
          className="relative flex-shrink-0 rounded-xl overflow-hidden"
          style={{ width: 220 }}
          initial={{ opacity: 0, x: 20, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -30, scale: 0.9 }}
          transition={{ duration: 0.35 }}
        >
          {/* Ameen flash */}
          <AnimatePresence>
            {ameen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 flex items-center justify-center rounded-xl"
                style={{ background: "rgba(16,185,129,0.92)" }}
              >
                <div className="flex items-center gap-2">
                  <Heart size={16} className="text-white" fill="white" />
                  <span className="text-white font-bold text-sm">آمين</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Swipe indicator background */}
          <motion.div
            className="absolute inset-0 rounded-xl flex items-center justify-start pl-4"
            style={{
              background: "linear-gradient(90deg, rgba(16,185,129,0.25) 0%, transparent 100%)",
              opacity: bgOpacity,
            }}
          >
            <Heart size={16} style={{ color: "#10b981" }} />
          </motion.div>

          {/* Card content */}
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 80 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            style={{
              x,
              opacity,
              scale,
              cursor: "grab",
              background: "rgba(255,255,255,0.06)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              padding: "10px 12px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span className="text-lg flex-shrink-0">{item.flag}</span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold leading-tight truncate" style={{ color: "rgba(255,255,255,0.92)" }}>
                {item.name} من {item.country}
              </p>
              <p className="text-[10px] mt-0.5 leading-tight truncate" style={{ color: item.color }}>
                {item.action}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function CommunityTicker() {
  const [items, setItems] = useState<TickerItem[]>(() => shuffleItems());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const newItem = POOL[Math.floor(Math.random() * POOL.length)];
      setItems((prev) => {
        const next = [...prev, { ...newItem, id: `${Date.now()}` }];
        return next.slice(-8);
      });
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ left: containerRef.current.scrollWidth, behavior: "smooth" });
    }
  }, [items]);

  const handleAmeen = (id: string) => {
    setTimeout(() => {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }, 200);
  };

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(30,30,46,0.85) 0%, rgba(20,20,35,0.9) 100%)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-2">
        <div className="flex items-center gap-1.5">
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-green-400"
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          />
          <span className="text-[11px] font-bold text-white/80">مجتمع التوبة الآن</span>
        </div>
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-[10px] text-white/40">اسحب يميناً لـ "آمين"</span>
      </div>

      {/* Scrollable ticker */}
      <div
        ref={containerRef}
        className="flex gap-2.5 px-4 pb-3 overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {items.map((item) => (
          <TickerCard key={item.id} item={item} onAmeen={handleAmeen} />
        ))}
      </div>
    </div>
  );
}
