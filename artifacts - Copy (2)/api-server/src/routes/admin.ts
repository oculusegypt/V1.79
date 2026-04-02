import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { db } from "@workspace/db";
import {
  userProgressTable,
  habitsTable,
  dhikrCountTable,
  kaffarahStepsTable,
  journalEntriesTable,
  zakiyMemoryTable,
  hadiTaskGroupsTable,
  hadiTaskItemsTable,
  journey30Table,
  dhikrRoomsTable,
  secretDuasTable,
  communityDuasTable,
  challengesTable,
  globalStatsTable,
} from "@workspace/db/schema";
import { eq, desc, count, sum, sql, and, gte, lte, like, asc } from "drizzle-orm";

const router: IRouter = Router();

// ─── Middleware: حماية بكلمة مرور ─────────────────────────────────────────
function adminAuth(req: Request, res: Response, next: NextFunction): void {
  const adminPassword = process.env.ADMIN_PASSWORD || "tawbah-admin-2024";
  const auth = req.headers["authorization"] || req.headers["x-admin-key"] || "";
  const token = auth.toString().replace(/^Bearer\s+/i, "").trim();
  if (token !== adminPassword) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

router.use(adminAuth);

// ─── T002: إحصائيات عامة ────────────────────────────────────────────────────
router.get("/stats/overview", async (_req, res) => {
  const [usersTotal] = await db.select({ count: count() }).from(userProgressTable);
  const [covenantSigned] = await db
    .select({ count: count() })
    .from(userProgressTable)
    .where(eq(userProgressTable.covenantSigned, true));

  const [dhikrTotals] = await db
    .select({
      istighfar: sum(dhikrCountTable.istighfar),
      tasbih: sum(dhikrCountTable.tasbih),
      sayyid: sum(dhikrCountTable.sayyid),
    })
    .from(dhikrCountTable);

  const [journalTotal] = await db.select({ count: count() }).from(journalEntriesTable);
  const [duasTotal] = await db.select({ count: count() }).from(communityDuasTable);
  const [amenTotal] = await db.select({ total: sum(communityDuasTable.amenCount) }).from(communityDuasTable);
  const [secretDuasTotal] = await db.select({ count: count() }).from(secretDuasTable);
  const [challengesTotal] = await db.select({ count: count() }).from(challengesTable);
  const [hadiGroupsTotal] = await db.select({ count: count() }).from(hadiTaskGroupsTable);

  const topCountries = await db
    .select({
      countryCode: globalStatsTable.countryCode,
      events: count(),
    })
    .from(globalStatsTable)
    .where(sql`${globalStatsTable.countryCode} is not null`)
    .groupBy(globalStatsTable.countryCode)
    .orderBy(desc(count()))
    .limit(10);

  const recentUsers = await db
    .select()
    .from(userProgressTable)
    .orderBy(desc(userProgressTable.createdAt))
    .limit(5);

  const habitStats = await db
    .select({
      habitKey: habitsTable.habitKey,
      total: count(),
      completed: sql<number>`sum(case when ${habitsTable.completed} then 1 else 0 end)`,
    })
    .from(habitsTable)
    .groupBy(habitsTable.habitKey)
    .orderBy(desc(count()));

  const dhikrRooms = await db.select().from(dhikrRoomsTable);

  res.json({
    users: {
      total: Number(usersTotal.count),
      covenantSigned: Number(covenantSigned.count),
    },
    dhikr: {
      istighfar: Number(dhikrTotals.istighfar ?? 0),
      tasbih: Number(dhikrTotals.tasbih ?? 0),
      sayyid: Number(dhikrTotals.sayyid ?? 0),
      total:
        Number(dhikrTotals.istighfar ?? 0) +
        Number(dhikrTotals.tasbih ?? 0) +
        Number(dhikrTotals.sayyid ?? 0),
    },
    journal: { total: Number(journalTotal.count) },
    duas: {
      community: Number(duasTotal.count),
      amenTotal: Number(amenTotal.total ?? 0),
      secret: Number(secretDuasTotal.count),
    },
    challenges: { total: Number(challengesTotal.count) },
    hadiGroups: { total: Number(hadiGroupsTotal.count) },
    topCountries,
    recentUsers,
    habitStats: habitStats.map((h) => ({
      habitKey: h.habitKey,
      total: Number(h.total),
      completed: Number(h.completed),
      rate: Number(h.total) > 0 ? Math.round((Number(h.completed) / Number(h.total)) * 100) : 0,
    })),
    dhikrRooms,
  });
});

// ─── T003: إدارة المستخدمين ────────────────────────────────────────────────
router.get("/users", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Number(req.query.offset) || 0;
  const search = (req.query.search as string) || "";
  const covenantFilter = req.query.covenant as string;
  const phaseFilter = req.query.phase as string;

  let query = db.select().from(userProgressTable).$dynamic();

  if (search) {
    query = query.where(like(userProgressTable.sessionId, `%${search}%`));
  }
  if (covenantFilter === "signed") {
    query = query.where(eq(userProgressTable.covenantSigned, true));
  } else if (covenantFilter === "unsigned") {
    query = query.where(eq(userProgressTable.covenantSigned, false));
  }
  if (phaseFilter) {
    query = query.where(eq(userProgressTable.currentPhase, Number(phaseFilter)));
  }

  const users = await query.orderBy(desc(userProgressTable.createdAt)).limit(limit).offset(offset);

  const [totalCount] = await db.select({ count: count() }).from(userProgressTable);

  res.json({ users, total: Number(totalCount.count), limit, offset });
});

