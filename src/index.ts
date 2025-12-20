/**
 * @file index.ts
 * @description Photosuite 的主入口文件，导出了核心初始化函数和 Astro 集成函数
 */

import type { PhotosuiteOptions } from './types'
import { imageUrl } from './rehype/imageUrl'

/**
 * 初始化 Photosuite
 * 
 * 根据配置项动态加载并初始化各个功能模块（GLightbox, ImageAlts, Exif）
 * 
 * @param opts - Photosuite 配置项
 */
export function photosuite(opts: PhotosuiteOptions) {
  const scope = opts.scope;
  if (!scope) {
    console.warn("Photosuite: 'scope' option is required.");
    return;
  }

  const selector = opts.selector ?? "a.glightbox";
  const gallery = opts.gallery ?? "markdown";
  const enableLightbox = opts.glightbox ?? true;
  const enableAlts = opts.imageAlts ?? true;
  const enableExif = opts.exif ?? true;

  const start = async () => {
    // 检查 scope 是否存在，若不存在则不加载任何资源
    if (!document.querySelector(scope)) return;

    // 动态加载通用样式
    await import('./styles/common.scss');

    const tasks: Promise<any>[] = [];
    
    // 如果启用灯箱功能，动态导入并初始化 glightbox 模块
    if (enableLightbox) {
      tasks.push(
        import("./modules/glightbox").then((m) =>
          m.initGlightboxModule({
            selector,
            scope,
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
      tasks.push(import("./modules/imageAlts").then((m) => m.enableImageAlts(scope, selector)));
    }

    // 如果启用 EXIF 功能，动态导入并初始化 exif 模块
    if (enableExif) {
      tasks.push(import("./modules/exif").then((m) => m.enableExif(scope, selector)));
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
export default function astroPhotosuite(options: PhotosuiteOptions) {
  return {
    name: "photosuite",
    hooks: {
      "astro:config:setup": ({ injectScript, updateConfig }: any) => {
        // 在 Astro 页面中注入初始化脚本
        // 自动引入样式文件，无需用户手动导入
        const code = 
                    `
                    import 'photosuite/dist/photosuite.css';
                    import { photosuite } from 'photosuite';
                    photosuite(${JSON.stringify(options)});
                    `;

        injectScript("page", code);

        // 如果配置了 imageBase，则自动注入 imageUrl Rehype 插件
        // 该插件用于将 Markdown 中的相对路径图片重写为绝对 URL
        if (options.imageBase) {
          updateConfig({
            markdown: {
              rehypePlugins: [
                [imageUrl, options]
              ]
            }
          });
        }
      },
    },
  };
}

// 导出 Rehype 插件和相关类型
export { imageUrl } from './rehype/imageUrl';
export type { ImageUrlOptions } from './types';