/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#00a651',
        'primary-dark': '#008c45',
        'primary-light': '#e6f7ed',
        darkGray: '#1f2937',
        mediumGray: '#6b7280',
        lightGray: '#f3f4f6',
        bgGray: '#f9fafb',
        danger: '#ef4444',
        warning: '#f59e0b',
        success: '#10b981',
        info: '#3b82f6',
      },
    },
  },
  plugins: [],
};
