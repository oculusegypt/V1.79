import { isNativeApp, getApiBase } from "./api-base";

type PushNotificationsPlugin = {
  requestPermissions: () => Promise<{ receive: string }>;
  register: () => Promise<void>;
  addListener: (
    event: string,
    callback: (data: unknown) => void
  ) => Promise<{ remove: () => void }>;
  getDeliveredNotifications: () => Promise<{ notifications: unknown[] }>;
  removeDeliveredNotifications: (options: { notifications: unknown[] }) => Promise<void>;
};

let _pushPlugin: PushNotificationsPlugin | null = null;

function setPushStage(stage: string) {
  try { localStorage.setItem("push_stage", stage); } catch {}
}

function setPushError(err: string) {
  try {
    if (!err) {
      localStorage.removeItem("push_last_error");
      return;
    }
    localStorage.setItem("push_last_error", err);
  } catch {}
}

async function getPushPlugin(): Promise<PushNotificationsPlugin | null> {
  console.log("[Push] getPushPlugin: start");
  const isNative = isNativeApp();
  console.log("[Push] getPushPlugin: isNativeApp() =", isNative);
  setPushStage("push_is_native_" + isNative);
  
  if (!isNative) {
    console.log("[Push] Not native app, skipping");
    setPushStage("push_plugin_not_native");
    return null;
  }

  // Always try to get from Capacitor.Plugins first (native registered plugin)
  try {
    const anyWindow = window as unknown as Record<string, unknown>;
    const capacitorPlugins = (anyWindow.Capacitor as Record<string, unknown>)?.Plugins as Record<string, unknown> | undefined;
    const nativePlugin = capacitorPlugins?.PushNotifications;
    console.log("[Push] Capacitor.Plugins.PushNotifications =", nativePlugin);
    
    if (nativePlugin) {
      console.log("[Push] Using native Capacitor.Plugins.PushNotifications");
      setPushStage("push_plugin_native_ok");
      setPushError("");
      return nativePlugin as unknown as PushNotificationsPlugin;
    }
  } catch (e) {
    console.log("[Push] Capacitor.Plugins check failed:", e);
  }

  // Fallback: use static import
  try {
    setPushStage("push_plugin_static_try");
    const spec = "@capacitor/" + "push-notifications";
    const mod = await import(/* @vite-ignore */ spec);
    const dyn = (mod as unknown as { PushNotifications?: unknown }).PushNotifications;
    console.log("[Push] PushNotifications dynamic =", typeof dyn, dyn);
    if (dyn && typeof (dyn as { requestPermissions?: unknown }).requestPermissions === "function") {
      console.log("[Push] Using dynamic import PushNotifications");
      setPushStage("push_plugin_static_ok");
      setPushError("");
      return dyn as unknown as PushNotificationsPlugin;
    }
  } catch (e) {
    console.log("[Push] Static import failed:", e);
  }

  setPushError("plugin_unavailable");
  setPushStage("push_plugin_not_found");
  return null;
}

export async function requestCapacitorPermission(): Promise<"granted" | "denied" | "default"> {
  const plugin = await getPushPlugin();
  if (!plugin) {
    console.log("[Push] requestCapacitorPermission: plugin not available, returning denied");
    return "denied";
  }
  try {
    console.log("[Push] requestCapacitorPermission: requesting permission (may show prompt)...");
    setPushStage("request_permission_start");
    const anyPlugin = plugin as unknown as {
      requestPermissions: () => Promise<{ receive: string }>;
    };
    const res = await Promise.race([
      anyPlugin.requestPermissions(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("request_permission_timeout")), 8000)),
    ]);
    console.log("[Push] requestCapacitorPermission result:", res);
    setPushStage(`request_permission_${res.receive || "unknown"}`);
    if (res.receive === "granted") return "granted";
    if (res.receive === "denied") return "denied";
    return "default";
  } catch (e) {
    console.error("[Push] requestCapacitorPermission error:", e);
    setPushError(e instanceof Error ? e.message : "request_permission_failed");
    return "denied";
  }
}

