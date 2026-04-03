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

  // Web fallback: prefer same-origin to keep HttpOnly auth cookies first-party.
  // (Cross-site requests can drop cookies due to SameSite/Secure rules.)
  return typeof window !== "undefined" ? `${window.location.origin}/api` : API_CONFIG.serverUrl;
}

export const API_BASE = getApiBase();

export function getAiBase(): string {
  const fromEnv = import.meta.env.VITE_AI_BASE_URL as string | undefined;
  if (fromEnv) return fromEnv;
  const stored = typeof localStorage !== "undefined"
    ? localStorage.getItem("tawbah_ai_base")
    : null;
  if (stored) return stored;
  return getApiBase();
}

export const AI_BASE = getAiBase();

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

export function aiUrl(path: string): string {
  if (!path) return AI_BASE;
  if (path.startsWith("/api/")) {
    return `${AI_BASE}${path.slice(4)}`;
  }
  if (path.startsWith("api/")) {
    return `${AI_BASE}/${path.slice(4)}`;
  }
  if (path.startsWith("/")) {
    return `${AI_BASE}${path}`;
  }
  return `${AI_BASE}/${path}`;
}
