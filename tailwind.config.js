/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        rafamDark: {
          950: '#020306',
          900: '#05070c',
          800: '#0b0f19',
          700: '#111827',
          600: '#1f2937',
        },
        neonBlue: '#00f0ff',
        neonPurple: '#a100ff',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

