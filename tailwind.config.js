/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0b1c30',
          800: '#162b46',
          700: '#213b5e',
        },
        primary: {
          DEFAULT: '#059669',
          dark: '#047857',
          light: '#10b981',
          bg: '#ecfdf5',
        },
        surface: '#f8fafc',
        card: '#ffffff',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'sans-serif'],
      }
    }
  },
  plugins: []
};
