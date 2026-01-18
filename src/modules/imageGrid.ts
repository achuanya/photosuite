/**
 * @file imageGrid.ts
 * @description 图片拼图模块，负责将连续的图片组合成拼图布局
 */

import { ensurePhotosuiteContainer } from "./dom";

/**
 * 启用图片拼图功能
 * 
 * 检测页面上连续出现的图片并将它们组合成拼图布局
 * 最多支持三张图片的拼图
 * 
 * @param scope - 生效范围选择器
 * @param selector - 图片选择器
 */
export async function enableImageGrid(scope: string, _selector: string) {
  // 动态导入样式文件
  await import("../styles/image-grid.scss");

  const roots = document.querySelectorAll(scope);
  roots.forEach((root) => {
    processImageGrids(root);
  });
}

/**
 * 处理图片拼图
 * 
 * @param root - 根元素
 */
function processImageGrids(root: Element) {
  // 获取所有图片元素
  const images = Array.from(root.querySelectorAll("img"));

  // 用于标记已处理的图片
  const processed = new Set<Element>();

  for (let i = 0; i < images.length; i++) {
    const img = images[i];

    // 跳过已处理的图片
    if (processed.has(img)) continue;

    // 检查是否可以形成拼图
    const gridImages = [img];
    processed.add(img);

    // 查找连续的图片（最多3张）
    for (let j = i + 1; j < images.length && gridImages.length < 3; j++) {
      const nextImg = images[j];

      // 检查两个图片容器是否相邻
      const currentContainer = ensurePhotosuiteContainer(gridImages[gridImages.length - 1]);
      const nextContainer = ensurePhotosuiteContainer(nextImg);

      if (areContainersAdjacent(currentContainer, nextContainer)) {
        gridImages.push(nextImg);
        processed.add(nextImg);
      } else {
        break;
      }
    }

    // 如果找到了多张连续的图片（2-3张），创建拼图
    if (gridImages.length >= 2) {
      createImageGrid(gridImages);
    }
  }
}

/**
 * 检查两个容器是否相邻
 * 
 * @param container1 - 第一个容器
 * @param container2 - 第二个容器
 * @returns 是否相邻
 */
function areContainersAdjacent(container1: HTMLElement, container2: HTMLElement): boolean {
  // 获取两个容器的父元素
  const parent1 = container1.parentElement;
  const parent2 = container2.parentElement;

  // 如果父元素不同，不是相邻的
  if (parent1 !== parent2 || !parent1) return false;

  // 获取父元素的所有子元素
  const siblings = Array.from(parent1.children);
  const index1 = siblings.indexOf(container1);
  const index2 = siblings.indexOf(container2);

  // 检查是否相邻（中间只能有文本节点或空白节点）
  if (index2 !== index1 + 1) {
    // 检查中间是否只有空白文本节点
    let hasNonWhitespace = false;
    let node = container1.nextSibling;
    while (node && node !== container2) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        hasNonWhitespace = true;
        break;
      }
      if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
        hasNonWhitespace = true;
        break;
      }
      node = node.nextSibling;
    }
    return !hasNonWhitespace && node === container2;
  }

  return true;
}

/**
 * 创建图片拼图
 * 
 * @param images - 要组合的图片元素数组
 */
function createImageGrid(images: Element[]) {
  if (images.length < 2) return;

  // 获取第一张图片的容器
  const firstContainer = ensurePhotosuiteContainer(images[0]);
  const parent = firstContainer.parentElement;
  if (!parent) return;

  // 创建拼图容器
  const gridWrapper = document.createElement("div");
  gridWrapper.className = "photosuite-grid";
  gridWrapper.setAttribute("data-grid-count", String(images.length));

  // 在第一个容器之前插入拼图容器
  parent.insertBefore(gridWrapper, firstContainer);

  const gridItems: HTMLElement[] = [];

  // 将所有图片容器移动到拼图容器中
  images.forEach((img) => {
    const container = ensurePhotosuiteContainer(img);

    // 标记容器为拼图成员
    container.classList.add("photosuite-grid-member");

    // 移除已有的 caption 和 exif 元素
    const caption = container.querySelector(".photosuite-caption");
    const exif = container.querySelector(".photosuite-exif");
    if (caption) caption.remove();
    if (exif) exif.remove();

    // 创建拼图项包装器
    const gridItem = document.createElement("div");
    gridItem.className = "photosuite-grid-item";

    // 将容器从原位置移除并添加到拼图项中
    if (container.parentElement) {
      container.parentElement.removeChild(container);
    }

    gridItem.appendChild(container);
    gridWrapper.appendChild(gridItem);
    gridItems.push(gridItem);
  });

  // 异步计算宽度以保证等高
  updateGridDimensions(images as HTMLImageElement[], gridItems);
}

/**
 * 异步更新拼图项宽度
 * 基于图片宽高比计算宽度，使得所有图片高度一致
 */
async function updateGridDimensions(images: HTMLImageElement[], gridItems: HTMLElement[]) {
  const ratios: number[] = [];

  // 获取所有图片的宽高比
  for (const img of images) {
    const ratio = await resolveImageRatio(img);
    ratios.push(ratio);
  }

  // 计算总比例
  const totalRatio = ratios.reduce((sum, r) => sum + r, 0);
  const gapCount = gridItems.length - 1;

  // 设置每张图片的宽度百分比
  gridItems.forEach((item, index) => {
    if (totalRatio > 0) {
      const ratio = ratios[index];
      const percent = (ratio / totalRatio) * 100;
      
      // 使用 calc 计算实际宽度：(比例% * 100) - (gap总宽 * 比例占比)
      // 公式: calc(33.33% - (2 * var(--gap) * 0.3333))
      const widthCalc = `calc(${percent}% - (${gapCount} * var(--photosuite-grid-gap, 4px)) * ${ratio / totalRatio})`;
      
      // 设置 flex-basis 和 max-width
      item.style.flex = `0 0 ${widthCalc}`;
      item.style.maxWidth = widthCalc;
    }
  });
}

/**
 * 解析图片宽高比
 */
function resolveImageRatio(img: HTMLImageElement): number | Promise<number> {
  // 1. 优先尝试从属性获取
  const attrW = parseFloat(img.getAttribute('width') || '');
  const attrH = parseFloat(img.getAttribute('height') || '');
  if (attrW && attrH) {
    return attrW / attrH;
  }

  // 2. 如果图片已加载，使用 naturalWidth/Height
  if (img.complete && img.naturalHeight) {
    return img.naturalWidth / img.naturalHeight;
  }

  // 3. 等待加载
  return new Promise((resolve) => {
    if (img.complete) {
      resolve(img.naturalHeight ? img.naturalWidth / img.naturalHeight : 1);
      return;
    }

    const onLoad = () => {
      removeListeners();
      resolve(img.naturalHeight ? img.naturalWidth / img.naturalHeight : 1);
    };

    const onError = () => {
      removeListeners();
      resolve(1); // 加载失败默认为 1
    };

    const removeListeners = () => {
      img.removeEventListener('load', onLoad);
      img.removeEventListener('error', onError);
    };

    img.addEventListener('load', onLoad);
    img.addEventListener('error', onError);
  });
}

