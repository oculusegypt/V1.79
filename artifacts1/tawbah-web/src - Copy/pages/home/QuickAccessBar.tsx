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
      className="flex gap-2 overflow-x-auto py-0.5"
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
            whileTap={{ scale: 0.9 }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl whitespace-nowrap shrink-0 cursor-pointer"
            style={{
              background: `${item.color}16`,
              border: `1px solid ${item.color}2e`,
            }}
          >
            <span style={{ fontSize: 13 }}>{item.emoji}</span>
            <span
              className="text-[11px] font-bold"
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
