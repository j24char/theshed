/** @type {import('tailwindcss').Config} */
module.exports = {
  // Add "nativewind/preset" here - this is vital for v4
  presets: [require("nativewind/preset")],
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: '#4B0082',
          gold: '#D4AF37',
          black: '#000000',
          charcoal: '#1A1A1A',
        },
      },
    },
  },
  plugins: [],
};