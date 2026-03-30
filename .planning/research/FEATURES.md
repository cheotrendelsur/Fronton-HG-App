# Feature Landscape

**Domain:** React PWA — Brand Identity Rebrand + Animated Splash Screen
**Project:** RacketTourneys / Frontón HGV
**Researched:** 2026-03-29
**Overall confidence:** HIGH (stack constraints tightly defined; patterns are well-established)

---

## Table Stakes

Features users expect. Missing = product feels incomplete or broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Animated JS splash screen on first app load | PWA standard; blank white flash is jarring; native app feel requires it | Low | CSS keyframe fade-in/scale on `lobo.png`; ~2s auto-dismiss |
| Splash shows once per session, not on every navigation | Re-showing on every route change is disorienting and unprofessional | Low | `sessionStorage` flag (see Storage Decision below) |
| `lobo.png` at 180px in splash, 80px in login, 28px in header | Institutional asset must be consistently sized across contexts | Low | Single import, CSS `width` constraint — no resizing pipeline needed |
| Login/Onboarding: dark background (`#1E2024`) with celeste accents | Dramatic identity entry; existing dark system adapted to new palette | Low-Med | Token swap in `AuthPage.jsx` and `OnboardingPage.jsx` |
| Interior layout: light background (`#F2F3F5`) + white cards | Professional readability post-login; common SaaS pattern | Low-Med | `Layout.jsx` + `DashboardPage`, `TournamentsPage`, etc. |
| Celeste (`#6BB3D9`) as CTA color everywhere | Visual coherence with institutional identity | Low | Token replacement in `tailwind.config.js` |
| PWA manifest updated: `theme_color`, `background_color`, `name` | Native chrome (status bar, title bar) matches brand on install | Low | Update `vite.config.js` manifest block |
| PWA icons replaced with `lobo.png`-derived assets | Installed icon on home screen must match brand | Med | 8 PNG sizes needed (72–512px); must generate manually or with tool |
| Tailwind design token overhaul | All color utilities must map to new HGV palette | Med | Tailwind 4 uses `@theme` in CSS, not `theme.extend` in JS config |

---

## Differentiators

Features that go beyond expectation and make the product feel identitario.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Tagline / phrase gallega on splash screen | "Comisión de Frontón — Hermandad Gallega de Venezuela" under the shield; instant emotional belonging | Low | Static text, no logic change |
| Dorado (`#D4A827`) exclusively on achievement/status badges | Hierarchical color semantics — gold means something; distinguishes active/borrador/finalizado/destacado | Low | Only applied to badge tokens, never buttons |
| Celeste left-border accent on tournament cards by state | Visual scan: active=celeste, draft=gris, finished=verde; professional dashboard feel | Low | CSS `border-l-4` + conditional class in `TournamentWidget.jsx` |
| Smooth dark→light transition at login boundary | The visual shift from dark login to light interior feels intentional, not accidental | Low | No transition needed — route change handles it naturally with correct tokens |
| Semantic badge system (activo/borrador/finalizado/destacado) | Badges communicate state immediately; standard in sports management UIs | Low | Token-driven; no logic change |

---

## Anti-Features

