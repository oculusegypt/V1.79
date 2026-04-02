import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { dhikrRoomsTable, globalStatsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

const ROOM_TYPES = ["istighfar", "tasbih", "tahmid", "salawat"];

async function ensureRoom(roomType: string) {
  const existing = await db.query.dhikrRoomsTable.findFirst({
    where: eq(dhikrRoomsTable.roomType, roomType),
  });
  if (!existing) {
    const [row] = await db.insert(dhikrRoomsTable).values({ roomType, totalCount: 0 }).returning();
    return row;
  }
  return existing;
}

router.get("/dhikr-rooms", async (_req, res) => {
  const rooms = await Promise.all(
    ROOM_TYPES.map(async (type) => {
      const room = await ensureRoom(type);
      return {
        type: room.roomType,
        totalCount: room.totalCount,
        activeNow: Math.floor(Math.random() * 120) + 10,
      };
    })
  );
  res.json({ rooms });
});

router.post("/dhikr-rooms/:type/tap", async (req, res) => {
  const { type } = req.params;
  if (!ROOM_TYPES.includes(type)) {
    return res.status(400).json({ error: "نوع غير صحيح" });
  }

  await ensureRoom(type);

  const [updated] = await db
    .update(dhikrRoomsTable)
    .set({
      totalCount: sql`${dhikrRoomsTable.totalCount} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(dhikrRoomsTable.roomType, type))
    .returning();

  await db.insert(globalStatsTable).values({
    eventType: "dhikr",
    date: new Date().toISOString().split("T")[0],
  });

  res.json({ totalCount: updated.totalCount });
});

export default router;
