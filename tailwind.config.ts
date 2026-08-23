import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        cream: "#F7F3EC",
        ink: "#241F1A",
        glow: "#E8724C",
        glowdark: "#C6512B",
        peach: "#FBE4D8",
        leaf: "#3F7D5B",
        clay: "#E7D9C8",
        amber: "#E7A857",
      },
      fontFamily: {
        display: ["Georgia", "'Times New Roman'", "serif"],
      },
      borderRadius: {
        xl2: "1.1rem",
      },
      boxShadow: {
        card: "0 8px 24px -12px rgba(36,31,26,0.18)",
        soft: "0 4px 14px -6px rgba(36,31,26,0.2)",
      },
    },
  },
  plugins: [],
};
export default config;
