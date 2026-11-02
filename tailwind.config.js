/** Paleta de Invenxio: azul marino + ámbar */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        gx: { bg: '#0a101d', bar: '#0d1424', card: '#111a2c', card2: '#16213a', line: '#1f2b42', mut: '#8b97ad', amb: '#f59e0b', ok: '#34d399', bad: '#f87171', warn: '#fbbf24' },
      },
      fontFamily: { sans: ['"DM Sans"', 'system-ui', 'sans-serif'], mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'] },
    },
  },
  plugins: [],
}
