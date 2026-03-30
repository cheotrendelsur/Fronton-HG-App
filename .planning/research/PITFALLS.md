# Domain Pitfalls

**Domain:** Design system migration — Tailwind CSS 4 color token rebrand + PWA icon replacement + animated splash screen
**Project:** Frontón HGV visual rebrand (RacketTourneys)
**Researched:** 2026-03-29

---

## Critical Pitfalls

Mistakes that cause rewrites, broken builds, or invisible regressions.

---

### Pitfall 1: JS Config Colors Do Not Generate CSS Custom Properties in Tailwind CSS 4

**What goes wrong:** The project currently uses `tailwind.config.js` referenced via `@config "../tailwind.config.js"` in `index.css`. In Tailwind v4, colors defined in a JS config file work as utility classes (`bg-galician-blue`) but the framework does NOT generate corresponding `--color-galician-blue` CSS variables for them. Only tokens defined inside a `@theme` block in CSS get CSS variables.

**Why it happens:** Tailwind v4 moved to a CSS-first design token model. The `@config` compatibility bridge preserves class generation but intentionally skips CSS variable generation for JS-origin tokens. This is a documented limitation confirmed in [Tailwind GitHub issue #18237](https://github.com/tailwindlabs/tailwindcss/issues/18237).

**Consequences:**
- Any `style={{ color: 'var(--color-galician-blue)' }}` inline reference returns `undefined`.
- The `.glass` utility in `index.css` uses a hardcoded RGBA value today — if anyone attempts to reference a token variable there during rebrand, it silently fails.
- Future dynamic theming (e.g., CSS variable toggling) is blocked until the config is migrated to `@theme`.

**Prevention:**
- Do NOT add new tokens to `tailwind.config.js` during the rebrand. Define all new tokens (`galician-*`, `shield-*`, `surface-light-*`) directly inside a `@theme` block in `index.css` instead. The JS config can remain for the transition period, but new tokens go in CSS.
- If inline `var(--color-*)` references are needed anywhere (e.g., SVG `stroke`, style objects), define those tokens via `@theme` or `@layer base { :root { --foo: ... } }` — not only in `tailwind.config.js`.

**Detection:** Build passes but `var(--color-new-token)` resolves to empty string in browser DevTools.

---

### Pitfall 2: Hardcoded Hex Values Scattered Across 7 Files Will Survive a Token Rename

**What goes wrong:** The codebase has 35 hardcoded hex values across 7 files (`Layout.jsx`, `AdminPanelPage.jsx`, `AuthPage.jsx`, `App.jsx`, `ProtectedRoute.jsx`, `OnboardingPage.jsx`, `index.css`). These are NOT Tailwind classes — they are inline `style={{ color: '#F5D547' }}`, SVG `stroke="#b8f533"`, and raw CSS `background-color: #080A0F`. Updating `tailwind.config.js` tokens has zero effect on them.

**Why it happens:** SVG paths and inline style objects cannot use Tailwind utility classes, so developers hardcoded values directly. Over 5 development phases these accumulated invisibly.

**Consequences:** After the rebrand, components with hardcoded old-green (`#b8f533`) or old-dark (`#212424`, `#2a2e2e`) values will display the wrong brand color while everything else looks correct. The mismatch is subtle and hard to spot in testing.

**Prevention:**
- Before any component rebrand work, run a global search for `#[0-9a-fA-F]` across all `.jsx`, `.js`, and `.css` files and produce an inventory. (Current count: 35 occurrences in 7 files — see grep output for exact locations.)
- Treat hardcoded colors as a first-pass checklist item in every phase. Replace with either a Tailwind class or a CSS variable reference like `var(--color-galician-blue)`.
- The old neon green `#b8f533` still exists in `App.jsx` SVG paths — this is a specific instance to address.

**Detection:** Visual QA with browser DevTools "inspect" on nav icons and inline-styled buttons after each phase.

---

### Pitfall 3: Mixed `"any maskable"` Purpose String in Manifest Icons Fails Modern Audits

**What goes wrong:** `vite.config.js` currently declares two icons with `purpose: 'any maskable'` (a space-separated string combining both purposes in one entry). The current Web App Manifest spec and Lighthouse require separate entries: one with `purpose: 'any'` and one with `purpose: 'maskable'`.

**Why it happens:** Older documentation and tutorials showed the combined string format. Some browsers accepted it historically, but the spec was tightened and Lighthouse 10+ flags it.

**Consequences:**
- Lighthouse PWA audit fails the maskable icon check.
- On some Android launchers, the icon is displayed without adaptive behavior (square corners instead of system shape).
- After replacing icon files with `lobo.png`-derived images, if the manifest format stays wrong, the new brand icon still fails installability criteria.

**Prevention:** When replacing icons, update `vite.config.js` to split the combined-purpose entries into two separate objects. For example, the `icon-192x192.png` entry should become two entries: one with `purpose: 'any'` and one with `purpose: 'maskable'`, pointing to either the same file or separate safe-zone-padded variants.

**Detection:** Lighthouse PWA audit in Chrome DevTools. Look for "Maskable icon" failure in the installability section.

---

### Pitfall 4: Installed PWA Icons Will Not Update for Existing Users Without Cache Invalidation

**What goes wrong:** Once a user has installed the PWA to their home screen, the browser caches the icons at install time. Replacing the PNG files with new `lobo.png`-derived images and updating the manifest does NOT automatically push the new icon to already-installed home screen shortcuts.

**Why it happens:** PWA installations cache the manifest and its referenced assets. Service workers (Workbox) cache `**/*.png` via `globPatterns` in `workbox` config — this means the old icons are in the Workbox precache. The precache key is based on filename + content hash. If files keep the same filename (e.g., `icon-192x192.png`), the Workbox cache entry does not automatically invalidate on update because the hash changes but the cache key prefix is the same filename.

**Consequences:**
- Android users who installed the old version may see the old icon indefinitely.
- iOS Safari is even more aggressive — it requires the user to delete and re-add the app from the home screen.
- The new service worker will eventually replace the old one (due to `registerType: 'autoUpdate'`), but icon asset caching is separate from SW registration.

**Prevention:**
- This is a known unsolvable problem for iOS already-installed users. Document in release notes that iOS users should delete and re-add.
- For Android: the `autoUpdate` registration mode plus the new service worker's precache manifest (which will have new hashes) will force icon replacement on next SW activation. No extra action needed beyond the normal release.
- Do NOT add query strings to icon paths in `vite.config.js` — vite-plugin-pwa handles cache busting via hashed precache manifests automatically.

**Detection:** Test icon update flow in a fresh Chrome profile with an installed instance of the old version.

---

### Pitfall 5: `theme_color` and `background_color` Are Defined in Three Places and Must Stay Synchronized

**What goes wrong:** The PWA theme color is currently set in three independent locations:
1. `vite.config.js` — `theme_color: '#0D1017'` and `background_color: '#0D1017'`
2. `index.html` — `<meta name="theme-color" content="#0D1017">`
3. `index.css` — `background-color: #080A0F` hardcoded in `html, body, #root`

These three values are currently slightly inconsistent (two different dark hex values). After the rebrand, the login/auth section uses a dark background and the interior uses `#F2F3F5` light. There is no single "correct" theme color for a mixed-mode app.

**Why it happens:** `theme_color` in the manifest affects the browser chrome/status bar color when the PWA is installed. `background_color` affects the splash background before the app loads. The `<meta name="theme-color">` is what mobile browsers use for the top bar. These are separate concepts but look identical when they match.

**Consequences:**
- If `background_color` stays `#0D1017` and the app interior turns `#F2F3F5`, the Workbox-generated splash screen (the one shown between icon tap and first paint) will show a jarring dark background before the light UI appears.
- If `theme_color` is updated to celeste `#6BB3D9` but the `<meta>` tag is forgotten in `index.html`, the status bar color stays dark in installed mode.

**Prevention:**
- Set `background_color` in both `vite.config.js` and `index.css` to the dark login color (`#1E2024`) since the splash/loading state occurs before the app is interactive.
- Set `theme_color` to the dark login background (`#1E2024`) for consistency with the auth screen that users see first.
- After updating `vite.config.js`, immediately update `index.html`'s `<meta name="theme-color">` in the same commit.

**Detection:** Install the PWA on Android, tap the icon, observe the splash background color and status bar tint.

---

## Moderate Pitfalls

---

### Pitfall 6: Splash Screen Dismissed Before React Hydrates on Slow Connections

**What goes wrong:** A `SplashPage.jsx` component that uses a fixed timer (e.g., `setTimeout(3000)`) will dismiss before React finishes hydrating the app on 3G connections or low-end devices, causing a white flash or blank screen after the splash.

**Why it happens:** The timer and the React hydration are independent. On fast connections the timer is the bottleneck; on slow connections hydration is. The splash exits into an unready app.

**Prevention:**
- Do NOT use a pure timeout to dismiss the splash. Use a hybrid: dismiss only when BOTH the timer has elapsed AND the target route component has signaled readiness (e.g., via a context flag set in `useEffect` on the first real page).
- Alternatively, keep the splash simple (CSS-only animation with no JS dependencies) and let the CSS animation complete naturally — then render normally. If the animation plays once (e.g., 1.5s `animation-fill-mode: forwards`), the splash is effectively self-dismissing.
- Avoid importing large assets inside `SplashPage.jsx` — the `lobo.png` shield should already be in the browser cache or bundled in the critical path.

**Detection:** Chrome DevTools Network tab with "Slow 3G" throttle. Observe what renders after the splash exits.

---

### Pitfall 7: Splash Animation Using `opacity` + `transform` on a `will-change` Element Causes Layer Explosion on iOS

**What goes wrong:** Adding `will-change: transform, opacity` to the splash shield image or container promotes it to its own compositing layer. This is correct for desktop but can cause memory pressure on iPhone SE / low-RAM devices if multiple elements have `will-change` simultaneously.

**Why it happens:** `will-change` is a hint to the browser to pre-allocate a GPU layer. If the splash has 3+ animated elements (logo, text, background overlay) all with `will-change`, the GPU memory cost exceeds what low-end devices can handle, causing dropped frames or a black flash.

**Prevention:**
- Limit `will-change` to a single wrapping element on the splash (the container div), not each child.
- Animate only `transform` and `opacity` — never `width`, `height`, `top`, `left`, or `background-color` on the splash. These trigger layout/paint.
- Use Tailwind's `animate-fade-up` (already in the config) rather than custom JS animation where possible.
- Remove `will-change` after the animation completes via an `animationend` listener or by removing the class.

**Detection:** Safari on a physical iPhone. Check for frame drops in the Performance profiler.

---

### Pitfall 8: The `.glass` Utility Class Uses Hardcoded RGBA That Won't Match the Light Interior Theme

**What goes wrong:** `index.css` defines `.glass` as `background: rgba(23, 27, 38, 0.85)` — a dark blue-grey. This class is used in modal overlays and some cards. In the light interior theme (white cards, `#F2F3F5` backgrounds), a dark glass overlay will look out of place if accidentally applied.

**Why it happens:** `.glass` was designed for the dark theme. With a mixed dark/light theme, the utility becomes context-dependent.

**Prevention:**
- Audit all usages of `.glass` class in `.jsx` files before the rebrand. Decide per usage: keep for dark zones (auth, splash), replace with a light equivalent (e.g., `bg-white/85 backdrop-blur`) for interior zones.
- Define a `.glass-light` variant in `index.css` for the interior theme rather than modifying the existing class.

**Detection:** Visual QA of modals on interior pages after the interior theme is applied.

---

### Pitfall 9: Token Name `neon` Persists in Config While Semantically Meaning "Gold" — Confusion Risk

**What goes wrong:** The current `tailwind.config.js` repurposed the `neon` namespace to hold gold/yellow values (`neon-300: #F5D547`). The semantic meaning is now "acento dorado" but the class names still say `neon`. During the rebrand, developers editing components will be confused about whether `neon-300` is the old green or the new gold.

**Why it happens:** A previous phase renamed the palette values but kept the token namespace to avoid a full find-and-replace across 345 class usages.

**Consequences:**
- If a developer searches for "neon" expecting green and finds gold, they may mistakenly introduce the old green somewhere.
- PRs touching ScoringSystem or AdminPanel will be hard to review because the class names don't match the visual intent.

**Prevention:**
- This rebrand is the right time to rename `neon-*` to `gold-*` or `accent-*`. However, this requires a find-and-replace across all 345 usages in 29 files — scope it as a dedicated atomic task, not mixed into other work.
- If the rename is deferred, add a comment block at the top of `tailwind.config.js` explaining that `neon` = gold accent in this project.

**Detection:** Code review confusion. Not a runtime error.

---

### Pitfall 10: `apple-touch-icon` in `index.html` References Files Not Listed in Workbox `includeAssets`

**What goes wrong:** `index.html` references `apple-touch-icon.png` (root-level) and `/icons/icon-152x152.png`. The Workbox config in `vite.config.js` has `includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icons/*.png']` — so these are included. However, after replacing icons with `lobo.png`-derived files, if the root-level `apple-touch-icon.png` (180x180) is forgotten and only `icons/*.png` files are replaced, iOS home screen icons will show the old image.

**Why it happens:** There are two sets of icon files: the `icons/` subdirectory (Workbox precached via manifest) and the root-level `apple-touch-icon.png` and `favicon.ico.png` (referenced directly in HTML). These are separate files that must both be replaced.

**Prevention:**
- Maintain a replacement checklist. Files to replace when rebranding icons:
  - `/public/apple-touch-icon.png` (180x180)
  - `/public/icons/icon-72x72.png` through `/public/icons/icon-512x512.png` (8 files)
  - `/public/favicon.svg` (if vector exists)
  - `/public/favicon.ico.png`
- All 10+ files must be derived from the same `lobo.png` source for visual consistency.

**Detection:** Install app on iOS. Long-press home screen icon. If it shows a generic or old icon, the root-level `apple-touch-icon.png` was missed.

---

## Minor Pitfalls

---

### Pitfall 11: Vite HMR Does Not Reload the Manifest After `vite.config.js` Changes

**What goes wrong:** Editing `vite.config.js` (e.g., updating `theme_color` or adding an icon) requires a full dev server restart to take effect. Hot module replacement does not apply to Vite plugin configuration.

**Prevention:** After any `vite.config.js` change, always stop and restart `npm run dev`. Do not rely on HMR to pick up manifest changes.

---

### Pitfall 12: Splash Screen Route Must Be Excluded From Auth Guards

**What goes wrong:** If `SplashPage.jsx` is added as a route in `App.jsx`, it may get wrapped by `ProtectedRoute` or the redirect logic that sends unauthenticated users to `/auth`. The splash must display before authentication state is known.

**Prevention:** Mount the splash as an overlay at the root level of `App.jsx` (or `main.jsx`), not as a React Router route. Dismiss it once the `AuthContext` has finished its initial session check (i.e., `loading === false`).

---

### Pitfall 13: `@config` Directive Must Come After `@import "tailwindcss"` in Tailwind CSS 4

**What goes wrong:** In `index.css`, the order is currently:
```
@import "tailwindcss";
@config "../tailwind.config.js";
```
This is correct. However, the Tailwind v4 docs note that `@config` placement relative to `@theme` blocks matters — `@theme` blocks defined before `@config` in the file are overridden by the JS config, which may produce unexpected token values.

**Prevention:** Keep `@import "tailwindcss"` first, then `@config`, then any `@theme` overrides. If adding `@theme` blocks for new tokens, place them after `@config`.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Tailwind token update | JS config tokens don't generate CSS vars | Add new tokens to `@theme` in `index.css` instead |
| Replacing icon files | Root-level `apple-touch-icon.png` forgotten | Use the 10-file replacement checklist (Pitfall 10) |
| Manifest update | `"any maskable"` combined purpose string | Split into two separate icon entries per spec |
| `theme_color` update | Three-location desync (`vite.config.js`, `index.html`, `index.css`) | Update all three in the same commit |
| Hardcoded hex sweep | Old neon-green `#b8f533` surviving in SVG paths | Grep `#[0-9a-fA-F]{3,6}` across all files first |
| Splash implementation | Timer dismisses before hydration on slow 3G | Combine timer with hydration readiness signal |
| Interior light theme | `.glass` class dark backdrop on white cards | Audit `.glass` usages before applying light theme |
| `neon-*` class rename | 345 class references need coordinated rename | Scope as isolated atomic task; don't mix with color work |
| Splash animation | Multiple `will-change` elements on low-RAM iOS | One `will-change` container max; animate only `transform`/`opacity` |
| Installed PWA icons | iOS users see old icon after rebrand | Document user action required; Android handles via SW update |

---

## Sources

- [Tailwind CSS v4 Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide) — HIGH confidence
- [Tailwind v4 CSS Variable Generation Issue with @config (#18237)](https://github.com/tailwindlabs/tailwindcss/issues/18237) — HIGH confidence
- [Tailwind v4 @config directive discussion (#16803)](https://github.com/tailwindlabs/tailwindcss/discussions/16803) — HIGH confidence
- [vite-plugin-pwa Minimal Requirements — Maskable Icons](https://vite-pwa-org.netlify.app/guide/pwa-minimal-requirements.html) — HIGH confidence
- [PWA Icon cache replacement gotchas](https://www.codestudy.net/blog/pwa-update-icon-after-user-add-to-homescreen/) — MEDIUM confidence
- [Animation performance — transform/opacity only](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Animation_performance_and_frame_rate) — HIGH confidence
- [iOS PWA splash screen requirements (Expo)](https://blog.expo.dev/enabling-ios-splash-screens-for-progressive-web-apps-34f06f096e5c) — MEDIUM confidence
- [Tailwind v4 dark mode mixed theme pitfalls (#16517)](https://github.com/tailwindlabs/tailwindcss/discussions/16517) — MEDIUM confidence
- [PWA Icon Requirements 2025 Checklist](https://dev.to/albert_nahas_cdc8469a6ae8/pwa-icon-requirements-the-complete-2025-checklist-i3g) — MEDIUM confidence
