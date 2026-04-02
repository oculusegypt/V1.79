import { isNativeApp } from "@/lib/api-base";

type NotificationChannel = {
  id: string;
  name: string;
  description?: string;
  importance?: number;
  sound?: string;
  vibration?: boolean;
  lights?: boolean;
};

type LocalNotificationsPlugin = {
  requestPermissions: () => Promise<{ display: string }>;
  checkPermissions: () => Promise<{ display: string }>;
  schedule: (options: { notifications: LocalNotification[] }) => Promise<{ notifications: Array<{ id: number }> }>;
  cancel: (options: { notifications: Array<{ id: number }> }) => Promise<void>;
  getPending: () => Promise<{ notifications: Array<{ id: number }> }>;
  createChannel?: (channel: NotificationChannel) => Promise<void>;
  listChannels?: () => Promise<{ channels: NotificationChannel[] }>;
};

interface LocalNotification {
  id: number;
  title: string;
  body: string;
  schedule: { at: Date; allowWhileIdle: boolean };
  extra?: Record<string, string>;
  channelId?: string;
  sound?: string;
  smallIcon?: string;
  iconColor?: string;
}

let _plugin: LocalNotificationsPlugin | null = null;
let _channelsCreated = false;

async function getPlugin(): Promise<LocalNotificationsPlugin | null> {
  if (!isNativeApp()) return null;
  if (_plugin) return _plugin;
  try {
    const anyWindow = window as unknown as Record<string, unknown>;
    const cap = anyWindow.Capacitor as Record<string, unknown> | undefined;
    const plugins = cap?.Plugins as Record<string, unknown> | undefined;
    if (plugins?.LocalNotifications) {
      _plugin = plugins.LocalNotifications as unknown as LocalNotificationsPlugin;
      return _plugin;
    }
  } catch {}
  try {
    const mod = await import("@capacitor/local-notifications");
    const p = (mod as unknown as { LocalNotifications?: unknown }).LocalNotifications;
    if (p && typeof (p as { schedule?: unknown }).schedule === "function") {
      _plugin = p as unknown as LocalNotificationsPlugin;
      return _plugin;
    }
  } catch {}
  return null;
}

export async function createNotificationChannels(): Promise<void> {
  if (_channelsCreated) return;
  const plugin = await getPlugin();
  if (!plugin || typeof plugin.createChannel !== "function") return;

  const channels: NotificationChannel[] = [
    {
      id: "prayer",
      name: "أوقات الصلاة",
      description: "إشعارات أوقات الصلاة",
      importance: 5,
      sound: "azan",
      vibration: true,
      lights: true,
    },
    {
      id: "adhkar",
      name: "الأذكار والأوراد",
      description: "إشعارات أذكار الصباح والمساء",
      importance: 4,
      sound: "azkar_sabah",
      vibration: true,
      lights: true,
    },
    {
      id: "reminder",
      name: "التذكيرات اليومية",
      description: "التذكيرات والتنبيهات اليومية",
      importance: 4,
      sound: "takbeer",
      vibration: true,
      lights: true,
    },
  ];

  for (const ch of channels) {
    try {
      await plugin.createChannel(ch);
    } catch {}
  }
  _channelsCreated = true;
}

export async function requestLocalNotifPermission(): Promise<boolean> {
  const plugin = await getPlugin();
  if (!plugin) return false;
  try {
    const checked = await plugin.checkPermissions();
    if (checked.display === "granted") return true;
    const result = await plugin.requestPermissions();
    return result.display === "granted";
  } catch {
    return false;
  }
}

export interface ScheduledItem {
  id: number;
  title: string;
  body: string;
  fireAt: Date;
  url?: string;
  channelId?: string;
  sound?: string;
}

let _scheduledIds: number[] = [];

function getSoundForChannel(channelId?: string): string {
  if (channelId === "prayer") return "azan";
  if (channelId === "adhkar") return "azkar_sabah";
  return "takbeer";
}

export async function scheduleLocalNotifications(items: ScheduledItem[]): Promise<void> {
  const plugin = await getPlugin();
  if (!plugin) return;

  await createNotificationChannels();

  try {
    if (_scheduledIds.length > 0) {
      await plugin.cancel({ notifications: _scheduledIds.map(id => ({ id })) });
      _scheduledIds = [];
    }
    const pending = await plugin.getPending();
    if (pending.notifications.length > 0) {
      await plugin.cancel({ notifications: pending.notifications.map(n => ({ id: n.id })) });
    }
  } catch {}

  if (items.length === 0) return;

  const now = Date.now();
  const future = items.filter(i => i.fireAt.getTime() > now);
  if (future.length === 0) return;

  const notifications: LocalNotification[] = future.map(item => {
    const ch = item.channelId ?? "reminder";
    const snd = item.sound ?? getSoundForChannel(ch);
    return {
      id: item.id,
      title: item.title,
      body: item.body,
      schedule: {
        at: item.fireAt,
        allowWhileIdle: true,
      },
      extra: { url: item.url ?? "/" },
      channelId: ch,
      sound: snd,
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#2d7a4f",
    };
  });

  try {
    const result = await plugin.schedule({ notifications });
    _scheduledIds = result.notifications.map(n => n.id);
    console.log("[LocalNotif] Scheduled", _scheduledIds.length, "notifications");
  } catch (e) {
    console.error("[LocalNotif] Schedule failed:", e);
  }
}

let _nowId = 900000;

export async function showLocalNotifNow(params: {
  title: string;
  body: string;
  tag: string;
  channelId?: string;
  sound?: string;
  url?: string;
}): Promise<void> {
  const plugin = await getPlugin();
  if (!plugin) return;

  await createNotificationChannels();

  const ch = params.channelId ?? "reminder";
  const snd = params.sound ?? getSoundForChannel(ch);

  const fireAt = new Date(Date.now() + 2000);
  _nowId = (_nowId % 999999) + 1;

  const notification: LocalNotification = {
    id: _nowId,
    title: params.title,
    body: params.body,
    schedule: { at: fireAt, allowWhileIdle: true },
    extra: { url: params.url ?? "/" },
    channelId: ch,
    sound: snd,
    smallIcon: "ic_stat_icon_config_sample",
    iconColor: "#2d7a4f",
  };

  try {
    await plugin.schedule({ notifications: [notification] });
    console.log("[LocalNotif] showLocalNotifNow scheduled id", _nowId);
  } catch (e) {
    console.error("[LocalNotif] showLocalNotifNow failed:", e);
  }
}

export function isNativeNotificationsSupported(): boolean {
  return isNativeApp();
}
