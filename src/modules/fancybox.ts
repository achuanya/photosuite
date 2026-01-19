/**
 * @file fancybox.ts
 * @description Fancybox 灯箱模块，负责初始化和配置图片灯箱查看功能
 */

import { Fancybox } from "@fancyapps/ui/dist/fancybox/";
import "@fancyapps/ui/dist/fancybox/fancybox.css";
import "../styles/fancybox.scss";
import type { FancyboxModuleOptions } from "../types";

/**
 * 确保图片被包裹在带有 data-fancybox 属性的链接中
 * 
 * 如果图片未被链接包裹或链接缺少 data-fancybox 属性，
 * 则创建新的链接或更新现有链接的属性
 * 
 * @param img - 需要处理的图片元素
 * @param gallery - Fancybox 画廊名称
 */
function ensureAnchor(img: Element, gallery: string) {
  // 获取图片的实际源地址，优先使用 currentSrc
  const src = (img as HTMLImageElement).currentSrc || (img as HTMLImageElement).src || "";
  if (!src) return;

  const parent = img.parentElement as HTMLElement | null;

  // 如果父元素已经是链接
  if (parent && parent.tagName.toLowerCase() === "a") {
    // 确保 href 指向正确的图片地址
    if (parent.getAttribute("href") !== src) parent.setAttribute("href", src);
    // 确保有 data-fancybox 属性
    if (!parent.getAttribute("data-fancybox")) parent.setAttribute("data-fancybox", gallery);
    return;
  }

  // 如果没有链接包裹，创建一个新的链接
  const a = document.createElement("a");
  a.href = src;
  a.setAttribute("data-fancybox", gallery);

  // 用新链接包裹图片
  if (parent) {
    parent.replaceChild(a, img);
    a.appendChild(img);
  }
}

/**
 * 同步链接元素的属性
 * 
 * 确保链接的 href 指向图片的实际源地址，并添加 data-fancybox 属性
 * 
 * @param a - 需要同步的链接元素
 * @param gallery - Fancybox 画廊名称
 */
function sync(a: Element, gallery: string) {
  const img = a.querySelector("img") as HTMLImageElement | null;
  if (!img) return;

  // 同步 href 为图片的实际地址
  const finalSrc = img.currentSrc || img.src;
  if (finalSrc && a.getAttribute("href") !== finalSrc) a.setAttribute("href", finalSrc);
  
  // 确保有 data-fancybox 属性
  if (!a.getAttribute("data-fancybox")) a.setAttribute("data-fancybox", gallery);
}

/**
 * 初始化 Fancybox 模块
 * 
 * 处理页面上的图片和链接元素，为它们绑定 Fancybox 灯箱事件
 * 支持鼠标滚轮切换图片、禁用无限循环、自定义工具栏等功能
 * 
 * @param opts - Fancybox 模块配置选项
 */
export async function initFancyboxModule(opts: FancyboxModuleOptions) {
  const selector = opts.selector;
  const scope = opts.scope;
  const gallery = opts.gallery;

  const imgs = new Set<HTMLImageElement>();
  const anchors = new Set<Element>();
  const roots = document.querySelectorAll<HTMLElement>(scope);

  // 收集范围内所有的图片和链接
  roots.forEach((root) => {
    root.querySelectorAll("img").forEach((img) => imgs.add(img as HTMLImageElement));
    root.querySelectorAll(selector).forEach((a) => anchors.add(a));
  });

  // 处理所有图片：确保被链接包裹
  imgs.forEach((el) => {
    const p = el.parentElement;
    const isA = p && p.tagName.toLowerCase() === "a";
    const hasData = isA && (p as HTMLElement).hasAttribute("data-fancybox");
    
    // 如果不是链接或者没有 data-fancybox 属性，则进行处理
    if (!isA || !hasData) ensureAnchor(el, gallery);
    else sync(p as Element, gallery); // 即使是链接，也要同步属性
  });

  // 处理所有直接选中的链接
  anchors.forEach((a) => sync(a, gallery));

  // 关闭可能已存在的实例并重新绑定
  Fancybox.close();
  roots.forEach((root) => {
    // 解绑旧事件
    Fancybox.unbind(root);
    
    // 绑定新事件及配置
    Fancybox.bind(root, selector, Object.assign({
      wheel: "slide" as const, // 支持滚轮切换
      Hash: false as const,    // 禁用 URL哈希
      Html: {
        video: {
          autoplay: false,
        },
      },
      Carousel: {
        Thumbs: false,
        infinite: false, // 禁用无限循环
        Toolbar: {
          display: {
            left: ["counter"],
            right: ["autoplay", "close"] //在此处定义右上角工具栏图标
          },
        },
      },
      on: {
        // 阻止在特定状态下的滚轮默认行为
        "wheel": (fancyboxRef: any, event: WheelEvent) => {
          if (fancyboxRef.getState() === 2) {
            event.preventDefault();
          }
        },
      },
    }, opts.options || {}));
  });
}