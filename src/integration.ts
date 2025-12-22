/**
 * @file integration.ts
 * @description Astro 集成入口，提供给 Astro 配置文件使用
 */

import type { PhotosuiteOptions } from './types'
// 导入 Remark 插件版本的 imageUrl
import { imageUrl } from './remark/imageUrl'
import { exiftoolVendored } from './rehype/exiftoolVendored'

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
                    import { photosuite } from 'photosuite/client';
                    const __opts = ${JSON.stringify(options)};
                    const __run = () => photosuite(__opts);
                    __run();
                    document.addEventListener('astro:page-load', __run);
                    `;

        injectScript("page", code);

        const rehypePlugins: any[] = [];
        const remarkPlugins: any[] = [];

        // 自动注入 imageUrl Remark 插件
        // 该插件用于将 Markdown 中的相对路径图片重写为绝对 URL
        // 插件内部会根据 imageBase、fileDir 或 frontmatter 决定是否处理
        // 注意：这必须是 Remark 插件，以便在 Astro 尝试解析图片资源之前修正路径
        remarkPlugins.push([imageUrl, options]);

        // 如果启用 EXIF 功能，注入 exiftoolVendored Rehype 插件
        if (options.exif !== false) {
          rehypePlugins.push([exiftoolVendored, options]);
        }

        const configUpdate: any = {
          markdown: {}
        };

        if (rehypePlugins.length > 0) {
          configUpdate.markdown.rehypePlugins = rehypePlugins;
        }

        if (remarkPlugins.length > 0) {
          configUpdate.markdown.remarkPlugins = remarkPlugins;
        }

        if (Object.keys(configUpdate.markdown).length > 0) {
          updateConfig(configUpdate);
        }
      },
    },
  };
}

/**
 * 允许使用 import { photosuite } from 'photosuite' 语法
 */
export const photosuite = astroPhotosuite;

// 导出插件
export { imageUrl } from './remark/imageUrl';
export { exiftoolVendored } from './rehype/exiftoolVendored';

// 导出类型定义
export type { PhotosuiteOptions, ImageUrlOptions } from './types';
