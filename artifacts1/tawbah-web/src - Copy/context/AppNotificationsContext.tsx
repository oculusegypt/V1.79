import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import {
  fetchInboxFromApi,
  addToInboxApi,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  seedDailyNotifications,
  loadNotifications,
  type AppNotification,
} from "@/lib/app-notifications";

interface AppNotificationsContextValue {
  unreadCount: number;
  notifications: AppNotification[];
  isLoaded: boolean;
  reloadNotifications: () => void;
  addNotification: (notif: {
    id?: string;
    type: AppNotification["type"];
    title: string;
    body: string;
    icon?: string;
    color?: string;
  }) => Promise<void>;
  markRead: (id: string) => void;
  markAllRead: () => void;
  removeNotification: (id: string) => void;
}

const AppNotificationsContext = createContext<AppNotificationsContextValue | null>(null);

export function AppNotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(() => loadNotifications());
  const [unreadCount, setUnreadCount] = useState(() => getUnreadCount());
  const [isLoaded, setIsLoaded] = useState(false);

  const syncState = useCallback((notifs: AppNotification[]) => {
    setNotifications(notifs);
    setUnreadCount(notifs.filter((n) => !n.isRead).length);
    setIsLoaded(true);
  }, []);

  // Load from API on mount
  useEffect(() => {
    const sessionId = localStorage.getItem("tawbah_session") ?? "guest";
    const streakStr = localStorage.getItem(`streak_${sessionId}`);
    const progressStr = localStorage.getItem(`day40_${sessionId}`);
    const covenantStr = localStorage.getItem(`covenant_${sessionId}`);

    const streakDays = streakStr ? parseInt(streakStr) : 0;
    const day40Progress = progressStr ? parseInt(progressStr) : 0;
    const covenantSigned = covenantStr === "true";

    // Seed localStorage first (quick)
    seedDailyNotifications(streakDays, day40Progress, covenantSigned);
    syncState(loadNotifications());

    // Then load from API (may have more / synced data)
    fetchInboxFromApi().then((apiNotifs) => {
      if (apiNotifs.length > 0) {
        syncState(apiNotifs);
      }
    }).catch(() => {});
  }, [syncState]);

  // Listen for notifications fired by the polling mechanism (from NotificationsContext)
  useEffect(() => {
    const handleFired = (e: Event) => {
      const notif = (e as CustomEvent<{
        id: string; type: AppNotification["type"];
        title: string; body: string; icon?: string; color?: string;
      }>).detail;
      addToInboxApi(notif).then((newNotif) => {
        setNotifications((prev) => {
          if (prev.find((n) => n.id === newNotif.id)) return prev;
          const next = [newNotif, ...prev].slice(0, 50);
          return next;
        });
        setUnreadCount((c) => c + 1);
      });
    };
    window.addEventListener("tawbah:notification:fired", handleFired);
    return () => window.removeEventListener("tawbah:notification:fired", handleFired);
  }, []);

  const reloadNotifications = useCallback(() => {
    fetchInboxFromApi().then((notifs) => {
      if (notifs.length > 0) syncState(notifs);
      else syncState(loadNotifications());
    }).catch(() => syncState(loadNotifications()));
  }, [syncState]);

  const addNotification = useCallback(async (notif: {
    id?: string; type: AppNotification["type"];
    title: string; body: string; icon?: string; color?: string;
  }) => {
    const newNotif = await addToInboxApi(notif);
    setNotifications((prev) => {
      if (prev.find((n) => n.id === newNotif.id)) return prev;
      return [newNotif, ...prev].slice(0, 50);
    });
    setUnreadCount((c) => c + 1);
  }, []);

  const markRead = useCallback((id: string) => {
    markAsRead(id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  const markAllRead = useCallback(() => {
    markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, []);

  const removeNotification = useCallback((id: string) => {
    const notif = notifications.find((n) => n.id === id);
    deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (notif && !notif.isRead) setUnreadCount((c) => Math.max(0, c - 1));
  }, [notifications]);

  return (
    <AppNotificationsContext.Provider value={{
      unreadCount, notifications, isLoaded, reloadNotifications,
      addNotification, markRead, markAllRead, removeNotification,
    }}>
      {children}
    </AppNotificationsContext.Provider>
  );
}

export function useAppNotifications() {
  const ctx = useContext(AppNotificationsContext);
  if (!ctx) throw new Error("useAppNotifications must be used inside AppNotificationsProvider");
  return ctx;
}