export interface CapacitorPushHandlers {
  onToken?: (token: string) => void;
  onNotification?: (title: string, body: string, data?: Record<string, string>) => void;
  onError?: (error: string) => void;
}

export async function initCapacitorPush(handlers: CapacitorPushHandlers = {}): Promise<boolean> {
  console.log("[Push] Starting initCapacitorPush");
  setPushStage("push_init_enter");
  setPushStage("push_init_loading_plugin");
  let plugin: PushNotificationsPlugin | null = null;
  try {
    plugin = await Promise.race([
      getPushPlugin(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 6000)),
    ]);
  } catch {
    plugin = null;
  }
  if (!plugin) {
    console.error("[Push] Plugin not available");
    setPushError("plugin_unavailable");
    handlers.onError?.("plugin_unavailable");
    return false;
  }

  try {
    const initTimeout = new Promise<boolean>((_, reject) =>
      setTimeout(() => reject(new Error("init_timeout")), 18000)
    );

    return await Promise.race([
      (async () => {
    // IMPORTANT: do NOT call requestPermissions here.
    // Permission prompts must happen from a user gesture (button click).
    // Here we only CHECK current state and fail gracefully.
    try {
      setPushStage("checking_permission");
      const anyPlugin = plugin as unknown as {
        checkPermissions?: () => Promise<{ receive: string }>;
        requestPermissions?: () => Promise<{ receive: string }>;
      };
      if (typeof anyPlugin.checkPermissions === "function") {
        const checked = await Promise.race([
          anyPlugin.checkPermissions(),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error("check_permission_timeout")), 4000)),
        ]);
        console.log("[Push] checkPermissions result:", checked);
        // Some Android builds report "prompt/default" even when notifications can still work.
        // Only hard-fail on explicit denied.
        if (checked.receive === "denied") {
          setPushError("permission_denied");
          handlers.onError?.("permission_denied");
          return false;
        }
        setPushStage(`permission_${checked.receive || "unknown"}`);
      }
    } catch (e) {
      console.error("[Push] Permission check failed:", e);
      // Don't block registration on permission check failures; record and continue.
      setPushError(e instanceof Error ? e.message : "permission_check_failed");
      handlers.onError?.(e instanceof Error ? e.message : "permission_check_failed");
    }

    let tokenResolve: ((t: string) => void) | null = null;
    let tokenReject: ((e: Error) => void) | null = null;
    const tokenPromise = new Promise<string>((resolve, reject) => {
      tokenResolve = resolve;
      tokenReject = reject;
    });

    // NOTE: Do not await addListener — some native builds can hang here.
    void plugin.addListener("registration", (token: unknown) => {
      const tokenStr = (token as { value: string }).value;
      console.log("[Push] registration token received");
      try { localStorage.setItem("push_last_error", "registration_token_received"); } catch {}
      handlers.onToken?.(tokenStr);
      try {
        localStorage.setItem("fcm_token", tokenStr);
        void sendTokenToServer(tokenStr);
      } catch {}
      tokenResolve?.(tokenStr);
    });

    void plugin.addListener("registrationError", (err: unknown) => {
      const msg = (err as { error?: string; message?: string }).error || (err as { message?: string }).message || "registration_error";
      console.error("[Push] registrationError:", err);
      try { localStorage.setItem("push_last_error", msg || "registration_error"); } catch {}
      handlers.onError?.(msg);
      tokenReject?.(new Error(msg));
    });

    void plugin.addListener("pushNotificationReceived", (notification: unknown) => {
      const n = notification as { title?: string; body?: string; data?: Record<string, string> };
      handlers.onNotification?.(n.title ?? "دليل التوبة", n.body ?? "", n.data);
    });

    void plugin.addListener("pushNotificationActionPerformed", (action: unknown) => {
      const a = action as { notification?: { data?: { url?: string } } };
      const url = a.notification?.data?.url;
      if (url && url !== "/" && typeof window !== "undefined") {
        window.location.hash = url;
      }
    });

    console.log("[Push] Registering...");
    setPushStage("registering_with_fcm");
    await Promise.race([
      plugin.register(),
      new Promise<void>((_, reject) => setTimeout(() => reject(new Error("register_timeout")), 9000)),
    ]);
    console.log("[Push] Registered successfully");
    setPushStage("registered_waiting_token");

    // Wait for token so the UI doesn't hang on "activating" forever
    try {
      const token = await Promise.race([
        tokenPromise,
        new Promise<string>((_, reject) => setTimeout(() => reject(new Error("token_timeout")), 10000)),
      ]);
      console.log("[Push] Token ready:", token ? "(redacted)" : "(empty)");
    } catch (e) {
      console.error("[Push] Token wait failed:", e);
      setPushError(e instanceof Error ? e.message : "token_timeout");
      handlers.onError?.(e instanceof Error ? e.message : "token_timeout");
      return false;
    }

    return true;
      })(),
      initTimeout as unknown as Promise<boolean>,
    ]);
  } catch (e) {
    console.error("[Push] initCapacitorPush failed:", e);
    setPushError(e instanceof Error ? e.message : "init_failed");
    handlers.onError?.(e instanceof Error ? e.message : "init_failed");
    return false;
  }
}

