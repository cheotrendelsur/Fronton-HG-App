# Architecture: Component-by-Component Color Migration

**Domain:** React PWA brownfield color migration — dark neon-green → mixed (dark auth / light interior)
**Researched:** 2026-03-29
**Overall confidence:** HIGH (evidence comes directly from reading every source file)

---

## 1. Current State Inventory

### Token system (tailwind.config.js)

The token system already underwent a partial migration from the original green-neon palette.
`neon-*` tokens now map to **golden/amber** values (neon-300 = `#F5D547`), not the original lime green.
The config already defines `galician.blue` (`#6BB3D9`) and `shield.blue` (`#1B3A5C`) as named tokens,
but they are not yet wired to the interactive roles (CTA buttons, focus rings, tab underlines, etc.).

Target palette tokens that need to be added or remapped in Phase 1:

| Role | Current Token | Target Value |
|------|--------------|-------------|
| CTA / primary action | `neon-300` (#F5D547 gold) | `galician.blue` (#6BB3D9) |
| Active tab underline | `neon-300` | `galician.blue` |
| Focus ring | `ring-neon-300/30` | `ring-galician-blue/30` |
| Active indicator dot | `bg-neon-300` | `bg-galician-blue` |
| CTA button hover | `neon-200` | new `galician.blue-dark` (#5A9BBF) |
| Progress bar fill | `bg-neon-300` | `bg-galician-blue` |
| Card border-left accent | `border-l-neon-300` | `border-l-galician-blue` |
| Shadow tokens | `shadow-neon-sm/md` (amber rgba) | celeste rgba |
| pulse-neon animation | amber rgba | celeste rgba |
| Interior backgrounds | `bg-base-950` / `bg-surface-*` (dark) | `#F2F3F5` gris perla / `#FFFFFF` cards |
| Nav bar background | rgba(23,27,38,0.96) inline style | `#E8F4FA` |
| Glass overlay | rgba(23,27,38,0.85) in `.glass` | stays dark (overlays) |

### Hardcoded hex values found across the codebase

The grep scan identified 82 `neon-*` token references across 20 files, plus the following
inline hex values that bypass the token system entirely:

| File | Hardcoded Colors | Nature |
|------|-----------------|--------|
| `App.jsx` | `#b8f533`, `#212424`, `#2a2e2e` | Spinner SVG — old lime green, leftover |
| `Layout.jsx` | `#F5D547`, `#0D1017`, `#505878`, `#1E2440`, `#2A3050`, `#1E2230` | Nav icons, nav border — inline `style={}` |
| `AuthPage.jsx` | `#F5D547`, `rgba(27,58,92,0.12)` | Logo SVG, background gradient |
| `AdminPanelPage.jsx` | `#F5D547`, `#f87171` | Accept/reject icon colors |
| `OnboardingPage.jsx` | `#f59e0b`, `#0D1017`, `#0f1010` | Warning icon, checkmark color |
| `ProtectedRoute.jsx` | `#1a1c1c`, `#2a2e2e`, `#f87171`, `#f59e0b` | Error card, error/warning icons |
| `index.css` | `#080A0F`, `#E5E7EB`, `rgba(23,27,38,0.85)` | HTML/body base, `.glass` |

**Key observation:** The majority of color debt is in Tailwind class names (`bg-neon-300`,
`text-neon-300`, `border-neon-300`, `shadow-neon-*`). Inline styles account for a minority of
touch-points but are concentrated in `Layout.jsx`, `AuthPage.jsx`, and `AdminPanelPage.jsx`.

---

## 2. Migration Strategy: Token-First

**Recommended approach: token replacement before component editing.**

The alternative — component-by-component without touching tokens first — forces each component to
carry the full target hex value inline, creates drift between components, and makes future palette
adjustments expensive. Token-first means most components update automatically once the config
changes; only inline styles (`style={}`) require manual per-file edits.

### Why token-first wins here

1. **82 neon-* references across 20 files.** Renaming `neon-300` to map to `#6BB3D9` in
   `tailwind.config.js` propagates that change to every consumer simultaneously at build time,
   with zero per-file edits.
2. **Tailwind 4 purges on build.** Any renamed token not present in JSX will be removed from the
   output CSS, so renamed tokens don't bloat the bundle.
3. **The token config already has `galician.blue`.** It is defined but unused in interactive roles.
   The migration is wiring, not inventing.
4. **Inline styles are isolated.** The 7 files with hardcoded hex are well-identified and can be
   audited individually in a dedicated pass after tokens are stable.

### Token-first vs component-by-component trade-off table

| Criterion | Token-First | Component-by-Component |
|-----------|------------|----------------------|
| Batch coverage | One file change covers 20 files | Each file is independent |
| Risk of drift | Low — single source of truth | High — each component can diverge |
| Partial rollout risk | Medium — tokens affect all consumers at once | Low — changes are scoped |
| Inline style handling | Separate pass required | Handled in same pass |
| Build validation cycle | Can validate after token phase, before components | Validate after every component |
| Recommended for | Large token surface (this codebase) | Few tokens, many custom styles |

**Verdict: token-first is correct for this codebase.** The inline style files are the exception,
not the rule.

---

## 3. Finding All Hardcoded Colors — Grep Strategy

### Pass 1: Tailwind token references to `neon-*`

```bash
grep -rn "neon-" src/ --include="*.jsx" --include="*.js" --include="*.css"
```

This surfaces all 82 occurrences that become candidates for token rename.

### Pass 2: Inline hex colors in JSX `style={}` props

```bash
grep -rn "#[0-9A-Fa-f]\{3,6\}" src/ --include="*.jsx" --include="*.js"
```

Returns 28 occurrences across 7 files. Each must be evaluated:
- Is it a design token value? → Replace with CSS variable or move to tailwind config.
- Is it an SVG stroke/fill? → Replace with `currentColor` where possible, else token hex.
- Is it a semantic color with no equivalent token? → Add a token first, then reference it.

### Pass 3: Inline hex colors in CSS

```bash
grep -rn "#[0-9A-Fa-f]\{3,6\}" src/index.css
```

Returns 3 occurrences (`#080A0F`, `#E5E7EB`, `rgba(23,27,38,0.85)`). These are in `@layer base`
and `.glass` — both must be updated to their new values in Phase 1 (token pass).

### Pass 4: rgba() values that encode old palette

```bash
grep -rn "rgba(" src/ --include="*.jsx" --include="*.js" --include="*.css"
```

Catches colors expressed as rgba() that are not surfaced by the hex grep (e.g. the glass overlay,
nav background, shadow token internals in tailwind.config.js).

### Pass 5: Old lime-green vestiges

```bash
grep -rn "b8f533\|a2e020\|ccff61" src/ --include="*.jsx" --include="*.js"
```

`App.jsx` lines 25 and 30 contain `#b8f533` (original lime neon) that was not updated in the
prior partial migration. This is high-priority cleanup.

---

## 4. Component Dependency Graph

Understanding which components render inside which shell determines safe migration order.
Changing a shared shell (Layout, tokens) affects everything downstream.

```
App.jsx
├── AppLoader            (standalone, dark spinner — touches hardcoded #b8f533)
├── Layout.jsx           (shell for ALL authenticated pages)
│   ├── DashboardPage
│   ├── TournamentsPage
│   │   └── TournamentsDashboard/
│   │       ├── ActiveTournaments.jsx
│   │       │   └── TournamentWidget.jsx    (uses neon-300, neon-200, shadow-neon-*)
│   │       ├── HistoryTournaments.jsx
│   │       │   └── TournamentWidget (readonly)
│   │       └── TournamentDetailModal.jsx
│   │           ├── Tabs/InfoTab.jsx
│   │           ├── Tabs/SolicitudesTab.jsx
│   │           │   ├── RequestsSection.jsx
│   │           │   │   └── RegistrationRequestCard.jsx
│   │           │   └── ApprovedSection.jsx
│   │           └── Tabs/ProgresoTab.jsx
│   │               └── CategoryProgressCard.jsx
│   ├── CreateTournamentPage
│   │   └── ScoringSystem/
│   │       ├── ScoringSystemSelector.jsx  (ACTIVE/INACTIVE string constants with neon-*)
│   │       ├── SetsScoringForm.jsx
│   │       ├── NormalSetsForm.jsx
│   │       ├── SumaSetsForm.jsx
│   │       ├── PointsScoringForm.jsx
│   │       ├── ClosingRuleSwitch.jsx      (ACTIVE/INACTIVE string constants)
│   │       └── ScoringPreview.jsx
│   ├── OrganizerHubPage (placeholder)
│   ├── ResultsInputPage (placeholder)
│   └── AdminPanelPage
├── AuthPage             (standalone dark page — NOT inside Layout)
├── OnboardingPage       (standalone dark page — NOT inside Layout)
└── ProtectedRoute.jsx   (route guard wrapper, error states)
```

**Critical observation:** `AuthPage` and `OnboardingPage` do NOT use `Layout`. They are fully
standalone and live in a separate visual context (dark auth zone). Their migration is independent
and isolated — changes here cannot break interior pages.

`Layout.jsx` is the highest-risk file. It is the shell for every authenticated page. Its nav bar
background, active indicator color, and `bg-base-950` wrapper all need to change. It has the most
inline `style={}` props of any file. Migrate it only after tokens are stable and after the auth
pages (which are simpler) have been validated.

---

## 5. Recommended Migration Order

### Phase 1 — Token Foundation (highest leverage, lowest risk per file)

**Files:** `tailwind.config.js`, `src/index.css`, `vite.config.js`, `index.html`

What to do:
1. In `tailwind.config.js`: rename `neon-*` to new celeste-mapped values, add light interior
   tokens (`light-bg`, `light-surface`, `light-border`, etc.), update `boxShadow` rgba values,
   update `pulse-neon` keyframes to celeste rgba.
2. In `index.css`: update `html/body` background to `#F2F3F5`, update `.glass` rgba, remove
   hardcoded `#080A0F` and `#E5E7EB`.
3. In `index.html`: add `<meta name="theme-color" content="#F2F3F5">`.
4. In `vite.config.js`: update PWA manifest `theme_color` and `name`/`short_name`.

**Build gate:** `npm run build` must pass with zero errors. All token-consuming files will
automatically reflect the new token values. Run a visual spot-check on one page.

Risk: MEDIUM. Token rename is a global change. If a component depends on a token name that is
removed (e.g. `neon-900` which is used in `ScoringSystemSelector` as `bg-neon-900/40`), the build
will not error but the class will be purged, producing missing background. Audit all distinct
`neon-*` suffixes before renaming: `neon-300`, `neon-200`, `neon-400`, `neon-900`, `neon-700`,
`neon-800` are all used. Provide mapped equivalents for each.

### Phase 2 — New SplashPage (additive, zero regression risk)

**Files:** `src/pages/SplashPage.jsx` (new), `src/App.jsx` (route addition only)

Creating a new component with the new palette introduces no risk to existing pages.
App.jsx needs a new route but existing routes are untouched.
Also fix the `#b8f533` vestiges in App.jsx AppLoader SVG at this point (isolated, low risk).

**Build gate:** `npm run build` must pass. Visually test splash → auth redirect flow.

Risk: LOW. Purely additive.

### Phase 3 — Auth & Onboarding (isolated dark zone)

**Files:** `AuthPage.jsx`, `OnboardingPage.jsx`

These are standalone pages with no Layout dependency. Changing them cannot affect the interior.
Both contain inline `style={}` hex values that need replacement.
Both contain `neon-*` Tailwind class references that will already be partially resolved by Phase 1
token rename — audit what remains after Phase 1 before editing these files.

**Build gate:** `npm run build` must pass. Test complete auth flow (login, register, onboarding
role selection, submit) before proceeding.

Risk: LOW-MEDIUM. Isolated scope. Risk is regression in the auth form UI states (focus, error,
active tab) if the new token name for focus rings is not applied to every input.

### Phase 4 — Layout Shell (highest leverage, highest risk)

**Files:** `Layout.jsx`

This is the highest-impact single file in the migration. It controls the nav bar and the page
wrapper for all authenticated pages. It has 7+ inline `style={}` props that hardcode hex values.
Changes here are immediately visible on every interior screen.

Specific changes:
- `div.bg-base-950` → `bg-light-bg` (new token for `#F2F3F5`)
- Nav bar `background: rgba(23,27,38,0.96)` inline style → `#E8F4FA`
- Nav `borderTop: 1px solid #1E2440` → `#D0E5F0`
- Active icon color `#F5D547` → `#1F2937`
- Inactive icon color `#505878` → `#9CA3AF`
- Active dot `bg-neon-300` → `bg-galician-blue` (resolved by token phase)
- SyncOverlay spinner SVG colors → update to celeste palette

Add header bar (new `<header>` element per LAYOUT-01/02 requirements) with `lobo.png` logo.

**Build gate:** `npm run build` must pass. Test on all three roles (player, organizer, admin) to
validate nav item rendering per role. Check that Layout wraps all inner pages without visual
breaks.

Risk: HIGH. Role-conditional rendering means each nav variant must be tested individually.

### Phase 5 — Dashboard & TournamentsPage (medium complexity)

**Files:** `DashboardPage.jsx`, `TournamentsPage.jsx`

Both pages live inside Layout and use a mix of Tailwind tokens and some hardcoded values.
DashboardPage has `neon-*` references for badge variants, progress bar, avatar, and "live" dot.
TournamentsPage has filter tabs and card accent border using `neon-*`.

These pages use mock data (DashboardPage entirely, TournamentsPage partially), so visual changes
won't affect real data flows. Lower risk than live data components.

**Build gate:** `npm run build` must pass. Visual review of both pages in all mock states.

Risk: LOW-MEDIUM. Limited inline styles; mostly token-based after Phase 1.

### Phase 6 — TournamentsDashboard Components (highest component count)

**Files:** `TournamentDetailModal.jsx`, `EditTournamentForm.jsx`, `InfoTab.jsx`,
`SolicitudesTab.jsx`, `RequestsSection.jsx`, `ApprovedSection.jsx`, `RegistrationRequestCard.jsx`,
`ProgresoTab.jsx`, `CategoryProgressCard.jsx`, `ActiveTournaments.jsx`, `HistoryTournaments.jsx`,
`TournamentWidget.jsx`

This is the largest group by file count but most use only Tailwind tokens (no inline styles).
After Phase 1, the token rename will already have changed `neon-300` to celeste across all of these.
The primary remaining work per file is:
- Background colors: `bg-surface-*` → `bg-white` / `bg-light-surface` (interior light theme)
- Border colors: `border-border-*` → `border-light-border`
- Tab underline / active state: verify token resolved correctly
- `CategoryProgressCard`: the three-tier color logic (neon-300 / yellow-400 / red-500) needs
  updating — `neon-300` resolves via token, yellow and red are Tailwind standard colors that stay.

Migrate in leaf-to-root order within this group:
1. Tab content components first (CategoryProgressCard, RegistrationRequestCard, ApprovedSection,
   RequestsSection, ProgresoTab, SolicitudesTab, InfoTab)
2. TournamentDetailModal (wraps the tabs)
3. TournamentWidget (used in both Active and History)
4. ActiveTournaments, HistoryTournaments (wrap TournamentWidget)

**Build gate:** `npm run build` after each sub-group. Full modal flow test (open, switch tabs,
edit, approve/reject request, view progress).

Risk: MEDIUM. Large surface area; low per-file risk but accumulated.

### Phase 7 — ScoringSystem, AdminPanel, CreateTournamentPage, PWA Assets

**Files:** All ScoringSystem components, `AdminPanelPage.jsx`, `CreateTournamentPage.jsx`,
`vite.config.js` PWA icons, `public/icons/`

ScoringSystem components use string constant patterns (`ACTIVE`/`INACTIVE` at file top):

```jsx
// Current — ScoringSystemSelector.jsx and ClosingRuleSwitch.jsx
const ACTIVE   = 'bg-neon-900/40 border-neon-700 text-neon-300 shadow-neon-sm'
const INACTIVE = 'bg-surface-700 border-border-default text-ink-secondary ...'
```

After Phase 1 token rename, `neon-900`, `neon-700`, `neon-300` will map to their new values
automatically. Review the string constants after Phase 1 to confirm the visual result is correct;
if `neon-900/40` maps to a golden variant with no celeste equivalent, add a `galician-blue/10`
token class to the active state.

AdminPanelPage has inline `style={}` with `#F5D547` and `#f87171` for accept/reject icons —
replace with `#6BB3D9` (accept) and existing `#ef4444` (reject/danger).

PWA assets (`public/icons/*`, `favicon.svg`, `apple-touch-icon.png`) are binary file replacements,
not code changes. No build risk; place last.

**Build gate:** `npm run build` must pass. Test full tournament creation flow with scoring
configuration. Test admin accept/reject flow.

Risk: MEDIUM (ScoringSystem string constants; AdminPanel inline styles). LOW for PWA assets.

---

## 6. Component Risk Matrix

| Component | Risk | Primary Reason | Token or Inline? |
|-----------|------|---------------|-----------------|
| `tailwind.config.js` | MEDIUM | Global impact; neon-900/700/800 aliases must survive | Tokens |
| `index.css` | LOW | 3 hardcoded values, isolated | Inline |
| `App.jsx` (AppLoader) | LOW | Isolated spinner, 2 hex values | Inline |
| `Layout.jsx` | HIGH | Shell for all interior; 7+ inline styles; role-conditional nav | Both |
| `AuthPage.jsx` | LOW | Standalone; 4 inline styles; known scope | Both |
| `OnboardingPage.jsx` | LOW | Standalone; 3 inline styles; known scope | Both |
| `DashboardPage.jsx` | LOW-MEDIUM | All mock data; neon-* via tokens; 0 inline styles | Tokens |
| `TournamentsPage.jsx` | LOW-MEDIUM | Real Supabase data but read-only display | Tokens |
| `TournamentWidget.jsx` | MEDIUM | Used in both active and readonly (history) contexts | Tokens |
| `TournamentDetailModal.jsx` | MEDIUM | Tab state, close button, backdrop | Tokens |
| `CategoryProgressCard.jsx` | MEDIUM | Three-tier color logic; must stay semantically correct | Tokens |
| `RegistrationRequestCard.jsx` | LOW | Semantic badge colors; one neon-* reference | Tokens |
| `ScoringSystemSelector.jsx` | MEDIUM | String constant ACTIVE/INACTIVE — neon-900/700 aliases | Tokens |
| `ClosingRuleSwitch.jsx` | MEDIUM | Same ACTIVE/INACTIVE string constant pattern | Tokens |
| `AdminPanelPage.jsx` | MEDIUM | Accept icon uses `#F5D547`; reject uses `#f87171` | Both |
| `CreateTournamentPage.jsx` | LOW | Input focus uses `focus:border-neon-300`; token resolves | Tokens |
| `InfoTab.jsx` | LOW | Token-based; edit inputs | Tokens |
| `SolicitudesTab.jsx` | LOW | Token-based; tab container | Tokens |
| `ProgresoTab.jsx` | LOW | Token-based; wraps CategoryProgressCard | Tokens |
| `ProtectedRoute.jsx` | LOW | Error states use `#f87171`/`#f59e0b`; semantic, stays | Inline |
| SplashPage (new) | LOW | New file, greenfield | — |

---

## 7. Build Validation Strategy

### Between every phase

```bash
npm run build
```

A successful build proves:
- No missing Tailwind tokens (Tailwind 4 errors on undefined tokens in `@apply` but NOT in class
  names — class names are silently dropped if not generated).
- No JSX syntax errors introduced by the edits.
- Vite bundle completes.

**Limitation:** `npm run build` does NOT catch missing token class names. A `bg-galician-blue`
class that was misspelled will be silently dropped from the output CSS, producing a white
background with no build error.

### Catching dropped token classes

After each phase, run the build and then:

```bash
grep -rn "bg-galician\|text-galician\|border-galician\|bg-light-\|text-light-" src/ \
  --include="*.jsx"
```

Then verify those class names exist in the generated CSS:

```bash
grep "galician" dist/assets/*.css
```

If a class name appears in JSX but not in the generated CSS, the token was not registered in
`tailwind.config.js` or Tailwind's content scan missed a file. Fix the config, not the component.

### Visual regression check (manual, per phase)

Because this project has no Storybook or visual regression testing infrastructure, manual checks
are the gate. For each phase, define a checklist:

- Phase 1 (tokens): open app, confirm no white flash on bg-base-950 screens
- Phase 3 (auth): full login/register/onboarding flow on mobile viewport
- Phase 4 (layout): navigate all three roles' nav bars; confirm active state indicator
- Phase 5 (dashboard): confirm mock tournament cards, standings table, progress bar
- Phase 6 (tournamentsdashboard): open modal, cycle all three tabs, approve one request,
  view progress bar fill
- Phase 7 (scoring + admin): complete tournament creation with scoring config; admin
  approve/reject an organizer

---

## 8. Special Patterns Requiring Attention

### Pattern: ACTIVE/INACTIVE string constants

Used in `ScoringSystemSelector.jsx` and `ClosingRuleSwitch.jsx`:

```jsx
const ACTIVE   = 'bg-neon-900/40 border-neon-700 text-neon-300 shadow-neon-sm'
const INACTIVE = 'bg-surface-700 border-border-default text-ink-secondary ...'
```

Tailwind's content scan finds these by full string match only when the class name exists in the
file as a static string. These strings are static and will be found by the scanner — no problem.
After Phase 1 token rename, the behavior of these constants depends on what `neon-900`, `neon-700`,
and `neon-300` resolve to. If the new tokens use different key names (e.g. `galician-*`), these
constants will reference dangling token names and the styles will silently vanish.

**Prevention:** When renaming tokens in Phase 1, either:
(a) Keep `neon-*` as alias tokens that point to the new values, so existing class names still work.
(b) Update these string constants in Phase 7 as part of that file's migration.

Option (a) is lower risk: keep `neon-300` in tailwind.config.js mapped to `#6BB3D9` so existing
consumers compile correctly, even if the semantic name is now inconsistent. Option (b) is cleaner
but risks silent style loss if a string constant is missed.

**Recommendation:** Use option (a) (alias remapping) for Phase 1, then clean up string constant
names in Phase 7 as an explicit step.

### Pattern: SVG fill/stroke hardcoded hex

SVG elements in `App.jsx`, `AuthPage.jsx`, `Layout.jsx` use hardcoded hex in `stroke` and `fill`
JSX attributes. These cannot be resolved through Tailwind tokens — they require either:
- Replacement with `currentColor` and a parent `className` text color, OR
- Replacement with the target hex value directly.

Using `currentColor` is preferred where the SVG should inherit the text color of its context.
For SVGs where color is decorative/fixed (e.g. the brand logo mark), direct hex replacement is
acceptable. Keep a comment noting the token equivalent.

### Pattern: Background split (dark auth / light interior)

The dark vs light split is controlled by Layout: pages inside Layout are light, pages outside
(AuthPage, OnboardingPage) are dark. This is clean — no conditional logic needed in shared code.
`Layout.jsx` switches from `bg-base-950` to the new light background token.
`AuthPage.jsx` and `OnboardingPage.jsx` retain their dark backgrounds independently.
`SplashPage.jsx` is also standalone dark.

There is no overlap risk between the two zones as long as the Layout wrapper is not inadvertently
applied to auth routes.

### Pattern: index.css body background

`index.css` sets `background-color: #080A0F` on `html, body, #root`. This is the fallback color
visible during the JS bundle load and during any unmounted state. In a light-interior theme, this
creates a dark flash before the app renders. After Phase 1, change this to `#F2F3F5`. However,
the Splash and Auth screens are dark — if the body background is now light, a white flash will
appear before the dark splash renders. Mitigation: set body background to `#1E2024` (dark) in
`index.css` (matching the splash background) so both dark and light screens share a neutral start.
Alternatively, the Splash renders first and covers the body color immediately.

---

## 9. Phase Build Order Implications

The phase structure defined in REQUIREMENTS.md maps directly to the technical dependency order:

```
Phase 1 (Tokens)
    ↓ unlocks all token consumers
Phase 2 (Splash — additive)
    ↓ no dependencies
Phase 3 (Auth/Onboarding — isolated dark)
    ↓ validates dark zone is complete before touching light zone
Phase 4 (Layout shell — light zone gateway)
    ↓ all interior pages depend on this
Phase 5 (Dashboard / Tournaments — real content pages)
    ↓ read-only pages before interactive modals
Phase 6 (TournamentsDashboard — interactive deep components)
    ↓ complex state; validated after simpler pages
Phase 7 (ScoringSystem / Admin / PWA assets — final polish)
```

Phases 1 and 4 are the two critical path items. Phase 1 because it is the token foundation that
all other phases depend on. Phase 4 because it is the visual gateway to the interior.
All other phases can be resequenced without structural risk if needed.

---

## 10. Gaps to Address

- **No automated visual regression tests.** The project has no Storybook, no Playwright snapshots,
  no Jest rendering tests. The entire regression safety net is manual per-phase checklists. This
  is an acceptable constraint given the "color only, no logic" scope, but phase transitions should
  include documented visual sign-off before proceeding.

- **`ProtectedRoute.jsx` error states.** Uses `#f87171` (red) and `#f59e0b` (amber) for error and
  warning icons. These are semantic utility colors (not brand), so they stay. Confirm the new light
  interior background does not break the visibility of these error cards.

- **`OrganizerHubPage.jsx` and `ResultsInputPage.jsx`.** Both are listed as placeholders in
  REQUIREMENTS.md (v2, PAGES-01). They are low risk but should receive the light interior
  background treatment at the same time as Phase 5 for consistency.

- **Tailwind 4 `@config` directive.** `index.css` uses `@config "../tailwind.config.js"` which is
  a Tailwind CSS 4 feature. Confirm that any `@layer utilities` additions for new token classes
  follow the Tailwind 4 syntax (not v3 `@apply` patterns that may not be supported the same way).

---

## Sources

- Direct source file analysis: all files under `src/` and `tailwind.config.js` read verbatim
- `.planning/PROJECT.md` — migration scope and constraints
- `.planning/REQUIREMENTS.md` — 48 numbered requirements mapped to phases
- Tailwind CSS 4 content scanning behavior: HIGH confidence based on Tailwind 4 docs
  (tokens must exist in config to be generated; missing class names are silently dropped, not
  errored)
- React component dependency graph: derived from `import` statements in source files — HIGH confidence
