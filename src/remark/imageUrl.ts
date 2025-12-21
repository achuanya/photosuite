/**
 * @file imageUrl.ts
 * @description Remark 插件，用于根据配置自动补全图片 URL
 */

import type { ImageUrlOptions } from "../types";

// 定义简单的 AST 节点类型，避免引入 mdast 依赖
interface Node {
  type: string;
  url?: string;
  children?: Node[];
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
const join = (...parts: (string | undefined | null)[]): string => {
  // 过滤掉无效部分，但保留空字符串（如果它是有意义的，但在路径拼接中空字符串通常被忽略）
  const validParts = parts.filter((p): p is string => typeof p === 'string' && p !== '');
  
  if (validParts.length === 0) return "";
  if (validParts.length === 1) return validParts[0];

  const partA = validParts[0];
  const partB = validParts[1];
  
  // 处理 partA 结尾的斜杠
  const cleanA = partA.endsWith("/") ? partA.slice(0, -1) : partA;
  // 处理 partB 开头的斜杠
  const cleanB = partB.startsWith("/") ? partB.slice(1) : partB;
  
  const result = `${cleanA}/${cleanB}`;
  
  // 递归处理剩余部分
  if (validParts.length > 2) {
    return join(result, ...validParts.slice(2));
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
 * ImageUrl Remark 插件
 * 
 * 遍历 Markdown AST，查找 image 节点，并根据配置补全其 url 属性
 * 
 * @param options - 插件配置项
 * @returns Transformer 函数
 */
export function imageUrl(options: ImageUrlOptions = {}) {
  const { imageBase, imageDir = "imageDir", fileDir = false } = options;

  return (tree: Node, file: any) => {
    // 提取 Frontmatter 数据
    // 注意：在 Remark 阶段，frontmatter 可能在 file.data.astro.frontmatter
    // 或者通过 remark-frontmatter 插件解析在 tree 的 children 中（type: yaml）
    // 但 Astro 通常会处理好并放在 file.data 中
    const fm = file?.data?.astro?.frontmatter || file?.data?.frontmatter || {};
    
    // 获取 Frontmatter 中指定的目录
    const dirFm = fm[imageDir] || "";
    
    // 获取当前处理文件的文件名（用于 fileDir 模式）
    const filePath = file?.path || file?.history?.[0] || "";
    // 提取文件名（去除路径和扩展名）
    const fileName = filePath.split(/[\\/]/).pop()?.split('.').shift() || "";
    
    // 确定最终使用的子目录
    const dir = fileDir ? fileName : dirFm;

    // 递归遍历 AST 的辅助函数
    const visit = (node: Node) => {
      if (!node) return;
      
      // 找到 image 节点
      if (node.type === 'image') {
        const src = node.url || "";
        
        // 核心重写逻辑：如果有 imageBase 或 dir 且 src 是短链接，则进行重写
        if ((imageBase || dir) && isShort(src)) {
          // 拼接路径
          const newSrc = join(imageBase, dir, src);
          node.url = newSrc;
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
