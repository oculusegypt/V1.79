# Implementation Plan — Zakiy Chat UI Overhaul

## Overview
UI improvements to the Zakiy chat page: header redesign, navigation simplification, dynamic input button, floating mic, and UI polish.

## Affected Files
| File | Changes |
|------|---------|
| `artifacts/tawbah-web/src/pages/zakiy/index.tsx` | Header, input bar, floating mic, background |
| `artifacts/tawbah-web/src/components/layout.tsx` | Nav center button → direct link, remove VoiceOrbOverlay |
| `artifacts/tawbah-web/src/pages/zakiy/components/SuggestionCards.tsx` | Reduce button sizes |

---

## Checklist

- [x] **STEP 1 — NAVIGATION**: Remove mic overlay, open chat directly
  ✔ Removed `VoiceOrbOverlay` import and usage from `layout.tsx`
  ✔ Center Zakiy button now navigates directly to `/zakiy` always
  ✔ Removed `voiceOpen` state and `navigate` binding
  ✔ Files modified: `components/layout.tsx`

- [x] **STEP 2 — HEADER**: WhatsApp-style (avatar+name left, tone icon right, remove "متصل" badge)
  ✔ Replaced `ContextHeader` with inline custom sticky header
  ✔ `ZakiyAvatar` + name + subtitle shown left of header (WhatsApp style)
  ✔ `SlidersHorizontal` icon button replaces old dropdown
  ✔ Removed green "متصل" status pill
  ✔ State accent line and anniversary badge preserved
  ✔ Files modified: `pages/zakiy/index.tsx`

- [x] **STEP 3 — INPUT BAR**: Dynamic mic→send button, remove footer text
  ✔ Removed standalone left mic button from input row
  ✔ Single right button: `StopCircle` when recording, `Send` when typing, `Mic` when idle
  ✔ Smooth `AnimatePresence` transition between button states
  ✔ Removed "ما تقوله هنا آمن ومحفوظ بيننا فقط" footer text
  ✔ Files modified: `pages/zakiy/index.tsx`

- [x] **STEP 4 — FLOATING MIC**: Modern floating mic FAB below suggestions
  ✔ Fixed position FAB with emerald gradient + glow shadow
  ✔ Subtle breathing animation on the mic icon
  ✔ Shown only when idle (no input text, not recording, not loading)
  ✔ Files modified: `pages/zakiy/index.tsx`

- [x] **STEP 5 — UI POLISH**: Reduce suggestion sizes, unify background
  ✔ Suggestion chip font: `11.5px` → `10.5px`, padding `px-3 py-1.5`
  ✔ Chat area background: unified `hsl(var(--muted)/0.25)`
  ✔ Files modified: `pages/zakiy/components/SuggestionCards.tsx`, `pages/zakiy/index.tsx`
