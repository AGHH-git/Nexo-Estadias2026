// ARCHIVO: frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        utcv: {
          primary: 'var(--color-primary)',
          'primary-dark': 'var(--color-primary-dark)',
          'primary-light': 'var(--color-primary-light)',
          accent: 'var(--color-accent)',
          'accent-dark': 'var(--color-accent-dark)',
          'accent-light': 'var(--color-accent-light)',
          success: 'var(--color-success)',
          danger: 'var(--color-danger)',
          warning: 'var(--color-warning)',
          info: 'var(--color-info)',
        }
      },
      borderRadius: {
        utcv: 'var(--border-radius)',
      },
      boxShadow: {
        utcv: 'var(--shadow-utcv)',
      }
    },
  },
  plugins: [],
}
