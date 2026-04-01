// In-app notification system — backed by API with localStorage fallback

import { getApiBase } from "./api-base";

export interface AppNotification {
  id: string;          // notifId (string, unique)
  type: "reminder" | "achievement" | "community" | "spiritual" | "warning";
  title: string;
  body: string;
  icon: string;
  color: string;
  isRead: boolean;
  createdAt: string;
  link?: string;       // optional navigation link when tapped
}

const STORAGE_KEY = "tawbah_web_inbox";
const API_BASE = getApiBase();

function getSessionId(): string {
  return localStorage.getItem("tawbah_session") ?? "guest";
}

function generateId(): string {
  return `w_notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0]!;
}

// ── localStorage helpers ──────────────────────────────────────────────────────

export function loadNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AppNotification[];
  } catch {
    return [];
  }
}

export function saveNotifications(notifications: AppNotification[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  } catch {}
}

export function getUnreadCount(): number {
  return loadNotifications().filter((n) => !n.isRead).length;
}

// ── API helpers ───────────────────────────────────────────────────────────────

export async function fetchInboxFromApi(): Promise<AppNotification[]> {
  try {
    const sessionId = getSessionId();
    const res = await fetch(`${API_BASE}/notifications/inbox?sessionId=${encodeURIComponent(sessionId)}`);
    if (!res.ok) return loadNotifications();
    const rows = await res.json() as {
      notifId: string; type: string; title: string; body: string;
      icon: string; color: string; isRead: boolean; createdAt: string;
    }[];
    return rows.map((r) => ({
      id: r.notifId,
      type: r.type as AppNotification["type"],
      title: r.title,
      body: r.body,
      icon: r.icon,
      color: r.color,
      isRead: r.isRead,
      createdAt: r.createdAt,
    }));
  } catch {
    return loadNotifications();
  }
}

export async function addToInboxApi(notif: {
  id?: string;
  type: AppNotification["type"];
  title: string;
  body: string;
  icon?: string;
  color?: string;
}): Promise<AppNotification> {
  const notifId = notif.id ?? generateId();
  const now = new Date().toISOString();
  const newNotif: AppNotification = {
    id: notifId,
    type: notif.type,
    title: notif.title,
    body: notif.body,
    icon: notif.icon ?? "bell",
    color: notif.color ?? "#4A90B8",
    isRead: false,
    createdAt: now,
  };

  // Persist to localStorage immediately
  const existing = loadNotifications();
  if (!existing.find((n) => n.id === notifId)) {
    saveNotifications([newNotif, ...existing].slice(0, 50));
  }

  // Sync to API (non-blocking)
  const sessionId = getSessionId();
  fetch(`${API_BASE}/notifications/inbox`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId,
      notifId,
      type: notif.type,
      title: notif.title,
      body: notif.body,
      icon: notif.icon ?? "bell",
      color: notif.color ?? "#4A90B8",
    }),
  }).catch(() => {});

  return newNotif;
}

export function markAsRead(id: string): void {
  const notifications = loadNotifications();
  const updated = notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n));
  saveNotifications(updated);
  // Sync to API
  fetch(`${API_BASE}/notifications/inbox/${encodeURIComponent(id)}/read`, { method: "PATCH" }).catch(() => {});
}

export function markAllAsRead(): void {
  const notifications = loadNotifications();
  saveNotifications(notifications.map((n) => ({ ...n, isRead: true })));
  const sessionId = getSessionId();
  fetch(`${API_BASE}/notifications/inbox/read-all`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  }).catch(() => {});
}

export function deleteNotification(id: string): void {
  saveNotifications(loadNotifications().filter((n) => n.id !== id));
  fetch(`${API_BASE}/notifications/inbox/${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => {});
}

// ── Fired-today tracking (prevents duplicate polling-based firing) ─────────────

const FIRED_KEY_PREFIX = "notifs_fired_";

export function hasFiredToday(tag: string): boolean {
  const today = new Date().toDateString();
  const raw = localStorage.getItem(`${FIRED_KEY_PREFIX}${today}`) ?? "[]";
  try { return (JSON.parse(raw) as string[]).includes(tag); } catch { return false; }
}

export function markFiredToday(tag: string): void {
  const today = new Date().toDateString();
  const key = `${FIRED_KEY_PREFIX}${today}`;
  const raw = localStorage.getItem(key) ?? "[]";
  try {
    const fired = JSON.parse(raw) as string[];
    if (!fired.includes(tag)) {
      fired.push(tag);
      localStorage.setItem(key, JSON.stringify(fired));
    }
  } catch {
    localStorage.setItem(key, JSON.stringify([tag]));
  }
  // Cleanup previous days (keep today only)
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  localStorage.removeItem(`${FIRED_KEY_PREFIX}${yesterday}`);
}

// ── Seeding (legacy localStorage approach, still used as initial seed) ─────────

