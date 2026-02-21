/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#0d7ff2",
        "background-light": "#f5f7f8",
        "background-dark": "#101922"
      },
      fontFamily: {
        "display": ["Inter", "sans-serif"]
      }
    },
  },
  plugins: [],
}
