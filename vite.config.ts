import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'photosuite',
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'photosuite.es' : 'photosuite.cjs'),
    },
    rollupOptions: {
      external: [],
    },
  },
})
