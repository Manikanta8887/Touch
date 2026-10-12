/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        secondary: "var(--color-secondary)",
        darkPurple: "var(--color-darkPurple)",
        navy: "var(--color-navy)",
        background: "var(--color-background)",
        card: "var(--color-card)",
        border: "var(--color-border)",
        text: "var(--color-text)",
        black: "var(--color-black)",
      },
    },
  },
  plugins: [],
};
