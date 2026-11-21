/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          pink: '#ec4899',
          purple: '#8b5cf6',
          indigo: '#6366f1',
          dark: '#030712'
        }
      }
    },
  },
  plugins: [],
}
