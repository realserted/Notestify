import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Was: serif: ['var(--font-serif)'] (Fraunces)
        display: ['var(--font-display)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // Kept so existing `font-serif` classes don't fall back to Times while you migrate.
        serif: ['var(--font-display)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        paper: {
          50: '#FFFBF4',  // card / surface
          100: '#F7E9D6', // page canvas
          200: '#EFE0CB', // tracks, subtle fills
          300: '#E3CFB2', // soft borders
        },
        espresso: {
          500: '#3A2112', // primary fill
          700: '#2E1A0E', // ink: borders, headings
          900: '#1A0F08', // darkest / dark-mode canvas
        },
        citrus: {
          300: '#F6C453',
          500: '#F2A61E', // accent
          600: '#D98E12',
        },
        caramel: { 500: '#B0703A' },                // 3rd landing strip, AI Tutor nav dot
        clay: { 500: '#C4452A', 300: '#E0705A' },   // errors, "Again", wrong answers
        olive: { 500: '#5C7A3A', 300: '#8FA05B' },  // success, correct answers
        bark: {
          300: '#A98D71', // muted text on dark
          500: '#8A6E55', // muted text on light
          700: '#5A4331', // body text on light
        },
        night: {
          600: '#4A3421', // dark border
          700: '#2E1D0E', // dark raised
          800: '#241609', // dark surface
          900: '#1A0F08', // dark canvas
        },
        foam: { 50: '#F5E7D5' }, // text on dark

        // ── Legacy aliases ──────────────────────────────────────────────
        // Point the OLD token names at the NEW palette. The entire app
        // recolours from this block alone, before a single component is
        // touched. Delete these once every className has been migrated.
        cream: { 50: '#F7E9D6', 100: '#EFE0CB', 200: '#E3CFB2' },
        coral: { 500: '#F2A61E', 600: '#D98E12' },
        ink: { 500: '#8A6E55', 700: '#5A4331', 900: '#2E1A0E' },
      },
      // Not in Tailwind's default scale, but referenced by the new primitives
      // (Button size="lg" uses h-13, Sidebar uses md:w-61).
      spacing: { 13: '3.25rem', 61: '15.25rem' },
      borderRadius: { pop: '16px', 'pop-lg': '20px' },
      boxShadow: {
        // Hard offset, zero blur — the defining move of this direction.
        'pop-sm': '3px 3px 0 #2E1A0E',
        pop: '4px 4px 0 #2E1A0E',
        'pop-lg': '6px 6px 0 #2E1A0E',
        'pop-dark': '4px 4px 0 #0E0805',
      },
      borderWidth: { 3: '3px' },
    },
  },
  plugins: [],
};

export default config;
