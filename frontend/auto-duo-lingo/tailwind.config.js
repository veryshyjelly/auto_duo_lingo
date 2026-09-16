/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        duo: {
          green: '#58CC02',
          'green-dark': '#46A302',
          blue: '#1CB0F6',
          bg: '#F7F7F2',
          surface: '#FFFFFF',
          text: '#3C3C3C',
          muted: '#777777',
          border: '#E5E5E5',
          error: '#FF4B4B',
          warning: '#FFC800',
        },
      },
      minHeight: {
        dvh: '100dvh',
      },
      padding: {
        safe: 'env(safe-area-inset-bottom, 0px)',
        'safe-top': 'env(safe-area-inset-top, 0px)',
      },
    },
  },
  plugins: [],
}
