/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        insta: {
          pink: '#E1306C',
          purple: '#C13584',
          yellow: '#FCAF45',
          orange: '#F56040',
        },
        twitter: {
          blue: '#1DA1F2',
          dark: '#0f1419',
        },
        threads: {
          dark: '#101010',
          accent: '#ffffff',
        }
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        }
      }
    },
  },
  plugins: [],
}
