/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          base: '#7CAA6D',
          lighter: '#A1C493',
          darker: '#5F8A52',
        },
        bg: {
          nav: {
            primary: '#FDFCFA',
            secondary: '#FEFDFB',
          },
          page: '#F8F9FB',
        },
        text: {
          primary: '#3A3A3A',
          secondary: '#6B6B6B',
          tertiary: '#9A9A9A',
          quaternary: '#C4C4C4',
          link: '#7CAA6D',
        },
        success: {
          default: '#C8DFC0',
          light: '#E7F3E3',
        },
        error: {
          default: '#D9B3AD',
          light: '#F5DDD9',
        },
        warning: {
          default: '#EED8B5',
          light: '#F9EDCF',
        },
        function: {
          default: '#7B9CB8',
          light: '#C8DEEF',
        },
        accent: {
          sage: '#9AB89A',
          cyan: '#A3C4C4',
          warmGray: '#B8ADA3',
        }
      },
      fontFamily: {
        base: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 2px 10px rgba(124,170,109,0.06)',
        'moderate': '0 3px 14px rgba(124,170,109,0.10)',
        'pronounced': '0 4px 20px rgba(124,170,109,0.14)',
      }
    },
  },
  plugins: [],
}
