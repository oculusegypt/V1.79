// ── Notification Settings Types ───────────────────────────────────────────────

import { getApiBase, isNativeApp } from "./api-base";
import { scheduleLocalNotifications, requestLocalNotifPermission, type ScheduledItem } from "./native-notifications";

export interface PrayerNotifSettings {
  fajr: boolean;
  sunrise: boolean;
  dhuhr: boolean;
  asr: boolean;
  maghrib: boolean;
  isha: boolean;
  advanceMinutes: number; // 0 = at prayer time, 5, 10, 15, 20, 30
}

export interface NotificationSettings {
  // Permission
  enabled: boolean;

  // ── Prayers ──────────────────────────────────────────
  prayers: PrayerNotifSettings;

  // ── Adhkar ───────────────────────────────────────────
  morningAdhkar: boolean;
  morningAdhkarTime: string; // "06:30"
  eveningAdhkar: boolean;
  eveningAdhkarTime: string; // "17:00"

  // ── Daily dhikr ──────────────────────────────────────
  dhikrReminder: boolean;
  dhikrReminderTime: string; // "12:00"

  // ── Journey ──────────────────────────────────────────
  journeyReminder: boolean;
  journeyReminderTime: string; // "21:00"

  // ── Nafl fasting ─────────────────────────────────────
  mondayFasting: boolean;
  thursdayFasting: boolean;
  ayyamBeedh: boolean;

  // ── Evening review ────────────────────────────────────
  eveningReview: boolean;
  eveningReviewTime: string; // "22:00"

  // ── Friday special ────────────────────────────────────
  fridayKahf: boolean;
  fridayKahfTime: string; // "09:00"

  // ── Streak reminder ───────────────────────────────────
  streakReminder: boolean;
  streakReminderTime: string; // "20:00"

  // Smart alert sounds
  prayerAlertSound: boolean;  // play takbeer MP3 when prayer time fires
  duaPeakAlert: boolean;      // show dua-peak modal + takbeer when score=100
  duaPeakThreshold: number;   // score threshold to trigger modal: 80 | 90 | 100
}

export const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: false,
  prayers: {
    fajr: true,
    sunrise: false,
    dhuhr: true,
    asr: true,
    maghrib: true,
    isha: true,
    advanceMinutes: 10,
  },
  morningAdhkar: true,
  morningAdhkarTime: "06:30",
  eveningAdhkar: true,
  eveningAdhkarTime: "17:00",
  dhikrReminder: false,
  dhikrReminderTime: "12:00",
  journeyReminder: true,
  journeyReminderTime: "21:00",
  mondayFasting: false,
  thursdayFasting: false,
  ayyamBeedh: false,
  eveningReview: false,
  eveningReviewTime: "22:00",
  fridayKahf: false,
  fridayKahfTime: "09:00",
  streakReminder: false,
  streakReminderTime: "20:00",
  prayerAlertSound: true,
  duaPeakAlert: true,
  duaPeakThreshold: 100,
};

const STORAGE_KEY = "notif_settings_v2";

export function loadSettings(): NotificationSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(s: NotificationSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

// ── Permission ────────────────────────────────────────────────────────────────

export async function requestPermission(): Promise<NotificationPermission> {
  if (isNativeApp()) {
    const granted = await requestLocalNotifPermission();
    const result: NotificationPermission = granted ? "granted" : "denied";
    try { localStorage.setItem("native_notif_permission", result); } catch {}
    return result;
  }
  if (!("Notification" in window)) return "denied";
  if (Notification.permission === "granted") return "granted";
  return await Notification.requestPermission();
}

export function getPermission(): NotificationPermission {
  if (isNativeApp()) {
    const stored = localStorage.getItem("native_notif_permission");
    return (stored as NotificationPermission) ?? "default";
  }
  if (!("Notification" in window)) return "denied";
  return Notification.permission;
}

// ── Service Worker ────────────────────────────────────────────────────────────

let swReg: ServiceWorkerRegistration | null = null;

export async function registerSW(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    swReg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;
    return swReg;
  } catch {
    return null;
  }
}

