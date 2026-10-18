/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Be Vietnam Pro"', '"Noto Sans KR"', 'system-ui', 'sans-serif'],
        ko: ['"Noto Sans KR"', '"Be Vietnam Pro"', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eef4ff', 100: '#dae6ff', 200: '#bcd3ff', 300: '#8eb6ff', 400: '#598dff',
          500: '#3366ff', 600: '#1f47f5', 700: '#1a36e1', 800: '#1c2fb6', 900: '#1d2e8f',
        },
      },
      keyframes: {
        wave: { '0%,100%': { transform: 'scaleY(0.35)' }, '50%': { transform: 'scaleY(1)' } },
        pop: { '0%': { transform: 'scale(0.9)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        shake: { '0%,100%': { transform: 'translateX(0)' }, '25%': { transform: 'translateX(-6px)' }, '75%': { transform: 'translateX(6px)' } },
      },
      animation: {
        wave: 'wave 0.9s ease-in-out infinite',
        pop: 'pop 0.25s ease-out',
        shake: 'shake 0.3s ease-in-out',
      },
    },
  },
  plugins: [],
};
