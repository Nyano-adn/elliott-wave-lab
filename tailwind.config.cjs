/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0b1020",
        panel: "#151b2e",
        accent: "#4fd1c5",
        danger: "#f87171"
      }
    }
  },
  plugins: []
};