// Post a message to the active service worker reliably.
async function postToSW(message: unknown): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sw = reg.active;
    if (sw) sw.postMessage(message);
  } catch {
    // SW unavailable — ignore silently
  }
}

// Show a notification via the Service Worker — works from ANY page/tab/background.
// This is the correct way to show notifications reliably across all pages.
export async function showViaSW(params: {
  title: string;
  body: string;
  tag: string;
  url?: string;
}): Promise<void> {
  await postToSW({
    type: "SHOW_NOTIFICATION",
    title: params.title,
    body: params.body,
    tag: params.tag,
    url: params.url ?? "/",
  });
}

// ── Scheduled notification type ───────────────────────────────────────────────

interface ScheduledNotif {
  tag: string;
  title: string;
  body: string;
  fireAt: number; // unix ms
  url?: string;
  attachments?: Array<{ id: string; url: string; options?: Record<string, unknown> }>;
}

// ── Prayer times fetching ─────────────────────────────────────────────────────

interface PrayerTimings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

const PRAYER_CACHE_KEY = "prayer_timings_cache";

async function fetchPrayerTimings(): Promise<PrayerTimings | null> {
  const city = localStorage.getItem("prayerCity");
  const country = localStorage.getItem("prayerCountry");
  const lat = localStorage.getItem("prayerLat");
  const lng = localStorage.getItem("prayerLng");
  const hasLatLng = !!lat && !!lng;
  const canQuery = (city && country) || hasLatLng;
  if (!canQuery) return null;

  // Try cache (valid for today)
  try {
    const raw = localStorage.getItem(PRAYER_CACHE_KEY);
    if (raw) {
      const { date, timings } = JSON.parse(raw) as { date: string; timings: PrayerTimings };
      const today = new Date().toDateString();
      if (date === today) return timings;
    }
  } catch { /* continue */ }

  try {
    const url = (country === "Auto" && hasLatLng) || (!city || !country)
      ? `https://api.aladhan.com/v1/timings?latitude=${encodeURIComponent(lat!)}&longitude=${encodeURIComponent(lng!)}&method=4`
      : `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=4`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json() as { code: number; data: { timings: PrayerTimings } };
    if (data.code !== 200) return null;
    const t = data.data.timings;
    const clean: PrayerTimings = {
      Fajr: t.Fajr.split(" ")[0]!,
      Sunrise: t.Sunrise.split(" ")[0]!,
      Dhuhr: t.Dhuhr.split(" ")[0]!,
      Asr: t.Asr.split(" ")[0]!,
      Maghrib: t.Maghrib.split(" ")[0]!,
      Isha: t.Isha.split(" ")[0]!,
    };
    localStorage.setItem(PRAYER_CACHE_KEY, JSON.stringify({ date: new Date().toDateString(), timings: clean }));
    return clean;
  } catch {
    return null;
  }
}

function timeToMs(hhmm: string, advanceMinutes = 0): number {
  const [h, m] = hhmm.split(":").map(Number);
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h!, m! - advanceMinutes, 0, 0);
  return target.getTime();
}

function todayTimeMs(hhmm: string): number {
  return timeToMs(hhmm, 0);
}

function getHijriMonth(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
    month: "numeric", timeZone: "Africa/Cairo",
  }).formatToParts(date);
  const m = parts.find(p => p.type === "month");
  return m ? parseInt(m.value) : 0;
}

function getHijriDay(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
    day: "numeric", timeZone: "Africa/Cairo",
  }).formatToParts(date);
  const d = parts.find(p => p.type === "day");
  return d ? parseInt(d.value) : 0;
}

// ── Build scheduled notifications list ────────────────────────────────────────

