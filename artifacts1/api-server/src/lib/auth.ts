import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import type { Request, Response, NextFunction } from "express";

export type AuthTokenPayload = {
  sub: string;
  username?: string;
  email?: string;
};

export type AuthenticatedRequest = Request & { auth?: AuthTokenPayload };

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "tawbah-fallback-secret-change-in-production"
);

export function hashPassword(password: string): { salt: string; hash: string } {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
}

export function verifyPassword(password: string, salt: string, hash: string): boolean {
  try {
    const derived = scryptSync(password, salt, 64);
    const stored = Buffer.from(hash, "hex");
    if (derived.length !== stored.length) return false;
    return timingSafeEqual(derived, stored);
  } catch {
    return false;
  }
}

export async function signJwt(payload: { sub: string; username?: string; email?: string }): Promise<string> {
  return new SignJWT(payload as JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET);
}

async function verifyJwt(token: string): Promise<AuthTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    const p = payload as AuthTokenPayload;
    if (!p.sub) return null;
    return { sub: p.sub, username: p.username, email: p.email };
  } catch {
    return null;
  }
}

export function setAuthCookie(res: Response, token: string) {
  res.cookie("tawbah_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie("tawbah_session", { path: "/" });
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const cookieToken = (req as Request & { cookies?: Record<string, string> }).cookies?.tawbah_session;
  if (cookieToken) {
    const payload = await verifyJwt(cookieToken);
    if (payload) {
      req.auth = payload;
      return next();
    }
  }

  const header = req.headers.authorization;
  if (header?.toLowerCase().startsWith("bearer ")) {
    const token = header.slice("bearer ".length).trim();
    const payload = await verifyJwt(token);
    if (payload) {
      req.auth = payload;
      return next();
    }
  }

  return res.status(401).json({ error: "Unauthorized" });
}

export async function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  try {
    const cookieToken = (req as Request & { cookies?: Record<string, string> }).cookies?.tawbah_session;
    if (cookieToken) {
      const payload = await verifyJwt(cookieToken);
      if (payload) { req.auth = payload; return next(); }
    }
    const header = req.headers.authorization;
    if (header?.toLowerCase().startsWith("bearer ")) {
      const token = header.slice("bearer ".length).trim();
      const payload = await verifyJwt(token);
      if (payload) req.auth = payload;
    }
  } catch {}
  return next();
}
