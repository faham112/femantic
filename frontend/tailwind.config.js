/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: { 50: "#e8eef5", 100: "#c5d3e6", 500: "#1a4a73", 600: "#123a5c", 700: "#0d2b4a", 800: "#0b2540", 900: "#07192c" },
        accent: { DEFAULT: "#f59a23", hover: "#e8890f", soft: "#fff4e0" },
        primary: { 50: "#f0f9ff", 100: "#e0f2fe", 500: "#0ea5e9", 600: "#0284c7", 700: "#0369a1", 900: "#0c4a6e" },
      },
      screens: { xs: "320px" },
      boxShadow: { card: "0 1px 3px rgba(15,23,42,.06), 0 1px 2px rgba(15,23,42,.04)" },
    },
  },
  plugins: [],
};
