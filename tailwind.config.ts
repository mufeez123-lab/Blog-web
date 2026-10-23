import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        editorial: {
          bg: "#F8FAFC",
          paper: "#FFFFFF",
          navy: "#0F172A",
          charcoal: "#1E293B",
          slate: "#475569",
          muted: "#64748B",
          border: "#E2E8F0",
          blue: "#1D4ED8",
          blueHover: "#1E40AF",
          blueLight: "#EFF6FF",
          amber: "#B45309",
        },
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", '"Times New Roman"', "Times", "serif"],
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "sans-serif",
        ],
        mono: [
          '"JetBrains Mono"',
          "Menlo",
          "Monaco",
          "Consolas",
          '"Courier New"',
          "monospace",
        ],
      },
      maxWidth: {
        reading: "68ch",
      },
    },
  },
  plugins: [],
};

export default config;
