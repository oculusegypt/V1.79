import { pgTable, text, serial, boolean, integer, timestamp, date, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;

export const userProgressTable = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  sinCategory: text("sin_category").notNull().default("other"),
  sinIds: text("sin_ids"),
  covenantSigned: boolean("covenant_signed").notNull().default(false),
  covenantDate: timestamp("covenant_date"),
  currentPhase: integer("current_phase").notNull().default(1),
  day40Progress: integer("day40_progress").notNull().default(0),
  firstDayTasksCompleted: boolean("first_day_tasks_completed").notNull().default(false),
  streakDays: integer("streak_days").notNull().default(0),
  relapseCount: integer("relapse_count").notNull().default(0),
  lastActiveDate: date("last_active_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserProgressSchema = createInsertSchema(userProgressTable).omit({ id: true, createdAt: true });
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;
export type UserProgress = typeof userProgressTable.$inferSelect;

export const habitsTable = pgTable("habits", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  habitKey: text("habit_key").notNull(),
  habitNameAr: text("habit_name_ar").notNull(),
  completed: boolean("completed").notNull().default(false),
  date: date("date").notNull(),
});

export const insertHabitSchema = createInsertSchema(habitsTable).omit({ id: true });
export type InsertHabit = z.infer<typeof insertHabitSchema>;
export type Habit = typeof habitsTable.$inferSelect;

export const dhikrCountTable = pgTable("dhikr_count", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  date: date("date").notNull(),
  istighfar: integer("istighfar").notNull().default(0),
  tasbih: integer("tasbih").notNull().default(0),
  sayyid: integer("sayyid").notNull().default(0),
});

export const insertDhikrCountSchema = createInsertSchema(dhikrCountTable).omit({ id: true });
export type InsertDhikrCount = z.infer<typeof insertDhikrCountSchema>;
export type DhikrCount = typeof dhikrCountTable.$inferSelect;

export const kaffarahStepsTable = pgTable("kaffarah_steps", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  stepKey: text("step_key").notNull(),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertKaffarahStepSchema = createInsertSchema(kaffarahStepsTable).omit({ id: true, createdAt: true });
export type InsertKaffarahStep = z.infer<typeof insertKaffarahStepSchema>;
export type KaffarahStep = typeof kaffarahStepsTable.$inferSelect;

export const journalEntriesTable = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  content: text("content").notNull(),
  mood: text("mood").notNull().default("neutral"),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertJournalEntrySchema = createInsertSchema(journalEntriesTable).omit({ id: true, createdAt: true });
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
export type JournalEntry = typeof journalEntriesTable.$inferSelect;

export const zakiyMemoryTable = pgTable("zakiy_memory", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  memoryJson: text("memory_json").notNull().default("{}"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type ZakiyMemory = typeof zakiyMemoryTable.$inferSelect;

export const hadiTaskGroupsTable = pgTable("hadi_task_groups", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertHadiTaskGroupSchema = createInsertSchema(hadiTaskGroupsTable).omit({ id: true, createdAt: true });
export type InsertHadiTaskGroup = z.infer<typeof insertHadiTaskGroupSchema>;
export type HadiTaskGroup = typeof hadiTaskGroupsTable.$inferSelect;

export const hadiTaskItemsTable = pgTable("hadi_task_items", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  sessionId: text("session_id").notNull(),
  title: text("title").notNull(),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  orderIdx: integer("order_idx").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertHadiTaskItemSchema = createInsertSchema(hadiTaskItemsTable).omit({ id: true, createdAt: true });
export type InsertHadiTaskItem = z.infer<typeof insertHadiTaskItemSchema>;
export type HadiTaskItem = typeof hadiTaskItemsTable.$inferSelect;

export const globalStatsTable = pgTable("global_stats", {
  id: serial("id").primaryKey(),
  eventType: text("event_type").notNull(),
  date: date("date").notNull(),
  countryCode: text("country_code"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const challengesTable = pgTable("challenges", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  duration: integer("duration").notNull(),
  pledge: text("pledge"),
  startDate: date("start_date").notNull(),
  encouragements: integer("encouragements").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const journey30Table = pgTable("journey30", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  sessionId: text("session_id"),
  dayNumber: integer("day_number").notNull(),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  date: date("date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertJourney30Schema = createInsertSchema(journey30Table).omit({ id: true, createdAt: true });
export type InsertJourney30 = z.infer<typeof insertJourney30Schema>;
export type Journey30 = typeof journey30Table.$inferSelect;

export const journey30TasksTable = pgTable("journey30_tasks", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  sessionId: text("session_id"),
  dayNumber: integer("day_number").notNull(),
  taskIndex: integer("task_index").notNull(),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const dhikrRoomsTable = pgTable("dhikr_rooms", {
  id: serial("id").primaryKey(),
  roomType: text("room_type").notNull(),
  totalCount: integer("total_count").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const secretDuasTable = pgTable("secret_duas", {
  id: serial("id").primaryKey(),
  fromSessionId: text("from_session_id").notNull(),
  toSessionId: text("to_session_id"),
  content: text("content").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const communityDuasTable = pgTable("community_duas", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  content: text("content").notNull(),
  amenCount: integer("amen_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notificationSettingsTable = pgTable("notification_settings", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  settingsJson: text("settings_json").notNull().default("{}"),
  prayerCity: text("prayer_city"),
  prayerCountry: text("prayer_country"),
  prayerLat: text("prayer_lat"),
  prayerLng: text("prayer_lng"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const appInboxTable = pgTable("app_inbox", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  notifId: text("notif_id").notNull().unique(),
  type: text("type").notNull().default("reminder"),
  title: text("title").notNull(),
  body: text("body").notNull(),
  icon: text("icon").notNull().default("bell"),
  color: text("color").notNull().default("#4A90B8"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const pushSubscriptionsTable = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const pushJobsTable = pgTable("push_jobs", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  type: text("type").notNull().default("custom"),
  title: text("title").notNull(),
  body: text("body").notNull(),
  url: text("url").notNull().default("/"),
  fireAt: timestamp("fire_at").notNull(),
  sent: boolean("sent").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const pushFcmTokensTable = pgTable(
  "push_fcm_tokens",
  {
    id: serial("id").primaryKey(),
    sessionId: text("session_id").notNull(),
    platform: text("platform").notNull().default("android"),
    token: text("token").notNull(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => ({
    sessionPlatformUnique: uniqueIndex("push_fcm_tokens_session_platform_unique").on(
      t.sessionId,
      t.platform,
    ),
  }),
);
