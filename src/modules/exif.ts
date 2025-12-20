/**
 * @file exif.ts
 * @description EXIF 模块，负责启用和管理图片的 EXIF 信息显示功能
 */

import { processMedia, ensureExif } from "./dom";

/**
 * 启用 EXIF 显示功能
 * 
 * 动态加载 EXIF 样式，并处理页面上的媒体元素以添加 EXIF 显示条
 * 
 * @param selector - 图片选择器
 */
export async function enableExif(scope: string, selector: string) {
  // 动态导入样式文件
  await import("../styles/exif.scss");
  
  // 处理匹配的媒体元素，为每个容器添加 EXIF 条
  processMedia(scope, selector, (container) => {
    ensureExif(container);
  });
}

