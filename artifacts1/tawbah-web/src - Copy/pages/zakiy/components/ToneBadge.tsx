import { cn } from "@/lib/utils";
import { TONE_STYLES } from "../constants";

export function getToneStyle(text: string) {
  for (const style of TONE_STYLES) {
    if (style.keywords.some((k) => text.includes(k))) return style;
  }
  return { emoji: "💬", className: "bg-teal-100 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-300/50" };
}

export function ToneBadge({ text }: { text: string }) {
  const style = getToneStyle(text);
  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border mx-0.5 align-middle",
      style.className
    )}>
      <span>{style.emoji}</span>
      <span className="font-sans">{text}</span>
    </span>
  );
}
