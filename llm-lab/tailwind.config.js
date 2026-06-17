/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#050811",
        void2: "#080d1a",
        panel: "#0e1525",
        panel2: "#131c30",
        line: "rgba(140,165,200,.16)",
        line2: "rgba(140,165,200,.28)",
        text: "#eaf2ff",
        muted: "#90a2c0",
        dim: "#5d6f8c",
        signal: "#54e0d6",
        azure: "#7aa0ff",
        warn: "#ffc24b",
        halluc: "#ff5d8f",
        violet: "#bb9bff",
        green: "#6dffb0",
      },
      fontFamily: {
        disp: ['"Space Grotesk"', "system-ui", "sans-serif"],
        body: ['"Inter"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "Menlo", "monospace"],
      },
      boxShadow: {
        glow: "0 0 14px rgba(84,224,214,.45)",
        glowPink: "0 0 14px rgba(255,93,143,.45)",
        card: "0 26px 60px rgba(0,0,0,.45)",
      },
    },
  },
  plugins: [],
};
