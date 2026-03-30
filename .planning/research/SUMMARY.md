# Project Research Summary

**Project:** Frontón HGV — Visual Rebrand of RacketTourneys PWA
**Domain:** Design system migration — Tailwind CSS 4 color token rebrand + PWA icon replacement + animated splash screen
**Researched:** 2026-03-29
**Confidence:** HIGH

---

## Executive Summary

This milestone is a pure visual rebrand of an existing, fully-functional React 19 + Tailwind CSS 4 PWA. The application changes from a dark neon-gold theme to a mixed identity: a dark navy auth zone (`#1E2024`) with celeste accents (`#6BB3D9`) and a light pearl interior (`#F2F3F5`) with white cards for all post-login pages. No business logic, data models, routing, or component structure changes. The only new component is `SplashPage.jsx`. The only new dependencies are zero — none are needed.

The recommended execution strategy is token-first: update `tailwind.config.js` first so that the 344 token-based class usages across 29 files propagate automatically, then make a dedicated pass to hunt and replace the 35 hardcoded hex values in 7 specific files. Token names must stay unchanged (`neon-300`, `surface-900`, etc.) — only their hex values change. Renaming tokens would require touching all 344 usages and is explicitly out of scope. New tokens for the light interior zone (`pearl-50/100/200`) must be added to the config, not invented per-component.

The highest risk in this migration is not the token swap — it is the hardcoded hex layer. `App.jsx` still contains `#b8f533` (original lime-green neon from a previous design iteration), and `Layout.jsx` has 8+ inline style properties referencing old gold (`#F5D547`). These will survive a token rename and produce visually inconsistent output. The second highest risk is PWA-specific: `theme_color` exists in three synchronized locations (`vite.config.js`, `index.html`, `index.css`) and the manifest icon entries use a deprecated `"any maskable"` combined purpose string that fails modern Lighthouse audits. Both must be resolved as part of the Phase 7 PWA pass.

---

## Key Findings

### Recommended Stack

The project already runs Tailwind CSS 4 in "Mode B" — JS config referenced via `@config "../tailwind.config.js"` from `index.css`. This is fully supported and must not be changed. The recommendation is to stay in Mode B for the rebrand and not migrate to the CSS-first `@theme` block model (Mode A), which would be a non-trivial refactor with no user-visible benefit.

**Core technologies:**
- **Tailwind CSS 4 (Mode B):** Color token system — change hex values in `tailwind.config.js`, all utility classes update at build time with zero component edits. New tokens (`pearl-*`) must also be added here.
- **Tailwind CSS 4 `@theme` in `index.css`:** New tokens that need CSS variable exposure (for any `var(--color-*)` references in inline styles or SVGs) must be defined via `@theme`, not only in `tailwind.config.js`. The JS config does NOT generate CSS variables in Tailwind v4.
- **React 19 + Vite 8:** No changes to build pipeline. No new dependencies.
- **`sessionStorage`:** Correct storage mechanism for the splash "shown once per session" flag. `localStorage` persists too long; React state alone resets on hard refresh.
- **vite-plugin-pwa / Workbox:** PWA manifest `theme_color`, `background_color`, and icon entries managed here. Separate `purpose: 'any'` and `purpose: 'maskable'` icon entries required.

**Critical version note:** `neon-900`, `neon-700`, `neon-800` are all actively used by `ScoringSystemSelector.jsx` and `ClosingRuleSwitch.jsx` via string constants. These token names must survive Phase 1 as aliases (pointing to new celeste-range values) or the active/inactive state styles will silently vanish from the tournament creation flow.

---

### Expected Features

