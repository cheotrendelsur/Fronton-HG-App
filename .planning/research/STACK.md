# Technology Stack — Frontón HGV Visual Rebrand

**Project:** RacketTourneys visual rebrand (dark neon → HGV identity palette)
**Researched:** 2026-03-29
**Confidence:** HIGH — verified against official Tailwind CSS 4 docs and upgrade guide

---

## Context: What This Milestone Actually Touches

This milestone does NOT change the application stack. The stack is fixed: React 19 + Vite 8 + Tailwind CSS 4 + Supabase. What this research answers is: **how does Tailwind CSS 4 color token migration work, what are the v4-specific gotchas, and what is the safest execution strategy for this codebase?**

The existing project already runs Tailwind CSS 4 (`tailwindcss ^4.2.1`) with the CSS-first import (`@import "tailwindcss"` in `src/index.css`) and the `@config` directive pointing at `tailwind.config.js`. This is a valid, supported configuration in v4.

---

## Tailwind CSS 4 vs v3: What Actually Changed for This Project

### Configuration Architecture

**v3 approach:** Tailwind is a PostCSS plugin. `tailwind.config.js` is the single source of truth. CSS uses `@tailwind base; @tailwind components; @tailwind utilities;` directives.

**v4 approach (what this project uses):** Two valid modes exist.

**Mode A — CSS-first (recommended for greenfield):**
```css
/* src/index.css */
@import "tailwindcss";

@theme {
  --color-surface-900: #171B26;
  --color-surface-800: #1E2230;
  --color-neon-300: #F5D547;
  /* etc. */
}
```
No `tailwind.config.js` needed. The `@theme` block replaces the JS config entirely.

**Mode B — JS config with @config directive (what this project currently uses):**
```css
/* src/index.css — current project setup */
@import "tailwindcss";
@config "../tailwind.config.js";
```
`tailwind.config.js` remains the token source. This is **fully supported in v4** via the `@config` directive. Tailwind loads the JS config explicitly from the CSS file.

**Verdict for this project: stay in Mode B.** The project already uses Mode B and it works. Migrating to Mode A (@theme) is optional and is NOT required for this milestone. Doing so would be out of scope (it is a non-trivial refactor of the config layer with no user-visible benefit).

### How Color Tokens Map to Utility Classes in v4

The mapping is identical to v3 when using `tailwind.config.js` via `@config`. Nested color objects in `theme.extend.colors` continue to generate the same utility class names:

```js
// tailwind.config.js
colors: {
  surface: {
    900: "#171B26",  // → bg-surface-900, text-surface-900, border-surface-900, etc.
    800: "#1E2230",  // → bg-surface-800, etc.
  },
  neon: {
    300: "#F5D547",  // → bg-neon-300, text-neon-300, etc.
  }
}
```

This is unchanged from v3. The nested object format with numeric keys generates hyphenated utility classes like `bg-surface-900`.

If you were using `@theme` (Mode A), the equivalent would be:
```css
@theme {
  --color-surface-900: #171B26;  /* → bg-surface-900 */
  --color-neon-300: #F5D547;     /* → bg-neon-300 */
}
```

The naming convention `--color-{name}-{scale}` maps directly to `bg-{name}-{scale}`.

### Opacity Modifiers Still Work

Classes like `bg-neon-900/40`, `hover:bg-neon-900/10` work identically in v4. The `/opacity` syntax is unchanged.

### Breaking Changes That Affect This Project

Two v4 breaking changes are relevant:

1. **Default border color is now `currentColor` (was `gray-200` in v3).** This project defines explicit border colors everywhere (`border-border-default`, `border-border-subtle`, etc.), so this is not a concern in practice.

2. **Default ring is 1px + currentColor (was 3px + blue-500 in v3).** The project uses explicit `focus:ring-neon-300/30` patterns, so this is also not a concern.

No color utility class names changed between v3 and v4.

---

## Color Token Strategy: The Complete Migration Map

### Current Tokens (pre-rebrand, confirmed from tailwind.config.js)

| Token | Hex | Semantic Role |
|-------|-----|---------------|
| `base-950` | `#080A0F` | Main screen background |
| `base-900` | `#0D1017` | Alternative background |
| `base-800` | `#131620` | Dark background variant |
| `surface-900` | `#171B26` | Cards, inputs |
| `surface-800` | `#1E2230` | Elevated surface |
| `surface-700` | `#252A3A` | Mid surface |
| `surface-600` | `#2D3347` | Light surface |
| `surface-500` | `#363D54` | Lightest dark surface |
| `border-strong` | `#3A4260` | Strong borders |
| `border-default` | `#2A3050` | Default card borders |
| `border-subtle` | `#1E2440` | Subtle borders |
| `neon-300` | `#F5D547` | Primary accent / CTA |
| `neon-400` | `#D4A827` | Dark accent |
| `ink-primary` | `#E5E7EB` | Main text |
| `ink-secondary` | `#8B92A8` | Secondary text |
| `ink-muted` | `#505878` | Muted text |
| `ink-inverse` | `#0D1017` | Text on light backgrounds |
| `shield-blue` | `#1B3A5C` | Brand deep navy |
| `galician-blue` | `#6BB3D9` | Brand celeste (already present) |

