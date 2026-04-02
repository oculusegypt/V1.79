import { type ReactNode, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface HeroHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  leftActions?: ReactNode;
  rightActions?: ReactNode;
  bottomContent?: ReactNode;
  className?: string;
}

export function HeroHeader({
  title,
  subtitle,
  showBack = false,
  onBack,
  leftActions,
  rightActions,
  bottomContent,
  className,
}: HeroHeaderProps) {
  const [, setLocation] = useLocation();
  const [compact, setCompact] = useState(false);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const onScroll = () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => {
        setCompact(window.scrollY > 60);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.length > 1 ? window.history.back() : setLocation("/");
    }
  };

  return (
    <div className={cn("absolute top-0 inset-x-0 z-20 pointer-events-none", className)}>
      <motion.div
        className="pointer-events-auto"
        animate={{
          paddingTop: compact ? 4 : 10,
          paddingBottom: compact ? 4 : 8,
        }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        <div className="flex items-center px-3 gap-2">
          {showBack && (
            <button
              onClick={handleBack}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-black/20 hover:bg-black/30 active:scale-95 backdrop-blur-sm transition-all text-white shrink-0"
              aria-label="رجوع"
            >
              <ChevronRight size={20} />
            </button>
          )}

          {(title || subtitle) && (
            <div className="flex-1 flex flex-col min-w-0">
              {title && (
                <motion.span
                  className="font-bold text-white drop-shadow leading-tight"
                  animate={{ fontSize: compact ? "14px" : "16px" }}
                  transition={{ duration: 0.25 }}
                >
                  {title}
                </motion.span>
              )}
              <AnimatePresence>
                {subtitle && !compact && (
                  <motion.span
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-[10px] text-white/70 leading-none mt-0.5"
                  >
                    {subtitle}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          )}

          <div className="mr-auto shrink-0 flex items-center gap-1.5">
            {leftActions}
          </div>
        </div>

        {!showBack && !title && (
          <div className="flex items-center justify-between px-3">
            <div className="flex items-center gap-1.5">{leftActions}</div>
            <div className="flex items-center gap-1.5">{rightActions}</div>
          </div>
        )}
      </motion.div>

      {bottomContent && (
        <AnimatePresence>
          {!compact && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="px-3 pb-2"
            >
              {bottomContent}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
