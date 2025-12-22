/**
 * @file vite.config.ts
 * @description Vite 配置文件，用于配置库模式打包
 */

import { defineConfig } from 'vite'
import path from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
    }),
  ],
  build: {
    lib: {
      entry: {
        index: path.resolve(__dirname, 'src/index.ts'),
        integration: path.resolve(__dirname, 'src/integration.ts')
      },
      name: 'photosuite',
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        const ext = format === 'es' ? 'js' : 'cjs';
        
        // 主入口特殊处理：保持 photosuite.es.js / photosuite.cjs.js 的命名格式
        if (entryName === 'index') {
          return format === 'es' ? 'photosuite.es.js' : 'photosuite.cjs.js';
        }
        
        // 其他入口（如 integration）使用标准命名格式
        return `photosuite.${entryName}.${ext}`;
      },
    },
    rollupOptions: {
      external: [
        'exiftool-vendored',
        'node:fs',
        'node:fs/promises',
        'node:path',
        'node:http',
        'node:https',
        'node:os',
        'node:url',
        'node:child_process'
      ],
    },
  },
})
