/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Modernized Theme Variables matching DESIGN.md
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: "var(--card)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
        },
        muted: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
        },
        success: {
          DEFAULT: "var(--success)",
        },
        border: "var(--border)",
        ring: "var(--ring)",

        // Legacy compatibility mappings
        "outline": "var(--outline)",
        "on-background": "var(--on-surface)",
        "on-tertiary": "#ffffff",
        "tertiary-fixed": "#d5e3fc",
        "on-secondary": "#ffffff",
        "surface-container": "var(--surface-container)",
        "on-primary": "var(--primary-foreground)",
        "inverse-primary": "var(--accent-foreground)",
        "on-tertiary-fixed": "#0d1c2e",
        "surface-dim": "var(--surface-container)",
        "on-primary-fixed": "var(--primary)",
        "surface-variant": "var(--surface-container)",
        "error-container": "var(--error-container)",
        "surface-tint": "var(--primary)",
        "on-tertiary-container": "#fdfcff",
        "on-tertiary-fixed-variant": "#3a485b",
        "error": "var(--destructive)",
        "secondary-fixed": "var(--secondary)",
        "primary-fixed-dim": "var(--primary)",
        "surface-container-highest": "var(--surface-container-highest)",
        "on-secondary-container": "var(--on-secondary-container)",
        "surface-container-lowest": "var(--surface-container-lowest)",
        "on-primary-fixed-variant": "var(--primary)",
        "secondary-container": "var(--secondary-container)",
        "on-error-container": "var(--on-error-container)",
        "on-surface-variant": "var(--on-surface-variant)",
        "inverse-on-surface": "var(--on-surface)",
        "primary-fixed": "var(--primary)",
        "on-surface": "var(--on-surface)",
        "outline-variant": "var(--outline-variant)",
        "on-primary-container": "var(--on-primary-container)",
        "tertiary": "var(--secondary)",
        "surface": "var(--surface)",
        "on-error": "#ffffff",
        "on-secondary-fixed": "var(--on-secondary-container)",
        "secondary-fixed-dim": "var(--secondary)",
        "inverse-surface": "var(--on-surface)",
        "on-secondary-fixed-variant": "var(--on-secondary-container)",
        "surface-bright": "var(--surface)",
        "tertiary-container": "var(--secondary)",
        "surface-container-low": "var(--surface-container-low)",
        "surface-container-high": "var(--surface-container-high)",
        "primary-container": "var(--primary-container)",
        "tertiary-fixed-dim": "var(--secondary)",
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "sm": "0.25rem",
        "md": "0.375rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
        "full": "9999px"
      },
      spacing: {
        "sidebar-width": "260px",
        "margin-desktop": "32px",
        "margin-mobile": "16px",
        "gutter": "16px",
        "base": "4px"
      },
      fontFamily: {
        sans: ["Geist", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["Geist Mono", "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      }
    },
  },
  plugins: [],
}
