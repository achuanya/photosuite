/**
 * @file index.ts
 * @description Photosuite 的主入口文件，导出了核心初始化函数和 Astro 集成函数
 */

import './styles/common.scss'
import type { PhotosuiteOptions } from './types'

/**
 * 初始化 Photosuite
 * 
 * 根据配置项动态加载并初始化各个功能模块（GLightbox, ImageAlts, Exif）
 * 
 * @param opts - Photosuite 配置项
 */
export function photosuite(opts: PhotosuiteOptions = {}) {
  const selector = opts.selector ?? "a.glightbox";
  const gallery = opts.gallery ?? "markdown";
  const enableLightbox = opts.glightbox ?? true;
  const enableAlts = opts.imageAlts ?? true;
  const enableExif = opts.exif ?? true;

  const start = () => {
    const tasks: Promise<any>[] = [];
    
    // 如果启用灯箱功能，动态导入并初始化 glightbox 模块
    if (enableLightbox) {
      tasks.push(
        import("./modules/glightbox").then((m) =>
          m.initGlightboxModule({
            selector,
            gallery,
            options: opts.glightboxOptions,
            cssUrl: opts.glightboxCssUrl,
            jsUrl: opts.glightboxJsUrl,
          })
        )
      );
    }

    // 如果启用标题功能，动态导入并初始化 imageAlts 模块
    if (enableAlts) {
      tasks.push(import("./modules/imageAlts").then((m) => m.enableImageAlts(selector)));
    }

    // 如果启用 EXIF 功能，动态导入并初始化 exif 模块
    if (enableExif) {
      tasks.push(import("./modules/exif").then((m) => m.enableExif(selector)));
    }

    // 并行执行所有初始化任务
    if (tasks.length) Promise.all(tasks).catch(() => {});
  };

  // 确保在 DOM 加载完成后执行
  if (document.readyState === "complete" || document.readyState === "interactive") start();
  else document.addEventListener("DOMContentLoaded", start);
}

/**
 * Astro 集成默认导出
 * 
 * 提供给 Astro 框架使用的集成配置。
 * 
 * @param options - Photosuite 配置项
 * @returns Astro 集成对象
 */
export default function astroPhotosuite(options: PhotosuiteOptions = {}) {
  return {
    name: "photosuite",
    hooks: {
      "astro:config:setup": ({ injectScript }: any) => {
        // 在 Astro 页面中注入初始化脚本
        const code = `import { photosuite } from 'photosuite';
photosuite(${JSON.stringify(options)});`;
        injectScript("page", code);
      },
    },
  };
}