router.get("/users/export", async (_req, res) => {
  const users = await db.select().from(userProgressTable).orderBy(desc(userProgressTable.createdAt));
  const headers = ["id", "sessionId", "sinCategory", "covenantSigned", "currentPhase", "streakDays", "day40Progress", "createdAt"];
  const csv = [
    headers.join(","),
    ...users.map((u) =>
      headers.map((h) => JSON.stringify((u as Record<string, unknown>)[h] ?? "")).join(",")
    ),
  ].join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=users.csv");
  res.send(csv);
});

router.get("/users/:sessionId", async (req, res) => {
  const { sessionId } = req.params;
  const user = await db.query.userProgressTable.findFirst({
    where: eq(userProgressTable.sessionId, sessionId),
  });
  if (!user) return res.status(404).json({ error: "User not found" });

  const habits = await db
    .select()
    .from(habitsTable)
    .where(eq(habitsTable.sessionId, sessionId))
    .orderBy(desc(habitsTable.date))
    .limit(30);

  const dhikr = await db
    .select()
    .from(dhikrCountTable)
    .where(eq(dhikrCountTable.sessionId, sessionId))
    .orderBy(desc(dhikrCountTable.date))
    .limit(30);

  const journal = await db
    .select()
    .from(journalEntriesTable)
    .where(eq(journalEntriesTable.sessionId, sessionId))
    .orderBy(desc(journalEntriesTable.createdAt))
    .limit(10);

  const hadiGroups = await db
    .select()
    .from(hadiTaskGroupsTable)
    .where(eq(hadiTaskGroupsTable.sessionId, sessionId));

  const journey = await db
    .select()
    .from(journey30Table)
    .where(eq(journey30Table.sessionId, sessionId))
    .orderBy(asc(journey30Table.dayNumber));

  const memory = await db.query.zakiyMemoryTable.findFirst({
    where: eq(zakiyMemoryTable.sessionId, sessionId),
  });

  res.json({ user, habits, dhikr, journal, hadiGroups, journey, memory });
});

router.put("/users/:sessionId", async (req, res) => {
  const { sessionId } = req.params;
  const { streakDays, currentPhase, sinCategory, covenantSigned, day40Progress } = req.body;

  const updateData: Record<string, unknown> = {};
  if (streakDays !== undefined) updateData.streakDays = Number(streakDays);
  if (currentPhase !== undefined) updateData.currentPhase = Number(currentPhase);
  if (sinCategory !== undefined) updateData.sinCategory = sinCategory;
  if (covenantSigned !== undefined) updateData.covenantSigned = Boolean(covenantSigned);
  if (day40Progress !== undefined) updateData.day40Progress = Number(day40Progress);

  const [updated] = await db
    .update(userProgressTable)
    .set(updateData)
    .where(eq(userProgressTable.sessionId, sessionId))
    .returning();

  if (!updated) return res.status(404).json({ error: "User not found" });
  res.json(updated);
});