Features to explicitly NOT build. These are common mistakes in splash/brand implementations.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Showing splash on every page navigation | Irritating; defeats the purpose; users navigate frequently | Use `sessionStorage` flag: set on first mount, check before rendering |
| Using `localStorage` for splash "shown" flag | Persists forever — returning users next day still skip it; but worse: PWA installs cached aggressively so users may never see splash again | Use `sessionStorage`: clears on tab close, shows once per session naturally |
| Native iOS/Android manifest-only splash (no JS layer) | `background_color` + static images only handles installed PWA cold launch; does nothing for browser tab first load, which is where most users are | JS animated splash for browser tab; manifest splash for installed PWA cold launch — both serve different moments |
| Framer Motion or animation libraries for splash | Adds ~60KB+ for a 2-second animation that CSS handles natively | Pure CSS keyframes: `opacity 0→1`, `scale 0.8→1`, `translateY 20px→0` |
| Generating multiple `<img>` srcsets for `lobo.png` | Overkill for a logo at 28/80/180px — all within normal bandwidth for a PWA user | Single high-quality PNG source, width-constrained in JSX via `className="w-7"` / `className="w-20"` / `className="w-[180px]"` |
| `vite-plugin-imagemin` or Sharp pipeline for `lobo.png` | Adds build complexity for a single logo file that's already small | Place in `src/assets/`, let Vite hash it, serve as-is |
| Theme switching toggle (user-controlled dark/light) | Out of scope; adds complexity; the dark/light split is architectural (auth=dark, interior=light), not a preference | Route-based class on `<html>` or wrapping `<div>` |
| `next-themes` or `@nuxtjs/color-mode` style package | Wrong tool — those solve user-toggle persistence; this project needs route-based deterministic theming | Tailwind v4 `data-theme` attribute on the route wrapper or Layout component |
| Modifying component structure / adding new JSX elements for rebrand | Out of scope per PROJECT.md; only colors and assets change | CSS token replacement only; exception is `SplashPage.jsx` which is a new page |
| Gold (`#D4A827`) on any interactive element / button / CTA | Dilutes its semantic weight as "achievement" color; confuses hierarchy | Celeste only for actions; dorado only for badges/status chips |

---

## Feature Dependencies

```
tailwind.config.js token overhaul
  → All other visual changes depend on this (correct tokens must exist first)

lobo.png in src/assets/
  → SplashPage.jsx (180px display)
  → AuthPage.jsx (80px display)
  → Layout.jsx header (28px display)
  → PWA icon generation (source for all 8 PNG sizes)

sessionStorage splash flag
  → SplashPage.jsx (read on mount)
  → App.jsx integration (conditional render before AppRoutes)

PWA manifest update (vite.config.js)
  → Requires icon PNGs already in public/icons/
  → background_color should match splash background (#1E2024)
  → theme_color should match interior nav (#6BB3D9 or #1B3A5C)
```

---

## Storage Decision: sessionStorage vs localStorage for Splash Flag

**Recommendation: `sessionStorage`**

Rationale:
- `sessionStorage` clears when the browser tab is closed — so users who return the next day see the splash again, which is appropriate for a branding moment.
- `localStorage` would suppress the splash permanently across all future sessions, which means installed PWA users might never see it after the first install.
- React state alone (no storage) would re-show splash on every hard refresh within a session. `sessionStorage` survives SPA navigations but not tab close/reopen.
- For this project (community club app with infrequent logins), seeing the splash once per session is the right frequency — it reinforces identity without being intrusive.

Implementation pattern:
```js
// In SplashPage.jsx
const [show, setShow] = useState(() => {
  return !sessionStorage.getItem('hgv-splash-shown')
})

useEffect(() => {
  if (show) {
    const timer = setTimeout(() => {
      sessionStorage.setItem('hgv-splash-shown', '1')
      setShow(false)
    }, 2200) // animation duration
    return () => clearTimeout(timer)
  }
}, [show])
```

Confidence: HIGH — `sessionStorage` semantics are standardized; this pattern has no React 19-specific caveats.

---

## Light/Dark Theme Split: Route-Based Architecture

**Recommendation: `data-theme` attribute on a wrapper `<div>` at the Layout level**

The project has two distinct zones:
- **Dark zone**: `/auth`, `/onboarding` — handled by `AuthPage.jsx` and `OnboardingPage.jsx` (no Layout wrapper)
- **Light zone**: all interior routes — handled by `Layout.jsx`

Since `AuthPage` and `OnboardingPage` already render without `<Layout>`, the theme split is natural:
- `AuthPage.jsx` and `OnboardingPage.jsx` use dark background classes directly on their root element.
- `Layout.jsx` uses light background classes on its root element.
- No dynamic class manipulation on `<html>` needed.

In Tailwind v4, define both zone variables in `index.css`:
```css
@layer base {
  :root {
    /* Light zone (interior) */
    --surface-bg: #F2F3F5;
    --card-bg: #FFFFFF;
    --cta: #6BB3D9;
  }
  [data-zone="dark"] {
    /* Dark zone (auth/onboarding) */
    --surface-bg: #1E2024;
    --card-bg: #24282C;
    --cta: #6BB3D9;
  }
}
```

Apply `data-zone="dark"` to the root element of `AuthPage` and `OnboardingPage`.

