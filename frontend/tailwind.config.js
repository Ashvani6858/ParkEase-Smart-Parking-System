/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          800: '#1a365d',
          900: '#0f172a',
        },
        teal: {
          500: '#14b8a6',
          600: '#0d9488',
        }
      }
    },
  },
  plugins: [],
}
