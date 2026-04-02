import { Capacitor } from "@capacitor/core";
import { API_CONFIG } from "./api-config";

declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform: () => boolean;
      getPlatform: () => string;
    };
  }
}

export function isNativeApp(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return typeof window !== "undefined" &&
      typeof window.Capacitor !== "undefined" &&
      window.Capacitor.isNativePlatform();
  }
}

export function getApiBase(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (fromEnv) return fromEnv;
  const stored = typeof localStorage !== "undefined"
    ? localStorage.getItem("tawbah_api_base")
    : null;
  if (stored) return stored;

  if (isNativeApp()) {
    return API_CONFIG.serverUrl;
  }

  // Web fallback: use the public server URL so web can run without a local proxy/server.
  return API_CONFIG.serverUrl;
}

export const API_BASE = getApiBase();

export function apiUrl(path: string): string {
  if (!path) return API_BASE;
  if (path.startsWith("/api/")) {
    return `${API_BASE}${path.slice(4)}`;
  }
  if (path.startsWith("api/")) {
    return `${API_BASE}/${path.slice(4)}`;
  }
  if (path.startsWith("/")) {
    return `${API_BASE}${path}`;
  }
  return `${API_BASE}/${path}`;
}
