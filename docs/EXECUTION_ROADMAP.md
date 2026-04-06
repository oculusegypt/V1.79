# 🚀 EXECUTION ROADMAP - Tawbah AI

> Production-grade transformation plan
> Last Updated: 2026-04-03

---

## 📋 Progress Tracker

```
[DONE] Phase 0: UX Critical Fixes
[DONE] Phase 1: Stability & Architecture
[DONE] Phase 2: Performance & Optimization
[DONE] Phase 3: Polish & Intelligence
```

---

# Phase 0: UX Critical Fixes

## 🎯 Objectives

1. إعادة تنظيم الصفحة الرئيسية (Home) بـ 4 sections واضحة
2. إضافة Zakiy AI improvements (typing indicator, pulse animation)
3. تحسين الـ accessibility للـ critical buttons

## 🧩 Tasks

### Task 0.1: Home Page Reorganization

**Status**: [IN PROGRESS]
**Estimated Time**: 4 hours
**Success Criteria**: Home page has 4 clear sections with visual hierarchy

#### Implementation Notes:

**Current State**: 15+ cards in single grid, no hierarchy

**Target State**:

```
🔷 Section 1 (Primary Focus) - Top of page
├── Zakiy AI Button (most prominent)
├── Today's Word (ورد اليوم)
└── Dua Moment (لحظة الإجابة)

🔷 Section 2 (Daily Tools) - 2x2 grid
├── 📿 الأذكار
├── 🕌 الصلاة
├── 📖 القرآن
└── مسبحة digital

🔷 Section 3 (Growth & Content) - List
├── 💚 مكتبة الرجاء
├── 🎓 البرامج
└── يومياتي

🔷 Section 4 (Community & Extras) - Bottom
├── غرف الذكر
└── الإشعارات
```

**Files to Modify**:
- `src/pages/home/index.tsx` - Main structure
- `src/pages/home/bento-cells.tsx` - Card organization
- `src/pages/home/list-sections.tsx` - Section definitions

**Technical Approach**:
1. Keep all existing functionality (NOT removing features)
2. Add section headers with visual separation
3. Use different card sizes: Hero cards (Section 1), Grid cards (Section 2), List items (Sections 3-4)
4. Add scroll-based section highlighting

---

### Task 0.2: Zakiy AI Improvements

**Status**: [PENDING]
**Estimated Time**: 3 hours
**Success Criteria**: Zakiy feels more alive and responsive

#### Implementation Notes:

**Add Typing Indicator**:
```tsx
// In zakiy/index.tsx - add after messages
{loading && (
  <div className="flex items-center gap-1 px-4 py-2">
    <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
    <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
    <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
  </div>
)}
```

**Add Pulse Animation to Avatar**:
- Modify `ZakiyAvatar.tsx` to accept `isActive` prop
- Add subtle breathing animation when Zakiy is "thinking"
- Add glow effect when user receives new message

**Add Context-Aware Intro Messages**:
- Check time of day (morning/afternoon/evening)
- Check user's last mood from journal
- Check streak status (celebrate or encourage)

**Add Dismiss for Suggestions**:
- Add X button to each suggestion card
- Track dismissed suggestions to avoid repetition

---

### Task 0.3: Accessibility Critical Fixes

**Status**: [PENDING]
**Estimated Time**: 2 hours
**Success Criteria**: All critical buttons have aria-labels, contrast improved

#### Implementation Notes:

**Add aria-labels to**:
- Bottom nav items
- Zakiy orb
- SOS button
- All icon-only buttons

**Fix Contrast**:
- Check `--text-muted` usage in dark mode
- Ensure 4.5:1 ratio for body text
- Ensure 3:1 ratio for large text

**Files to Modify**:
- `src/components/layout.tsx` - Nav items
- `src/components/ZakiyPanel.tsx` - Zakiy controls
- `src/pages/home/QuickAccessBar.tsx` - Quick actions

---

# Phase 1: Stability & Architecture

## 🎯 Objectives

1. Code splitting for heavy pages
2. Extract giant components
3. Add error boundaries
4. Improve state management

## 🧩 Tasks

### Task 1.1: Route-based Code Splitting

**Status**: [PENDING]
**Estimated Time**: 3 hours

#### Implementation Notes:

**Pages to Lazy Load**:
- Quran pages ( heaviest - 97KB)
- Munajat (48KB)
- Kaffarah (44KB)
- Adhkar
- Islamic Programs

