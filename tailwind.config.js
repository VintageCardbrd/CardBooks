/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        paper: '#FBFBF8',
        ink: '#19222E',
        muted: '#6A7280',
        line: '#E5E0D4',
        stitch: '#B23A2E',
        good: '#2F6B4F',
        accent: '#C45C26',
      },
    },
  },
  plugins: [],
};
