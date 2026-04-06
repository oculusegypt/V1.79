import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq, or } from "drizzle-orm";
import {
  hashPassword, verifyPassword, signJwt, requireAuth, optionalAuth,
  setAuthCookie, clearAuthCookie, type AuthenticatedRequest,
} from "../lib/auth";

const router: IRouter = Router();

function normalizeUsername(u: string) { return u.trim().toLowerCase(); }
function normalizeEmail(e: string) { return e.trim().toLowerCase(); }

router.post("/auth/register", async (req, res) => {
  const { username: usernameRaw, email: emailRaw, password, phone, gender } = req.body ?? {};

  if (typeof usernameRaw !== "string" || !usernameRaw.trim()) {
    return res.status(400).json({ error: "username_required" });
  }
  if (typeof emailRaw !== "string" || !emailRaw.includes("@")) {
    return res.status(400).json({ error: "email_required" });
  }
  if (typeof password !== "string" || password.length < 6) {
    return res.status(400).json({ error: "password_min_6" });
  }

  const username = normalizeUsername(usernameRaw);
  const email = normalizeEmail(emailRaw);

  if (!/^[a-z0-9_\.]+$/.test(username)) {
    return res.status(400).json({ error: "username_invalid_chars" });
  }

  const existing = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(or(eq(usersTable.username, username), eq(usersTable.email, email)));

  if (existing.length > 0) {
    const emailExists = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email));
    if (emailExists.length > 0) return res.status(409).json({ error: "email_taken" });
    return res.status(409).json({ error: "username_taken" });
  }

  const { salt, hash } = hashPassword(password);
  const [user] = await db
    .insert(usersTable)
    .values({ 
      username, 
      email, 
      phone: phone ?? null, 
      gender: gender === "female" ? "female" : "male",
      passwordSalt: salt, 
      passwordHash: hash 
    })
    .returning({ id: usersTable.id, username: usersTable.username, email: usersTable.email, gender: usersTable.gender });

  const token = await signJwt({ sub: String(user!.id), username: user!.username ?? username, email: user!.email });
  setAuthCookie(res, token);

  return res.json({ user: { id: user!.id, username: user!.username, email: user!.email, gender: user!.gender } });
});

router.post("/auth/login", async (req, res) => {
  const { username: usernameRaw, password } = req.body ?? {};

  if (typeof usernameRaw !== "string" || !usernameRaw.trim()) {
    return res.status(400).json({ error: "username_required" });
  }
  if (typeof password !== "string") {
    return res.status(400).json({ error: "password_required" });
  }

  const username = normalizeUsername(usernameRaw);

  const [user] = await db
    .select({
      id: usersTable.id,
      username: usersTable.username,
      email: usersTable.email,
      passwordSalt: usersTable.passwordSalt,
      passwordHash: usersTable.passwordHash,
    })
    .from(usersTable)
    .where(eq(usersTable.username, username));

  if (!user) return res.status(401).json({ error: "invalid_credentials" });

  const ok = verifyPassword(password, user.passwordSalt, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "invalid_credentials" });

  const token = await signJwt({ sub: String(user.id), username: user.username ?? username, email: user.email });
  setAuthCookie(res, token);

  return res.json({ user: { id: user.id, username: user.username, email: user.email } });
});

router.post("/auth/logout", (req, res) => {
  clearAuthCookie(res);
  return res.json({ ok: true });
});

router.get("/auth/me", optionalAuth, async (req: AuthenticatedRequest, res) => {
  if (!req.auth?.sub) return res.json({ user: null });
  const userId = Number(req.auth.sub);
  const [user] = await db
    .select({ id: usersTable.id, username: usersTable.username, email: usersTable.email })
    .from(usersTable)
    .where(eq(usersTable.id, userId));
  if (!user) return res.json({ user: null });
  return res.json({ user });
});

export default router;