**Must have (table stakes):**
- Animated JS splash screen (`SplashPage.jsx`) on first tab load — CSS keyframe fade-in + scale on `lobo.png`, ~2s, dismissed via `sessionStorage` flag. Renders as overlay at App root, not as a route.
- `lobo.png` consistently sized: 180px splash, 80px auth/onboarding, 28px Layout header.
- Dark auth/onboarding zone (`#1E2024` bg, `#6BB3D9` accents) — no Layout wrapper.
- Light interior zone (`#F2F3F5` bg, white cards) — controlled by `Layout.jsx`.
- Celeste (`#6BB3D9`) as the sole CTA and interactive element color everywhere.
- PWA manifest updated: `theme_color`, `background_color`, `name`, `short_name`, icons.
- PWA icons regenerated from `lobo.png` for all 8 sizes (72–512px) + root `apple-touch-icon.png`.
- `theme_color` synchronized across `vite.config.js`, `index.html`, `index.css` in one atomic commit.

**Should have (differentiators):**
- Tagline "Comisión de Frontón — Hermandad Gallega de Venezuela" on the splash screen.
- Dorado (`#D4A827`, already `neon-400`) used exclusively on achievement/status badges — never on buttons.
- Celeste left-border accent on tournament cards by state: active=celeste, draft=gray, finished=green.
- Semantic badge system (activo/borrador/finalizado/destacado) driven by tokens.
- Manifest icon entries split into separate `purpose: 'any'` and `purpose: 'maskable'` objects.

**Defer (v2+):**
- User-controlled dark/light toggle — out of scope; the dark/light split is architectural (auth=dark, interior=light), not a preference.
- `next-themes` or any theme library — wrong tool for deterministic route-based theming.
- Image optimization pipeline (`vite-plugin-imagemin`, `sharp`) for `lobo.png` — single asset, not needed.
- Token namespace cleanup (`neon-*` → `gold-*` or `celeste-*`) — 345 usages across 29 files; valid cleanup but must be scoped as an isolated task, not mixed with color migration work.

---

### Architecture Approach

The migration follows a strict token-first, leaf-to-root component order. The token config (`tailwind.config.js`) is the single source of truth that propagates to 82 `neon-*` references across 20 files automatically. After Phase 1 establishes stable tokens, the remaining 35 hardcoded hex values across 7 files are handled as a dedicated inline-style pass within each phase's scope. The dark/light theme split is structural, not dynamic: `AuthPage.jsx` and `OnboardingPage.jsx` are standalone (outside `Layout`), so they form an isolated dark zone that can be migrated independently without risk to the light interior. `Layout.jsx` is the highest-risk single file because it is the shell for every authenticated page and contains the most inline `style={}` props.

**Major components by migration risk:**

1. **`tailwind.config.js` + `index.css`** — Token foundation. Global impact. Must be Phase 1. Blocks every other phase. MEDIUM risk (global change, `neon-900/700` alias survival is critical).
2. **`Layout.jsx`** — Interior shell. Highest single-file risk. 7+ inline style props. Controls nav bar, page wrapper, header. Must be Phase 4 (after auth is validated). HIGH risk.
3. **`SplashPage.jsx` (new) + `App.jsx`** — Additive only. LOW risk. Fix `#b8f533` leftover in `App.jsx` AppLoader SVG at this point.
4. **`AuthPage.jsx` / `OnboardingPage.jsx`** — Isolated dark zone. 4–7 inline styles combined. LOW-MEDIUM risk.
5. **`DashboardPage.jsx` / `TournamentsPage.jsx`** — Inside Layout. Mostly token-based. LOW-MEDIUM risk.
6. **TournamentsDashboard components** (12 files) — Largest group by file count, mostly token-based after Phase 1. Migrate leaf-to-root within group. MEDIUM aggregate risk.
7. **`ScoringSystem/` components + `AdminPanelPage.jsx` + PWA assets** — String constant `ACTIVE`/`INACTIVE` patterns depend on `neon-900/700` aliases surviving. PWA assets are binary replacements. MEDIUM (scoring) + LOW (PWA assets).

---

### Critical Pitfalls

1. **Hardcoded hex values in 7 files will not update with token changes** — 35 occurrences including `#b8f533` (old lime green still in `App.jsx` SVG), `#F5D547` (gold in `Layout.jsx` nav icons), and `#080A0F` (old dark in `index.css`). Run `grep -rn "#[0-9A-Fa-f]{3,6}" src/` before starting each phase. Replace inline hex with token hex equivalent or `currentColor`. This is the single highest execution risk.

