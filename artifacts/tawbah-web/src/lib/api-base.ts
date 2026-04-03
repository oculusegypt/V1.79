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

  // Web fallback: prefer same-origin to keep auth cookies first-party and avoid CORS.
  return typeof window !== "undefined" ? `${window.location.origin}/api` : API_CONFIG.serverUrl;
}

export function getZakiyApiBase(): string {
  const fromEnv = import.meta.env.VITE_ZAKIY_API_BASE_URL as string | undefined;
  if (fromEnv) return fromEnv;
  const stored = typeof localStorage !== "undefined"
    ? localStorage.getItem("tawbah_zakiy_api_base")
    : null;
  if (stored) return stored;

  if (isNativeApp()) {
    return API_CONFIG.serverUrl;
  }

  // Web fallback: same-origin proxy (avoids CORS and keeps cookies first-party)
  return typeof window !== "undefined" ? `${window.location.origin}/api` : API_CONFIG.serverUrl;
}

export function apiUrl(path: string): string {
  const base = getApiBase();
  if (!path) return base;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (base.endsWith("/") && path.startsWith("/")) return base + path.slice(1);
  if (!base.endsWith("/") && !path.startsWith("/")) return `${base}/${path}`;
  return base + path;
}

export const API_BASE = getApiBase();
