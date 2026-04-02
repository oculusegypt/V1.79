import { Router } from "express";
import https from "https";
import http from "http";

const router = Router();

// ── Per-reciter CDN config ─────────────────────────────────────────────────
// Islamic Network CDN uses different bitrates per reciter.
// Some reciters (saadalghamdi) are only available on everyayah.com per-ayah.

type IslamicConfig = { type: "islamic"; bitrate: number };
type EveryayahConfig = { type: "everyayah"; folder: string };
type ReciterConfig = IslamicConfig | EveryayahConfig;

const RECITER_CONFIG: Record<string, ReciterConfig> = {
  "ar.alafasy":            { type: "islamic", bitrate: 128 },
  "ar.mahermuaiqly":       { type: "islamic", bitrate: 128 },
  "ar.abdurrahmaansudais": { type: "islamic", bitrate: 192 },
  "ar.saoodshuraym":       { type: "islamic", bitrate: 64  },
  "ar.shaatree":           { type: "islamic", bitrate: 128 },
  "ar.saadalghamdi":       { type: "everyayah", folder: "Ghamadi_40kbps" },
  "ar.hanirifai":          { type: "islamic", bitrate: 192 },
  "ar.husary":             { type: "islamic", bitrate: 128 },
  "ar.minshawi":           { type: "islamic", bitrate: 128 },
  "ar.abdulsamad":         { type: "islamic", bitrate: 64  },
  "ar.ahmedajamy":         { type: "islamic", bitrate: 128 },
  "ar.muhammadjibreel":    { type: "islamic", bitrate: 128 },
};

// Global ayah → surah + ayah-in-surah (for everyayah.com format)
const SURAH_LENGTHS = [7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];

function globalToSurahAyah(global: number): [number, number] {
  let remaining = global;
  for (let i = 0; i < SURAH_LENGTHS.length; i++) {
    const len = SURAH_LENGTHS[i]!;
    if (remaining <= len) return [i + 1, remaining];
    remaining -= len;
  }
  return [114, remaining];
}

function pad3(n: number) { return String(n).padStart(3, "0"); }

// ── Proxy helper ───────────────────────────────────────────────────────────
function proxyUrl(url: string, res: ReturnType<Router["get"]> extends (path: string, ...handlers: infer H) => unknown ? (H[0] extends (req: unknown, res: infer R) => unknown ? R : never) : never) {
  const get = url.startsWith("https") ? https.get : http.get;
  // @ts-ignore
  get(url, (upstream: import("http").IncomingMessage) => {
    // @ts-ignore
    if (upstream.statusCode && upstream.statusCode >= 400) {
      // @ts-ignore
      res.status(upstream.statusCode ?? 502).end();
      return;
    }
    // @ts-ignore
    res.setHeader("Content-Type", upstream.headers["content-type"] ?? "audio/mpeg");
    // @ts-ignore
    res.setHeader("Cache-Control", "public, max-age=86400");
    // @ts-ignore
    res.setHeader("Access-Control-Allow-Origin", "*");
    // @ts-ignore
    if (upstream.headers["content-length"]) {
      // @ts-ignore
      res.setHeader("Content-Length", upstream.headers["content-length"]);
    }
    // @ts-ignore
    upstream.pipe(res);
  // @ts-ignore
  }).on("error", () => { res.status(502).end(); });
}

router.get("/audio-proxy/quran/:reciter/:file", (req, res) => {
  const { reciter, file } = req.params;
  if (!file?.endsWith(".mp3") || !reciter) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const globalAyah = parseInt(file.replace(".mp3", ""), 10);
  const config = RECITER_CONFIG[reciter] ?? { type: "islamic", bitrate: 128 };

  let url: string;
  if (config.type === "everyayah") {
    const [surah, ayah] = globalToSurahAyah(globalAyah);
    url = `https://everyayah.com/data/${config.folder}/${pad3(surah)}${pad3(ayah)}.mp3`;
  } else {
    url = `https://cdn.islamic.network/quran/audio/${config.bitrate}/${reciter}/${globalAyah}.mp3`;
  }

  const get = url.startsWith("https") ? https.get : http.get;
  get(url, (upstream) => {
    if (upstream.statusCode && upstream.statusCode >= 400) {
      res.status(upstream.statusCode ?? 502).end();
      return;
    }
    res.setHeader("Content-Type", upstream.headers["content-type"] ?? "audio/mpeg");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.setHeader("Access-Control-Allow-Origin", "*");
    if (upstream.headers["content-length"]) {
      res.setHeader("Content-Length", upstream.headers["content-length"]);
    }
    upstream.pipe(res);
  }).on("error", () => {
    res.status(502).end();
  });
});

export default router;
