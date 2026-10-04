/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#0f172a',
        primary: '#312e81',
        accent: '#7c3aed',
        mint: '#0f766e',
        amber: '#d97706',
        danger: '#dc2626',
        panel: '#f8fafc',
      },
      boxShadow: {
        soft: '0 10px 30px rgba(15, 23, 42, 0.08)',
      },
    },
  },
  plugins: [],
};
