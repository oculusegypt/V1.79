import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useUserProgress } from "@/hooks/use-progress";

// ── Islamic geometry SVG ──────────────────────────────────────────────────────

function GeometricPattern({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 220"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden
    >
      <defs>
        <pattern id="geo-hero" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
          <g opacity="0.5">
            {/* 8-point star */}
            <polygon
              points="30,6 33.5,22 48,14 38.5,26 54,30 38.5,34 48,46 33.5,38 30,54 26.5,38 12,46 21.5,34 6,30 21.5,26 12,14 26.5,22"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.6"
            />
            {/* Inner octagon */}
            <polygon
              points="30,16 37,22 37,38 30,44 23,38 23,22"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.4"
            />
            {/* Center dot */}
            <circle cx="30" cy="30" r="1.5" fill="currentColor" opacity="0.4" />
            {/* Corner diamonds */}
            <polygon points="0,0 5,6 0,12 -5,6" fill="none" stroke="currentColor" strokeWidth="0.4" />
            <polygon points="60,0 65,6 60,12 55,6" fill="none" stroke="currentColor" strokeWidth="0.4" />
            <polygon points="0,60 5,66 0,72 -5,66" fill="none" stroke="currentColor" strokeWidth="0.4" />
            <polygon points="60,60 65,66 60,72 55,66" fill="none" stroke="currentColor" strokeWidth="0.4" />
          </g>
        </pattern>
      </defs>
      <rect width="400" height="220" fill="url(#geo-hero)" />
      {/* Large decorative star left */}
      <g transform="translate(40,110)" opacity="0.12">
        <polygon
          points="0,-42 9,-13 37,-13 15,5 24,34 0,16 -24,34 -15,5 -37,-13 -9,-13"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        />
      </g>
      {/* Large decorative star right */}
      <g transform="translate(360,110)" opacity="0.12">
        <polygon
          points="0,-42 9,-13 37,-13 15,5 24,34 0,16 -24,34 -15,5 -37,-13 -9,-13"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        />
      </g>
      {/* Crescent top center */}
      <g transform="translate(200,24)" opacity="0.15">
        <path
          d="M0,-14 a14,14 0 1,1 10,24 a10,10 0 1,0 -10,-24"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

// ── Greeting helper ───────────────────────────────────────────────────────────

function getDayGreeting() {
  const h = new Date().getHours();
  if (h < 5)  return "ليلة مباركة";
  if (h < 12) return "صباح النور";
  if (h < 17) return "ظهيرة طيبة";
  if (h < 20) return "مساء الخير";
  return "مساء النور";
}

// ── Main component ────────────────────────────────────────────────────────────

export function AppHero() {
  const { progress } = useUserProgress();
  const [greeting] = useState(getDayGreeting);

  const name: string | null = null;
  const hasCovenant = !!progress?.covenantSigned;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative w-full overflow-hidden"
      style={{ minHeight: 200 }}
    >
      {/* Background layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/12 via-background to-accent/8 dark:from-primary/18 dark:via-background dark:to-accent/10" />

      {/* Islamic pattern */}
      <GeometricPattern className="absolute inset-0 w-full h-full text-primary opacity-[0.07] dark:opacity-[0.09] pointer-events-none" />

      {/* Top shimmer line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      {/* Bottom fade */}
      <div
        className="absolute bottom-0 inset-x-0 h-16 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, transparent, var(--background))",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center pt-8 pb-10 px-5">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.55, ease: "backOut" }}
          className="mb-3"
        >
          <div
            className="w-[74px] h-[74px] rounded-full overflow-hidden ring-2 ring-primary/30 shadow-xl shadow-primary/20"
            style={{ boxShadow: "0 0 24px color-mix(in srgb, var(--primary) 30%, transparent), 0 4px 16px rgba(0,0,0,0.12)" }}
          >
            <img
              src="/images/logo.png"
              alt="دليل التوبة"
              className="w-full h-full object-cover"
            />
          </div>
        </motion.div>

        {/* App name */}
        <motion.h1
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.5 }}
          className="text-[18px] font-display font-bold text-foreground tracking-tight"
        >
          دليل التوبة النصوح
        </motion.h1>

        {/* Greeting / tagline */}
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.5 }}
          className="text-[12px] text-muted-foreground mt-1 flex items-center gap-1.5"
        >
          <span className="w-8 h-px bg-muted-foreground/30 rounded" />
          {name && hasCovenant ? `${greeting} ${name}` : greeting}
          <span className="w-8 h-px bg-muted-foreground/30 rounded" />
        </motion.p>
      </div>
    </motion.div>
  );
}
