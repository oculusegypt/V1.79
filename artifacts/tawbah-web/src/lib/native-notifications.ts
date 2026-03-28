import { isNativeApp } from "@/lib/api-base";

type LocalNotificationsPlugin = {
  requestPermissions: () => Promise<{ display: string }>;
  checkPermissions: () => Promise<{ display: string }>;
  schedule: (options: { notifications: LocalNotification[] }) => Promise<{ notifications: Array<{ id: number }> }>;
  cancel: (options: { notifications: Array<{ id: number }> }) => Promise<void>;
  getPending: () => Promise<{ notifications: Array<{ id: number }> }>;
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
}

let _scheduledIds: number[] = [];

export async function scheduleLocalNotifications(items: ScheduledItem[]): Promise<void> {
  const plugin = await getPlugin();
  if (!plugin) return;

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

  const notifications: LocalNotification[] = future.map(item => ({
    id: item.id,
    title: item.title,
    body: item.body,
    schedule: {
      at: item.fireAt,
      allowWhileIdle: true,
    },
    extra: { url: item.url ?? "/" },
    channelId: "prayer",
    smallIcon: "ic_stat_icon_config_sample",
    iconColor: "#2d7a4f",
  }));

  try {
    const result = await plugin.schedule({ notifications });
    _scheduledIds = result.notifications.map(n => n.id);
    console.log("[LocalNotif] Scheduled", _scheduledIds.length, "notifications");
  } catch (e) {
    console.error("[LocalNotif] Schedule failed:", e);
  }
}

export function isNativeNotificationsSupported(): boolean {
  return isNativeApp();
}