router.delete("/users/:sessionId", async (req, res) => {
  const { sessionId } = req.params;
  await db.delete(habitsTable).where(eq(habitsTable.sessionId, sessionId));
  await db.delete(dhikrCountTable).where(eq(dhikrCountTable.sessionId, sessionId));
  await db.delete(journalEntriesTable).where(eq(journalEntriesTable.sessionId, sessionId));
  await db.delete(kaffarahStepsTable).where(eq(kaffarahStepsTable.sessionId, sessionId));
  await db.delete(zakiyMemoryTable).where(eq(zakiyMemoryTable.sessionId, sessionId));
  await db.delete(hadiTaskItemsTable).where(eq(hadiTaskItemsTable.sessionId, sessionId));
  await db.delete(hadiTaskGroupsTable).where(eq(hadiTaskGroupsTable.sessionId, sessionId));
  await db.delete(journey30Table).where(eq(journey30Table.sessionId, sessionId));
  await db.delete(communityDuasTable).where(eq(communityDuasTable.sessionId, sessionId));
  await db.delete(secretDuasTable).where(eq(secretDuasTable.fromSessionId, sessionId));
  await db.delete(userProgressTable).where(eq(userProgressTable.sessionId, sessionId));
  res.json({ success: true });
});

// ─── T004: إدارة العادات ────────────────────────────────────────────────────
router.get("/habits", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  const offset = Number(req.query.offset) || 0;
  const sessionId = req.query.sessionId as string;
  const dateFrom = req.query.dateFrom as string;
  const dateTo = req.query.dateTo as string;
  const completed = req.query.completed as string;

  let query = db.select().from(habitsTable).$dynamic();
  if (sessionId) query = query.where(eq(habitsTable.sessionId, sessionId));
  if (dateFrom) query = query.where(gte(habitsTable.date, dateFrom));
  if (dateTo) query = query.where(lte(habitsTable.date, dateTo));
  if (completed === "true") query = query.where(eq(habitsTable.completed, true));
  else if (completed === "false") query = query.where(eq(habitsTable.completed, false));

  const habits = await query.orderBy(desc(habitsTable.date)).limit(limit).offset(offset);
  const [totalCount] = await db.select({ count: count() }).from(habitsTable);

  res.json({ habits, total: Number(totalCount.count) });
});

router.get("/habits/stats", async (_req, res) => {
  const stats = await db
    .select({
      habitKey: habitsTable.habitKey,
      habitNameAr: habitsTable.habitNameAr,
      total: count(),
      completed: sql<number>`sum(case when ${habitsTable.completed} then 1 else 0 end)`,
    })
    .from(habitsTable)
    .groupBy(habitsTable.habitKey, habitsTable.habitNameAr)
    .orderBy(desc(count()));

  res.json(
    stats.map((s) => ({
      ...s,
      total: Number(s.total),
      completed: Number(s.completed),
      rate: Number(s.total) > 0 ? Math.round((Number(s.completed) / Number(s.total)) * 100) : 0,
    }))
  );
});

router.put("/habits/:id", async (req, res) => {
  const [updated] = await db
    .update(habitsTable)
    .set({ completed: req.body.completed })
    .where(eq(habitsTable.id, Number(req.params.id)))
    .returning();
  res.json(updated);
});

router.delete("/habits/:id", async (req, res) => {
  await db.delete(habitsTable).where(eq(habitsTable.id, Number(req.params.id)));
  res.json({ success: true });
});

// ─── T005: إدارة الذكر ─────────────────────────────────────────────────────
router.get("/dhikr/personal", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  const offset = Number(req.query.offset) || 0;
  const sessionId = req.query.sessionId as string;

  let query = db.select().from(dhikrCountTable).$dynamic();
  if (sessionId) query = query.where(eq(dhikrCountTable.sessionId, sessionId));

  const records = await query.orderBy(desc(dhikrCountTable.date)).limit(limit).offset(offset);
  const [totalCount] = await db.select({ count: count() }).from(dhikrCountTable);

  const [totals] = await db.select({
    istighfar: sum(dhikrCountTable.istighfar),
    tasbih: sum(dhikrCountTable.tasbih),
    sayyid: sum(dhikrCountTable.sayyid),
  }).from(dhikrCountTable);

  res.json({ records, total: Number(totalCount.count), totals });
});

router.get("/dhikr/rooms", async (_req, res) => {
  const rooms = await db.select().from(dhikrRoomsTable);
  res.json(rooms);
});