**Implementation**:
```tsx
// App.tsx - change imports to lazy
const QuranPage = lazy(() => import("@/pages/quran"));
const Munajat = lazy(() => import("@/pages/munajat"));
// etc.
```

**Expected Impact**: Initial bundle reduction ~40%

---

### Task 1.2: Extract Giant Components

**Status**: [PENDING]
**Estimated Time**: 6 hours

#### Implementation Notes:

**quran.tsx (97KB) → Extract**:
- `QuranSurahList.tsx` - Surah listing
- `QuranPlayer.tsx` - Audio controls
- `QuranSearch.tsx` - Search functionality
- `QuranBookmarks.tsx` - Bookmark management
- `QuranJuzSelector.tsx` - Juz navigation

**zakiy/index.tsx (710 lines) → Extract**:
- `ZakiyMessageList.tsx` - Message rendering
- `ZakiyInput.tsx` - Input handling
- `ZakiySuggestions.tsx` - Suggestion cards
- `ZakiyVoiceInput.tsx` - Voice recording

---

### Task 1.3: Error Boundaries

**Status**: [PENDING]
**Estimated Time**: 2 hours

#### Implementation Notes:

**Current**: Basic ErrorBoundary exists

**Add**:
- Per-route error boundaries
- Graceful degradation for failed components
- User-friendly error messages in Arabic

---

# Phase 2: Performance & Optimization

## 🎯 Objectives

1. Virtual scrolling for long lists
2. Image optimization
3. Bundle analysis and reduction

## 🧩 Tasks

### Task 2.1: Virtual Scrolling

**Status**: [PENDING]
**Estimated Time**: 4 hours

#### Implementation Notes:

**Apply to**:
- Habits library (50 items)
- Adhkar lists
- Quran surah list (114)
- Community duas

**Use**: `@tanstack/react-virtual` or `react-window`

---

### Task 2.2: Image Optimization

**Status**: [PENDING]
**Estimated Time**: 2 hours

#### Implementation Notes:

**Add lazy loading**:
```tsx
<img src={avatarSrc} loading="lazy" alt="..." />
```

**Optimize**:
- Convert PNG avatars to WebP
- Add srcset for different screen sizes

---

### Task 2.3: Bundle Analysis

**Status**: [PENDING]
**Estimated Time**: 3 hours

#### Implementation Notes:

**Tools**: webpack-bundle-analyzer or source-map-explorer

**Actions**:
- Identify large dependencies
- Remove unused shadcn components
- Optimize icon imports (use tree-shaking)

---

# Phase 3: Polish & Intelligence

## 🎯 Objectives

1. Zakiy AI personality refinement
2. Onboarding flow
3. Offline support basics

## 🧩 Tasks

### Task 3.1: Onboarding Flow

**Status**: [PENDING]
**Estimated Time**: 6 hours

#### Implementation Notes:

**3-Step Introduction**:
1. Welcome screen with Zakiy introduction
2. Goal selection (repentance, habits, general growth)
3. Daily reminder preferences

**Implementation**:
- Create `OnboardingModal.tsx`
- Store completion in localStorage
- Show only on first visit

---

### Task 3.2: Zakiy AI Personality

**Status**: [PENDING]
**Estimated Time**: 4 hours

#### Implementation Notes:

**Add**:
- Time-aware greetings
- Streak celebration messages
- Post-SOS follow-up check-in
- Context from user's journal entries

---

### Task 3.3: Offline Basics

**Status**: [PENDING]
**Estimated Time**: 8 hours

#### Implementation Notes:

**Cache**:
- Adhkar text (static)
- Quran bookmarks
- User preferences

**Use**: Service Worker + Cache API

---

# 📊 Success Metrics

| Phase | Key Metric | Target |
|-------|------------|--------|
| Phase 0 | Home page bounce rate | -30% |
| Phase 0 | Zakiy engagement | +50% |
| Phase 1 | Initial load time | -40% |
| Phase 2 | Scroll performance | 60fps |
| Phase 3 | Day-1 retention | +20% |

---

# 🔄 Weekly Update Template

```
## Week X Update

### Completed
- [Task name] - 2h

### In Progress
- [Task name] - 4h remaining

### Blockers
- [Issue description]

### Next Week
- [Task name]
- [Task name]
```
