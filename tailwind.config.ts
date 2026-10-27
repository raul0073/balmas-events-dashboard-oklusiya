import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Pikud HaOref brand colors
        pikud: {
          navy: "#0D2B5E",
          "navy-dark": "#071A3E",
          "navy-light": "#1A3F7A",
          orange: "#F47920",
          "orange-dark": "#D4620E",
          "orange-light": "#F9A55A",
          "orange-pale": "rgb(var(--orange-pale) / <alpha-value>)",
          // the old cream and grays now follow the theme tokens
          cream: "rgb(var(--canvas) / <alpha-value>)",
          "gray-light": "rgb(var(--line) / <alpha-value>)",
          "gray-mid": "rgb(var(--ink-muted) / <alpha-value>)",
        },
        // theme tokens (light/dark values live in globals.css)
        canvas: { DEFAULT: "rgb(var(--canvas) / <alpha-value>)", deep: "rgb(var(--canvas-deep) / <alpha-value>)" },
        surface: { DEFAULT: "rgb(var(--surface) / <alpha-value>)", 2: "rgb(var(--surface-2) / <alpha-value>)" },
        line: { DEFAULT: "rgb(var(--line) / <alpha-value>)", strong: "rgb(var(--line-strong) / <alpha-value>)" },
        ink: {
          DEFAULT: "rgb(var(--ink) / <alpha-value>)",
          soft: "rgb(var(--ink-soft) / <alpha-value>)",
          muted: "rgb(var(--ink-muted) / <alpha-value>)",
          faint: "rgb(var(--ink-faint) / <alpha-value>)",
        },
        // IDF olive green, the "green" space
        idf: {
          green: "#4B5320",
          "green-dark": "#363C17",
          "green-light": "#6B7A3A",
          "green-pale": "rgb(var(--olive-pale) / <alpha-value>)",
          "green-mist": "rgb(var(--olive-mist) / <alpha-value>)",
        },
        // Plugot colors
        plugah: {
          alef: "#1A3F7A",
          bet: "#2E7D32",
          gimel: "#6A1B9A",
          dalet: "#BF360C",
          other: "#37474F",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        heebo: ["var(--font-heebo)", "Heebo", "sans-serif"],
        sans: ["var(--font-heebo)", "Heebo", "sans-serif"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
