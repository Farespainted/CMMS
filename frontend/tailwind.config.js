/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#dbe7fe',
          200: '#bfd4fe',
          300: '#93b6fd',
          400: '#608efa',
          500: '#3b6df5',
          600: '#264fea',
          700: '#1f3cd6',
          800: '#2033ad',
          900: '#1f2f89',
        },
      },
    },
  },
  plugins: [],
};
