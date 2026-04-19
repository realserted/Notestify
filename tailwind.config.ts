import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['var(--font-serif)', 'ui-serif', 'Georgia', 'serif'],
      },
      colors: {
        cream: {
          50: '#FAF9F5',
          100: '#F4EDE4',
          200: '#EDE6D8',
        },
        coral: {
          500: '#D97757',
          600: '#C15F3C',
        },
        ink: {
          500: '#5C5B57',
          700: '#3D3D3A',
          900: '#1F1E1D',
        },
      },
    },
  },
  plugins: [],
};

export default config;
