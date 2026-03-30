# Workspace

## Overview

**دليل التوبة النصوح** - A comprehensive Arabic Islamic app guiding users through sincere repentance (Tawbah). Available as both a web app and mobile app.

### Key Features
- **القرآن الكريم** (`/quran`): Comprehensive Quran library — hero with rotating ayahs, daily ayah+tafsir, reading tracker (streak), surah browser (114 surahs with search+filter), sciences grid, miracles section (expandable cards), virtues hadiths. Home card with embedded reading tracker before SoulMeter. Hadith-of-the-day card below SoulMeter.
- **البوت الزكي** (`/zakiy`): AI-powered Arabic spiritual chatbot for venting and repentance guidance. Supports text and voice input, TTS responses (onyx voice), full chat history.
- **مكتبة الرجاء** (`/rajaa`): Hadiths and stories with AI-generated Arabic TTS audio (onyx/echo voices).
- All AI features use OpenAI via Replit proxy (no API key needed).
- **Roadmap**: Full Quran library roadmap in `QURAN_ROADMAP.md` (4 phases: foundation ✅, deep reading, social khatma, AI).

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Web frontend**: React + Vite, Tailwind CSS, Framer Motion
- **Mobile**: Expo React Native, Expo Router

## App Features

1. **عهد التوبة (Covenant)** - User selects sin category and signs a repentance covenant
2. **مهام اليوم الأول (First Day Tasks)** - Mandatory checklist of 4 immediate actions
3. **رحلة الـ 30 يوماً (30-Day Journey)** - Primary journey: day-by-day task list with individual task toggling, sin integration panel, and streak tracking. Replaces the 40-day plan as the main hero card.
4. **عداد الذكر (Dhikr Counter)** - Three counters (Istighfar/100, Tasbih/33, Sayyid al-Istighfar)
5. **زر الطوارئ SOS المطور** - 3-phase emergency: Alert → Breathing exercise (animated) → Emergency duas
6. **علامات قبول التوبة (Signs of Accepted Repentance)** - 5 spiritual signs
7. **التعامل مع الانتكاسات (Handling Relapse)** - Guidance and encouragement
8. **الكفارات الشرعية (Kaffarah System)** - Sin-category-specific expiation steps with completion tracking
9. **مكتبة الرجاء (Library of Hope)** - Quran verses + Hadiths + Historical repentance stories with tabs
10. **يوميات التوبة السرية (Private Journal)** - Encrypted personal diary with mood tracking
11. **خريطة التقدم الروحي (Spiritual Progress Chart)** - 40-day grid + weekly bar charts for habits & dhikr
12. **أوقات الخطر الذكية (Smart Danger Times)** - User-configurable danger time alerts with local notifications
13. **تنبيهات المواسم (Seasonal Banners)** - Auto-detected Islamic season banners (Ramadan, Dhul Hijja, etc.)
14. **البوت الزكي — Zakiy AI Chatbot** (`/zakiy`) - Arabic spiritual chatbot for venting and repentance guidance. Supports text + voice input, TTS responses (OpenAI onyx voice), full chat history. Uses OpenAI via Replit proxy.
15. **غرف الذكر الجماعية (Dhikr Rooms)** (`/dhikr-rooms`) - Live group dhikr sessions where users join virtual rooms and do collective remembrance in real time.
16. **مقياس الروح (Soul Meter)** - Interactive spiritual wellness gauge on the home page; user rates their spiritual state and gets a contextual response.
17. **برامج إسلامية (Islamic Programs)** (`/islamic-programs`) - Curated collection of structured Islamic self-improvement programmes (e.g., Tahajjud challenge, Quran khatm planner).
18. **شجرة التوبة (Tawbah Garden)** - Gamified visual tree on the home page that grows with each completed day and habit, giving a sense of spiritual progress.
19. **وضع المناجاة (Munajat Mode)** - Immersive night-mode screen with soft background audio and personal supplication prompts for late-night worship.
20. **شريط الوصول الفوري (Quick Access Bar)** - Horizontally scrollable pill-shaped shortcut bar at the top of the home page linking to the 8 most-used sections (Quran, Prayer Times, Dhikr, Rajaa Library, Islamic Programs, Dhikr Rooms, Journal, Adhkar).
21. **بطاقة تركيزي اليوم (Daily Focus Card)** - A pinned daily task card on the home page showing one spiritually focused mission per day (rotates by day of week). User marks it complete; state persists across sessions via localStorage.
22. **قارئ القرآن الداخلي الكامل (In-App Quran Reader)** - Full in-app surah reader sheet triggered from the Quran browser. Displays all ayahs in Uthmani script fetched from `/api/quran/surah/:id`. Each ayah has a play/pause audio button using the CDN audio proxy. Includes reciter selection (6 reciters), Bismillah header, and a singleton audio manager so only one ayah plays at a time.
23. **مسار API لنص القرآن (Quran Text API Route)** (`GET /api/quran/surah/:id`) - Backend proxy route that fetches full surah ayah text from alquran.cloud (`quran-uthmani` edition) and caches responses in memory for 24 hours to avoid repeated upstream calls.

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/       # Express 5 API server (port 8080, /api)
│   ├── tawbah-web/       # React+Vite web app (port 20251, /)
│   └── tawbah-mobile/    # Expo React Native mobile app (port 24800, /mobile/)
├── lib/
│   ├── api-spec/         # OpenAPI spec + Orval codegen config
│   ├── api-client-react/ # Generated React Query hooks
│   ├── api-zod/          # Generated Zod schemas from OpenAPI
│   └── db/               # Drizzle ORM schema + DB connection
│       └── schema/tawbah.ts  # user_progress, habits, dhikr_count tables
└── ...
```

## DB Schema

- `user_progress` - Tracks each session's repentance journey
- `habits` - Daily habit completion tracking
- `dhikr_count` - Daily dhikr counters per session
- `kaffarah_steps` - Tracks completion of each expiation step per session
- `journal_entries` - Private repentance journal entries with mood field

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

## Required Setup (for any agent starting on this project)

### OpenAI Integration (REQUIRED — must run before starting)

All AI features (Zakiy chatbot, TTS in Rajaa library, voice responses) use OpenAI via Replit's managed AI Integrations proxy. No API key from the user is needed — Replit provisions it automatically.

**You MUST run this in the code_execution sandbox before working on any AI features:**

```javascript
const result = await setupReplitAIIntegrations({
    providerSlug: "openai",
    providerUrlEnvVarName: "AI_INTEGRATIONS_OPENAI_BASE_URL",
    providerApiKeyEnvVarName: "AI_INTEGRATIONS_OPENAI_API_KEY"
});
console.log(result);
```

This sets `AI_INTEGRATIONS_OPENAI_BASE_URL` and `AI_INTEGRATIONS_OPENAI_API_KEY` environment variables. The server-side client is at `lib/integrations-openai-ai-server/src/client.ts` — it automatically picks up these env vars. After running, restart the API server workflow so it picks up the new variables.

If the Zakiy chatbot throws "No OpenAI credentials found", it means this step was skipped.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes:
- `GET /api/healthz` - Health check
- `GET /api/user/progress` - Get user progress by sessionId
- `PUT /api/user/progress` - Update progress
- `POST /api/user/covenant` - Sign repentance covenant
- `GET /api/habits` - Get today's habits
- `POST /api/habits` - Toggle habit completion
- `GET /api/dhikr/count` - Get dhikr counts
- `POST /api/dhikr/increment` - Increment a dhikr counter
- `GET /api/quran/surah/:id` - Fetch full ayah text for a surah (1-114) from alquran.cloud, 24h in-memory cache
- `GET /api/audio-proxy/quran/:reciterId/:globalAyahNum.mp3` - Streams Quran recitation audio from cdn.islamic.network CDN

### `artifacts/tawbah-web` (`@workspace/tawbah-web`)

React+Vite web app with Arabic RTL layout, Islamic green/gold theme.
Pages: home, covenant, day-one, plan, dhikr, sos, signs, relapse

### `artifacts/tawbah-mobile` (`@workspace/tawbah-mobile`)

Expo React Native app with 4 tabs + 4 modal/stack screens.
Tabs: الرئيسية, المهام, الذكر, التقدم
Screens: covenant (modal), sos (modal), signs, relapse
Uses AsyncStorage for local persistence (no API calls needed).
