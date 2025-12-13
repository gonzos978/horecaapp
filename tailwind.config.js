/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: "#2563eb", // blue-600
        "brand-strong": "#1e40af", // blue-800
        "brand-medium": "#93c5fd", // blue-300
      },
      borderRadius: {
        base: "0.375rem", // 6px
      },
      boxShadow: {
        xs: "0 1px 2px rgba(0,0,0,0.05)",
      },
    },
  },
  plugins: [],
};
