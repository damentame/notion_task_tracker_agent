/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#06b6d4',
          500: '#06b6d4',
        },
        success: {
          DEFAULT: '#10b981',
          500: '#10b981',
        },
        error: {
          DEFAULT: '#f43f5e',
          500: '#f43f5e',
        },
        warning: {
          DEFAULT: '#f59e0b',
          500: '#f59e0b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      backdropBlur: {
        sm: '4px',
      },
    },
  },
  plugins: [],
}