2. **`neon-900`/`neon-700`/`neon-800` must survive Phase 1 as working aliases** — `ScoringSystemSelector.jsx` and `ClosingRuleSwitch.jsx` use string constants `'bg-neon-900/40 border-neon-700 text-neon-300 shadow-neon-sm'`. If these token names are removed from `tailwind.config.js` in Phase 1, Tailwind silently drops those classes from the CSS output with no build error. The `ACTIVE` state styling disappears invisibly. Keep `neon-900/700/800` as aliases in the config; clean up in Phase 7.

3. **`theme_color` is defined in three independent locations** — `vite.config.js`, `index.html` `<meta name="theme-color">`, and `index.css` `html/body background-color`. These are currently inconsistent even in the current codebase. Update all three in a single atomic commit during Phase 7. Set `background_color` and the CSS fallback to `#1E2024` (dark login color, since that is the first screen users see), not the light interior.

4. **Manifest icon `"any maskable"` combined purpose string fails Lighthouse 10+** — Current `vite.config.js` uses `purpose: 'any maskable'`. This must be split into two separate icon entries (`purpose: 'any'` and `purpose: 'maskable'`) when icons are replaced in Phase 7. Failure means PWA installability audit fails and Android adaptive icons break.

5. **JS config tokens do NOT generate CSS variables in Tailwind v4** — `tailwind.config.js` tokens via `@config` create utility classes (`bg-galician-blue`) but no `--color-galician-blue` CSS variable. Any new token that needs to be referenced in `style={{}}` or SVG attributes must also be declared in an `@theme` block in `index.css`. The `.glass` utility uses a hardcoded RGBA today — do not attempt to reference a token variable here without first adding it to `@theme`.

---

## Implications for Roadmap

Based on research, the correct phase structure is a 7-phase dependency chain where Phase 1 (tokens) and Phase 4 (Layout shell) are the two critical path items. All other phases can be resequenced if needed.

---

### Phase 1: Token Foundation

**Rationale:** Every other phase depends on correct tokens existing first. 344 class usages across 29 files update automatically when `tailwind.config.js` changes. This is the highest-leverage, most efficient action in the entire migration. Do this before touching any component.

**Delivers:** Updated `tailwind.config.js` (new hex values for `neon-300`, `base-950`; updated shadow RGBA; updated `pulse-neon` keyframes; new `pearl-50/100/200` tokens); updated `index.css` (`.glass` rgba, `html/body` fallback background); a buildable codebase where all token-consuming components reflect the new palette.

**Files:** `tailwind.config.js`, `src/index.css`

**Must avoid:**
- Pitfall 1 (CSS variables not generated from JS config) — add new tokens to both `tailwind.config.js` AND `@theme` if they'll be used in `var()` references.
- Pitfall 9 (`neon-900/700/800` alias survival) — keep all `neon-*` names, only change hex values; do not remove any existing `neon-*` key.

**Build gate:** `npm run build` must pass. Verify generated CSS contains `galician`, `pearl`, and updated `neon-300` classes.

---

### Phase 2: Splash Screen

**Rationale:** Purely additive — creates one new file (`SplashPage.jsx`) and makes minimal changes to `App.jsx`. Zero regression risk. Also the right moment to fix the `#b8f533` lime-green vestiges in `App.jsx` AppLoader SVG (isolated, low-blast-radius).

**Delivers:** Animated `SplashPage.jsx` with `lobo.png` at 180px, Galician tagline text, CSS `fade-up` + scale animation (~2s), `sessionStorage` dismiss flag. `lobo.png` placed in `src/assets/`. `App.jsx` shows splash as overlay before `AuthContext` resolves.

**Files:** `src/pages/SplashPage.jsx` (new), `src/App.jsx`, `src/assets/lobo.png`

