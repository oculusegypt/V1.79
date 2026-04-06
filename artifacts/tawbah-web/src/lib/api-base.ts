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
    return (
      typeof window !== "undefined" &&
      typeof window.Capacitor !== "undefined" &&
      window.Capacitor.isNativePlatform()
    );
  }
}

export function getApiBase(): string {
  if (isNativeApp()) {
    const fromEnv = import.meta.env.VITE_API_BASE_URL as string | undefined;
    if (fromEnv) return fromEnv;
    const stored =
      typeof localStorage !== "undefined"
        ? localStorage.getItem("tawbah_api_base")
        : null;
    if (stored) return stored;
    return API_CONFIG.serverUrl;
  }

  return "/api";
}

export function getAiBase(): string {
  const fromEnv = import.meta.env.VITE_ZAKIY_API_BASE_URL as string | undefined;
  if (fromEnv) return fromEnv;

  const stored =
    typeof localStorage !== "undefined"
      ? localStorage.getItem("tawbah_zakiy_api_base")
      : null;
  if (stored) return stored;

  return API_CONFIG.zakiyApiBaseUrl;
}

function joinUrl(base: string, path: string): string {
  const b = base.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;

  if (b.endsWith("/api") && p.startsWith("/api/")) {
    return `${b}${p.slice(4)}`;
  }

  if (b.endsWith("/api") && p === "/api") {
    return b;
  }

  return `${b}${p}`;
}

export function apiUrl(path: string): string {
  if (!isNativeApp()) {
    return path;
  }

  if (/^https?:\/\//i.test(path)) return path;

  return joinUrl(getApiBase(), path);
}

export function aiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return joinUrl(getAiBase(), path);
}

export const API_BASE = getApiBase();
