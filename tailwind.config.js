/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': {
          '50': '#e6f5ef',
          '100': '#ccead0',
          '200': '#99d6a2',
          '300': '#66c173',
          '400': '#33ad45',
          '500': '#008751', // Nigerian green
          '600': '#006c41',
          '700': '#005131',
          '800': '#003720',
          '900': '#001c10',
        },
        'secondary': '#FFFFFF', // Nigerian white
        'accent': {
          '500': '#FF7A00', // Orange accent
        },
        'success': {
          '500': '#10B981', // Green for success states
        },
        'warning': {
          '500': '#F59E0B', // Yellow for warning states
        },
        'error': {
          '500': '#EF4444', // Red for error states
        },
      },
      fontFamily: {
        'sans': ['Roboto', 'sans-serif'],
        'display': ['Montserrat', 'sans-serif'],
      },
      screens: {
        'xs': '375px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
    },
  },
  plugins: [],
}