router.put("/dhikr/rooms/:type", async (req, res) => {
  const { type } = req.params;
  const { totalCount } = req.body;
  const [updated] = await db
    .update(dhikrRoomsTable)
    .set({ totalCount: Number(totalCount), updatedAt: new Date() })
    .where(eq(dhikrRoomsTable.roomType, type))
    .returning();
  if (!updated) return res.status(404).json({ error: "Room not found" });
  res.json(updated);
});

router.delete("/dhikr/personal/:id", async (req, res) => {
  await db.delete(dhikrCountTable).where(eq(dhikrCountTable.id, Number(req.params.id)));
  res.json({ success: true });
});

// ─── T006: إدارة اليوميات ───────────────────────────────────────────────────
router.get("/journal", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Number(req.query.offset) || 0;
  const sessionId = req.query.sessionId as string;
  const mood = req.query.mood as string;

  let query = db.select().from(journalEntriesTable).$dynamic();
  if (sessionId) query = query.where(eq(journalEntriesTable.sessionId, sessionId));
  if (mood) query = query.where(eq(journalEntriesTable.mood, mood));

  const entries = await query.orderBy(desc(journalEntriesTable.createdAt)).limit(limit).offset(offset);
  const [totalCount] = await db.select({ count: count() }).from(journalEntriesTable);

  res.json({ entries, total: Number(totalCount.count) });
});

router.get("/journal/moods-stats", async (_req, res) => {
  const stats = await db
    .select({
      mood: journalEntriesTable.mood,
      count: count(),
    })
    .from(journalEntriesTable)
    .groupBy(journalEntriesTable.mood)
    .orderBy(desc(count()));
  res.json(stats.map((s) => ({ ...s, count: Number(s.count) })));
});

router.get("/journal/:id", async (req, res) => {
  const entry = await db.query.journalEntriesTable.findFirst({
    where: eq(journalEntriesTable.id, Number(req.params.id)),
  });
  if (!entry) return res.status(404).json({ error: "Not found" });
  res.json(entry);
});

router.delete("/journal/:id", async (req, res) => {
  await db.delete(journalEntriesTable).where(eq(journalEntriesTable.id, Number(req.params.id)));
  res.json({ success: true });
});

// ─── T007: إدارة الكفارة ────────────────────────────────────────────────────
router.get("/kaffarah", async (req, res) => {
  const sessionId = req.query.sessionId as string;
  const completed = req.query.completed as string;

  let query = db.select().from(kaffarahStepsTable).$dynamic();
  if (sessionId) query = query.where(eq(kaffarahStepsTable.sessionId, sessionId));
  if (completed === "true") query = query.where(eq(kaffarahStepsTable.completed, true));
  else if (completed === "false") query = query.where(eq(kaffarahStepsTable.completed, false));

  const steps = await query.orderBy(desc(kaffarahStepsTable.createdAt));
  const [totalCount] = await db.select({ count: count() }).from(kaffarahStepsTable);
  res.json({ steps, total: Number(totalCount.count) });
});

router.get("/kaffarah/stats", async (_req, res) => {
  const stats = await db
    .select({
      stepKey: kaffarahStepsTable.stepKey,
      total: count(),
      completed: sql<number>`sum(case when ${kaffarahStepsTable.completed} then 1 else 0 end)`,
    })
    .from(kaffarahStepsTable)
    .groupBy(kaffarahStepsTable.stepKey)
    .orderBy(desc(count()));
  res.json(
    stats.map((s) => ({
      ...s,
      total: Number(s.total),
      completed: Number(s.completed),
      rate: Number(s.total) > 0 ? Math.round((Number(s.completed) / Number(s.total)) * 100) : 0,
    }))
  );
});

router.put("/kaffarah/:id", async (req, res) => {
  const [updated] = await db
    .update(kaffarahStepsTable)
    .set({ completed: req.body.completed, completedAt: req.body.completed ? new Date() : null })
    .where(eq(kaffarahStepsTable.id, Number(req.params.id)))
    .returning();
  res.json(updated);
});

router.delete("/kaffarah/:id", async (req, res) => {
  await db.delete(kaffarahStepsTable).where(eq(kaffarahStepsTable.id, Number(req.params.id)));
  res.json({ success: true });
});

// ─── T008: إدارة ذاكرة زكي ─────────────────────────────────────────────────
router.get("/zakiy-memory", async (_req, res) => {
  const memories = await db.select().from(zakiyMemoryTable).orderBy(desc(zakiyMemoryTable.updatedAt));
  res.json({ memories, total: memories.length });
});

