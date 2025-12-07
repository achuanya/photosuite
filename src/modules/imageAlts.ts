/**
 * @file imageAlts.ts
 * @description 图片标题模块，负责将图片的 alt 属性作为标题显示
 */

import { processMedia, ensureCaption } from "./dom";

/**
 * 启用图片标题显示功能
 * 
 * 动态加载标题样式，并处理页面上的媒体元素以添加标题
 * 
 * @param selector - 图片选择器
 */
export async function enableImageAlts(selector: string) {
  // 动态导入样式文件
  await import("../styles/image-alts.scss");
  
  // 处理匹配的媒体元素，为每个容器添加标题
  processMedia(selector, (container) => {
    ensureCaption(container);
  });
}
