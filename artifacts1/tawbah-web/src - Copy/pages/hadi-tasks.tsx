import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { CheckSquare, Square, Trash2, ListChecks, Loader2, Bot } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { cn } from "@/lib/utils";
import { getSessionId } from "@/lib/session";

interface HadiTaskItem {
  id: number;
  title: string;
  completed: boolean;
  completedAt: string | null;
  orderIdx: number;
}

interface HadiTaskGroup {
  id: number;
  title: string;
  createdAt: string;
  items: HadiTaskItem[];
}

function useHadiTasks() {
  const sessionId = getSessionId();
  return useQuery<HadiTaskGroup[]>({
    queryKey: ["/api/hadi-tasks", sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/hadi-tasks?sessionId=${encodeURIComponent(sessionId)}`);
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    },
    staleTime: 0,
  });
}

function useToggleTask() {
  const sessionId = getSessionId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, completed }: { id: number; completed: boolean }) => {
      const res = await fetch(`/api/hadi-tasks/items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, completed }),
      });
      if (!res.ok) throw new Error("Failed to toggle");
      return res.json();
    },
    onMutate: async ({ id, completed }) => {
      await qc.cancelQueries({ queryKey: ["/api/hadi-tasks", sessionId] });
      const prev = qc.getQueryData<HadiTaskGroup[]>(["/api/hadi-tasks", sessionId]);
      qc.setQueryData<HadiTaskGroup[]>(["/api/hadi-tasks", sessionId], (old) =>
        old?.map((g) => ({
          ...g,
          items: g.items.map((item) =>
            item.id === id ? { ...item, completed } : item
          ),
        }))
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(["/api/hadi-tasks", sessionId], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["/api/hadi-tasks", sessionId] });
    },
  });
}

function useDeleteGroup() {
  const sessionId = getSessionId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (groupId: number) => {
      const res = await fetch(`/api/hadi-tasks/groups/${groupId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/hadi-tasks", sessionId] });
    },
  });
}

function TaskGroupCard({ group }: { group: HadiTaskGroup }) {
  const toggle = useToggleTask();
  const deleteGroup = useDeleteGroup();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const completedCount = group.items.filter((i) => i.completed).length;
  const total = group.items.length;
  const progress = total > 0 ? Math.round((completedCount / total) * 100) : 0;
  const allDone = completedCount === total && total > 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "bg-card rounded-2xl p-5 shadow-sm border transition-all",
        allDone ? "border-emerald-300/60 bg-emerald-50/30 dark:bg-emerald-950/10" : "border-border"
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base text-foreground leading-snug">{group.title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {completedCount} من {total} مهمة مكتملة
          </p>
        </div>
        <button
          onClick={() => setConfirmDelete(true)}
          className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="w-full h-1.5 bg-muted rounded-full mb-4 overflow-hidden">
        <motion.div
          className={cn(
            "h-full rounded-full transition-all",
            allDone ? "bg-emerald-500" : "bg-primary"
          )}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      <div className="flex flex-col gap-2">
        {group.items.map((item) => (
          <button
            key={item.id}
            onClick={() => toggle.mutate({ id: item.id, completed: !item.completed })}
            className={cn(
              "flex items-start gap-3 text-right w-full rounded-xl px-3 py-2.5 transition-all",
              item.completed
                ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400"
                : "bg-muted/50 hover:bg-muted text-foreground"
            )}
          >
            {item.completed
              ? <CheckSquare size={18} className="shrink-0 mt-0.5 text-emerald-500" />
              : <Square size={18} className="shrink-0 mt-0.5 text-muted-foreground" />
            }
            <span className={cn("text-sm leading-snug text-right", item.completed && "line-through opacity-70")}>
              {item.title}
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="mt-4 bg-destructive/10 rounded-xl p-3 border border-destructive/20"
          >
            <p className="text-sm text-destructive font-medium mb-2">حذف هذه المجموعة؟</p>
            <div className="flex gap-2">
              <button
                onClick={() => deleteGroup.mutate(group.id)}
                disabled={deleteGroup.isPending}
                className="flex-1 bg-destructive text-destructive-foreground text-xs py-1.5 rounded-lg font-medium"
              >
                {deleteGroup.isPending ? <Loader2 size={12} className="animate-spin mx-auto" /> : "نعم، احذف"}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 bg-muted text-muted-foreground text-xs py-1.5 rounded-lg"
              >
                إلغاء
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function HadiTasksPage() {
  const { data: groups, isLoading } = useHadiTasks();

  return (
    <div className="flex flex-col flex-1 pb-8">
      <PageHeader title="مهام هادي" subtitle="خطواتك نحو التوبة والاستقامة" icon={<ListChecks size={16} />} />
      <div className="relative bg-gradient-to-b from-emerald-600 to-emerald-700 px-5 pt-5 pb-8 rounded-b-[2rem] shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <ListChecks size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-white">مهام هادي</h1>
            <p className="text-emerald-100 text-sm">خطواتك نحو التوبة والاستقامة</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 relative z-10 flex flex-col gap-4 pt-2">
        {isLoading && (
          <div className="flex justify-center py-10">
            <Loader2 size={28} className="animate-spin text-emerald-500" />
          </div>
        )}

        {!isLoading && (!groups || groups.length === 0) && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl p-8 border border-border text-center flex flex-col items-center gap-4"
          >
            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/30 rounded-full flex items-center justify-center">
              <ListChecks size={28} className="text-emerald-500" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">لا توجد مهام بعد</h3>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-[260px] mx-auto">
                اطلب من الزكي نصيحة في شكل خطوات، ثم اضغط على زر "مهام هادي" لتحويلها لمهام تتابعها هنا
              </p>
            </div>
            <Link href="/zakiy">
              <button className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-full text-sm font-medium">
                <Bot size={16} />
                اسأل الزكي
              </button>
            </Link>
          </motion.div>
        )}

        <AnimatePresence mode="popLayout">
          {groups?.map((group) => (
            <TaskGroupCard key={group.id} group={group} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
