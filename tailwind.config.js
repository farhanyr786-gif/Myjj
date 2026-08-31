/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hing: {
          bg: '#0a0e1a',
          panel: '#111827',
          border: '#1e293b',
          accent: '#f59e0b',
          accentLight: '#fbbf24',
          green: '#10b981',
          red: '#ef4444',
          blue: '#3b82f6',
          purple: '#8b5cf6',
          text: '#e2e8f0',
          muted: '#94a3b8',
          keyword: '#f59e0b',
          string: '#34d399',
          number: '#60a5fa',
          comment: '#6b7280',
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