async function sendTokenToServer(token: string): Promise<void> {
  try {
    const sessionId = localStorage.getItem("tawbah_session") ?? "guest";
    await fetch(`${getApiBase()}/push/fcm-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, token, platform: "android" }),
    });
  } catch {}
}

async function sendTokenToServerWithRetry(token: string, retries = 3): Promise<boolean> {
  const sessionId = localStorage.getItem("tawbah_session") ?? "guest";
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`${getApiBase()}/push/fcm-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, token, platform: "android" }),
      });
      if (res.ok) return true;
    } catch {}
    if (i < retries - 1) await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
  }
  return false;
}

export async function retrySendStoredToken(): Promise<void> {
  const storedToken = localStorage.getItem("fcm_token");
  if (storedToken) {
    const ok = await sendTokenToServerWithRetry(storedToken, 3);
    console.log("[Push] retrySendStoredToken:", ok ? "success" : "failed");
  }
}

export async function getCapacitorPermission(): Promise<"granted" | "denied" | "default"> {
  const plugin = await getPushPlugin();
  if (!plugin) {
    console.log("[Push] getCapacitorPermission: plugin not available, returning denied");
    return "denied";
  }
  try {
    console.log("[Push] getCapacitorPermission: checking current permission state...");
    const anyPlugin = plugin as unknown as {
      checkPermissions?: () => Promise<{ receive: string }>;
      requestPermissions: (opts?: { types?: { receive: string[] } }) => Promise<{ receive: string }>;
    };

    // Prefer checkPermissions when available (doesn't trigger UI prompts and tends to be more accurate)
    if (typeof anyPlugin.checkPermissions === "function") {
      const checked = await anyPlugin.checkPermissions();
      console.log("[Push] getCapacitorPermission checkPermissions result:", checked);
      if (checked.receive === "granted") return "granted";
      if (checked.receive === "denied") return "denied";
      return "default";
    }

    // Fallback: requestPermissions (may show a prompt on Android 13+)
    const requested = await anyPlugin.requestPermissions();
    console.log("[Push] getCapacitorPermission requestPermissions result:", requested);
    if (requested.receive === "granted") return "granted";
    if (requested.receive === "denied") return "denied";
    return "default";
  } catch (e) {
    console.error("[Push] getCapacitorPermission error:", e);
    return "denied";
  }
}

export async function isCapacitorPushAvailable(): Promise<boolean> {
  if (!isNativeApp()) return false;
  try {
    await import("@capacitor/push-notifications");
    return true;
  } catch {
    return false;
  }
}