router.get("/zakiy-memory/:sessionId", async (req, res) => {
  const memory = await db.query.zakiyMemoryTable.findFirst({
    where: eq(zakiyMemoryTable.sessionId, req.params.sessionId),
  });
  if (!memory) return res.status(404).json({ error: "Not found" });
  res.json(memory);
});

router.put("/zakiy-memory/:sessionId", async (req, res) => {
  const [updated] = await db
    .update(zakiyMemoryTable)
    .set({ memoryJson: JSON.stringify(req.body.memoryJson), updatedAt: new Date() })
    .where(eq(zakiyMemoryTable.sessionId, req.params.sessionId))
    .returning();
  if (!updated) return res.status(404).json({ error: "Not found" });
  res.json(updated);
});

router.delete("/zakiy-memory/:sessionId", async (req, res) => {
  await db.delete(zakiyMemoryTable).where(eq(zakiyMemoryTable.sessionId, req.params.sessionId));
  res.json({ success: true });
});

// ─── T009: إدارة مهام هادي ─────────────────────────────────────────────────
router.get("/hadi-tasks", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Number(req.query.offset) || 0;
  const sessionId = req.query.sessionId as string;

  let query = db.select().from(hadiTaskGroupsTable).$dynamic();
  if (sessionId) query = query.where(eq(hadiTaskGroupsTable.sessionId, sessionId));

  const groups = await query.orderBy(desc(hadiTaskGroupsTable.createdAt)).limit(limit).offset(offset);
  const [totalCount] = await db.select({ count: count() }).from(hadiTaskGroupsTable);

  const groupsWithStats = await Promise.all(
    groups.map(async (g) => {
      const items = await db
        .select({
          total: count(),
          completed: sql<number>`sum(case when ${hadiTaskItemsTable.completed} then 1 else 0 end)`,
        })
        .from(hadiTaskItemsTable)
        .where(eq(hadiTaskItemsTable.groupId, g.id));
      return {
        ...g,
        totalItems: Number(items[0]?.total ?? 0),
        completedItems: Number(items[0]?.completed ?? 0),
      };
    })
  );

  res.json({ groups: groupsWithStats, total: Number(totalCount.count) });
});

router.get("/hadi-tasks/:groupId/items", async (req, res) => {
  const items = await db
    .select()
    .from(hadiTaskItemsTable)
    .where(eq(hadiTaskItemsTable.groupId, Number(req.params.groupId)))
    .orderBy(asc(hadiTaskItemsTable.orderIdx));
  res.json(items);
});

router.put("/hadi-tasks/items/:itemId", async (req, res) => {
  const [updated] = await db
    .update(hadiTaskItemsTable)
    .set({ completed: req.body.completed, completedAt: req.body.completed ? new Date() : null })
    .where(eq(hadiTaskItemsTable.id, Number(req.params.itemId)))
    .returning();
  res.json(updated);
});

router.delete("/hadi-tasks/:groupId", async (req, res) => {
  await db.delete(hadiTaskItemsTable).where(eq(hadiTaskItemsTable.groupId, Number(req.params.groupId)));
  await db.delete(hadiTaskGroupsTable).where(eq(hadiTaskGroupsTable.id, Number(req.params.groupId)));
  res.json({ success: true });
});

// ─── T010: إدارة رحلة 30 يوم ───────────────────────────────────────────────
router.get("/journey30", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  const offset = Number(req.query.offset) || 0;
  const sessionId = req.query.sessionId as string;

  let query = db.select().from(journey30Table).$dynamic();
  if (sessionId) query = query.where(eq(journey30Table.sessionId, sessionId));

  const records = await query.orderBy(desc(journey30Table.createdAt)).limit(limit).offset(offset);
  const [totalCount] = await db.select({ count: count() }).from(journey30Table);

  res.json({ records, total: Number(totalCount.count) });
});

router.get("/journey30/stats", async (_req, res) => {
  const stats = await db
    .select({
      dayNumber: journey30Table.dayNumber,
      total: count(),
      completed: sql<number>`sum(case when ${journey30Table.completed} then 1 else 0 end)`,
    })
    .from(journey30Table)
    .groupBy(journey30Table.dayNumber)
    .orderBy(asc(journey30Table.dayNumber));
  res.json(
    stats.map((s) => ({
      ...s,
      total: Number(s.total),
      completed: Number(s.completed),
      rate: Number(s.total) > 0 ? Math.round((Number(s.completed) / Number(s.total)) * 100) : 0,
    }))
  );
});