Confidence: MEDIUM — Tailwind v4 `data-*` selector theming is documented in community sources; no Context7 verification performed (Tailwind v4 API is confirmed stable as of 2025).

---

## PWA Splash: Native vs JS Layer — Both Needed

| Layer | Trigger | Implementation | Required? |
|-------|---------|----------------|-----------|
| **Native manifest splash** | Installed PWA cold launch from home screen (Android auto-generates; iOS needs `<link rel="apple-touch-startup-image">`) | `background_color: '#1E2024'` in manifest; static PNG splash images for iOS | YES — without it, installed PWA shows blank white on cold start |
| **JS animated splash** (`SplashPage.jsx`) | Browser tab first load; installed PWA warm navigate; any first session | React component with CSS animation, sessionStorage flag | YES — manifest splash only covers the OS-controlled launch moment, not the React app's first render |

These two layers complement each other. The native splash covers the gap before React boots; the JS splash delivers the brand experience once React has rendered.

Confidence: HIGH — MDN and vite-plugin-pwa documentation confirm `background_color` behavior; JS splash as a React pattern is framework-agnostic.

---

## Asset Pipeline: lobo.png at Multiple Sizes

**Recommendation: Single source PNG in `src/assets/`, no build-time resizing**

Strategy:
1. Place `lobo.png` in `src/assets/lobo.png`
2. Import once: `import logoSrc from '../assets/lobo.png'`
3. Use Tailwind width classes to constrain display size: `w-7` (28px), `w-20` (80px), `w-[180px]`
4. The browser scales the image — for a logo at these small sizes, visual quality is indistinguishable from server-side resize
5. Vite will content-hash the asset automatically for cache-busting

For PWA icons (72–512px), generate 8 PNG files manually from `lobo.png` using any image editor or `sharp` CLI — place in `public/icons/`. This is a one-time manual step, not a build pipeline.

Do NOT add `vite-plugin-imagemin`, `vite-imagetools`, or `sharp` as build dependencies — this is a single-asset operation.

Confidence: HIGH — Vite static asset handling is well-documented; confirmed by `vite.config.js` already using `includeAssets: ['icons/*.png']`.

---

## MVP Recommendation

Build in this order:

1. **tailwind.config.js + index.css token replacement** — everything else depends on correct tokens existing
2. **lobo.png in src/assets/** — unblock all logo placements
3. **SplashPage.jsx** — only new component; sessionStorage flag; CSS animation; tagline text
4. **App.jsx integration** — wrap `<AppShell>` output with splash conditional
5. **AuthPage + OnboardingPage dark theme** — swap neon tokens to celeste on dark background
6. **Layout.jsx light theme** — header celeste, nav celeste-soft, body gris perla
7. **Interior pages** — cards white, badges semantic, tournament card border accents
8. **vite.config.js manifest** — update theme_color, background_color, name, icons
9. **PWA icon PNGs** — replace 8 icons in public/icons/ with lobo.png variants

Defer: None — all items are in scope for this milestone per PROJECT.md.

---

## Sources

- [MDN: Customize PWA app colors](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Customize_your_app_colors) — MEDIUM confidence
- [MDN: sessionStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage) — HIGH confidence
- [Tailwind v4 multi-theme with React (DEV.to)](https://dev.to/praveen-sripati/how-i-built-a-multi-theme-system-using-new-tailwind-css-v4-react-27j3) — MEDIUM confidence
- [Tailwind dark/light discussion (GitHub)](https://github.com/tailwindlabs/tailwindcss/discussions/16925) — MEDIUM confidence
- [Vite static asset handling](https://vite.dev/guide/assets) — HIGH confidence
- [vite-plugin-pwa manifest configuration (DeepWiki)](https://deepwiki.com/vite-pwa/vite-plugin-pwa/2.1-pwa-manifest-configuration) — MEDIUM confidence
- [Syncing React State and Session Storage](https://www.darrenlester.com/blog/syncing-react-state-and-session-storage) — MEDIUM confidence
- [React PWA splash screen (DEV.to)](https://dev.to/guillaumelarch/how-to-add-a-splash-screen-for-a-progressive-web-app-with-react-1019) — LOW confidence (native only, no JS layer detail)
