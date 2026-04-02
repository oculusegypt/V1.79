import { db } from "@workspace/db";
import { habitsTable, hadiTaskItemsTable, hadiTaskGroupsTable } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";

export interface UnifiedTask {
  id: string;
  source: "habits" | "hadi" | "journey";
  title: string;
  completed: boolean;
  priority: "required" | "recommended" | "optional";
  route?: string;
}

const TODAY_HABIT_KEYS = ["wudu", "salat_tawba", "delete_apps", "change_env"];
const TODAY_HABIT_NAMES: Record<string, string> = {
  wudu: "توضأ الآن",
  salat_tawba: "صلِّ ركعتين بنية التوبة",
  delete_apps: "احذف التطبيقات المحرمة",
  change_env: "غيّر بيئتك",
};

export async function getTodayTasks(
  sessionId: string,
  phase: number
): Promise<UnifiedTask[]> {
  const today = new Date().toISOString().split("T")[0]!;
  const tasks: UnifiedTask[] = [];

  if (phase <= 1) {
    const habitRows = await db
      .select()
      .from(habitsTable)
      .where(and(eq(habitsTable.sessionId, sessionId), eq(habitsTable.date, today)));

    const completedKeys = new Set(habitRows.filter((h) => h.completed).map((h) => h.habitKey));

    for (const key of TODAY_HABIT_KEYS) {
      tasks.push({
        id: `habit_${key}`,
        source: "habits",
        title: TODAY_HABIT_NAMES[key] ?? key,
        completed: completedKeys.has(key),
        priority: "required",
        route: "/day-one",
      });
    }
  } else {
    const habitRows = await db
      .select()
      .from(habitsTable)
      .where(and(eq(habitsTable.sessionId, sessionId), eq(habitsTable.date, today)));

    const completedKeys = new Set(habitRows.filter((h) => h.completed).map((h) => h.habitKey));

    for (const row of habitRows) {
      tasks.push({
        id: `habit_${row.habitKey}`,
        source: "habits",
        title: row.habitNameAr,
        completed: row.completed,
        priority: completedKeys.has(row.habitKey) ? "optional" : "recommended",
        route: "/habits",
      });
    }
  }

  const hadiGroups = await db
    .select()
    .from(hadiTaskGroupsTable)
    .where(eq(hadiTaskGroupsTable.sessionId, sessionId))
    .orderBy(desc(hadiTaskGroupsTable.createdAt))
    .limit(1);

  if (hadiGroups.length > 0) {
    const group = hadiGroups[0]!;
    const hadiItems = await db
      .select()
      .from(hadiTaskItemsTable)
      .where(
        and(
          eq(hadiTaskItemsTable.groupId, group.id),
          eq(hadiTaskItemsTable.completed, false)
        )
      )
      .limit(3);

    for (const item of hadiItems) {
      tasks.push({
        id: `hadi_${item.id}`,
        source: "hadi",
        title: item.text,
        completed: item.completed,
        priority: "recommended",
        route: "/hadi-tasks",
      });
    }
  }

  const requiredIncomplete = tasks.filter(
    (t) => t.priority === "required" && !t.completed
  );
  const requiredComplete = tasks.filter(
    (t) => t.priority === "required" && t.completed
  );
  const others = tasks.filter((t) => t.priority !== "required");

  return [...requiredIncomplete, ...others, ...requiredComplete];
}
