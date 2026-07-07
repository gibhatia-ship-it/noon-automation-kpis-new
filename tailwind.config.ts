import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        noon: {
          yellow: '#D4E600',
          'yellow-light': '#E8F200',
          'yellow-dark': '#B8CC00',
          'yellow-muted': 'rgba(212, 230, 0, 0.12)',
          red: '#DA291C',
          'red-light': '#F03A2B',
          'red-dark': '#B5220F',
          'red-muted': 'rgba(218, 41, 28, 0.1)',
        },
        surface: {
          0: '#FFFFFF',
          1: '#F8F9FA',
          2: '#F1F3F5',
          3: '#E9ECEF',
        },
        ink: {
          primary: '#0D0D0D',
          secondary: '#4B5563',
          tertiary: '#9CA3AF',
          disabled: '#D1D5DB',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 12px 0 rgba(0,0,0,0.08), 0 2px 4px -1px rgba(0,0,0,0.06)',
        'card-lg': '0 8px 24px 0 rgba(0,0,0,0.08)',
      },
      animation: {
        'spin-slow': 'spin 2s linear infinite',
        'pulse-soft': 'pulse 3s ease-in-out infinite',
        shimmer: 'shimmer 1.5s infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
