import { Filesystem, Directory } from "@capacitor/filesystem";
import { isNativeApp, getApiBase } from "@/lib/api-base";

const AUDIO_CACHE_DIR = "quran-audio";

export interface QuranAudioSource {
  surahId: number;
  ayahNum: number;
  reciterId: string;
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

function getLocalPath(source: QuranAudioSource): string {
  const globalAyah = toGlobalAyah(source.surahId, source.ayahNum);
  return `${AUDIO_CACHE_DIR}/${source.reciterId}/${globalAyah}.mp3`;
}

export async function preloadQuranVerseNative(source: QuranAudioSource): Promise<string> {
  if (!isNativeApp()) {
    return getProxyUrl(source);
  }

  const localPath = getLocalPath(source);
  const proxyUrl = getProxyUrl(source);

  try {
    const fileInfo = await Filesystem.stat({
      path: localPath,
      directory: Directory.Data,
    });
    if (fileInfo) {
      const base64 = await Filesystem.readFile({
        path: localPath,
        directory: Directory.Data,
      });
      const mimeType = "audio/mpeg";
      return `data:${mimeType};base64,${base64.data}`;
    }
  } catch {
  }

  try {
    const response = await fetch(proxyUrl, { mode: "cors" });
    if (response.ok) {
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
      );

      const dirPath = `${AUDIO_CACHE_DIR}/${source.reciterId}`;
      try {
        await Filesystem.mkdir({
          path: dirPath,
          directory: Directory.Data,
          recursive: true,
        });
      } catch {}

      await Filesystem.writeFile({
        path: localPath,
        data: base64,
        directory: Directory.Data,
      });

      const mimeType = "audio/mpeg";
      return `data:${mimeType};base64,${base64}`;
    }
  } catch (e) {
    console.error("[NativeAudio] Failed to download:", e);
  }

  return proxyUrl;
}

export async function getCachedAudioUrlNative(source: QuranAudioSource): Promise<string> {
  if (!isNativeApp()) {
    return getProxyUrl(source);
  }

  const localPath = getLocalPath(source);

  try {
    const fileInfo = await Filesystem.stat({
      path: localPath,
      directory: Directory.Data,
    });
    if (fileInfo) {
      const base64 = await Filesystem.readFile({
        path: localPath,
        directory: Directory.Data,
      });
      const mimeType = "audio/mpeg";
      return `data:${mimeType};base64,${base64.data}`;
    }
  } catch {
  }

  return getProxyUrl(source);
}

export async function clearAudioCache(): Promise<void> {
  if (!isNativeApp()) return;

  try {
    await Filesystem.rmdir({
      path: AUDIO_CACHE_DIR,
      directory: Directory.Data,
      recursive: true,
    });
  } catch {}
}

export async function getCachedAudioCount(): Promise<number> {
  if (!isNativeApp()) return 0;

  try {
    const files = await Filesystem.readdir({
      path: AUDIO_CACHE_DIR,
      directory: Directory.Data,
    });
    let count = 0;
    const dirs = files as unknown as Array<{ name: string; type: string }>;
    for (const dir of dirs) {
      if (dir.type === "directory") {
        const audioFiles = await Filesystem.readdir({
          path: `${AUDIO_CACHE_DIR}/${dir.name}`,
          directory: Directory.Data,
        });
        const audioList = audioFiles as unknown as Array<{ name: string }>;
        count += audioList.filter((f: { name: string }) => f.name.endsWith(".mp3")).length;
      }
    }
    return count;
  } catch {
    return 0;
  }
}
