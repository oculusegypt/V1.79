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
  if (isNativeApp()) {
    const stored = typeof localStorage !== "undefined"
      ? localStorage.getItem("tawbah_api_base")
      : null;
    if (stored) return stored;
    return API_CONFIG.serverUrl;
  }
  return API_CONFIG.serverUrl;
}

export function apiUrl(path: string): string {
  const base = getApiBase();
  if (!path) return base;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  // Prevent double /api/api - strip /api prefix from path if base ends with /api
  if (base.endsWith("/api") && path.startsWith("/api")) {
    path = path.slice(4) || "/";
  }
  if (base.endsWith("/") && path.startsWith("/")) return base + path.slice(1);
  if (!base.endsWith("/") && !path.startsWith("/")) return `${base}/${path}`;
  return base + path;
}

export const API_BASE = getApiBase();