**Must avoid:**
- Pitfall 12 (splash as route vs. overlay) — mount at App root level, not as a React Router route, or it will be caught by auth guards.
- Pitfall 6 (timer dismisses before hydration) — tie dismiss to `AuthContext loading === false` as the minimum condition, not purely to a fixed timer.
- Pitfall 7 (multiple `will-change` on iOS) — single `will-change` container element maximum; animate only `transform` and `opacity`.

---

### Phase 3: Auth and Onboarding (Dark Zone)

**Rationale:** `AuthPage.jsx` and `OnboardingPage.jsx` are fully standalone — they render outside `Layout` and have no dependency on interior pages. Changes here cannot break interior pages. Completing the dark zone before touching `Layout.jsx` means the auth experience is validated end-to-end before the higher-risk shell migration.

**Delivers:** Dark-themed auth and onboarding pages with `#1E2024` backgrounds, celeste accents, `lobo.png` at 80px in auth. Remaining inline `style={}` hex values replaced. Auth and onboarding remain fully functional through login/register/role-selection/submit flows.

**Files:** `src/pages/AuthPage.jsx`, `src/pages/OnboardingPage.jsx`

**Must avoid:**
- Pitfall 2 (hardcoded hex survival) — run hex grep on both files; replace every `#F5D547`, `#0D1017`, `rgba(27,58,92,...)` occurrence.
- Focus ring and input border states must use the updated `neon-300` token (which now resolves to celeste); audit all `focus:border-neon-300` and `focus:ring-neon-300/30` patterns.

**Build gate:** Full auth flow tested (login, register, onboarding role selection, submit, pending state).

---

### Phase 4: Layout Shell (Light Zone Gateway)

**Rationale:** `Layout.jsx` is the visual gateway for all authenticated pages. It is the highest-risk single file: 7+ inline `style={}` props hardcoding gold and dark hex values, role-conditional nav rendering, and `bg-base-950` wrapper that must become the light pearl background. Migrate this only after Phase 1 tokens are stable and Phase 3 (auth) is validated. Once Phase 4 is done, all interior pages are partially visible in the correct shell.

**Delivers:** Light-background page wrapper (`bg-pearl-100`), celeste nav bar (`#E8F4FA`), updated nav active indicator (celeste replaces gold), `lobo.png` at 28px in header, all inline hex values replaced. SyncOverlay spinner updated. Nav border updated (`#D0E5F0`).

**Files:** `src/components/Layout.jsx`

**Must avoid:**
- All 7+ inline `style={}` occurrences must be audited: nav background rgba, nav border color, active icon color `#F5D547`, inactive icon color `#505878`.
- Test all three roles (player, organizer, admin) — nav items are role-conditional; each variant must be verified.

**Build gate:** All three role nav bars render correctly; page wrapper is light; active state indicator is celeste.

---

### Phase 5: Dashboard and Tournaments Pages

**Rationale:** `DashboardPage.jsx` and `TournamentsPage.jsx` are the first interior content pages. DashboardPage uses entirely mock data; TournamentsPage is read-only display. Both are mostly token-based after Phase 1, making this a low-risk phase that validates the light interior treatment at the page level before touching interactive modals.

**Delivers:** Both pages rendered with white cards, `pearl-100` background, celeste accents, semantic badge colors (dorado for status badges only), celeste left-border tournament card accent by state. `OrganizerHubPage.jsx` and `ResultsInputPage.jsx` placeholder pages receive light background treatment at this stage for consistency.

**Files:** `src/pages/DashboardPage.jsx`, `src/pages/TournamentsPage.jsx`, `src/pages/OrganizerHubPage.jsx`, `src/pages/ResultsInputPage.jsx`

**Must avoid:**
- `.glass` utility usage — audit before applying light theme; dark glass on white cards is a visual regression (Pitfall 8). Define `.glass-light` variant in `index.css` if needed.
- `neon-*` badge variants on DashboardPage must resolve correctly via token alias (verify after Phase 1 token change).

---

### Phase 6: TournamentsDashboard Components

