import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // GAA Theme Colors
        gaa: {
          green: "#1B5E20",
          greenLight: "#2E7D32",
          greenDark: "#0A3D0C",
          gold: "#FFD700",
          goldLight: "#FFE44D",
          goldDark: "#C6A300",
        },
        // Match Day Colors
        matchday: {
          pitch: "#4CAF50",
          line: "#FFFFFF",
          sun: "#FFF8E1",
          shadow: "#1B5E2020",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        display: ["Montserrat", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "gaa": "0 4px 6px -1px #1B5E2033, 0 2px 4px -1px #FFD70022",
        "gaa-lg": "0 10px 15px -3px #1B5E2044, 0 4px 6px -2px #FFD70033",
      },
    },
  },
  plugins: [],
} satisfies Config;