const SPIRITUAL_POOL: Omit<AppNotification, "id" | "isRead" | "createdAt">[] = [
  {
    type: "spiritual",
    title: "آية اليوم",
    body: "﴿إِنَّ اللَّهَ يُحِبُّ التَّوَّابِينَ وَيُحِبُّ الْمُتَطَهِّرِينَ﴾ — البقرة: ٢٢٢",
    icon: "book-open",
    color: "#16a34a",
  },
  {
    type: "spiritual",
    title: "تذكّر",
    body: "«مَن تاب قبل أن تطلع الشمس من مغربها، تاب الله عليه» — رواه مسلم",
    icon: "sun",
    color: "#d97706",
  },
  {
    type: "spiritual",
    title: "قوّة الاستغفار",
    body: "«من أكثر من الاستغفار جعل الله له من كل هم فرجًا، ومن كل ضيق مخرجًا» — رواه أبو داود",
    icon: "heart",
    color: "#4A90B8",
  },
  {
    type: "spiritual",
    title: "آية كريمة",
    body: "﴿وَمَن يَعْمَلْ سُوءًا أَوْ يَظْلِمْ نَفْسَهُ ثُمَّ يَسْتَغْفِرِ اللَّهَ يَجِدِ اللَّهَ غَفُورًا رَّحِيمًا﴾ — النساء: ١١٠",
    icon: "book-open",
    color: "#16a34a",
  },
  {
    type: "spiritual",
    title: "رحمة الله واسعة",
    body: "﴿قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَى أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ﴾ — الزمر: ٥٣",
    icon: "sun",
    color: "#8E5CA8",
  },
];

const REMINDER_POOL: Omit<AppNotification, "id" | "isRead" | "createdAt">[] = [
  {
    type: "reminder",
    title: "ورد الصباح",
    body: "لا تنسَ ذكر الصباح — سيد الاستغفار يُحصّنك ليومك كله 🌅",
    icon: "sunrise",
    color: "#d97706",
    link: "/adhkar",
  },
  {
    type: "reminder",
    title: "ورد المساء",
    body: "اختم يومك بذكر المساء وسيد الاستغفار قبل النوم 🌙",
    icon: "moon",
    color: "#4A90B8",
    link: "/adhkar",
  },
  {
    type: "reminder",
    title: "الأذكار اليومية",
    body: "حان وقت ورد الاستغفار اليومي ١٠٠ مرة — افتح عداد الذكر",
    icon: "refresh-cw",
    color: "#16a34a",
    link: "/dhikr",
  },
  {
    type: "reminder",
    title: "قراءة القرآن",
    body: "لا تنسَ صفحتين من القرآن اليوم — هدفك اليومي ينتظرك ✨",
    icon: "book",
    color: "#16a34a",
    link: "/quran",
  },
  {
    type: "reminder",
    title: "سجّل يومك",
    body: "كيف كان يومك الروحي؟ سجّله في مذكرتك الآن",
    icon: "pen-tool",
    color: "#8E5CA8",
    link: "/journal",
  },
];

export function seedDailyNotifications(
  streakDays: number,
  day40Progress: number,
  covenantSigned: boolean
): void {
  const existing = loadNotifications();
  const today = todayStr();
  const todayNotifs = existing.filter((n) => n.createdAt.startsWith(today));
  if (todayNotifs.length > 0) return;

  const newNotifs: AppNotification[] = [];

  const spiritual = SPIRITUAL_POOL[day40Progress % SPIRITUAL_POOL.length]!;
  newNotifs.push({ ...spiritual, id: generateId(), isRead: false, createdAt: new Date().toISOString() });

  const reminder = REMINDER_POOL[Math.floor(Math.random() * REMINDER_POOL.length)]!;
  newNotifs.push({ ...reminder, id: generateId(), isRead: false, createdAt: new Date(Date.now() - 60000).toISOString() });

  if (covenantSigned && streakDays > 0 && streakDays % 7 === 0) {
    newNotifs.push({
      id: generateId(), type: "achievement",
      title: "🏆 إنجاز جديد!",
      body: `أكملت ${streakDays} يوماً متواصلاً من الاستقامة — ثبّتك الله وزادك من فضله`,
      icon: "award", color: "#d97706", isRead: false,
      createdAt: new Date(Date.now() - 120000).toISOString(),
      link: "/journey",
    });
  }
  if (covenantSigned && day40Progress === 10) {
    newNotifs.push({
      id: generateId(), type: "achievement",
      title: "ربع الطريق! 🌿",
      body: "أتممت ١٠ أيام من رحلتك — الله يرى صدقك وثباتك",
      icon: "award", color: "#16a34a", isRead: false,
      createdAt: new Date(Date.now() - 180000).toISOString(),
      link: "/journey",
    });
  }
  if (covenantSigned && day40Progress === 20) {
    newNotifs.push({
      id: generateId(), type: "achievement",
      title: "منتصف الرحلة! ⭐",
      body: "٢٠ يوماً من الثبات — أنت أقرب إلى الله مما تتخيل",
      icon: "star", color: "#d97706", isRead: false,
      createdAt: new Date(Date.now() - 180000).toISOString(),
      link: "/journey",
    });
  }
  if (covenantSigned && day40Progress === 40) {
    newNotifs.push({
      id: generateId(), type: "achievement",
      title: "أكملت الرحلة! 🌟",
      body: "ماشاء الله! أتممت الأربعين يوماً — سأل الله أن تكون من التوابين",
      icon: "star", color: "#d97706", isRead: false,
      createdAt: new Date(Date.now() - 180000).toISOString(),
      link: "/journey",
    });
  }
  if (!covenantSigned) {
    newNotifs.push({
      id: generateId(), type: "warning",
      title: "ابدأ رحلتك",
      body: "لم توقّع ميثاقك بعد — كل لحظة تأخير هي فرصة ضائعة للتوبة",
      icon: "alert-circle", color: "#dc2626", isRead: false,
      createdAt: new Date(Date.now() - 240000).toISOString(),
      link: "/covenant",
    });
  }

  const merged = [...newNotifs, ...existing].slice(0, 50);
  saveNotifications(merged);
}
