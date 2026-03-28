# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

```
racket-tourneys
├─ .env
├─ eslint.config.js
├─ index.html
├─ package-lock.json
├─ package.json
├─ postcss.config.js
├─ public
│  ├─ apple-touch-icon.png
│  ├─ favicon.ico.png
│  ├─ favicon.svg
│  ├─ icon-512x512.png
│  ├─ icons
│  │  ├─ icon-128x128.png
│  │  ├─ icon-144x144.png
│  │  ├─ icon-152x152.png
│  │  ├─ icon-192x192.png
│  │  ├─ icon-384x384.png
│  │  ├─ icon-512x512.png
│  │  ├─ icon-72x72.png
│  │  └─ icon-96x96.png
│  └─ icons.svg
├─ README.md
├─ src
│  ├─ App.css
│  ├─ App.jsx
│  ├─ assets
│  │  ├─ hero.png
│  │  ├─ react.svg
│  │  └─ vite.svg
│  ├─ components
│  │  ├─ Layout.jsx
│  │  └─ ProtectedRoute.jsx
│  ├─ context
│  │  └─ AuthContext.jsx
│  ├─ hooks
│  │  └─ useVisibilityRefresh.js
│  ├─ index.css
│  ├─ lib
│  │  └─ supabaseClient.js
│  ├─ main.jsx
│  └─ pages
│     ├─ AuthPage.jsx
│     ├─ CreateTournamentPage.jsx
│     ├─ DashboardPage.jsx
│     └─ OnboardingPage.jsx
├─ tailwind.config.js
├─ vercel.json
└─ vite.config.js

```