**Rationale:** This is the largest group by file count (12 components) but most are purely token-based with no inline styles. Migrating after Phase 4 and 5 means the Layout shell and surrounding pages are already correct, providing a stable visual reference for matching card and modal styles. Migrate leaf-to-root within the group to avoid testing partially-styled containers.

**Delivers:** All tournament management UI — widgets, modal, tabs (Info/Solicitudes/Progreso), registration request cards, category progress cards — using the light interior palette. White cards with soft shadows, celeste accents, correct three-tier progress bar colors (celeste / yellow / red). `EditTournamentForm.jsx` inputs updated.

**Files:** `CategoryProgressCard.jsx`, `RegistrationRequestCard.jsx`, `ApprovedSection.jsx`, `RequestsSection.jsx`, `ProgresoTab.jsx`, `SolicitudesTab.jsx`, `InfoTab.jsx`, `TournamentDetailModal.jsx`, `TournamentWidget.jsx`, `ActiveTournaments.jsx`, `HistoryTournaments.jsx`, `EditTournamentForm.jsx`

**Migrate order within group:** Tab content components first → `TournamentDetailModal` → `TournamentWidget` → `ActiveTournaments`, `HistoryTournaments`.

**Must avoid:**
- `CategoryProgressCard` three-tier color logic: `neon-300` resolves via token (celeste), but verify the threshold color logic (yellow, red) uses standard Tailwind colors, not custom tokens.
- Full modal flow test: open, switch all three tabs, edit a field, approve/reject a request, view progress bar fill.

---

### Phase 7: ScoringSystem, AdminPanel, and PWA Assets

**Rationale:** `ScoringSystem/` components use the `ACTIVE`/`INACTIVE` string constant pattern that depends on `neon-900/700` aliases established in Phase 1. These are validated here after all other UI is stable. `AdminPanelPage.jsx` has a known inline `#F5D547` for accept icons. PWA asset replacement (binary files) carries zero code risk and is placed last to avoid cache issues during development.

**Delivers:** Tournament creation flow fully rebranded (scoring system selector, set/points forms, closing rule switch, preview). Admin accept/reject flow with celeste accept icon (replacing gold). All 10 PWA icon files replaced with `lobo.png`-derived assets. `vite.config.js` manifest updated (`theme_color`, `background_color`, `name`, `short_name`, split icon entries). `index.html` `<meta name="theme-color">` synchronized. `ProtectedRoute.jsx` error state colors verified (semantic red/amber — expected to stay).

**Files:** All `src/components/ScoringSystem/*.jsx`, `src/pages/AdminPanelPage.jsx`, `src/pages/CreateTournamentPage.jsx`, `src/components/ProtectedRoute.jsx`, `vite.config.js`, `index.html`, `public/icons/*` (8 files), `public/apple-touch-icon.png`, `public/favicon.svg`, `public/favicon.ico.png`

