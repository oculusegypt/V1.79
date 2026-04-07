---
title: Authentication & Data Isolation
---

# Authentication model (server)

- The server issues a JWT and stores it in an **HttpOnly cookie** named `tawbah_session`.
- The frontend authenticates requests via `fetch(..., { credentials: "include" })`.
- The authoritative endpoint for client auth state is:
  - `GET /api/auth/me`

## Canonical identity / session id

Many endpoints historically accepted a `sessionId` parameter for both:

- Guest/anonymous usage.
- Logged-in usage.

To prevent cross-account leakage and client spoofing, the server now derives a **canonical session id** when the request is authenticated:

- If authenticated: `sessionId = user_<id>` (derived from the cookie JWT subject)
- Else: the request may supply `sessionId` for guest usage.

Implementation:

- `artifacts/api-server/src/lib/auth.ts`
  - `optionalAuth` populates `req.auth`
  - `getCanonicalSessionId(req)` returns `user_<id>` if authenticated
- `artifacts/api-server/src/routes/tawbah.ts`
  - `resolveSessionId(req)` returns canonical session id if present, otherwise uses query/body `sessionId`

# Frontend auth state

- The frontend **does not treat localStorage as a login source**.
- Auth state is loaded from `GET /api/auth/me` only.
- localStorage is reserved for non-auth preferences (e.g. `tawbah_gender`) and for the guest anon session id (`tawbah_anon_session`).

Relevant files:

- `artifacts/tawbah-web/src/context/AuthContext.tsx`
- `artifacts/tawbah-web/src/lib/session.ts`

# Guest session id

- Guests get a stable anonymous session id stored at `localStorage.tawbah_anon_session`.
- `getSessionId()` returns:
  - `localStorage.tawbah_session_id` (override, if present)
  - `user_<id>` if the app has an authenticated user in memory
  - `guest_<uuid>` (persisted) otherwise

# React Query data isolation (prevent cross-account leakage)

Rules:

- Any user-scoped query must:
  - Include `user.id` in the `queryKey`
  - Use `enabled: !!user`
- On auth transitions (login/register/logout):
  - Clear query cache to prevent stale UI.

Rationale:

- SPAs can show cached data from a previous account if query keys are shared.
- The combination of **per-user query keys + enabled gating + cache clear** prevents leakage when switching accounts without a full page refresh.

# Developer setup (env + routing)

This repo uses **two bases**:

- `API base` (regular app API: auth, progress, stats, push, etc.)
- `AI base` (Zakiy + any AI-backed endpoints)

## Required env vars (tawbah-web)

Create `artifacts/tawbah-web/.env.local`:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...

# IMPORTANT: Must end with /api
# Web default is same-origin + /api, but you can override for local/dev/prod.
VITE_API_BASE_URL=http://localhost:20251/api

# OPTIONAL: AI server base (Replit). Must end with /api
VITE_AI_BASE_URL=https://v-177--cbctube.replit.app/api
```

Notes:

- `VITE_*` variables are **public** (shipped to the browser). Do **not** put secrets (e.g. OpenAI keys) in `VITE_*`.
- `VITE_API_BASE_URL` and `VITE_AI_BASE_URL` must end with `/api` because the helpers strip the `/api` prefix when building URLs.

## Runtime overrides (no rebuild)

You can override bases in the browser via localStorage:

- `tawbah_api_base`
- `tawbah_ai_base`

Example:

```js
localStorage.setItem("tawbah_ai_base", "https://v-177--cbctube.replit.app/api");
location.reload();
```

## What routes go where

- Regular API calls should use `apiUrl("/api/..." )` (same-origin cookie auth works best).
- AI calls should use `aiUrl("/api/..." )`.

Current AI-routed endpoints (frontend):

- `/api/zakiy/*`
- `/api/hadi-tasks/extract`