export async function buildScheduledNotifications(
  settings: NotificationSettings,
  // When true, also includes notifications that fired within the last pastWindowMs ms
  // (used by the in-app polling to catch recently-missed ones)
  pastWindowMs = 0
): Promise<ScheduledNotif[]> {
  const now = Date.now();
  const notifs: ScheduledNotif[] = [];
  const dayOfWeek = new Date().getDay(); // 0=Sun, 1=Mon ... 5=Fri, 6=Sat

  const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
  const pad2 = (n: number) => String(n).padStart(2, "0");
  const fmtTodayAt = (ms: number) => {
    const d = new Date(ms);
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  };
  const parseTimeToTodayMs = (timeStr: string) => {
    const [h, m] = timeStr.split(":").map(Number);
    const d = new Date();
    d.setHours(h ?? 0, m ?? 0, 0, 0);
    return d.getTime();
  };
  const calcSunPathPercent = (sunrise: string, maghrib: string, atMs = Date.now()) => {
    const sr = parseTimeToTodayMs(sunrise);
    const mg = parseTimeToTodayMs(maghrib);
    const t = atMs;
    if (!Number.isFinite(sr) || !Number.isFinite(mg) || mg <= sr) return null;
    const p = clamp01((t - sr) / (mg - sr));
    return Math.round(p * 100);
  };

  const sunPathDots = (percent: number) => {
    const p = clamp01(percent / 100);
    const slots = 14;
    const idx = Math.max(0, Math.min(slots - 1, Math.round(p * (slots - 1))));
    let s = "";
    for (let i = 0; i < slots; i++) {
      s += i === idx ? "☀" : "·";
    }
    return s;
  };

  // ── Prayer times ────────────────────────────────────────────────────────────
  const prayerTimings = settings.prayers.fajr || settings.prayers.dhuhr ||
    settings.prayers.asr || settings.prayers.maghrib || settings.prayers.isha ||
    settings.prayers.sunrise || settings.morningAdhkar || settings.eveningAdhkar
    ? await fetchPrayerTimings()
    : null;

  const sunPathPercent = prayerTimings
    ? calcSunPathPercent(prayerTimings.Sunrise, prayerTimings.Maghrib, Date.now())
    : null;
  const sunPathLine = sunPathPercent == null
    ? ""
    : `مسار الشمس اليوم\n${sunPathDots(sunPathPercent)}  ${sunPathPercent}%`;
  const sunPathInline = sunPathPercent == null
    ? ""
    : `مسار الشمس: ${sunPathDots(sunPathPercent)}  ${sunPathPercent}%`;

  const getSkyColorsForHour = (h: number): { top: string; bottom: string; sunColor: string; sunGlow: string } => {
    if (h < 4)  return { top: "#0a0520", bottom: "#1a0a3a", sunColor: "#fbbf24", sunGlow: "rgba(251,191,36,0.08)" };
    if (h < 6)  return { top: "#1e1035", bottom: "#4a1d73", sunColor: "#fbbf24", sunGlow: "rgba(251,191,36,0.18)" };
    if (h < 8)  return { top: "#7c2d12", bottom: "#ea580c", sunColor: "#fbbf24", sunGlow: "rgba(251,191,36,0.35)" };
    if (h < 12) return { top: "#1d4ed8", bottom: "#60a5fa", sunColor: "#fde047", sunGlow: "rgba(253,224,71,0.4)" };
    if (h < 13) return { top: "#0c4a6e", bottom: "#0ea5e9", sunColor: "#fde68a", sunGlow: "rgba(253,230,138,0.45)" };
    if (h < 16) return { top: "#78350f", bottom: "#d97706", sunColor: "#fbbf24", sunGlow: "rgba(251,191,36,0.3)" };
    if (h < 19) return { top: "#4c1d95", bottom: "#b45309", sunColor: "#fb923c", sunGlow: "rgba(251,146,60,0.35)" };
    return { top: "#0f172a", bottom: "#1e1b4b", sunColor: "#fbbf24", sunGlow: "rgba(251,191,36,0.08)" };
  };

  const buildSunPathCardPng = (percent: number, atMs: number): string | null => {
    try {
      if (typeof document === "undefined") return null;
      const w = 280;
      const h = 120;
      const dpr = Math.max(1, Math.min(2, (window.devicePixelRatio || 1)));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.scale(dpr, dpr);

      const p = clamp01(percent / 100);

      const hour = new Date(atMs).getHours();
      const sky = getSkyColorsForHour(hour);
      const isNight = hour < 5 || hour >= 20;

      // Background gradient
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, sky.top);
      g.addColorStop(1, sky.bottom);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // Stars for night
      if (isNight) {
        ctx.save();
        ctx.fillStyle = "rgba(255,255,255,0.75)";
        const stars = [
          { x: 22, y: 16, r: 1.2 },
          { x: 66, y: 10, r: 0.9 },
          { x: 98, y: 22, r: 1.0 },
          { x: 162, y: 12, r: 0.8 },
          { x: 208, y: 26, r: 1.1 },
          { x: 248, y: 14, r: 0.9 },
        ];
        for (const s of stars) {
          ctx.globalAlpha = 0.55;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Arc path (quadratic Bezier) similar to PrayerSkyHeader
      // Mirrored horizontally to better match perceived real sun direction.
      const x0 = w - 22, y0 = 86;
      const cx = w / 2, cy = 18;
      const x1 = 22, y1 = 86;

      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.22)";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 6]);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo(cx, cy, x1, y1);
      ctx.stroke();
      ctx.restore();

      // Sun position on quadratic Bezier
      const t = Math.min(p, 0.98);
      const sunX = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1;
      const sunY = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1;

      // Glow
      ctx.fillStyle = sky.sunGlow;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 18, 0, Math.PI * 2);
      ctx.fill();
      // Sun core
      ctx.fillStyle = sky.sunColor;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.beginPath();
      ctx.arc(sunX, sunY, 4, 0, Math.PI * 2);
      ctx.fill();

      // Label
      ctx.fillStyle = "rgba(255,255,255,0.70)";
      ctx.font = "600 13px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("مسار الشمس اليوم", w / 2, h - 14);

      // Percent
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.font = "700 16px system-ui";
      ctx.fillText(`${percent}%`, w / 2, 28);

      return canvas.toDataURL("image/png");
    } catch {
      return null;
    }
  };

  const sunPathAttachment = sunPathPercent == null
    ? null
    : (() => {
        const url = buildSunPathCardPng(sunPathPercent, Date.now());
        if (!url) return null;
        return [{ id: "sunpath", url }];
      })();

  const PRAYER_MAP: Array<{ key: keyof typeof settings.prayers; time: keyof PrayerTimings; nameAr: string; body: string; url: string }> = [
    { key: "fajr",    time: "Fajr",    nameAr: "الفجر",   body: "حان وقت صلاة الفجر — ﴿وَقُرْآنَ الْفَجْرِ إِنَّ قُرْآنَ الْفَجْرِ كَانَ مَشْهُودًا﴾", url: "/prayer-times" },
    { key: "sunrise", time: "Sunrise", nameAr: "الشروق",  body: "وقت صلاة الإشراق — اجلس تذكر الله حتى الشروق واحصل على أجر حجة وعمرة", url: "/prayer-times" },
    { key: "dhuhr",   time: "Dhuhr",   nameAr: "الظهر",   body: "حان وقت صلاة الظهر — لا تؤخّرها، الله ينتظر عبده", url: "/prayer-times" },
    { key: "asr",     time: "Asr",     nameAr: "العصر",   body: "حان وقت صلاة العصر — ﴿حَافِظُوا عَلَى الصَّلَوَاتِ وَالصَّلَاةِ الْوُسْطَىٰ﴾", url: "/prayer-times" },
    { key: "maghrib", time: "Maghrib", nameAr: "المغرب",  body: "حان وقت صلاة المغرب — ساعة مباركة، الدعاء مستجاب بين الأذان والإقامة", url: "/prayer-times" },
    { key: "isha",    time: "Isha",    nameAr: "العشاء",  body: "حان وقت صلاة العشاء — «من صلى العشاء في جماعة فكأنما قام نصف الليل»", url: "/prayer-times" },
  ];

  if (prayerTimings) {
    for (const p of PRAYER_MAP) {
      if (!settings.prayers[p.key]) continue;
      const fireAt = timeToMs(prayerTimings[p.time], settings.prayers.advanceMinutes);
      if (fireAt > now - pastWindowMs) {
        const timeLabel = fmtTodayAt(fireAt);
        notifs.push({
          tag: `prayer-${p.key}`,
          title: `🕌 وقت صلاة ${p.nameAr}`,
          body: settings.prayers.advanceMinutes > 0
            ? `بعد ${settings.prayers.advanceMinutes} دقيقة (${timeLabel}) — ${p.body}${sunPathLine ? `\n${sunPathLine}` : ""}`
            : `(${timeLabel}) — ${p.body}${sunPathLine ? `\n${sunPathLine}` : ""}`,
          fireAt,
          url: p.url,
        });
      }
    }
  }

  // ── Morning adhkar ───────────────────────────────────────────────────────────
  if (settings.morningAdhkar) {
    const fireAt = todayTimeMs(settings.morningAdhkarTime);
    if (fireAt > now - pastWindowMs) {
      const p = prayerTimings ? calcSunPathPercent(prayerTimings.Sunrise, prayerTimings.Maghrib, fireAt) : null;
      const att = p == null ? undefined : (() => {
        const url = buildSunPathCardPng(p, fireAt);
        return url ? [{ id: "sunpath", url }] : undefined;
      })();
      notifs.push({
        tag: "morning-adhkar",
        title: "📿 أذكار الصباح",
        body: "لا تنسَ أذكار الصباح — «ما من عبد يقول في صباح كل يوم وفي مساء كل ليلة...» ابدأ الآن",
        fireAt,
        url: "/?adhkar=morning",
        attachments: att,
      });
    }
  }

  // ── Evening adhkar ───────────────────────────────────────────────────────────
  if (settings.eveningAdhkar) {
    const fireAt = todayTimeMs(settings.eveningAdhkarTime);
    if (fireAt > now - pastWindowMs) {
      const p = prayerTimings ? calcSunPathPercent(prayerTimings.Sunrise, prayerTimings.Maghrib, fireAt) : null;
      const att = p == null ? undefined : (() => {
        const url = buildSunPathCardPng(p, fireAt);
        return url ? [{ id: "sunpath", url }] : undefined;
      })();
      notifs.push({
        tag: "evening-adhkar",
        title: "🌙 أذكار المساء",
        body: "حان وقت أذكار المساء — أنت بحاجة إلى حصن الذكر الآن",
        fireAt,
        url: "/?adhkar=evening",
        attachments: att,
      });
    }
  }

  // ── Daily dhikr reminder ─────────────────────────────────────────────────────
  if (settings.dhikrReminder) {
    const fireAt = todayTimeMs(settings.dhikrReminderTime);
    if (fireAt > now - pastWindowMs) {
      notifs.push({
        tag: "dhikr-reminder",
        title: "📿 تذكير الذكر اليومي",
        body: "خصّص لحظات من يومك لذكر الله — سبحان الله وبحمده سبحان الله العظيم",
        fireAt,
        url: "/dhikr",
      });
    }
  }

  // ── Journey reminder ─────────────────────────────────────────────────────────
  if (settings.journeyReminder) {
    const fireAt = todayTimeMs(settings.journeyReminderTime);
    if (fireAt > now - pastWindowMs) {
      notifs.push({
        tag: "journey-reminder",
        title: "🌟 رحلة التوبة اليومية",
        body: "هل أكملت ورد اليوم؟ كل يوم في الرحلة هو خطوة نحو ربك",
        fireAt,
        url: "/journey",
      });
    }
  }

  // ── Streak reminder ──────────────────────────────────────────────────────────
  if (settings.streakReminder) {
    const fireAt = todayTimeMs(settings.streakReminderTime);
    if (fireAt > now - pastWindowMs) {
      notifs.push({
        tag: "streak-reminder",
        title: "🔥 تذكير الاستقامة اليومية",
        body: "حافظ على سلسلتك — سجّل يومك قبل منتصف الليل",
        fireAt,
        url: "/",
      });
    }
  }

  // ── Evening review ───────────────────────────────────────────────────────────
  if (settings.eveningReview) {
    const fireAt = todayTimeMs(settings.eveningReviewTime);
    if (fireAt > now - pastWindowMs) {
      notifs.push({
        tag: "evening-review",
        title: "📔 مراجعة المساء",
        body: "قبل أن تنام — سجّل يومك، شكر ربك، وتُب إليه. اليوم قد لا يعود.",
        fireAt,
        url: "/journal",
      });
    }
  }

  // ── Friday Kahf reminder ─────────────────────────────────────────────────────
  if (settings.fridayKahf && dayOfWeek === 5) {
    const fireAt = todayTimeMs(settings.fridayKahfTime);
    if (fireAt > now - pastWindowMs) {
      notifs.push({
        tag: "friday-kahf",
        title: "📖 تذكير الجمعة المبارك",
        body: "يوم الجمعة — اقرأ سورة الكهف، أكثر من الصلاة على النبي ﷺ، وادعُ في ساعة الإجابة",
        fireAt,
        url: "/",
      });
    }
  }

  // ── Monday fasting reminder (Sunday evening) ─────────────────────────────────
  if (settings.mondayFasting && dayOfWeek === 0) {
    const fireAt = todayTimeMs("20:00");
    if (fireAt > now - pastWindowMs) {
      notifs.push({
        tag: "monday-fasting",
        title: "🌙 تذكير صيام الاثنين",
        body: "غداً الاثنين — يوم تُعرض فيه الأعمال على الله. هل ستصوم؟ النية الآن.",
        fireAt,
        url: "/",
      });
    }
  }

  // ── Thursday fasting reminder (Wednesday evening) ────────────────────────────
  if (settings.thursdayFasting && dayOfWeek === 3) {
    const fireAt = todayTimeMs("20:00");
    if (fireAt > now - pastWindowMs) {
      notifs.push({
        tag: "thursday-fasting",
        title: "🌙 تذكير صيام الخميس",
        body: "غداً الخميس — يوم تُعرض فيه الأعمال على الله. أحبّ أن يُعرَض عملي وأنا صائم.",
        fireAt,
        url: "/",
      });
    }
  }

  // ── Ayyam al-beedh reminder ───────────────────────────────────────────────────
  if (settings.ayyamBeedh) {
    const hijriDay = getHijriDay(new Date());
    if ([12, 13, 14].includes(hijriDay)) {
      const fireAt = todayTimeMs("06:00");
      if (fireAt > now - pastWindowMs) {
        notifs.push({
          tag: "ayyam-beedh",
          title: "☀️ أيام البيض",
          body: `اليوم ${hijriDay} من الشهر — من أيام البيض المباركة. صيامها كصيام الدهر كله.`,
          fireAt,
          url: "/",
        });
      }
    }
  }


  // ── Dua Peak server push (fires even when app is closed) ─────────────────────
  if (settings.duaPeakAlert) {
    // Last third of night: 02:30
    const lastThirdAt = todayTimeMs('02:30');
    if (lastThirdAt > now - pastWindowMs) {
      notifs.push({
        tag: 'dua-peak-last-third',
        title: '✨ قمة الإجابة — آخر ثلث الليل',
        body: 'الله ينزل إلى السماء الدنيا الآن — ارفع يديك وادعُ، الدعاء مستجاب',
        fireAt: lastThirdAt,
        url: '/dua-timing',
      });
    }
    // Friday answer hour: 15:30
    if (dayOfWeek === 5) {
      const fridayPeakAt = todayTimeMs('15:30');
      if (fridayPeakAt > now - pastWindowMs) {
        notifs.push({
          tag: 'dua-peak-friday',
          title: '✨ ساعة الإجابة — الجمعة',
          body: 'أنت الآن في ساعة إجابة الجمعة المباركة — ادعُ الله الآن بما تتمنى',
          fireAt: fridayPeakAt,
          url: '/dua-timing',
        });
      }
    }
  }

  return notifs;
}

