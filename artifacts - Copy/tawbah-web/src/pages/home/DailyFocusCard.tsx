import { motion } from "framer-motion";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

const DAILY_TASKS = [
  {
    icon: "📖",
    task: "اقرأ صفحتين من القرآن الكريم بتدبر وخشوع",
    category: "قرآن",
    color: "#c8a84b",
  },
  {
    icon: "🌙",
    task: "صلِّ ركعتي الضحى قبل الظهر واسأل الله حاجتك",
    category: "صلاة",
    color: "#6366f1",
  },
  {
    icon: "📿",
    task: "سبّح الله ١٠٠ مرة بالمسبحة مع التركيز",
    category: "ذكر",
    color: "#f59e0b",
  },
  {
    icon: "✍️",
    task: "اكتب في يوميات توبتك تأملاً أو دعاءً صادقاً",
    category: "يوميات",
    color: "#8b5cf6",
  },
  {
    icon: "🤝",
    task: "ادعُ لأخٍ مجهول في الصديق السري بظهر الغيب",
    category: "دعاء",
    color: "#ec4899",
  },
  {
    icon: "💪",
    task: "أتمم مهمة واحدة من مهام هادي اليوم بنية صادقة",
    category: "عمل",
    color: "#10b981",
  },
  {
    icon: "🌟",
    task: "راجع تقدمك في رحلة الثلاثين يوماً واحتفل بيوم جديد",
    category: "تقدم",
    color: "#0ea5e9",
  },
];

export function DailyFocusCard() {
  const todayTask = DAILY_TASKS[new Date().getDay() % DAILY_TASKS.length]!;
  const todayKey = `focus_done_${new Date().toDateString()}`;
  const [done, setDone] = useState<boolean>(() => {
    try {
      return localStorage.getItem(todayKey) === "1";
    } catch {
      return false;
    }
  });

  const markDone = () => {
    setDone(true);
    try {
      localStorage.setItem(todayKey, "1");
    } catch {}
    if (navigator.vibrate) navigator.vibrate([12, 8, 12]);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-[20px] p-4"
      style={{
        background: `linear-gradient(135deg, ${todayTask.color}12 0%, ${todayTask.color}05 100%)`,
        border: `1px solid ${todayTask.color}26`,
      }}
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 18 }}>{todayTask.icon}</span>
          <div>
            <p
              className="text-[10px] font-extrabold tracking-wide"
              style={{ color: todayTask.color }}
            >
              تركيزك اليوم
            </p>
            <p className="text-[9px] text-muted-foreground">
              {todayTask.category}
            </p>
          </div>
        </div>
        {done && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full"
            style={{ background: `${todayTask.color}20` }}
          >
            <CheckCircle2 size={11} style={{ color: todayTask.color }} />
            <span
              className="text-[10px] font-bold"
              style={{ color: todayTask.color }}
            >
              أحسنت!
            </span>
          </motion.div>
        )}
      </div>

      <p className="text-[13px] font-semibold leading-relaxed text-right mb-3">
        {todayTask.task}
      </p>

      {!done ? (
        <button
          onClick={markDone}
          className="w-full py-2 rounded-xl text-[12px] font-bold transition-all active:scale-95"
          style={{
            background: `${todayTask.color}1a`,
            color: todayTask.color,
            border: `1px solid ${todayTask.color}30`,
          }}
        >
          ✓ أتممت هذه المهمة
        </button>
      ) : (
        <p className="text-center text-[11px] text-muted-foreground">
          بارك الله فيك 🌟 واصل الاستمرارية كل يوم
        </p>
      )}
    </motion.div>
  );
}
