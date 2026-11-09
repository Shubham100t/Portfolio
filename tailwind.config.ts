import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cosmos: {
          950: '#030712',
          900: '#060B1E',
          800: '#0B1536',
          700: '#14235A',
          cyan: '#38BDF8',
          violet: '#818CF8',
          gold: '#FBBF24',
        },
      },
      fontFamily: {
        mono: ['Courier New', 'Courier', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-subtle': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 20s linear infinite',
      },
    },
  },
  plugins: [],
};
export default config;
