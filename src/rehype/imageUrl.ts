/**
 * @file imageUrl.ts
 * @description Rehype 插件，用于根据配置自动补全图片 URL
 */

import type { ImageUrlOptions } from "../types";

// 定义简单的 AST 节点类型，避免引入 hast 依赖
interface Node {
  type: string;
  tagName?: string;
  properties?: Record<string, any>;
  children?: Node[];
  value?: string;
  [key: string]: any;
}

/**
 * 路径拼接工具
 * 
 * 拼接多个路径片段，确保中间有且仅有一个斜杠
 * 
 * @param parts - 路径片段
 * @returns 拼接后的路径
 */
const join = (...parts: string[]): string => {
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];

  const partA = parts[0];
  const partB = parts[1];
  
  // 处理 partA 结尾的斜杠
  const cleanA = partA.endsWith("/") ? partA.slice(0, -1) : partA;
  // 处理 partB 开头的斜杠
  const cleanB = partB.startsWith("/") ? partB.slice(1) : partB;
  
  const result = `${cleanA}/${cleanB}`;
  
  // 递归处理剩余部分
  if (parts.length > 2) {
    return join(result, ...parts.slice(2));
  }
  
  return result;
};

/**
 * 短链接判断工具
 * 
 * 判断给定的字符串是否为需要在处理的"短链接"
 * 忽略绝对 URL、绝对路径和相对路径
 * 
 * @param s - 图片 src 字符串
 * @returns 是否为短链接
 */
const isShort = (s: string): boolean => {
  if (!s) return false;
  // 忽略绝对 URL (http://, https://)
  if (/^https?:\/\//i.test(s)) return false;
  // 忽略绝对路径
  if (s.startsWith("/")) return false;
  // 忽略相对路径
  if (s.startsWith("./") || s.startsWith("../")) return false;
  
  return true;
};

/**
 * ImageUrl Rehype 插件
 * 
 * 遍历 HTML AST，查找 img 标签，并根据配置补全其 src 属性
 * 
 * @param options - 插件配置项
 * @returns Transformer 函数
 */
export function imageUrl(options: ImageUrlOptions = {}) {
  const { imageBase, imageDir = "imageDir", fileDir = false } = options;

  return (tree: Node, file: any) => {
    // 提取 Frontmatter 数据
    const fm = file?.data?.astro?.frontmatter || {};
    // 获取 Frontmatter 中指定的目录
    const dirFm = fm[imageDir] || "";
    
    // 获取当前处理文件的文件名（用于 fileDir 模式）
    const filePath = file?.path || file?.history?.[0] || "";
    // 提取文件名（去除路径和扩展名）
    // Windows 路径可能包含反斜杠，Unix 路径使用斜杠，这里统一处理
    const fileName = filePath.split(/[\\/]/).pop()?.split('.').shift() || "";
    
    // 确定最终使用的子目录
    // 如果启用 fileDir，则优先使用文件名；否则使用 Frontmatter 中的配置
    const dir = fileDir ? fileName : dirFm;

    // 递归遍历 AST 的辅助函数
    const visit = (node: Node) => {
      if (!node) return;
      
      // 找到 img 标签
      if (node.type === 'element' && node.tagName === 'img') {
        const src = node.properties?.src || "";
        
        // 核心重写逻辑：如果有 imageBase 且 src 是短链接，则进行重写
        if (imageBase && isShort(src)) {
          // 根据是否有子目录来决定拼接方式
          const newSrc = dir ? join(imageBase, dir, src) : join(imageBase, src);
          if (node.properties) {
            node.properties.src = newSrc;
          }
        }
      }

      // 递归遍历子节点
      if (node.children && node.children.length) {
        node.children.forEach(visit);
      }
    };

    visit(tree);
  };
}