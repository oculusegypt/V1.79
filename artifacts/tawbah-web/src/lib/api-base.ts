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
  if (isNativeApp()) {
    const fromEnv = import.meta.env.VITE_API_BASE_URL as string | undefined;
    if (fromEnv) return fromEnv;
    const stored = typeof localStorage !== "undefined"
      ? localStorage.getItem("tawbah_api_base")
      : null;
    if (stored) return stored;
    return API_CONFIG.serverUrl;
  }
  return "/api";
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
