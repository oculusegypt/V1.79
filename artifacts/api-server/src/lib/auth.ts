import type { Request, Response, NextFunction } from "express";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

export type AuthTokenPayload = {
  sub: string;
  email?: string;
};

function getSupabaseUrl(): string | null {
  const url = process.env.SUPABASE_URL;
  return url ? url.replace(/\/$/, "") : null;
}

function getSupabaseAudience() {
  return process.env.SUPABASE_JWT_AUD ?? "authenticated";
}

let _jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks(): ReturnType<typeof createRemoteJWKSet> | null {
  if (_jwks) return _jwks;
  const supabaseUrl = getSupabaseUrl();
  if (!supabaseUrl) return null;
  try {
    _jwks = createRemoteJWKSet(new URL(`${supabaseUrl}/auth/v1/keys`));
    return _jwks;
  } catch {
    return null;
  }
}

async function verifySupabaseJwt(token: string): Promise<AuthTokenPayload | null> {
  const jwks = getJwks();
  if (!jwks) return null;
  const supabaseUrl = getSupabaseUrl();
  if (!supabaseUrl) return null;
  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: `${supabaseUrl}/auth/v1`,
      audience: getSupabaseAudience(),
    });
    const p = payload as JWTPayload & { email?: string };
    if (!p.sub) return null;
    return { sub: p.sub, email: p.email };
  } catch {
    return null;
  }
}

export type AuthenticatedRequest = Request & { auth?: AuthTokenPayload };

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.toLowerCase().startsWith("bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = header.slice("bearer ".length).trim();
  const payload = await verifySupabaseJwt(token);
  if (!payload) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  req.auth = payload;
  return next();
}

export async function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (header && header.toLowerCase().startsWith("bearer ")) {
      const token = header.slice("bearer ".length).trim();
      const payload = await verifySupabaseJwt(token);
      if (payload) req.auth = payload;
    }
  } catch {}
  return next();
}

export function hashPassword(_password: string): string {
  return "";
}
