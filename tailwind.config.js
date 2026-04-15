/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ops: {
          bg: '#0A0C10',
          surface: '#161B22',
          border: '#30363D',
          accent: '#238636',
          'accent-hover': '#2ea043',
          muted: '#8B949E',
          text: '#E6EDF3',
          warning: '#D29922',
          danger: '#DA3633',
          info: '#388BFD',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
