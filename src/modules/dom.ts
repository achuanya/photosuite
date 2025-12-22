/**
 * @file dom.ts
 * @description 提供 DOM 操作相关的辅助函数，用于处理图片容器、标题和 EXIF 元素的创建与管理
 */

/**
 * 确保元素被包裹在 photosuite-item 容器中
 * 
 * 如果目标元素（通常是 img 或 a.glightbox）尚未被 photosuite-item 包裹
 * 则创建一个新的 div.photosuite-item 并将目标元素移动到其中
 * 
 * @param el - 需要检查或包裹的 DOM 元素
 * @returns 包含该元素的 HTMLElement 容器 (.photosuite-item)
 */
export function ensurePhotosuiteContainer(el: Element): HTMLElement {
  const p = el.parentElement as HTMLElement | null;
  // 如果没有父元素，无法进行替换操作，直接返回原元素（作为 fallback）
  if (!p) return el as HTMLElement;

  let target: Element = el;

  // 如果元素是 img，且被 a.glightbox 包裹，则将整个链接作为目标进行包裹
  // 这样可以保持链接的点击行为
  if (el.tagName.toLowerCase() === "img" && p && p.tagName.toLowerCase() === "a" && p.classList.contains("glightbox")) {
    target = p;
  }

  const parent = target.parentElement as HTMLElement | null;
  // 如果父元素已经是 photosuite-item，则直接返回，避免重复包裹
  if (parent && parent.classList.contains("photosuite-item")) return parent;

  // 创建新的包装容器
  const wrapper = document.createElement("div");
  wrapper.className = "photosuite-item";

  const host = target.parentElement as HTMLElement | null;
  // 再次检查父元素是否存在（理论上上面已经检查过，这里是双重保险）
  if (!host) return wrapper;

  // 在 DOM 中用 wrapper 替换 target，然后将 target 放入 wrapper 中
  host.replaceChild(wrapper, target);
  wrapper.appendChild(target);
  return wrapper;
}

/**
 * 处理媒体元素
 * 
 * 遍历匹配选择器的元素以及所有 img 元素，确保它们拥有统一的容器结构
 * 然后对每个容器执行回调函数
 * 
 * @param selector - 用于选择图片或链接的选择器字符串
 * @param callback - 对每个处理后的容器执行的回调函数
 */
export function processMedia(
  scope: string,
  selector: string,
  callback: (container: HTMLElement) => void
) {
  // 使用 Set 防止重复处理同一个容器
  const processed = new Set<HTMLElement>();
  
  const process = (el: Element) => {
    const container = ensurePhotosuiteContainer(el);
    if (processed.has(container)) return;
    
    // 安全检查：确保容器内确实包含图片
    // 如果处理的是非图片元素且内部没有图片，则跳过
    if (!container.querySelector('img')) return;

    callback(container);
    processed.add(container);
  };

  const roots = document.querySelectorAll(scope);
  roots.forEach((root) => {
    // 处理匹配选择器的元素
    root.querySelectorAll(selector).forEach(process);
    // 额外处理页面上所有的 img 元素
    root.querySelectorAll("img").forEach(process);
  });
}

/**
 * 确保容器内存在标题元素
 * 
 * 根据容器内图片的 alt 属性创建并插入标题元素
 * 
 * @param container - 图片容器 (.photosuite-item)
 */
export function ensureCaption(container: HTMLElement): void {
  // 如果已经存在标题，则不再创建
  if (container.querySelector(".photosuite-caption")) return;

  const img = container.querySelector("img");
  if (!img) return;

  // 获取图片的 alt 属性作为标题内容
  const altText = String(img.getAttribute("alt") || "").trim();
  if (!altText) return;

  const cap = document.createElement("div");
  cap.className = "photosuite-caption";
  cap.textContent = altText;
  container.appendChild(cap);
}

/**
 * 确保容器内存在 EXIF 显示条
 * 
 * 创建一个用于显示 EXIF 信息的占位元素
 * 
 * @param container - 图片容器 (.photosuite-item)
 */
export function ensureExif(container: HTMLElement): void {
  // 检查是否已存在 EXIF 条
  const existing = container.querySelector(".photosuite-exif");
  if (existing) {
    // 如果存在但内容为空（只有空白字符），则将其移除
    if (!existing.textContent?.trim()) {
      existing.remove();
    }
    return;
  }

  // 客户端不再自动创建空的 EXIF 条，
  // 因为 EXIF 数据是在构建时由 rehype 插件提取并注入的。
  // 如果构建时没有生成（例如因为缺少关键 EXIF 信息），客户端也不应显示空条。
}