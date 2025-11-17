/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      screens: {
        'xl': '1280px',
        '2xl': '1536px',
        '3xl': '1920px',
      },
      colors: {
        'rice-primary': {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        'rice-secondary': {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        'disease': {
          'healthy': '#16a34a',
          'bacterial': '#dc2626',
          'brown': '#d97706',
          'smut': '#9333ea',
        },
        'farm': {
          'soil': '#8B4513',
          'leaf': '#228B22',
          'sun': '#FFD700',
          'water': '#4682B4',
          'harvest': '#DAA520',
        },
        'outdoor': {
          'high-contrast': '#000000',
          'sun-readable': '#FFFFFF',
          'shadow': '#808080',
          'warning': '#FF6B35',
          'success': '#00A878',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-gentle': 'bounce 2s infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      backdropBlur: {
        'xs': '2px',
      },
      fontFamily: {
        'sans': ['Nunito', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      minHeight: {
        '96': '24rem',
        '128': '32rem',
      }
    },
  },
  plugins: [],
  darkMode: 'class',
}