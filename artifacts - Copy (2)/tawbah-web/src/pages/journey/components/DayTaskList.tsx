import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiBase } from "@/lib/api-base";
import { getAuthHeader } from "@/lib/auth-client";
import { JourneyDay } from "../types";
import { extractSurahsFromTask, SurahButton } from "./SurahReader";
import {
  isDhikrCounterTask,
  isPrayerTask,
  isQuranPagesTask,
  parseIstighfarCount,
  getDhikrLabel,
  IstighfarCounter,
  PrayerReminderButton,
  QuranPagesButton,
} from "./TaskHelpers";

interface Props {
  day: JourneyDay;
  sessionId: string;
  onAllDone: () => void;
}

export function DayTaskList({ day, sessionId, onAllDone }: Props) {
  const queryClient = useQueryClient();
  const [optimistic, setOptimistic] = useState<boolean[]>(
    day.taskChecks?.length ? day.taskChecks : Array(day.tasks.length).fill(false),
  );
  const calledDone = useRef(false);

  useEffect(() => {
    setOptimistic(day.taskChecks?.length ? day.taskChecks : Array(day.tasks.length).fill(false));
    calledDone.current = false;
  }, [day.taskChecks, day.day]);

  const toggleMutation = useMutation({
    mutationFn: async ({ taskIndex, completed }: { taskIndex: number; completed: boolean }) => {
      const res = await fetch(`${getApiBase()}/journey30/task-toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ dayNumber: day.day, taskIndex, completed, sessionId }),
      });
      return res.json() as Promise<{ success: boolean; allDone: boolean }>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["journey30", sessionId] });
      if (data.allDone && !calledDone.current) {
        calledDone.current = true;
        onAllDone();
      }
    },
  });

  const toggle = (i: number) => {
    if (day.completed) return;
    const next = optimistic.map((v, idx) => (idx === i ? !v : v));
    setOptimistic(next);
    toggleMutation.mutate({ taskIndex: i, completed: next[i]! });
  };

  const doneCount = optimistic.filter(Boolean).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-xs font-bold text-muted-foreground">مهام اليوم {day.day}</span>
        <motion.span
          key={doneCount}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="text-xs font-black text-primary"
        >
          {doneCount}/{day.tasks.length}
        </motion.span>
      </div>

      <div className="flex flex-col gap-2.5">
        {day.tasks.map((task, i) => {
          const surahsForTask = extractSurahsFromTask(task);
          const isCounter = isDhikrCounterTask(task);
          const isPrayer = isPrayerTask(task);
          const isPages = isQuranPagesTask(task);

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.04 * i, duration: 0.3 }}
              className={`rounded-2xl border transition-all ${
                optimistic[i]
                  ? "bg-primary/5 border-primary/20 shadow-sm"
                  : "bg-muted/20 border-border/50"
              }`}
            >
              <div className="flex items-start gap-3 p-3.5">
                <button
                  onClick={() => toggle(i)}
                  className="shrink-0 mt-0.5"
                  disabled={day.completed}
                >
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                      optimistic[i]
                        ? "bg-primary border-primary shadow-md shadow-primary/25"
                        : "border-muted-foreground/25"
                    }`}
                  >
                    <AnimatePresence>
                      {optimistic[i] && (
                        <motion.div
                          initial={{ scale: 0, rotate: -45 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0 }}
                          transition={{ duration: 0.18, type: "spring", stiffness: 400, damping: 18 }}
                        >
                          <CheckCircle2 size={13} strokeWidth={3} className="text-primary-foreground" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </button>

                <span
                  className={`text-sm flex-1 leading-relaxed font-medium ${
                    optimistic[i] ? "line-through text-muted-foreground" : "text-foreground"
                  }`}
                >
                  {task}
                </span>
              </div>

              {!day.completed && (
                <div className="px-3.5 pb-3.5 flex flex-col gap-1.5">
                  {isCounter && (
                    <IstighfarCounter
                      count={parseIstighfarCount(task)}
                      done={optimistic[i] ?? false}
                      onDone={() => toggle(i)}
                      label={getDhikrLabel(task)}
                    />
                  )}
                  {isPrayer && <PrayerReminderButton task={task} />}
                  {isPages && (
                    <QuranPagesButton
                      done={optimistic[i] ?? false}
                      onDone={() => !optimistic[i] && toggle(i)}
                    />
                  )}
                  {surahsForTask && !isPages && (
                    <div className="flex flex-wrap gap-1.5">
                      <SurahButton task={task} />
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
