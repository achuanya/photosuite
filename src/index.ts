/**
 * @file index.ts
 * @description Photosuite 的客户端入口文件，导出了核心初始化函数
 */

import './styles/common.scss'
import type { PhotosuiteOptions } from './types'

/**
 * 初始化 Photosuite
 * 
 * 根据配置项动态加载并初始化各个功能模块（Fancybox, ImageAlts, Exif）
 * 
 * @param opts - Photosuite 配置项
 */
export function photosuite(opts: PhotosuiteOptions) {
  const scope = opts.scope;
  if (!scope) {
    console.warn("Photosuite: 'scope' option is required.");
    return;
  }

  const selector = opts.selector ?? "a[data-fancybox]";
  const gallery = opts.gallery ?? "markdown";
  const enableLightbox = opts.fancybox ?? true;
  const enableAlts = opts.imageAlts ?? true;
  const enableGrid = opts.imageGrid ?? true;
  const enableExif = opts.exif ?? true;

  const start = async () => {
    // 检查 scope 是否存在，若不存在则不加载任何资源
    if (!document.querySelector(scope)) return;

    const tasks: Promise<any>[] = [];

    // 如果启用灯箱功能，动态导入并初始化 fancybox 模块
    if (enableLightbox) {
      tasks.push(
        import("./modules/fancybox").then((m) =>
          m.initFancyboxModule({
            selector,
            scope,
            gallery,
            options: opts.fancyboxOptions,
          })
        )
      );
    }

    // 如果启用标题功能，动态导入并初始化 imageAlts 模块
    if (enableAlts) {
      tasks.push(import("./modules/imageAlts").then((m) => m.enableImageAlts(scope, selector)));
    }

    // 如果启用拼图功能，动态导入并初始化 imageGrid 模块
    if (enableGrid) {
      tasks.push(import("./modules/imageGrid").then((m) => m.enableImageGrid(scope, selector)));
    }

    // 如果启用 EXIF 功能，动态导入并初始化 exif 模块
    if (enableExif) {
      tasks.push(import("./modules/exif").then((m) => m.enableExif(scope, selector)));
    }

    // 并行执行所有初始化任务
    if (tasks.length) Promise.all(tasks).catch(() => { });
  };

  // 确保在 DOM 加载完成后执行
  if (document.readyState === "complete" || document.readyState === "interactive") start();
  else document.addEventListener("DOMContentLoaded", start);
}

// 导出类型定义
export type { PhotosuiteOptions, ImageUrlOptions } from './types';
