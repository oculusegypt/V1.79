import { Router } from "express";
import webpush from "web-push";
import { db } from "@workspace/db";
import { pushSubscriptionsTable, pushJobsTable, pushFcmTokensTable } from "@workspace/db/schema";
import { eq, lte, and } from "drizzle-orm";

const router = Router();

const VAPID_EMAIL = process.env.VAPID_EMAIL || "mailto:admin@tawbah.app";
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

// ── Firebase Admin (FCM) ─────────────────────────────────────────────────────

type FirebaseApp = {
  messaging: () => {
    send: (msg: object) => Promise<string>;
  };
};

let firebaseApp: FirebaseApp | null = null;

async function getFirebaseApp(): Promise<FirebaseApp | null> {
  if (firebaseApp) return firebaseApp;
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountJson) return null;
  try {
    const admin = await import("firebase-admin");
    if (!admin.default.apps.length) {
      const serviceAccount = JSON.parse(serviceAccountJson) as object;
      admin.default.initializeApp({
        credential: admin.default.credential.cert(serviceAccount as Parameters<typeof admin.default.credential.cert>[0]),
      });
    }
    firebaseApp = admin.default.app() as unknown as FirebaseApp;
    return firebaseApp;
  } catch (e) {
    console.error("[FCM] Firebase Admin init failed:", e);
    return null;
  }
}

async function sendFcmNotification(token: string, title: string, body: string, url: string): Promise<boolean> {
  const app = await getFirebaseApp();
  if (!app) return false;
  try {
    await app.messaging().send({
      token,
      notification: { title, body },
      data: { url },
      android: {
        priority: "high",
        notification: {
          channelId: "prayer",
          sound: "default",
          clickAction: "FLUTTER_NOTIFICATION_CLICK",
        },
      },
    });
    return true;
  } catch (e) {
    console.error("[FCM] Send failed for token:", e);
    return false;
  }
}

// GET /push/vapid-public-key
router.get("/vapid-public-key", (_req, res) => {
  if (!VAPID_PUBLIC_KEY) {
    return res.json({ key: "", configured: false });
  }
  return res.json({ key: VAPID_PUBLIC_KEY, configured: true });
});

// POST /push/subscribe
router.post("/subscribe", async (req, res) => {
  const { sessionId, subscription } = req.body;
  if (!sessionId || !subscription?.endpoint) {
    return res.status(400).json({ error: "Missing sessionId or subscription" });
  }
  const { endpoint, keys } = subscription;
  const { p256dh, auth } = keys || {};
  if (!p256dh || !auth) {
    return res.status(400).json({ error: "Missing subscription keys" });
  }
  await db
    .insert(pushSubscriptionsTable)
    .values({ sessionId, endpoint, p256dh, auth })
    .onConflictDoUpdate({
      target: pushSubscriptionsTable.sessionId,
      set: { endpoint, p256dh, auth, updatedAt: new Date() },
    });
  res.json({ ok: true });
});

// POST /push/fcm-token
router.post("/fcm-token", async (req, res) => {
  const { sessionId, token, platform } = req.body as {
    sessionId?: string;
    token?: string;
    platform?: string;
  };
  if (!sessionId || !token) {
    return res.status(400).json({ error: "Missing sessionId or token" });
  }
  const plat = platform || "android";
  await db
    .insert(pushFcmTokensTable)
    .values({ sessionId, token, platform: plat })
    .onConflictDoUpdate({
      target: [pushFcmTokensTable.sessionId, pushFcmTokensTable.platform],
      set: { token, updatedAt: new Date() },
    });
  return res.json({ ok: true });
});

// POST /push/schedule
router.post("/schedule", async (req, res) => {
  const { sessionId, jobs } = req.body;
  if (!sessionId || !Array.isArray(jobs)) {
    return res.status(400).json({ error: "Missing sessionId or jobs" });
  }
  if (jobs.length === 0) {
    return res.json({ ok: true, count: 0 });
  }
  const rows = jobs.map((j: { type?: string; title: string; body: string; url?: string; fireAt: string }) => ({
    sessionId,
    type: j.type || "custom",
    title: j.title,
    body: j.body,
    url: j.url || "/",
    fireAt: new Date(j.fireAt),
    sent: false,
  }));
  await db.insert(pushJobsTable).values(rows);
  res.json({ ok: true, count: rows.length });
});

// DELETE /push/jobs  — clear pending jobs for a session (before rescheduling)
router.delete("/jobs", async (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) return res.status(400).json({ error: "Missing sessionId" });
  await db
    .delete(pushJobsTable)
    .where(and(eq(pushJobsTable.sessionId, sessionId), eq(pushJobsTable.sent, false)));
  res.json({ ok: true });
});

// Internal: send due push notifications (called by scheduler)
export async function sendDuePushJobs() {
  const now = new Date();
  const dueJobs = await db.query.pushJobsTable.findMany({
    where: and(eq(pushJobsTable.sent, false), lte(pushJobsTable.fireAt, now)),
  });
  if (dueJobs.length === 0) return;

  for (const job of dueJobs) {
    let sent = false;

    // 1. Try native FCM push (Android APK users)
    const fcmTokens = await db.query.pushFcmTokensTable.findMany({
      where: eq(pushFcmTokensTable.sessionId, job.sessionId),
    });
    for (const fcmRow of fcmTokens) {
      const ok = await sendFcmNotification(fcmRow.token, job.title, job.body, job.url);
      if (ok) sent = true;
    }

    // 2. Try Web Push (PWA/browser users)
    const sub = await db.query.pushSubscriptionsTable.findFirst({
      where: eq(pushSubscriptionsTable.sessionId, job.sessionId),
    });
    if (sub && VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({
            title: job.title,
            body: job.body,
            url: job.url,
            tag: `job-${job.id}`,
          })
        );
        sent = true;
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 410 || status === 404) {
          await db
            .delete(pushSubscriptionsTable)
            .where(eq(pushSubscriptionsTable.sessionId, job.sessionId));
        }
      }
    }

    void sent;

    await db
      .update(pushJobsTable)
      .set({ sent: true })
      .where(eq(pushJobsTable.id, job.id));
  }
}

export default router;
