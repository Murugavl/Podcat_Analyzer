/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Semantic tokens — resolved from CSS variables so they follow the
        // active light / dark theme. Values are space-separated RGB channels.
        canvas: 'rgb(var(--canvas) / <alpha-value>)',
        panel: 'rgb(var(--panel) / <alpha-value>)',
        inset: 'rgb(var(--inset) / <alpha-value>)',
        hairline: 'rgb(var(--hairline) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        'ink-soft': 'rgb(var(--ink-soft) / <alpha-value>)',
        'ink-faint': 'rgb(var(--ink-faint) / <alpha-value>)',
        overlay: 'rgb(var(--overlay) / <alpha-value>)',
        // Accent stays indigo; shade 400 tracks a variable so it darkens
        // enough for light backgrounds without touching every className.
        indigo: {
          400: 'rgb(var(--accent) / <alpha-value>)',
          500: '#6366F1',
          600: '#4F46E5',
        },
        zinc: {
          950: '#09090B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
