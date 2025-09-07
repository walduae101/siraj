/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Design Tokens
      colors: {
        // Primary brand colors
        primary: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
          950: "#2e1065",
          DEFAULT: "#7f22fe",
          foreground: "#f5f3ff",
        },

        // Secondary colors
        secondary: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
          DEFAULT: "#27272a",
          foreground: "#fafafa",
        },

        // Background colors
        background: "#09090b",
        "background-secondary": "#8e51ff",

        // Foreground colors
        foreground: "#fafafa",

        // Card colors
        card: {
          DEFAULT: "#18181b",
          foreground: "#fafafa",
        },

        // Popover colors
        popover: {
          DEFAULT: "#18181b",
          foreground: "#fafafa",
        },

        // Muted colors
        muted: {
          DEFAULT: "#27272a",
          foreground: "#9f9fa9",
        },

        // Accent colors
        accent: {
          DEFAULT: "#27272a",
          foreground: "#fafafa",
        },

        // Destructive colors
        destructive: {
          DEFAULT: "#f53b3e",
          foreground: "#fafafa",
        },

        // Border colors
        border: "rgba(255, 255, 255, 0.1)",
        input: "rgba(255, 255, 255, 0.15)",
        ring: "#7f22fe",

        // Chart colors
        chart: {
          1: "#1447e6",
          2: "#00bc7d",
          3: "#fe9a00",
          4: "#ad46ff",
          5: "#ff2056",
        },

        // Sidebar colors
        sidebar: {
          DEFAULT: "#18181b",
          foreground: "#fafafa",
          primary: "#7f22fe",
          "primary-foreground": "#f5f3ff",
          accent: "#27272a",
          "accent-foreground": "#fafafa",
          border: "rgba(255, 255, 255, 0.1)",
          ring: "#7f22fe",
        },
      },

      // Typography
      fontFamily: {
        cairo: ["var(--font-cairo)", "sans-serif"],
        sans: ["var(--font-cairo)", "system-ui", "sans-serif"],
      },

      // Spacing (4px base)
      spacing: {
        18: "4.5rem", // 72px
        88: "22rem", // 352px
        128: "32rem", // 512px
      },

      // Border radius
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
      },

      // Shadows
      boxShadow: {
        glow: "0 0 20px rgba(127, 34, 254, 0.3)",
        "glow-lg": "0 0 40px rgba(127, 34, 254, 0.4)",
        "inner-glow": "inset 0 0 20px rgba(127, 34, 254, 0.2)",
      },

      // Animation
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "fade-out": "fadeOut 0.5s ease-in-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
        "slide-in-left": "slideInLeft 0.3s ease-out",
        "slide-out-right": "slideOutRight 0.3s ease-in",
        "slide-out-left": "slideOutLeft 0.3s ease-in",
        "bounce-gentle": "bounceGentle 2s ease-in-out infinite",
        "pulse-gentle": "pulseGentle 2s ease-in-out infinite",
        "smooth-bob": "smoothBob 2.5s ease-in-out infinite",
      },

      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeOut: {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        slideInRight: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        slideInLeft: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        slideOutRight: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(100%)" },
        },
        slideOutLeft: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-100%)" },
        },
        bounceGentle: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        pulseGentle: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" },
        },
        smoothBob: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
      },

      // RTL Support
      textAlign: {
        start: "start",
        end: "end",
      },

      // Custom utilities for RTL
      inset: {
        "start-0": "var(--inset-start, 0)",
        "end-0": "var(--inset-end, 0)",
        "start-4": "var(--inset-start, 1rem)",
        "end-4": "var(--inset-end, 1rem)",
      },

      margin: {
        "start-0": "var(--margin-start, 0)",
        "end-0": "var(--margin-end, 0)",
        "start-4": "var(--margin-start, 1rem)",
        "end-4": "var(--margin-end, 1rem)",
      },

      padding: {
        "start-0": "var(--padding-start, 0)",
        "end-0": "var(--padding-end, 0)",
        "start-4": "var(--padding-start, 1rem)",
        "end-4": "var(--padding-end, 1rem)",
      },

      // Responsive breakpoints
      screens: {
        xs: "475px",
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
      },

      // Container
      container: {
        center: true,
        padding: {
          DEFAULT: "1rem",
          sm: "2rem",
          lg: "4rem",
          xl: "5rem",
          "2xl": "6rem",
        },
      },
    },
  },
  plugins: [
    // RTL plugin for automatic direction handling
    ({ addUtilities, theme }) => {
      const rtlUtilities = {
        ".rtl": {
          "--inset-start": "auto",
          "--inset-end": "0",
          "--margin-start": "auto",
          "--margin-end": "0",
          "--padding-start": "auto",
          "--padding-end": "0",
        },
        ".ltr": {
          "--inset-start": "0",
          "--inset-end": "auto",
          "--margin-start": "0",
          "--margin-end": "auto",
          "--padding-start": "0",
          "--padding-end": "auto",
        },
      };
      addUtilities(rtlUtilities);
    },
  ],
};
