import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  icon?: ReactNode;
  subtitle?: string;
  className?: string;
}

export function SectionHeader({ title, icon, subtitle, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex items-center gap-2.5 mb-4", className)}>
      {icon && (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary shadow-sm">
          {icon}
        </div>
      )}
      <div className="flex-1">
        <h2 className="text-base font-bold text-foreground tracking-tight">{title}</h2>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="h-px flex-1 bg-gradient-to-r from-muted/50 to-transparent ml-4" />
    </div>
  );
}

export const SECTION_CONFIG = {
  primary: {
    title: "الأهم",
    icon: null,
    subtitle: null,
  },
  daily: {
    title: "أدواتك اليومية",
    icon: null,
    subtitle: null,
  },
  growth: {
    title: "النمو والمحتوى",
    icon: null,
    subtitle: null,
  },
  community: {
    title: "المجتمع والمزيد",
    icon: null,
    subtitle: null,
  },
} as const;
