/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#1E3A5F',
        cyan: {
          DEFAULT: '#7BC4D9',
          glow: '#A8E3F5',
        },
        amber: {
          DEFAULT: '#F5B946',
        },
        coral: {
          DEFAULT: '#E86A5C',
        },
        sand: '#E8DFC9',
        'warm-top': '#F4F3EF',
        'warm-bot': '#DDD6C4',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      letterSpacing: {
        tight: '-0.02em',
        wide: '0.14em',
      },
      borderRadius: {
        '4xl': '32px',
      },
      transitionTimingFunction: {
        glass: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
      keyframes: {
        'float-y': {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'pulse-cyan': {
          '0%,100%': {
            transform: 'scale(1)',
            opacity: '1',
            filter: 'drop-shadow(0 0 12px rgba(168,227,245,0.7))',
          },
          '50%': {
            transform: 'scale(1.05)',
            opacity: '0.85',
            filter: 'drop-shadow(0 0 28px rgba(168,227,245,1))',
          },
        },
        'pulse-amber': {
          '0%,100%': {
            boxShadow:
              '0 0 24px rgba(245,185,70,0.5), 0 0 0 1px rgba(245,185,70,0.4) inset',
          },
          '50%': {
            boxShadow:
              '0 0 40px rgba(245,185,70,0.85), 0 0 0 1px rgba(245,185,70,0.7) inset',
          },
        },
        'pulse-dot': {
          '0%,100%': { opacity: '0.4', transform: 'scale(0.8)' },
          '50%': { opacity: '1', transform: 'scale(1.15)' },
        },
        typing: {
          '0%,60%,100%': { opacity: '0.3', transform: 'translateY(0)' },
          '30%': { opacity: '1', transform: 'translateY(-3px)' },
        },
        fall: {
          '0%': { transform: 'translateY(-20px) rotate(0deg)', opacity: '0' },
          '15%': { opacity: '1' },
          '100%': { transform: 'translateY(900px) rotate(720deg)', opacity: '0' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        'draw-ring': {
          to: { strokeDashoffset: '0' },
        },
      },
      animation: {
        'float-y': 'float-y 4s ease-in-out infinite',
        'pulse-cyan': 'pulse-cyan 2s ease-in-out infinite',
        'pulse-amber': 'pulse-amber 1.8s ease-in-out infinite',
        'pulse-dot': 'pulse-dot 1.4s ease-in-out infinite',
        typing: 'typing 1.2s ease-in-out infinite',
        'fade-in': 'fade-in 0.45s cubic-bezier(0.2,0.8,0.2,1)',
        'slide-up': 'slide-up 0.4s cubic-bezier(0.2,0.8,0.2,1)',
        'draw-ring': 'draw-ring 2s linear forwards',
      },
    },
  },
  plugins: [],
};
