/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1d2925",
        muted: "#737d77",
        canvas: "#f6f7f2",
        leaf: "#254f3d",
        lime: "#d7f06a",
        line: "#e5e9e1",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Manrope", "Inter", "ui-sans-serif", "sans-serif"],
      },
      boxShadow: {
        card: "0 18px 48px rgba(34, 53, 41, .08)",
      },
    },
  },
  plugins: [],
};
