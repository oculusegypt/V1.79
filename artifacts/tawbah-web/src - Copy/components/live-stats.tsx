import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users } from "lucide-react";

interface LiveStats {
  today: {
    tawbah: number;
    dhikr: number;
    dua: number;
    quran: number;
  };
  total: number;
  thisWeek: number;
}

function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const [displayed, setDisplayed] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    if (value === prevRef.current) return;
    const diff = value - prevRef.current;
    const steps = Math.min(Math.abs(diff), 30);
    const step = diff / steps;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed((prev) => {
        const next = prev + step;
        return i >= steps ? value : Math.round(next);
      });
      if (i >= steps) clearInterval(interval);
    }, 30);
    prevRef.current = value;
    return () => clearInterval(interval);
  }, [value]);

  return <span className={className}>{displayed.toLocaleString("ar-EG")}</span>;
}

function formatArabic(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "م";
  if (n >= 1000) return (n / 1000).toFixed(1) + "ك";
  return n.toLocaleString("ar-EG");
}

export function LiveStats() {
  const [stats, setStats] = useState<LiveStats | null>(null);
  const [pulse, setPulse] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/stats/live");
      if (!res.ok) return;
      const data = await res.json();
      setStats(data);
      setPulse(true);
      setTimeout(() => setPulse(false), 600);
    } catch { }
  };

  useEffect(() => {
    fetchStats();
    const id = setInterval(fetchStats, 30000);
    return () => clearInterval(id);
  }, []);

  if (!stats) return null;

  const todayTotal = stats.today.tawbah + stats.today.dhikr + stats.today.dua + stats.today.quran;

  const items = [
    { label: "تابوا اليوم", value: stats.today.tawbah, emoji: "🌿", color: "text-primary" },
    { label: "ذكر اليوم", value: stats.today.dhikr, emoji: "📿", color: "text-secondary" },
    { label: "قرأوا القرآن", value: stats.today.quran, emoji: "📖", color: "text-blue-500" },
  ];

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="bg-primary/5 border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ scale: pulse ? [1, 1.3, 1] : 1 }}
            transition={{ duration: 0.5 }}
            className="w-2 h-2 bg-green-500 rounded-full"
          />
          <span className="text-xs font-bold text-foreground">نبضات التوبة — الآن</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Users size={12} />
          <span className="text-[10px]">{formatArabic(todayTotal)} اليوم</span>
        </div>
      </div>

      {/* Main stat */}
      <div className="px-4 py-4 text-center border-b border-border/50">
        <p className="text-[11px] text-muted-foreground mb-1">إجمالي الأحداث الروحية منذ الإطلاق</p>
        <AnimatePresence mode="wait">
          <motion.div
            key={stats.total}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-primary font-display"
          >
            <AnimatedNumber value={stats.total} />
          </motion.div>
        </AnimatePresence>
        <p className="text-[10px] text-muted-foreground mt-1">حدث روحي سُجِّل</p>
      </div>

      {/* Today breakdown */}
      <div className="px-4 py-3 grid grid-cols-3 gap-2">
        {items.map((item) => (
          <div key={item.label} className="text-center">
            <div className="text-base mb-0.5">{item.emoji}</div>
            <div className={`text-base font-bold ${item.color}`}>
              {formatArabic(item.value)}
            </div>
            <div className="text-[9px] text-muted-foreground leading-tight">{item.label}</div>
          </div>
        ))}
      </div>

      {/* This week */}
      <div className="px-4 pb-3 text-center">
        <p className="text-[10px] text-muted-foreground">
          هذا الأسبوع: <span className="text-primary font-bold">{formatArabic(stats.thisWeek)}</span> حدث روحي
        </p>
      </div>
    </div>
  );
}

export async function recordEvent(eventType: "tawbah" | "dhikr" | "covenant" | "dua" | "quran") {
  try {
    await fetch("/api/stats/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType }),
    });
  } catch { }
}
