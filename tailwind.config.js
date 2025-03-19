/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'space-black': '#050505',
        'star-yellow': '#F9D71C',
        'microtech-blue': '#EDF5FA',
        'hurston-orange': '#D2691E',
        'arccorp-red': '#B22222',
        'crusader-gas': '#B0C4DE',
      },
    },
  },
  plugins: [],
} 