router.put("/journey30/:id", async (req, res) => {
  const [updated] = await db
    .update(journey30Table)
    .set({ completed: req.body.completed, completedAt: req.body.completed ? new Date() : null })
    .where(eq(journey30Table.id, Number(req.params.id)))
    .returning();
  res.json(updated);
});

router.delete("/journey30/:sessionId", async (req, res) => {
  await db.delete(journey30Table).where(eq(journey30Table.sessionId, req.params.sessionId));
  res.json({ success: true });
});

// ─── T011: إدارة الأدعية ────────────────────────────────────────────────────
router.get("/community-duas", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Number(req.query.offset) || 0;
  const duas = await db
    .select()
    .from(communityDuasTable)
    .orderBy(desc(communityDuasTable.amenCount))
    .limit(limit)
    .offset(offset);
  const [totalCount] = await db.select({ count: count() }).from(communityDuasTable);
  const [amenTotal] = await db.select({ total: sum(communityDuasTable.amenCount) }).from(communityDuasTable);
  res.json({ duas, total: Number(totalCount.count), amenTotal: Number(amenTotal.total ?? 0) });
});

router.delete("/community-duas/:id", async (req, res) => {
  await db.delete(communityDuasTable).where(eq(communityDuasTable.id, Number(req.params.id)));
  res.json({ success: true });
});

router.get("/secret-duas", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Number(req.query.offset) || 0;
  const isRead = req.query.isRead as string;

  let query = db.select().from(secretDuasTable).$dynamic();
  if (isRead === "true") query = query.where(eq(secretDuasTable.isRead, true));
  else if (isRead === "false") query = query.where(eq(secretDuasTable.isRead, false));

  const duas = await query.orderBy(desc(secretDuasTable.createdAt)).limit(limit).offset(offset);
  const [totalCount] = await db.select({ count: count() }).from(secretDuasTable);
  const [unreadCount] = await db
    .select({ count: count() })
    .from(secretDuasTable)
    .where(eq(secretDuasTable.isRead, false));
  res.json({ duas, total: Number(totalCount.count), unread: Number(unreadCount.count) });
});

router.delete("/secret-duas/:id", async (req, res) => {
  await db.delete(secretDuasTable).where(eq(secretDuasTable.id, Number(req.params.id)));
  res.json({ success: true });
});

// ─── T012: إدارة التحديات والخريطة ─────────────────────────────────────────
router.get("/challenges", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Number(req.query.offset) || 0;
  const challenges = await db
    .select()
    .from(challengesTable)
    .orderBy(desc(challengesTable.createdAt))
    .limit(limit)
    .offset(offset);
  const [totalCount] = await db.select({ count: count() }).from(challengesTable);
  res.json({ challenges, total: Number(totalCount.count) });
});

router.delete("/challenges/:slug", async (req, res) => {
  await db.delete(challengesTable).where(eq(challengesTable.slug, req.params.slug));
  res.json({ success: true });
});

router.get("/global-stats", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  const offset = Number(req.query.offset) || 0;
  const countryCode = req.query.countryCode as string;
  const eventType = req.query.eventType as string;

  let query = db.select().from(globalStatsTable).$dynamic();
  if (countryCode) query = query.where(eq(globalStatsTable.countryCode, countryCode));
  if (eventType) query = query.where(eq(globalStatsTable.eventType, eventType));

  const records = await query.orderBy(desc(globalStatsTable.createdAt)).limit(limit).offset(offset);
  const [totalCount] = await db.select({ count: count() }).from(globalStatsTable);
  res.json({ records, total: Number(totalCount.count) });
});

router.get("/global-stats/map", async (_req, res) => {
  const mapData = await db
    .select({
      countryCode: globalStatsTable.countryCode,
      events: count(),
    })
    .from(globalStatsTable)
    .where(sql`${globalStatsTable.countryCode} is not null`)
    .groupBy(globalStatsTable.countryCode)
    .orderBy(desc(count()));
  res.json(mapData.map((d) => ({ ...d, events: Number(d.events) })));
});

router.delete("/global-stats", async (_req, res) => {
  await db.delete(globalStatsTable);
  res.json({ success: true });
});

export default router;
