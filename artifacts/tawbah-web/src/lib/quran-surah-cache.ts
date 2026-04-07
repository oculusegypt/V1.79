export type CachedSurahResponse = {
  code: number;
  data: {
    ayahs: any[];
  };
};

const PREFIX = "quran_surah_cache_v1_";

export function saveSurahToCache(surahId: number, payload: CachedSurahResponse): void {
  try {
    localStorage.setItem(`${PREFIX}${surahId}`, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

export function loadSurahFromCache(surahId: number): CachedSurahResponse | null {
  try {
    const raw = localStorage.getItem(`${PREFIX}${surahId}`);
    if (!raw) return null;
    return JSON.parse(raw) as CachedSurahResponse;
  } catch {
    return null;
  }
}
