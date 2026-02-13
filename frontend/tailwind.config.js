/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#09637E',
        secondary: '#088395',
        accent: '#7AB2B2',
        light: '#EBF4F6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        safe: 'max(1rem, env(safe-area-inset-left))',
      },
    },
  },
  plugins: [],
  corePlugins: {},
}
