import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  type NotificationSettings,
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  requestPermission,
  getPermission,
  registerSW,
  scheduleAll,
  buildScheduledNotifications,
  subscribeToPush,
  showViaSW,
} from "@/lib/notifications";
import {
  hasFiredToday,
  markFiredToday,
  addToInboxApi,
} from "@/lib/app-notifications";
import {
  playTakbeer,
  preloadTakbeer,
  playAzan,
  preloadAzan,
  playDuaPeak,
  preloadDuaPeak,
  playAzkarSabah,
  preloadAzkarSabah,
  playAzkarMasaa,
  preloadAzkarMasaa,
  stopAzkarSabah,
  stopAzkarMasaa,
} from "@/lib/takbeer";
import {
  calcDuaPower,
  duaPeakCooledDown,
  markDuaPeakFired,
} from "@/lib/dua-power";
import { isNativeApp, getApiBase } from "@/lib/api-base";
import {
  initCapacitorPush,
  getCapacitorPermission,
  requestCapacitorPermission,
} from "@/lib/capacitor-push";
import {
  createNotificationChannels,
  showLocalNotifNow,
  requestLocalNotifPermission,
} from "@/lib/native-notifications";

const API_BASE = getApiBase();

async function syncSettingsToApi(s: NotificationSettings): Promise<void> {
  try {
    const sessionId = localStorage.getItem("tawbah_session") ?? "guest";
    await fetch(`${API_BASE}/notifications/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        settingsJson: JSON.stringify(s),
        prayerCity: localStorage.getItem("prayerCity") ?? undefined,
        prayerCountry: localStorage.getItem("prayerCountry") ?? undefined,
        prayerLat: localStorage.getItem("prayerLat") ?? undefined,
        prayerLng: localStorage.getItem("prayerLng") ?? undefined,
      }),
    });
  } catch {}
}

async function loadSettingsFromApi(): Promise<NotificationSettings | null> {
  try {
    const sessionId = localStorage.getItem("tawbah_session") ?? "guest";
    const res = await fetch(
      `${API_BASE}/notifications/settings?sessionId=${encodeURIComponent(sessionId)}`,
    );
    if (!res.ok) return null;
    const row = (await res.json()) as {
      settingsJson: string;
      prayerCity?: string;
      prayerCountry?: string;
      prayerLat?: string;
      prayerLng?: string;
    } | null;
    if (!row || !row.settingsJson) return null;
    if (row.prayerCity && !localStorage.getItem("prayerCity"))
      localStorage.setItem("prayerCity", row.prayerCity);
    if (row.prayerCountry && !localStorage.getItem("prayerCountry"))
      localStorage.setItem("prayerCountry", row.prayerCountry);
    if (row.prayerLat && !localStorage.getItem("prayerLat"))
      localStorage.setItem("prayerLat", row.prayerLat);
    if (row.prayerLng && !localStorage.getItem("prayerLng"))
      localStorage.setItem("prayerLng", row.prayerLng);
    return {
      ...DEFAULT_SETTINGS,
      ...JSON.parse(row.settingsJson),
    } as NotificationSettings;
  } catch {
    return null;
  }
}

type AdhkarType = "morning" | "evening";

interface NotificationsContextValue {
  settings: NotificationSettings;
  permission: NotificationPermission;
  supported: boolean;
  updateSettings: (patch: Partial<NotificationSettings>) => void;
  enableNotifications: () => Promise<boolean>;
  disableNotifications: () => void;
  reschedule: () => Promise<void>;
  duaPeakVisible: boolean;
  hideDuaPeak: () => void;
  adhkarVisible: boolean;
  adhkarType: AdhkarType;
  hideAdhkar: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(
  null,
);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<NotificationSettings>(() =>
    loadSettings(),
  );
  const native = isNativeApp();
  const [permission, setPermission] = useState<NotificationPermission>(() =>
    native ? "default" : getPermission(),
  );
  const [duaPeakVisible, setDuaPeakVisible] = useState(false);
  const [adhkarVisible, setAdhkarVisible] = useState(false);
  const [adhkarType, setAdhkarType] = useState<AdhkarType>("morning");
  const supported =
    native || ("Notification" in window && "serviceWorker" in navigator);

  // ── On mount: check if opened from a notification click (?adhkar=morning/evening) ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const adhkar = params.get("adhkar");
    if (adhkar === "morning" || adhkar === "evening") {
      setAdhkarType(adhkar);
      setAdhkarVisible(true);
      // Clean the URL so it doesn't re-trigger on refresh
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, "", cleanUrl);
    }
  }, []);

  // Preload audio files so they're ready for instant playback
  useEffect(() => {
    preloadTakbeer();
    preloadAzan();
    preloadDuaPeak();
    preloadAzkarSabah();
    preloadAzkarMasaa();
  }, []);

  // Register SW on mount and re-subscribe to push if already enabled
  useEffect(() => {
    if (!supported) return;
    if (native) {
      // Create notification channels (required for Android 8+)
      void createNotificationChannels();
      // Request local notification permission and cache it
      void requestLocalNotifPermission().then((granted) => {
        if (granted) {
          try {
            localStorage.setItem("native_notif_permission", "granted");
          } catch {}
          setPermission("granted");
        }
      });
      // Capacitor native: initialize FCM push notifications
      const s = loadSettings();
      if (s.enabled) {
        void initCapacitorPush({
          onToken: () => {},
          onNotification: (title, body) => {
            void addToInboxApi({
              type: "reminder",
              title,
              body,
              icon: "bell",
              color: "#4A90B8",
            });
          },
        }).then((ok) => {
          if (ok) {
            setPermission("granted");
            try {
              localStorage.setItem("native_notif_permission", "granted");
            } catch {}
          }
        });
      }
      // Update permission state
      void getCapacitorPermission().then((p) => setPermission(p));
      // Register service worker even in native builds so showViaSW works
      registerSW().then(() => {
        // IMPORTANT: in native mode do NOT use web Notification.permission,
        // because it can report denied inside WebView even when OS permission is granted.
        const s = loadSettings();
        void getCapacitorPermission().then((p) => {
          setPermission(p);
          if (s.enabled && p === "granted") {
            void subscribeToPush();
          }
        });
      });
    } else {
      registerSW().then(() => {
        setPermission(getPermission());
        const s = loadSettings();
        if (s.enabled && getPermission() === "granted") {
          void subscribeToPush();
        }
      });
    }
  }, [supported, native]);

  // Load settings from API on mount
  useEffect(() => {
    loadSettingsFromApi().then((apiSettings) => {
      if (apiSettings) {
        setSettings(apiSettings);
        saveSettings(apiSettings);
      }
    });
  }, []);

  const reschedule = useCallback(async () => {
    const fresh = loadSettings();
    await scheduleAll(fresh);
  }, []);

  useEffect(() => {
    reschedule();
  }, [settings, reschedule]);

  // Re-schedule server-side push when tab becomes visible (refresh subscription)
  useEffect(() => {
    if (!supported) return;
    // On native Android, opening the notification shade can toggle page visibility.
    // Rescheduling on visibility change can cancel + recreate LocalNotifications, causing them to disappear
    // (and any currently playing in-app sounds to stop). Keep this behavior web-only.
    if (native) return;
    const handleVisibility = () => {
      if (document.visibilityState === "visible") reschedule();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [supported, native, reschedule]);

  // ── Listen for SW-fired notifications (push) → add to in-app inbox ───────────
  useEffect(() => {
    if (!supported) return;
    const handleSwMessage = (event: MessageEvent) => {
      // Direct adhkar modal trigger from SW notificationclick (app was open in background)
      if (event.data?.type === "SHOW_ADHKAR") {
        const t = event.data.adhkarType as AdhkarType;
        if (t === "morning" || t === "evening") {
          setAdhkarType(t);
          setAdhkarVisible(true);
        }
        return;
      }

      if (event.data?.type === "NOTIFICATION_FIRED") {
        const { tag, title, body } = event.data as {
          tag: string;
          title: string;
          body: string;
          url: string;
        };
        // Play Azan for prayer notifications (if enabled)
        if (tag.startsWith("prayer-") && settings.prayerAlertSound) {
          playAzan();
        }
        if (
          (tag === "dua-peak-last-third" || tag === "dua-peak-friday") &&
          settings.duaPeakAlert
        ) {
          playDuaPeak();
          setDuaPeakVisible(true);
        }
        // Adhkar notifications
        if (tag === "morning-adhkar" && settings.morningAdhkar) {
          setAdhkarType("morning");
          setAdhkarVisible(true);
        }
        if (tag === "evening-adhkar" && settings.eveningAdhkar) {
          setAdhkarType("evening");
          setAdhkarVisible(true);
        }
        if (!hasFiredToday(tag)) {
          markFiredToday(tag);
          void addToInboxApi({
            type: "reminder",
            title,
            body,
            icon: "bell",
            color: "#4A90B8",
          });
        }
      }
    };
    navigator.serviceWorker.addEventListener("message", handleSwMessage);
    return () =>
      navigator.serviceWorker.removeEventListener("message", handleSwMessage);
  }, [supported]);

  // ── In-app polling every 30s — works on ALL pages while app is open ───────────
  // Note: For native apps, we skip this because LocalNotifications already handles scheduling
  useEffect(() => {
    // Skip polling for native apps - LocalNotifications handles everything
    if (native) return;
    
    if (!settings.enabled || permission !== "granted" || !supported) return;

    // Fire if notification time is within ±2 minutes
    const WINDOW_MS = 120_000;

    const checkDue = async () => {
      const now = Date.now();
      const notifs = await buildScheduledNotifications(settings, WINDOW_MS);
      for (const n of notifs) {
        const diff = n.fireAt - now;
        if (diff >= -WINDOW_MS && diff <= WINDOW_MS) {
          const fireKey = `${n.tag}_${new Date(n.fireAt).toISOString().slice(0, 16)}`;
          if (!hasFiredToday(fireKey)) {
            markFiredToday(fireKey);
            if (native) {
              // Native: use LocalNotifications for real status-bar notification with sound
              let channelId = "reminder";
              let sound = "azan";

              if (n.tag.startsWith("prayer-")) {
                channelId = "prayer";
                sound = "azan";
              } else if (n.tag === "morning-adhkar") {
                channelId = "adhkar";
                sound = "azkar_sabah";
              } else if (n.tag === "evening-adhkar") {
                channelId = "adhkar";
                sound = "azkar_masaa";
              }
              await showLocalNotifNow({
                title: n.title,
                body: n.body,
                tag: n.tag,
                channelId,
                sound,
                url: n.url ?? "/",
              });
            } else {
              // Web: show via Service Worker
              await showViaSW({
                title: n.title,
                body: n.body,
                tag: n.tag,
                url: n.url ?? "/",
              });
            }
            void addToInboxApi({
              type: "reminder",
              title: n.title,
              body: n.body,
              icon: "bell",
              color: "#4A90B8",
            });
          }
        }
      }
    };

    checkDue();
    const interval = setInterval(checkDue, 30_000);
    return () => clearInterval(interval);
  }, [settings, permission, supported, native]);

  // ── Adhkar polling — shows the modal at configured morning/evening time ────────
  useEffect(() => {
    const ADHKAR_CHECK_INTERVAL = 60_000; // check every minute
    const ADHKAR_WINDOW_MS = 120_000; // ±2 minutes

    const getTimeMs = (timeStr: string) => {
      const [h, m] = timeStr.split(":").map(Number);
      const d = new Date();
      d.setHours(h ?? 0, m ?? 0, 0, 0);
      return d.getTime();
    };

    const checkAdhkar = () => {
      const now = Date.now();
      if (settings.morningAdhkar) {
        const fireAt = getTimeMs(settings.morningAdhkarTime);
        const diff = now - fireAt;
        // Key includes the configured time — changing the time resets the lock
        const morningKey = `morning-adhkar-modal_${settings.morningAdhkarTime}`;
        if (
          diff >= 0 &&
          diff <= ADHKAR_WINDOW_MS &&
          !hasFiredToday(morningKey)
        ) {
          markFiredToday(morningKey);
          setAdhkarType("morning");
          setAdhkarVisible(true);
        }
      }
      if (settings.eveningAdhkar) {
        const fireAt = getTimeMs(settings.eveningAdhkarTime);
        const diff = now - fireAt;
        const eveningKey = `evening-adhkar-modal_${settings.eveningAdhkarTime}`;
        if (
          diff >= 0 &&
          diff <= ADHKAR_WINDOW_MS &&
          !hasFiredToday(eveningKey)
        ) {
          markFiredToday(eveningKey);
          setAdhkarType("evening");
          setAdhkarVisible(true);
        }
      }
    };

    checkAdhkar();
    const interval = setInterval(checkAdhkar, ADHKAR_CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [
    settings.morningAdhkar,
    settings.morningAdhkarTime,
    settings.eveningAdhkar,
    settings.eveningAdhkarTime,
  ]);

  // ── 5-minute Dua Peak polling — shows modal + plays takbeer when score = 100 ──
  useEffect(() => {
    if (!settings.duaPeakAlert) return; // only run if feature is enabled

    const DUA_PEAK_INTERVAL = 5 * 60 * 1000; // 5 minutes

    const threshold = settings.duaPeakThreshold ?? 100;
    const checkDuaPeak = () => {
      const score = calcDuaPower();
      if (score >= threshold && duaPeakCooledDown()) {
        markDuaPeakFired();
        playDuaPeak();
        setDuaPeakVisible(true);
      }
    };

    // Check immediately, then every 5 minutes
    checkDuaPeak();
    const interval = setInterval(checkDuaPeak, DUA_PEAK_INTERVAL);
    return () => clearInterval(interval);
  }, [settings.duaPeakAlert, settings.duaPeakThreshold]);

  // ── Play azkar sound when modal opens, stop when it closes ───────────────────
  useEffect(() => {
    if (adhkarVisible) {
      if (adhkarType === "morning") {
        stopAzkarMasaa();
        playAzkarSabah();
      } else {
        stopAzkarSabah();
        playAzkarMasaa();
      }
    } else {
      stopAzkarSabah();
      stopAzkarMasaa();
    }
  }, [adhkarVisible, adhkarType]);

  const hideDuaPeak = useCallback(() => setDuaPeakVisible(false), []);
  const hideAdhkar = useCallback(() => setAdhkarVisible(false), []);

  const updateSettings = useCallback((patch: Partial<NotificationSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      if (patch.prayers) next.prayers = { ...prev.prayers, ...patch.prayers };
      saveSettings(next);
      syncSettingsToApi(next);
      return next;
    });
  }, []);

  const enableNotifications = useCallback(async (): Promise<boolean> => {
    if (native) {
      try {
        localStorage.removeItem("push_last_error");
        localStorage.removeItem("push_stage");
      } catch {}
      try {
        localStorage.setItem("push_stage", "native_enable_start");
      } catch {}
      // Force Android permission request from a user gesture (button click)
      try {
        localStorage.setItem("push_stage", "requesting_permission");
      } catch {}
      let perm: NotificationPermission = "default";
      try {
        perm = await Promise.race([
          requestCapacitorPermission(),
          new Promise<NotificationPermission>((resolve) =>
            setTimeout(() => resolve("default"), 9000),
          ),
        ]);
        if (perm === "default") {
          try {
            localStorage.setItem(
              "push_stage",
              "permission_request_timeout_or_default",
            );
          } catch {}
        }
      } catch {
        try {
          localStorage.setItem("push_stage", "permission_request_failed");
        } catch {}
        perm = "default";
      }
      setPermission(perm);
      try {
        localStorage.setItem("push_stage", `permission_${perm}`);
      } catch {}
      // Some Android builds (and Android < 13) can return "default" while notifications still work.
      // Only treat explicit "denied" as a blocker.
      if (perm === "denied") return false;

      let lastErr = "";
      try {
        localStorage.setItem("push_stage", "init_push_start");
      } catch {}
      console.log(
        "[Notifications] enableNotifications: starting native push init",
      );
      const ok = await initCapacitorPush({
        onToken: (token) => {
          console.log(
            "[Notifications] enableNotifications: token received",
            token ? "(redacted)" : "(empty)",
          );
          try {
            localStorage.setItem("push_stage", "token_received");
          } catch {}
        },
        onNotification: (title, body) => {
          console.log(
            "[Notifications] enableNotifications: notification received",
            title,
            body,
          );
          void addToInboxApi({
            type: "reminder",
            title,
            body,
            icon: "bell",
            color: "#4A90B8",
          });
        },
        onError: (e) => {
          lastErr = e;
          console.error("[Notifications] enableNotifications error:", e);
          try {
            localStorage.setItem("push_last_error", e || "unknown_error");
          } catch {}
        },
      });
      console.log(
        "[Notifications] enableNotifications: initCapacitorPush returned",
        ok,
      );
      if (!ok) {
        try {
          console.log(
            "[Notifications] enableNotifications: saving error to localStorage",
            lastErr || "unknown_error",
          );
          localStorage.setItem("push_last_error", lastErr || "unknown_error");
        } catch {}
        return false;
      }
      // Mark as granted inside the app so settings UI unlocks once native push is working.
      setPermission("granted");
      try {
        localStorage.setItem("native_notif_permission", "granted");
      } catch {}
      // Also ensure LocalNotifications permission for scheduled/timed notifications
      void requestLocalNotifPermission().then((localOk) => {
        if (localOk) {
          try {
            localStorage.setItem("native_notif_permission", "granted");
          } catch {}
        }
      });
      updateSettings({ enabled: true });
      return true;
    }
    const perm = await requestPermission();
    setPermission(perm);
    if (perm !== "granted") return false;
    await registerSW();
    void subscribeToPush();
    updateSettings({ enabled: true });
    return true;
  }, [updateSettings, native]);

  const disableNotifications = useCallback(() => {
    updateSettings({ enabled: false });
  }, [updateSettings]);

  return (
    <NotificationsContext.Provider
      value={{
        settings,
        permission,
        supported,
        updateSettings,
        enableNotifications,
        disableNotifications,
        reschedule,
        duaPeakVisible,
        hideDuaPeak,
        adhkarVisible,
        adhkarType,
        hideAdhkar,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx)
    throw new Error(
      "useNotifications must be used inside NotificationsProvider",
    );
  return ctx;
}
