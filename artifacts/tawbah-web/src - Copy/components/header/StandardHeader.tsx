import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StandardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  onBack?: () => void;
  showBack?: boolean;
  right?: ReactNode;
  className?: string;
}

export function StandardHeader({
  title,
  subtitle,
  icon,
  onBack,
  showBack = true,
  right,
  className,
}: StandardHeaderProps) {
  const [, setLocation] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const onScroll = () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => {
        setScrolled(window.scrollY > 12);
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
    <div
      className={cn(
        "sticky top-0 z-30 transition-all duration-200",
        scrolled
          ? "bg-background/95 backdrop-blur-md shadow-sm shadow-black/5 border-b border-border/60"
          : "bg-background/80 backdrop-blur-sm border-b border-border/30",
        className,
      )}
      style={{ height: scrolled ? 52 : 58 }}
    >
      <div className="flex items-center h-full px-2 relative">
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
            {icon && (
              <span className="text-primary shrink-0">{icon}</span>
            )}
            <h1
              className="font-bold text-foreground leading-tight transition-all duration-200"
              style={{ fontSize: scrolled ? 14 : 15 }}
            >
              {title}
            </h1>
          </div>
          {subtitle && (
            <p
              className="text-muted-foreground leading-none mt-0.5 transition-all duration-200"
              style={{
                fontSize: scrolled ? 9 : 10,
                opacity: scrolled ? 0.7 : 1,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>

        <div className="mr-auto shrink-0">{right}</div>
      </div>
    </div>
  );
}