### Target Token Values (post-rebrand, from PROJECT.md)

The new identity uses a mixed theme: dark login zone + light interior.

**Dark zone (login, onboarding, splash):**
- Background: `#1E2024` (dark near-black, replaces `#080A0F`)
- Accent: `#6BB3D9` (celeste, replaces `#F5D547`)

**Light zone (all interior pages after login):**
- Background: `#F2F3F5` (pearl gray — NEW, requires new token)
- Cards: `#FFFFFF` with soft shadow
- Nav bar: `#E8F4FA` (celeste tint — NEW, requires new token)

**Universal:**
- CTA buttons: `#6BB3D9` (celeste)
- Badge/highlights: `#D4A827` (golden, already `neon-400`)
- Accent lateral (active tournament): celeste
- Accent lateral (draft): gray
- Accent lateral (finished): green

### Token Renaming Strategy

The safest approach for this codebase is **keep all existing token names, change only their hex values**. 344 occurrences of token-based classes exist across 29 files. Renaming tokens (e.g., `neon-300` to `celeste-300`) would require touching every one of those 344 usages. That is out of scope and high risk.

Instead:

1. **Change hex values in `tailwind.config.js`** for tokens that shift role but keep name.
2. **Add new tokens** for concepts that don't exist yet (pearl gray interior, nav tint).
3. **Leave token names untouched** in component JSX files.

Specific mapping:

| Token Name | Old Hex | New Hex | Rationale |
|------------|---------|---------|-----------|
| `neon-300` | `#F5D547` | `#6BB3D9` | Primary accent shifts from gold to celeste |
| `neon-400` | `#D4A827` | `#D4A827` | Keep — golden badge accent, same role |
| `base-950` | `#080A0F` | `#1E2024` | Dark background for login/splash |
| `base-900` | `#0D1017` | `#1E2024` | Consolidate dark base |
| `ink-primary` | `#E5E7EB` | `#E5E7EB` | Keep — legible on both themes |
| `ink-inverse` | `#0D1017` | `#1B3A5C` | Text on light/celeste → navy |

New tokens to add to `tailwind.config.js`:

```js
// Add inside theme.extend.colors
pearl: {
  50: "#FFFFFF",
  100: "#F2F3F5",  // interior page background
  200: "#E8F4FA",  // nav bar in light mode
},
```

These generate `bg-pearl-100`, `bg-pearl-200`, `bg-pearl-50` for the interior light zone.

### Shadow Tokens

The `boxShadow` section in `tailwind.config.js` references RGBA values hardcoded to the old gold:

```js
// Current
"neon-sm": "0 0 12px rgba(212,168,39,0.15)",
"neon-md": "0 0 24px rgba(212,168,39,0.20)",
```

Change to celeste:
```js
"neon-sm": "0 0 12px rgba(107,179,217,0.15)",
"neon-md": "0 0 24px rgba(107,179,217,0.20)",
"card":    "0 1px 3px rgba(0,0,0,0.12)",  // lighter for white cards
```

### Keyframe Tokens

The `pulse-neon` animation uses gold RGBA directly in the keyframe definition:

```js
// Current
"pulse-neon": {
  "0%, 100%": { boxShadow: "0 0 8px rgba(245,213,71,0.15)" },
  "50%":      { boxShadow: "0 0 20px rgba(245,213,71,0.35)" },
},
```

Change to celeste RGBA (`107, 179, 217`).

---

## The Hardcoded Hex Problem

**This is the most critical finding.** The codebase has two color layers:

1. **Token-based layer** — 344 usages across 29 files using classes like `bg-neon-300`, `text-ink-muted`, `border-border-default`. These are safe: change hex in `tailwind.config.js` and they update globally.

2. **Hardcoded hex layer** — inline `style={{}}` props and SVG attributes with literal hex values scattered throughout. These bypass the token system entirely and will NOT update when `tailwind.config.js` changes.

Files with hardcoded color values that must be manually updated:

| File | Hardcoded Values | Dominant Color |
|------|-----------------|----------------|
| `src/components/Layout.jsx` | `#F5D547`, `#1E2230`, `#1E2440`, `rgba(245,213,71,...)` | Gold accent |
| `src/pages/AuthPage.jsx` | `#F5D547`, `rgba(27,58,92,...)` | Gold accent |
| `src/pages/AdminPanelPage.jsx` | `#F5D547`, `rgba(...)` | Gold accent |
| `src/pages/OnboardingPage.jsx` | `#0D1017`, `#0f1010` | Dark backgrounds |
| `src/App.jsx` | `#b8f533`, `#212424`, `#2a2e2e` | OLD green neon (leftover!) |
| `src/components/ProtectedRoute.jsx` | `#1a1c1c`, `#2a2e2e` | Old surface values |

**`App.jsx` contains `#b8f533`** — the original green neon — in an inline SVG spinner. This is a leftover from a previous design iteration. It must be updated to celeste `#6BB3D9`.

