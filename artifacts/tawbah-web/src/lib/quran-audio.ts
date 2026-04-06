import { isNativeApp, getApiBase } from "@/lib/api-base";

const QURAN_AUDIO_CACHE = "quran-audio-v1";

export interface QuranAudioSource {
  surahId: number;
  ayahNum: number;
  reciterId: string;
}

function audioCacheKey(source: QuranAudioSource): string {
  const globalAyah = toGlobalAyah(source.surahId, source.ayahNum);
  return `${source.reciterId}/${globalAyah}.mp3`;
}

const SURAH_LENGTHS = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111,
  110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45,
  83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55,
  78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20,
  56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21,
  11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6,
];

function toGlobalAyah(surah: number, ayah: number): number {
  let count = 0;
  for (let i = 0; i < surah - 1; i++) count += SURAH_LENGTHS[i] ?? 0;
  return count + ayah;
}

function getProxyUrl(source: QuranAudioSource): string {
  const globalAyah = toGlobalAyah(source.surahId, source.ayahNum);
  const baseUrl = getApiBase().replace(/\/+$/, "");
  return `${baseUrl}/audio-proxy/quran/${encodeURIComponent(source.reciterId)}/${globalAyah}.mp3`;
}

// ─── FAST PRELOAD: Immediate download without Cache API overhead ─────
// Used for quick playback preparation
export async function preloadQuranVerseFast(source: QuranAudioSource): Promise<string> {
  const url = getProxyUrl(source);
  try {
    const response = await fetch(url, { mode: "cors" });
    if (response.ok) {
      return url;
    }
  } catch {
  }
  return url;
}

// ─── OFFLINE CACHE: Save to Cache API for offline playback ───────────
// Slower but enables offline listening
export async function preloadQuranVerseForCache(source: QuranAudioSource): Promise<void> {
  const proxyUrl = getProxyUrl(source);

  try {
    const cache = await caches.open(QURAN_AUDIO_CACHE);
    const existing = await cache.match(proxyUrl);
    if (existing) return;

    const response = await fetch(proxyUrl, { mode: "cors" });
    if (response.ok) {
      await cache.put(proxyUrl, response.clone());
    }
  } catch {
  }
}

// Legacy function - uses cache if available, otherwise fetches
export async function getCachedAudioUrl(source: QuranAudioSource): Promise<string> {
  const proxyUrl = getProxyUrl(source);

  // Android WebView (Capacitor) can behave poorly with blob: URLs for streaming audio.
  // Prefer the stable HTTP(S) URL path on native to keep behavior consistent.
  if (isNativeApp()) {
    return proxyUrl;
  }

  try {
    const cache = await caches.open(QURAN_AUDIO_CACHE);
    const cachedResponse = await cache.match(proxyUrl);
    if (cachedResponse) {
      const blob = await cachedResponse.blob();
      return URL.createObjectURL(blob);
    }
  } catch {
  }

  return proxyUrl;
}

// Preload multiple for offline (batch)
export async function preloadQuranAudioForCache(sources: QuranAudioSource[]): Promise<void> {
  if (sources.length === 0) return;

  try {
    const cache = await caches.open(QURAN_AUDIO_CACHE);

    await Promise.all(
      sources.map(async (source) => {
        const proxyUrl = getProxyUrl(source);

        try {
          const existing = await cache.match(proxyUrl);
          if (existing) return;
        } catch {
        }

        try {
          const response = await fetch(proxyUrl, { mode: "cors" });
          if (response.ok) {
            await cache.put(proxyUrl, response.clone());
          }
        } catch {
        }
      })
    );
  } catch {
  }
}

export async function getAudioBlob(source: QuranAudioSource): Promise<Blob | null> {
  const proxyUrl = getProxyUrl(source);

  try {
    const cache = await caches.open(QURAN_AUDIO_CACHE);
    const cachedResponse = await cache.match(proxyUrl);
    if (cachedResponse) {
      return await cachedResponse.blob();
    }
  } catch {
  }

  try {
    const response = await fetch(proxyUrl, { mode: "cors" });
    if (response.ok) {
      const cache = await caches.open(QURAN_AUDIO_CACHE);
      await cache.put(proxyUrl, response.clone());
      return await response.blob();
    }
  } catch {
  }

  return null;
}

export function getAudioUrlDirect(source: QuranAudioSource): string {
  return getProxyUrl(source);
}
