/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Base negra
        base: {
          950: "#080909",
          900: "#0f1010",
          800: "#161818",
        },
        // Superficies (cards, modales, inputs)
        surface: {
          900: "#1a1c1c",
          800: "#212424",
          700: "#282b2b",
          600: "#303434",
          500: "#3a3e3e",
        },
        // Bordes
        border: {
          strong:  "#3a3e3e",
          default: "#2a2e2e",
          subtle:  "#1e2222",
        },
        // Acento verde neón (pelota de pádel/tenis)
        neon: {
          50:  "#f4ffe0",
          100: "#e2ffa8",
          200: "#ccff61",
          300: "#b8f533",  // ← principal
          400: "#a2e020",
          500: "#84be0e",
          600: "#659606",
          700: "#4a6e04",
          800: "#334d03",
          900: "#1e2e01",
        },
        // Texto
        ink: {
          primary:   "#f0f2f0",
          secondary: "#9aa29a",
          muted:     "#5c665c",
          inverse:   "#0f1010",
        },
      },
      fontFamily: {
        sans: ["'DM Sans'", "system-ui", "sans-serif"],
        mono: ["'DM Mono'", "monospace"],
      },
      borderRadius: {
        "xl":  "12px",
        "2xl": "16px",
        "3xl": "20px",
      },
      spacing: {
        "safe-bottom": "env(safe-area-inset-bottom, 16px)",
      },
      boxShadow: {
        "neon-sm": "0 0 12px rgba(184, 245, 51, 0.15)",
        "neon-md": "0 0 24px rgba(184, 245, 51, 0.20)",
        "card":    "0 1px 3px rgba(0,0,0,0.4)",
      },
      keyframes: {
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-neon": {
          "0%, 100%": { boxShadow: "0 0 8px rgba(184,245,51,0.15)" },
          "50%":      { boxShadow: "0 0 20px rgba(184,245,51,0.35)" },
        },
      },
      animation: {
        "fade-up":    "fade-up 0.3s ease-out both",
        "pulse-neon": "pulse-neon 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
}