**Must avoid:**
- Pitfall 3 (`"any maskable"` combined purpose string) — split into two icon entries per modern spec.
- Pitfall 4 (installed PWA icon cache) — Android handles via SW update; iOS users require manual re-add. Document this.
- Pitfall 5 (`theme_color` three-location sync) — update `vite.config.js`, `index.html`, and `index.css` in the same commit.
- Pitfall 11 (HMR doesn't reload `vite.config.js`) — restart `npm run dev` after any manifest change.
- `ACTIVE`/`INACTIVE` string constants in `ScoringSystemSelector.jsx` and `ClosingRuleSwitch.jsx` — if `neon-900/700` aliases were correctly preserved in Phase 1, these work automatically. Verify visually; if the active state background is missing, the alias is broken.

**Build gate:** Complete tournament creation flow with scoring configuration. Admin approve/reject flow. Lighthouse PWA audit passes maskable icon check.

---

### Phase Ordering Rationale

- **Phase 1 is mandatory first** because 344 class usages depend on correct tokens. Any component migration before Phase 1 produces half-old, half-new visual states.
- **Phase 2 is second** because it is purely additive and establishes the `lobo.png` asset in `src/assets/`, which is needed by Phases 3, 4, and 7.
- **Phase 3 before Phase 4** because the dark zone (auth) is simpler and isolated; validating it before touching the high-risk Layout shell reduces the blast radius of Phase 4 mistakes.
- **Phase 4 before Phases 5–7** because `Layout.jsx` wraps all interior pages. Testing interior page styling requires the shell to be correct first.
- **Phase 5 before Phase 6** because dashboard and tournaments pages are simpler (mostly mock data, read-only display) and establish the light interior pattern that dashboard components must match.
- **Phase 7 last** because ScoringSystem depends on `neon-*` aliases established in Phase 1 being correct, and PWA asset replacement should happen after code changes are stable.

---

### Research Flags

Phases with standard, well-documented patterns (research-phase not needed):

- **Phase 1 (tokens):** Tailwind CSS 4 `@config` + `tailwind.config.js` token migration is thoroughly documented. The exact token changes are fully specified in STACK.md.
- **Phase 2 (splash):** CSS keyframe animation + `sessionStorage` flag is a standard React pattern. Implementation spec is complete in FEATURES.md.
- **Phase 3 (auth):** Straightforward inline style replacement in two isolated files.
- **Phase 5 (dashboard pages):** Mostly token-based; low implementation complexity.

Phases where a targeted review is recommended before execution:

- **Phase 4 (Layout shell):** The role-conditional nav rendering needs explicit testing coverage for all three roles. No research needed but pre-execution checklist is essential.
- **Phase 6 (TournamentsDashboard):** Largest surface area. Before starting, verify which files still contain non-token styles after Phase 1 (the set may be smaller than the full 12-file list). A quick grep pass before execution saves time.
- **Phase 7 (ScoringSystem + PWA):** `neon-900/700/800` alias behavior must be confirmed working in a local build before touching the string constants. If the aliases were missed in Phase 1, fix them in Phase 1 before proceeding here.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Tailwind CSS 4 docs verified official; `@config` Mode B compatibility confirmed; no new dependencies needed |
| Features | HIGH | Requirements are tightly constrained by PROJECT.md; splash/sessionStorage pattern is standard; no ambiguity |
| Architecture | HIGH | Based on direct source file analysis of every component; dependency graph derived from import statements; not inferred |
| Pitfalls | HIGH | Critical pitfalls 1–5 sourced from official Tailwind v4 docs and GitHub issues; confirmed against actual codebase |

**Overall confidence:** HIGH

### Gaps to Address

- **`neon-900/700/800` exact alias values:** STACK.md specifies `neon-300` and `neon-400` new hex values but does not provide target hex values for `neon-900`, `neon-700`, `neon-800`. These need to be defined in Phase 1 as aliases pointing to celeste-range values (e.g., `neon-900` → a dark celeste or navy tint). Decision can be made during Phase 1 execution based on visual inspection of `ScoringSystemSelector` active state.

- **`ProtectedRoute.jsx` error/warning icon colors on light background:** Uses `#f87171` (red) and `#f59e0b` (amber) as semantic utility colors. These are intentional and should stay. However, the error card container uses `#1a1c1c` and `#2a2e2e` dark backgrounds. On the new light interior theme, the dark error card may look intentional (modal-like) or jarring. Evaluate during Phase 7 visual QA; update container backgrounds if needed.

- **`OrganizerHubPage.jsx` and `ResultsInputPage.jsx` are placeholders:** ARCHITECTURE.md lists them as low-risk. They appear in the component tree under `Layout.jsx` so they will inherit the correct shell from Phase 4. Their internal background classes only need a light interior background token, which is a single-line change each. Scope this into Phase 5.

- **iOS native splash images:** FEATURES.md notes that iOS requires `<link rel="apple-touch-startup-image">` for PWA cold launch splash beyond the manifest `background_color`. This was not fully scoped in the research. If native iOS splash is a goal, it requires generating splash images for multiple iPhone screen dimensions — this is a Phase 7 decision that should be confirmed against project requirements before execution.

- **No automated visual regression testing:** The project has no Storybook, Playwright, or Jest snapshot infrastructure. The entire safety net is manual per-phase checklists (documented in ARCHITECTURE.md section 7). This is an acceptable constraint given the "color only" scope, but phase sign-off should be documented explicitly before proceeding to the next phase.

---

## Sources

### Primary (HIGH confidence)
- [Tailwind CSS v4.0 Release Post](https://tailwindcss.com/blog/tailwindcss-v4) — config modes, `@config` directive behavior
- [Tailwind CSS Theme Variables Docs](https://tailwindcss.com/docs/theme) — token naming convention, nested color objects
- [Tailwind CSS v4 Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide) — breaking changes (border color, ring defaults)
- [Tailwind v4 CSS Variable Generation Issue #18237](https://github.com/tailwindlabs/tailwindcss/issues/18237) — JS config tokens do not generate CSS vars
- [Tailwind v4 @config directive discussion #16803](https://github.com/tailwindlabs/tailwindcss/discussions/16803) — `@config` + `@theme` order
- [vite-plugin-pwa Minimal Requirements — Maskable Icons](https://vite-pwa-org.netlify.app/guide/pwa-minimal-requirements.html) — separate purpose entries required
- [MDN: sessionStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage) — storage semantics for splash flag
- [MDN: Animation performance](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Animation_performance_and_frame_rate) — `transform`/`opacity` only for GPU compositing
- [Vite static asset handling](https://vite.dev/guide/assets) — `src/assets/` import + content hashing

### Secondary (MEDIUM confidence)
- [Tailwind v4 multi-theme with React (DEV.to)](https://dev.to/praveen-sripati/how-i-built-a-multi-theme-system-using-new-tailwind-css-v4-react-27j3) — `data-*` attribute theming
- [Tailwind dark/light discussion #16925 (GitHub)](https://github.com/tailwindlabs/tailwindcss/discussions/16925) — mixed dark/light architecture
- [vite-plugin-pwa manifest configuration (DeepWiki)](https://deepwiki.com/vite-pwa/vite-plugin-pwa/2.1-pwa-manifest-configuration) — icon entries structure
- [MDN: Customize PWA app colors](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Customize_your_app_colors) — `theme_color` vs `background_color`
- [PWA Icon cache replacement gotchas](https://www.codestudy.net/blog/pwa-update-icon-after-user-add-to-homescreen/) — installed icon update behavior
- [Tailwind CSS v4 Color Guide (nihardaily.com)](https://www.nihardaily.com/95-how-to-customize-tailwind-colors-in-v40-master-the-latest-css-revolution) — nested color object format
- [iOS PWA splash screen requirements (Expo)](https://blog.expo.dev/enabling-ios-splash-screens-for-progressive-web-apps-34f06f096e5c) — native splash layers
- [PWA Icon Requirements 2025 Checklist (DEV.to)](https://dev.to/albert_nahas_cdc8469a6ae8/pwa-icon-requirements-the-complete-2025-checklist-i3g) — icon purpose spec

### Tertiary (LOW confidence)
- [React PWA splash screen (DEV.to)](https://dev.to/guillaumelarch/how-to-add-a-splash-screen-for-a-progressive-web-app-with-react-1019) — native splash only, no JS layer detail; use as supplemental reference only
- [Syncing React State and Session Storage](https://www.darrenlester.com/blog/syncing-react-state-and-session-storage) — `sessionStorage` + React state sync pattern; functional but verify with React 19 behavior

---

### Direct Source Analysis (highest confidence for architecture)
- All files under `src/` read verbatim — component dependency graph, hardcoded hex inventory, token usage counts, and `ACTIVE`/`INACTIVE` string constant patterns derived from actual source code, not inference.
- `tailwind.config.js` read verbatim — current token values, shadow definitions, keyframe definitions confirmed.
- `vite.config.js` read verbatim — current manifest structure, `"any maskable"` combined purpose string confirmed.

---

*Research completed: 2026-03-29*
*Ready for roadmap: yes*