// ── Server-side WebPush subscription ─────────────────────────────────────────

const API_BASE = getApiBase();

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const arr = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) arr[i] = rawData.charCodeAt(i);
  return arr.buffer;
}

export async function subscribeToPush(): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
  try {
    // Fetch VAPID public key from server
    const res = await fetch(`${API_BASE}/push/vapid-public-key`);
    if (!res.ok) return false;
    const { key } = await res.json() as { key: string };
    if (!key) return false;

    const reg = await navigator.serviceWorker.ready;
    let subscription = await reg.pushManager.getSubscription();
    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });
    }

    const sessionId = localStorage.getItem("tawbah_session") ?? "guest";
    await fetch(`${API_BASE}/push/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, subscription }),
    });
    return true;
  } catch {
    return false;
  }
}

// Schedule server-side push jobs so notifications fire even when app is closed
async function scheduleServerPush(notifs: { tag: string; title: string; body: string; fireAt: number; url?: string }[]): Promise<void> {
  try {
    const sessionId = localStorage.getItem("tawbah_session") ?? "guest";
    // Clear old pending jobs first
    await fetch(`${API_BASE}/push/jobs`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    if (notifs.length === 0) return;
    const jobs = notifs.map((n) => ({
      type: "reminder",
      title: n.title,
      body: n.body,
      url: n.url ?? "/",
      fireAt: new Date(n.fireAt).toISOString(),
    }));
    await fetch(`${API_BASE}/push/schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, jobs }),
    });
  } catch {
    // Non-critical — local SW will still handle timers when app is open
  }
}

