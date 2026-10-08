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
        campus: {
          50: "#F5F9FF",
          100: "#EAF4FF",
          200: "#D2E6FF",
          300: "#9EC6FF",
          400: "#3B82F6",
          500: "#1976D2",
          600: "#1557C0", // Primary Blue
          700: "#073B8F", // Dark Blue
          800: "#062B68", // Navy
          900: "#031940",
          text: "#102A43",
          muted: "#486581",
          border: "#D9E2EC",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