**The `Layout.jsx` nav bar** uses 8+ inline style properties for active state colors referencing `#F5D547`. All must be updated to `#6BB3D9`.

---

## index.css Changes Required

The `src/index.css` file has two hardcoded hex values that must also change:

```css
/* Current */
html, body, #root {
  background-color: #080A0F;  /* → change to #1E2024 for dark zone */
  color: #E5E7EB;
}

.glass {
  background: rgba(23, 27, 38, 0.85);  /* → update to match new surface-900 */
}
```

The glass utility background must be updated when `surface-900` changes.

---

## PWA Manifest Changes (vite.config.js)

The `vite.config.js` manifest has:
```js
theme_color: '#0D1017',
background_color: '#0D1017',
```

Update to:
```js
theme_color: '#1B3A5C',      // shield navy — renders browser chrome/status bar
background_color: '#1E2024', // matches splash screen dark bg
```

The `index.html` `<meta name="theme-color">` tag (if present) must match.

---

## How to Safely Execute Token Migration Without Breaking Components

**Step 1: Update `tailwind.config.js` only.**
Change hex values for `neon-300`, `base-950`, shadow RGBA, keyframe RGBA. Add `pearl` color scale. Run `npm run build` — all token-based classes update globally with zero component changes.

**Step 2: Update `src/index.css`.**
Change the hardcoded `background-color` and `.glass` background. Run build again.

**Step 3: Hunt and replace hardcoded hex values in JSX files.**
Use a targeted grep for each old hex value:
- `#F5D547` and `rgba(245,213,71` → replace with `#6BB3D9` / `rgba(107,179,217`
- `#b8f533` → replace with `#6BB3D9`
- `#080A0F`, `#0D1017`, `#0f1010` in inline styles → replace with `#1E2024`
- `#1a1c1c`, `#212424` in inline styles → replace with `#171B26` (surface-900)
- `#2a2e2e`, `#2A3050`, `#1E2440` in inline styles → match new border-default/subtle values

**Step 4: Add new component classes for the interior light theme.**
Where pages need `bg-pearl-100` instead of `bg-base-950`, those are in scope for this milestone. Layout.jsx and per-page backgrounds are the main targets.

**Step 5: Update vite.config.js manifest colors and index.html theme-color meta.**

---

## What NOT to Do

**Do NOT rename token names** (e.g., `neon-300` → `celeste-300`). 344 class usages across 29 files would all break. The token name is just a label — change the value, keep the name.

**Do NOT migrate from `@config` + `tailwind.config.js` to `@theme`-only.** This is optional in v4. It would require rewriting every nested color object into flat CSS variable notation and verifying that all generated class names still match. Zero user-visible benefit for this milestone.

**Do NOT use dynamic class construction** for the new palette (e.g., `` `bg-${color}-900` ``). Tailwind's scanner cannot detect dynamically built class names and will not include them in the output CSS. All classes must appear as complete strings in source files.

**Do NOT add `--color-*` variables to `:root` in `index.css` alongside `@config`.** In Mode B (JS config via `@config`), putting `--color-surface-900: ...` in `:root` defines a CSS variable but does NOT make `bg-surface-900` work — that mapping is handled by `tailwind.config.js`. The two systems are separate. Use `:root` variables only if you explicitly reference them from `@theme` or from `tailwind.config.js` via `var(--...)`.

**Do NOT change any spacing, layout, breakpoint, or font settings** — only colors, shadows, and animation RGBA values.

---

## Token Inventory: Usage Frequency

Based on grep across 29 JSX files (344 total hits), the highest-frequency tokens to validate after migration:

| Token | Files | Approx Uses | Risk if Wrong |
|-------|-------|-------------|---------------|
| `bg-surface-900` / `bg-surface-800` | 15+ | ~60 | High — cards/inputs everywhere |
| `text-ink-primary` / `text-ink-secondary` | 20+ | ~80 | High — all body text |
| `bg-neon-300` / `text-neon-300` | 10+ | ~30 | High — CTAs and active states |
| `border-border-default` | 12+ | ~40 | Medium — card outlines |
| `bg-neon-900/40` | 5 | ~8 | Medium — active button state |
| `shadow-neon-sm` | 5 | ~8 | Low — glow effect |
| `text-galician-blue` | 2 | ~3 | Low — already new brand color |
| `bg-shield-blue/20` | 1 | ~1 | Low — badge bg |

---

## Sources

- [Tailwind CSS v4.0 Release Post](https://tailwindcss.com/blog/tailwindcss-v4) — HIGH confidence, official
- [Tailwind CSS Theme Variables Docs](https://tailwindcss.com/docs/theme) — HIGH confidence, official
- [Tailwind CSS v4 Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide) — HIGH confidence, official
- [BYO CSS Tokens to Tailwind v4](https://nerdy.dev/BYO-CSS-tokens-to-tailwind-v4s-new-CSS-centric-config) — MEDIUM confidence, community
- [Tailwind CSS v4 Color Guide (nihardaily.com)](https://www.nihardaily.com/95-how-to-customize-tailwind-colors-in-v40-master-the-latest-css-revolution) — MEDIUM confidence, community
