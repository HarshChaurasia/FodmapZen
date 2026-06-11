/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // FodmapZen Design System
        primary: {
          DEFAULT: '#2D7A4F',
          light: '#E8F5EE',
          dark: '#1B5C38',
        },
        accent: {
          orange: '#F4845F',
          yellow: '#F9C74F',
        },
        fodmap: {
          safe: '#2D7A4F',
          caution: '#F9C74F',
          avoid: '#E05C5C',
          unknown: '#9CA3AF',
        },
        background: '#FAFAF7',
        surface: '#FFFFFF',
        border: '#E5E7EB',
        text: {
          primary: '#1A1A1A',
          secondary: '#6B7280',
          tertiary: '#9CA3AF',
        },
      },
      fontFamily: {
        sans: ['DMSans_400Regular'],
        'sans-medium': ['DMSans_500Medium'],
        'sans-bold': ['DMSans_700Bold'],
      },
      borderRadius: {
        card: '12px',
      },
    },
  },
  plugins: [],
};
