import { JourneyDay, JourneyData } from "./types";

export function toArabicIndic(n: number): string {
  return n.toString().replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[parseInt(d)]!);
}

const SURAH_LENGTHS = [7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];

export function toGlobalAyah(surah: number, ayah: number): number {
  let count = 0;
  for (let i = 0; i < surah - 1; i++) count += SURAH_LENGTHS[i] ?? 0;
  return count + ayah;
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
  timeoutMs = 12_000,
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

export function buildNativeFallbackJourney(): JourneyData {
  const days: JourneyDay[] = Array.from({ length: 30 }, (_, i) => {
    const day = i + 1;
    return {
      day,
      title: `اليوم ${toArabicIndic(day)}`,
      tasks: ["ذكر", "استغفار", "صلاة"],
      verse: "﴿وَتُوبُوا إِلَى اللَّهِ جَمِيعًا أَيُّهَا الْمُؤْمِنُونَ لَعَلَّكُمْ تُفْلِحُونَ﴾",
      completed: false,
      isCurrent: day === 1,
      isLocked: day !== 1,
      taskChecks: [false, false, false],
    };
  });

  return { days, completedCount: 0, currentDay: 1, streakDays: 0 };
}
