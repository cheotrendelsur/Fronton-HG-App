/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Base oscura — FRONTÓN HGV
        base: {
          950: "#1E2024",
          900: "#1E2024",
          800: "#24282C",
        },
        // Superficies
        surface: {
          900: "#2A2D33",
          800: "#32363D",
          700: "#3A3D44",
          600: "#4B5563",
          500: "#6B7280",
        },
        // Bordes
        border: {
          strong:  "#4B5563",
          default: "#3A3D44",
          subtle:  "#2A2D33",
        },
        // Acento celeste — FRONTÓN HGV
        neon: {
          50:  "#F0F9FF",
          100: "#E0F2FE",
          200: "#A8D8EA",
          300: "#6BB3D9",  // ← principal (celeste)
          400: "#5A9BBF",
          500: "#4A89A8",
          600: "#3A7090",
          700: "#1A4A6B",
          800: "#0F2E45",
          900: "#061B2A",
        },
        // Texto
        ink: {
          primary:   "#E5E7EB",
          secondary: "#9CA3AF",
          muted:     "#6B7280",
          inverse:   "#1F2937",
        },
        // Zona clara interior
        pearl: {
          50:  "#FFFFFF",
          100: "#F2F3F5",
          200: "#E8F4FA",
          300: "#D0E5F0",
        },
        // Celeste del escudo
        celeste: {
          DEFAULT: "#6BB3D9",
          hover:   "#5A9BBF",
          light:   "#E8F4FA",
          text:    "#3A8BB5",
        },
        // Dorado del escudo (SOLO badges/estrellas)
        dorado: {
          DEFAULT: "#D4A827",
          light:   "#FFF5D6",
          text:    "#92750F",
        },
        // Identidad Hermandad Gallega (conservados)
        shield: {
          blue:       "#1B3A5C",
          "blue-light": "#2B5A8C",
        },
        galician: {
          blue:       "#6BB3D9",
          "blue-light": "#A8D8EA",
        },
        ball: {
          green: "#C5D93F",
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
        "neon-sm": "0 0 12px rgba(107,179,217,0.15)",
        "neon-md": "0 0 24px rgba(107,179,217,0.20)",
        "card":    "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
      },
      keyframes: {
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-neon": {
          "0%, 100%": { boxShadow: "0 0 8px rgba(107,179,217,0.15)" },
          "50%":      { boxShadow: "0 0 20px rgba(107,179,217,0.35)" },
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
