import { isNativeApp } from "@/lib/api-base";

const AUDIO_URL_KEY = "__tawbah_object_url";

export async function setAudioSrc(audio: HTMLAudioElement, url: string): Promise<void> {
  try {
    const prev = (audio as unknown as Record<string, unknown>)[AUDIO_URL_KEY];
    if (typeof prev === "string" && prev.startsWith("blob:")) {
      URL.revokeObjectURL(prev);
    }
  } catch {}

  if (!isNativeApp()) {
    audio.src = url;
    return;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      console.error("[Audio] Fetch failed:", res.status, res.statusText);
      throw new Error(`audio_fetch_failed_${res.status}`);
    }
    
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    (audio as unknown as Record<string, unknown>)[AUDIO_URL_KEY] = objectUrl;
    audio.src = objectUrl;
    console.log("[Audio] Blob URL created successfully");
  } catch (e) {
    console.error("[Audio] Error loading audio:", e);
    audio.src = url;
  }
}
