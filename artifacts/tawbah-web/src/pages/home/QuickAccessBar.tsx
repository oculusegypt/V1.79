import { Link } from "wouter";
import { motion } from "framer-motion";

const QUICK_ACCESS = [
  { href: "/quran", emoji: "📖", label: "القرآن", color: "#c8a84b" },
  { href: "/prayer-times", emoji: "🕌", label: "الصلاة", color: "#6366f1" },
  { href: "/dhikr", emoji: "📿", label: "مسبحة", color: "#f59e0b" },
  { href: "/rajaa", emoji: "💚", label: "مكتبة الرجاء", color: "#059669" },
  { href: "/islamic-programs", emoji: "🎓", label: "برامج", color: "#10b981" },
  { href: "/dhikr-rooms", emoji: "👥", label: "غرف الذكر", color: "#14b8a6" },
  { href: "/journal", emoji: "✍️", label: "يومياتي", color: "#8b5cf6" },
  { href: "/adhkar", emoji: "🤲", label: "الأذكار", color: "#ec4899" },
];

export function QuickAccessBar() {
  return (
    <div
      className="flex gap-3 overflow-x-auto py-1 px-1"
      style={
        {
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
        } as React.CSSProperties
      }
    >
      {QUICK_ACCESS.map((item) => (
        <Link key={item.href} href={item.href}>
          <motion.div
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl whitespace-nowrap shrink-0 cursor-pointer shadow-sm"
            style={{
              background: `linear-gradient(135deg, ${item.color}15 0%, ${item.color}08 100%)`,
              border: `1px solid ${item.color}30`,
            }}
          >
            <span style={{ fontSize: 16 }}>{item.emoji}</span>
            <span
              className="text-xs font-semibold"
              style={{ color: item.color }}
            >
              {item.label}
            </span>
          </motion.div>
        </Link>
      ))}
    </div>
  );
}
