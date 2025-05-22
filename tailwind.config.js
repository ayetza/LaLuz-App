// tailwind.config.js

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  presets: [require("nativewind/preset")], // ⚠️ Esta línea es OBLIGATORIA
  theme: {
    extend: {
      colors: {
        blue: '#3A557C',
        grey: '#A6A6A6',
        white: '#FFFFFF',
      },
    },
  },
  plugins: [],
}
