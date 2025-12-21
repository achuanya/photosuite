/**
 * @file vite.config.ts
 * @description Vite 配置文件，用于配置库模式打包
 */

import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: path.resolve(__dirname, 'src/index.ts'),
        integration: path.resolve(__dirname, 'src/integration.ts')
      },
      name: 'photosuite',
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        // 为了兼容旧的引用方式，index 入口生成 photosuite.es.js / photosuite.cjs
        // integration 入口生成 photosuite.integration.js / photosuite.integration.cjs
        const ext = format === 'es' ? 'js' : 'cjs';
        if (entryName === 'index') {
          // 为了保持向后兼容（虽然 package.json 的 main/module 可以调整）
          // 使用更清晰的命名：photosuite.js (esm) 和 photosuite.cjs (cjs)
          // 注意：Vite 默认库模式如果只有 es 和 cjs，单入口会是 name.js 和 name.cjs
          // 多入口模式下，format 'es' 通常生成 [name].js，format 'cjs' 生成 [name].cjs
          // 我们这里显式指定一下
          return format === 'es' ? 'photosuite.es.js' : 'photosuite.cjs.js';
        }
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
