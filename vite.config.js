
import { defineConfig } from 'vite'
import optimizer from '@yworks/optimizer/rollup-plugin'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const plugins = []
  if (mode === 'production') {
    plugins.push(
      optimizer({
        logLevel: 'info',
        shouldOptimize({ id }) {
          return id.includes('demo-utils') || id.includes('demo-resources') || !id.includes('node_modules')
        },
      }),
    )
  }
  return {
    base: './',
    plugins,
    resolve: {
      preserveSymlinks: true
    },
    build: {
      target: 'esnext'
    }
  }
})
