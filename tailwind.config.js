/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        natal: {
          bg: '#0b1320',
          panel: '#101c33',
          gold: '#d4af37',
          green: '#0f5132',
          red: '#b91c1c'
        }
      },
      fontSize: {
        'tv-xl': ['5rem', { lineHeight: '1.1' }],
        'tv-lg': ['3.25rem', { lineHeight: '1.15' }]
      }
    }
  },
  plugins: []
}
