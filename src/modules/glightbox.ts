/**
 * @file glightbox.ts
 * @description GLightbox 模块，负责集成 GLightbox 库以实现灯箱效果，包括 DOM 结构的包装、资源的动态加载和实例的初始化
 * @link https://github.com/achuanya/glightbox
 */

import type { GlightboxModuleOptions } from "../types";

/**
 * 包装图片元素
 * 
 * 将普通的 img 元素包装在 a.glightbox 链接中，使其能够被 GLightbox 识别和处理
 * 
 * @param img - 需要包装的图片元素
 * @param gallery - 画廊分组名称
 */
function wrap(img: Element, gallery: string) {
  const src = (img as HTMLImageElement).currentSrc || (img as HTMLImageElement).src || "";
  // 如果没有图片源，则跳过
  if (!src) return;

  const altText = String(img.getAttribute("alt") || "").trim();
  const a = document.createElement("a");
  a.href = src;
  a.className = "glightbox";
  a.dataset.gallery = gallery;
  if (altText) a.dataset.title = altText;

  const parent = img.parentElement as HTMLElement;
  // 替换原 img 元素为包装后的 a 元素
  parent.replaceChild(a, img);
  // 将 img 重新加入到 a 元素中
  a.appendChild(img);
}

/**
 * 同步链接属性
 * 
 * 确保已有的 a.glightbox 元素的 href 和 dataset 属性与内部图片的属性保持一致
 * 
 * @param a - 链接元素
 * @param gallery - 画廊分组名称
 */
function sync(a: Element, gallery: string) {
  const img = a.querySelector("img") as HTMLImageElement | null;
  if (!img) return;

  // 确保 href 指向当前图片源（处理响应式图片 currentSrc）
  const finalSrc = img.currentSrc || img.src;
  if (finalSrc && a.getAttribute("href") !== finalSrc) a.setAttribute("href", finalSrc);

  // 同步 alt 文本到 dataset.title
  const alt = img.getAttribute("alt");
  if (alt && !(a as HTMLElement).dataset.title) (a as HTMLElement).dataset.title = alt;

  // 设置画廊分组
  if (!(a as HTMLElement).dataset.gallery) (a as HTMLElement).dataset.gallery = gallery;
}

/**
 * 动态加载 CSS 文件
 * 
 * @param href - CSS 文件的 URL
 */
function loadCss(href: string) {
  if (!href) return;
  // 防止重复加载
  if (document.querySelector(`link[href="${href}"]`)) return;
  
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

/**
 * 动态加载 JS 文件
 * 
 * @param src - JS 文件的 URL
 * @returns Promise<void> - 加载完成后的 Promise
 */
function loadJs(src: string): Promise<void> {
  return new Promise((resolve) => {
    if (!src) return resolve();
    // 如果全局对象中已存在 GLightbox，则直接返回
    if (typeof (window as any).GLightbox === "function") return resolve();
    
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    document.head.appendChild(s);
  });
}

/**
 * 初始化 GLightbox 模块
 * 
 * 处理页面中的图片，加载必要的资源，并实例化 GLightbox
 * 
 * @param opts - GLightbox 模块配置项
 */
export async function initGlightboxModule(opts: GlightboxModuleOptions) {
  const selector = opts.selector;
  const scope = opts.scope;
  const gallery = opts.gallery;
  const cssUrl = opts.cssUrl || "https://cos.lhasa.icu/dist/glightbox/glightbox.min.css";
  const jsUrl = opts.jsUrl || "https://cos.lhasa.icu/dist/glightbox/glightbox.min.js";

  // 1. 处理所有图片元素，如果未被包装则进行包装
  const imgs = new Set<HTMLImageElement>();
  const anchors = new Set<Element>();
  const roots = document.querySelectorAll(scope);

  roots.forEach((root) => {
    root.querySelectorAll("img").forEach((img) => imgs.add(img as HTMLImageElement));
    root.querySelectorAll(selector).forEach((a) => anchors.add(a));
  });

  imgs.forEach((el) => {
    const p = el.parentElement;
    const isA = p && p.tagName.toLowerCase() === "a";
    const hasClass = isA && (p as HTMLElement).classList.contains("glightbox");
    // 如果不是被 a.glightbox 包裹的图片，则进行包装
    if (!isA || !hasClass) wrap(el, gallery);
  });

  // 2. 同步所有匹配选择器的链接属性
  anchors.forEach((a) => sync(a, gallery));

  // 3. 加载资源
  loadCss(cssUrl);
  await loadJs(jsUrl);

  // 4. 运行 GLightbox 实例
  const run = () => {
    const anyGL = (window as any).GLightbox;
    if (typeof anyGL === "function") {
      const inst = (window as any).__glightboxInstance;
      // 如果已存在实例，先销毁，防止内存泄漏或冲突
      if (inst && inst.destroy) inst.destroy();
      
      const baseOpts = Object.assign({}, opts.options || {}, { selector });
      // 创建新实例并保存到全局变量
      (window as any).__glightboxInstance = anyGL(baseOpts);
    }
  };
  run();
}