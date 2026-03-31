import { type ReactNode } from "react";
import { useLocation } from "wouter";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type ZakiyState = "emergency" | "repentance" | "growth" | null;

const STATE_STYLES: Record<
  NonNullable<ZakiyState>,
  { border: string; bg: string; dot: string; label: string }
> = {
  emergency: {
    border: "border-red-300/50 dark:border-red-700/40",
    bg: "bg-red-50/40 dark:bg-red-950/20",
    dot: "bg-red-500",
    label: "حالة طوارئ",
  },
  repentance: {
    border: "border-blue-300/50 dark:border-blue-700/40",
    bg: "bg-blue-50/40 dark:bg-blue-950/20",
    dot: "bg-blue-500",
    label: "رحلة التوبة",
  },
  growth: {
    border: "border-emerald-300/50 dark:border-emerald-700/40",
    bg: "bg-emerald-50/40 dark:bg-emerald-950/20",
    dot: "bg-emerald-500",
    label: "مرحلة النمو",
  },
};

export interface ContextHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  onBack?: () => void;
  showBack?: boolean;
  zakiyState?: ZakiyState;
  right?: ReactNode;
  className?: string;
}

export function ContextHeader({
  title,
  subtitle,
  icon,
  onBack,
  showBack = true,
  zakiyState = null,
  right,
  className,
}: ContextHeaderProps) {
  const [, setLocation] = useLocation();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.length > 1 ? window.history.back() : setLocation("/");
    }
  };

  const stateStyle = zakiyState ? STATE_STYLES[zakiyState] : null;

  return (
    <div
      className={cn(
        "sticky top-0 z-30 border-b transition-colors duration-500",
        "bg-background/95 backdrop-blur-md",
        stateStyle ? stateStyle.border : "border-border/50",
        stateStyle ? stateStyle.bg : "",
        className,
      )}
    >
      <div className="flex items-center h-14 px-2 relative">
        {showBack && (
          <button
            onClick={handleBack}
            className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-muted/70 active:scale-95 transition-all text-muted-foreground hover:text-foreground shrink-0"
            aria-label="رجوع"
          >
            <ChevronRight size={22} />
          </button>
        )}

        <div className="absolute inset-x-0 flex flex-col items-center justify-center pointer-events-none px-14">
          <div className="flex items-center gap-1.5">
            {icon && <span className="text-primary shrink-0">{icon}</span>}
            <h1 className="font-bold text-[15px] text-foreground leading-tight">
              {title}
            </h1>
          </div>
          {subtitle && (
            <div className="flex items-center gap-1.5 mt-0.5">
              {zakiyState && stateStyle && (
                <motion.span
                  key={zakiyState}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full flex-shrink-0",
                    stateStyle.dot,
                  )}
                />
              )}
              <p className="text-[10px] text-muted-foreground leading-none">
                {subtitle}
              </p>
            </div>
          )}
        </div>

        <div className="mr-auto shrink-0">{right}</div>
      </div>

      {zakiyState && (
        <motion.div
          key={zakiyState}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className={cn(
            "absolute bottom-0 inset-x-0 h-[2px] origin-right",
            zakiyState === "emergency" && "bg-red-400/60",
            zakiyState === "repentance" && "bg-blue-400/60",
            zakiyState === "growth" && "bg-emerald-400/60",
          )}
        />
      )}
    </div>
  );
}
