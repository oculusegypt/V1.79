# Radio Proxy & Podcast Playback Fix (Android)

## Summary
Fixed radio playback on Android APK and resolved podcast playback issues on both web and native. The root cause was:
- Radio streams returned HTTP **302 redirects** which broke Android WebView playback.
- Podcast playback on `islamic-programs` page was blocked by forced `crossOrigin="anonymous"` and a `stalled→reload` loop.

## Changes Made

### 1. API Server: Radio Proxy Follows Redirects
- **File**: `api-server/src/routes/audio-proxy.ts`
- **Endpoint**: `GET /api/audio-proxy/radio?url=...`
- **What**: Added recursive redirect following (up to 5 hops) with allowed-host validation.
- **Result**: Clients receive **200/206 streaming** instead of 302.
- **Deployed**: Pushed to GitHub `main` and live on Replit.

### 2. Web App: Selective Radio Proxy Usage
- **File**: `tawbah-web/src/pages/islamic-programs/index.tsx`
- **What**: `playUrl` now uses radio proxy **only for radio streams on native** (`useRadioProxy: true`).
- **Result**: Podcasts play directly; radio uses proxy for cross-domain/redirect safety.

### 3. Native Audio: Removed Forced crossOrigin
- **File**: `tawbah-web/src/lib/native-audio.ts`
- **What**: Stopped forcing `crossOrigin="anonymous"` inside `setAudioSrc`.
- **Result**: Page controls `crossOrigin` (only for radio proxy), avoiding CORS issues with direct podcast URLs.

### 4. Audio Error Handling: Reload Only for Live Radio
- **File**: `tawbah-web/src/pages/islamic-programs/index.tsx`
- **What**: `onstalled` now calls `a.load()` **only when `useRadioProxy`** (live radio).
- **Result**: Podcasts avoid infinite `stalled→reload` loops on Wi‑Fi/cellular.

## APK Build
- **Script**: `scripts/build-apk.ps1`
- **Output**: `artifacts/tawbah-web/android/app/build/outputs/apk/debug/app-debug.apk`
- **Built**: After all fixes (latest commit: `e5aba2a`).

## Testing Checklist
- [ ] Radio stations play on Android APK (proxy returns 200/206)
- [ ] Podcast episodes play on Android APK (direct URLs, no CORS block)
- [ ] Podcast episodes play on web (localhost) without CORS errors
- [ ] Podcast episodes play on Wi‑Fi and cellular (no stall loops)
- [ ] Category page (`/islamic-programs/podcast/:id`) still plays
- [ ] Replit endpoint returns 200/206 (not 302)

## Network Notes
- **Wi‑Fi vs Cellular**: Some networks may block or delay certain domains. The proxy mitigates this for radio by serving from a trusted Replit domain.
- **Stalled Loop**: Previously, any `stalled` event triggered `a.load()`. Now only live radio retries; podcasts log the event and continue.

## Future Improvements
- Add fallback URLs for radio hosts.
- Consider CDN caching for podcast assets if needed.
- Monitor `stalled` and `error` rates in production.

## Relevant Commits
- `ff7788d` fix(api): follow redirects for radio proxy
- `b75a17e` fix(web): avoid crossOrigin for direct podcast audio
- `accc77f` fix(native): do not force crossOrigin in setAudioSrc
- `e5aba2a` fix(audio): reload on stalled only for live radio
