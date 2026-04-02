import { Router } from "express";
import https from "https";

const router = Router();

const cache = new Map<string, { data: unknown; expiresAt: number }>();

router.get("/quran/surah/:id", (req, res) => {
  const id = req.params.id ?? "";
  const num = parseInt(id);
  if (isNaN(num) || num < 1 || num > 114) {
    res.status(400).json({ error: "Invalid surah number (1-114)" });
    return;
  }

  const cached = cache.get(id);
  if (cached && Date.now() < cached.expiresAt) {
    res.json(cached.data);
    return;
  }

  const url = `https://api.alquran.cloud/v1/surah/${num}/quran-uthmani`;
  https
    .get(url, (upstream) => {
      let body = "";
      upstream.on("data", (chunk: Buffer) => {
        body += chunk.toString();
      });
      upstream.on("end", () => {
        try {
          const parsed = JSON.parse(body) as unknown;
          cache.set(id, {
            data: parsed,
            expiresAt: Date.now() + 24 * 60 * 60 * 1000,
          });
          res.json(parsed);
        } catch {
          res.status(502).json({ error: "Invalid upstream response" });
        }
      });
    })
    .on("error", () => {
      res.status(502).json({ error: "Failed to fetch Quran data" });
    });
});

export default router;
