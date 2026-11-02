import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  "#e8f4ff",
          100: "#c3e0ff",
          200: "#9bcbff",
          300: "#64adff",
          400: "#3b8fef",
          500: "#1a6fd4",
          600: "#0d54b0",
          700: "#083d88",
          800: "#062c62",
          900: "#041b3e",
          DEFAULT: "#1a6fd4",
        },
        teal: {
          400: "#22d3c8",
          500: "#14b8a6",
          600: "#0d9488",
        },
        emerald: {
          400: "#34d399",
          500: "#10b981",
        },
      },
      fontFamily: {
        sans: ["var(--font-cairo)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
