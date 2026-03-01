/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0086CE",
        dark: "#012160",
        light: "#F3F4F6",
        success: "#00A200",
        danger: "#F13137",
        carbon: "#1A1A1A",
      },
      fontFamily: {
        inter: ["Inter", "sans-serif"],
        cormorant: ["Cormorant Garamond", "serif"],
      },
      keyframes: {
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "spin-slow-reverse": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(-360deg)" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.5", transform: "scale(0.8)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "cursor-blink": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        "float-card": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "magnetic-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(0,134,206,0.4)" },
          "70%": { boxShadow: "0 0 0 16px rgba(0,134,206,0)" },
        },
      },
      animation: {
        "spin-slow": "spin-slow 6s linear infinite",
        "spin-slow-reverse": "spin-slow-reverse 4.5s linear infinite",
        "pulse-dot": "pulse-dot 1.5s ease-in-out infinite",
        "fade-up": "fade-up 0.8s ease forwards",
        "cursor-blink": "cursor-blink 0.85s step-end infinite",
        "float-card": "float-card 4s ease-in-out infinite",
        "magnetic-pulse": "magnetic-pulse 2s ease infinite",
      },
    },
  },
  plugins: [],
}
