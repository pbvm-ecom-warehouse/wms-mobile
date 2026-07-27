/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#ececf1',
        surface: '#ffffff',
        'surface-muted': '#f5f6f8',
        primary: '#0878f9',
        'primary-soft': '#eaf3ff',
        ink: '#101114',
        muted: '#6c7078',
        border: '#e4e5e9',
        success: '#16875f',
        'success-soft': '#e7f7f0',
        warning: '#a66300',
        'warning-soft': '#fff4dc',
        danger: '#c83a3a',
        'danger-soft': '#ffebeb',
      },
      borderRadius: {
        card: '24px',
      },
    },
  },
  plugins: [],
};