// ── Main scheduling entry point ───────────────────────────────────────────────

export async function scheduleAll(settings: NotificationSettings): Promise<void> {
  if (!settings.enabled) return;

  const notifs = await buildScheduledNotifications(settings);

  if (isNativeApp()) {
    // For native: request LocalNotifications permission (separate from FCM push permission)
    const localGranted = await requestLocalNotifPermission();
    if (localGranted) {
      try { localStorage.setItem("native_notif_permission", "granted"); } catch {}
    }
    const items: ScheduledItem[] = notifs.map((n, i) => {
      let channelId = "reminder_v2";
      let sound: string | undefined = undefined;
      if (n.tag.startsWith("prayer-")) { channelId = "prayer"; sound = "azan"; }
      else if (n.tag === "morning-adhkar" || n.tag === "evening-adhkar") { channelId = "adhkar"; sound = n.tag === "morning-adhkar" ? "azkar_sabah" : "azkar_masaa"; }
      return {
        id: hashTag(n.tag) + i,
        title: n.title,
        body: n.body,
        fireAt: new Date(n.fireAt),
        url: n.url,
        channelId,
        sound,
        attachments: n.attachments,
      };
    });
    await scheduleLocalNotifications(items);
    // Prevent duplicates: if this device previously scheduled server push jobs,
    // clear them now so only LocalNotifications will fire on native.
    void scheduleServerPush([]);
    return;
  }

  if (getPermission() !== "granted") return;
  if (!("serviceWorker" in navigator)) return;
  await navigator.serviceWorker.ready;
  void scheduleServerPush(notifs);
}

function hashTag(tag: string): number {
  let h = 0;
  for (let i = 0; i < tag.length; i++) {
    h = (Math.imul(31, h) + tag.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % 100000 + 1;
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export async function clearAll(): Promise<void> {}
