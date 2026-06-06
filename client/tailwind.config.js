/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Inter'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "'Fira Code'", "monospace"],
      },
      colors: {
        ink: {
          50:  "#f6f6f7",
          100: "#e9e9ec",
          200: "#d0d0d8",
          300: "#a8a8b5",
          400: "#86869a",
          500: "#64647a",
          600: "#4e4e62",
          700: "#3c3c4e",
          800: "#2a2a3a",
          900: "#18182a",
          950: "#0d0d1a",
        },
        violet: {
          50:  "#f4f2ff",
          100: "#ebe8ff",
          200: "#d5cfff",
          300: "#b8aeff",
          400: "#9b8fff",
          500: "#7c6ff5",
          600: "#6554e8",
          700: "#5340d0",
          800: "#4232aa",
          900: "#372c88",
        },
      },
    },
  },
  plugins: [],
};