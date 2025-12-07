export function ensurePhotosuiteContainer(el: Element): HTMLElement {
  const p = el.parentElement as HTMLElement | null;
  if (!p) return el as HTMLElement;
  let target: Element = el;
  if (el.tagName.toLowerCase() === "img" && p && p.tagName.toLowerCase() === "a" && p.classList.contains("glightbox")) {
    target = p;
  }
  const parent = target.parentElement as HTMLElement | null;
  if (parent && parent.classList.contains("photosuite-item")) return parent;
  const wrapper = document.createElement("div");
  wrapper.className = "photosuite-item";
  const host = target.parentElement as HTMLElement | null;
  if (!host) return wrapper;
  host.replaceChild(wrapper, target);
  wrapper.appendChild(target);
  return wrapper;
}

export function ensureCaption(container: HTMLElement): void {
  if (container.querySelector(".photosuite-caption")) return;
  const img = container.querySelector("img");
  if (!img) return;
  const altText = String(img.getAttribute("alt") || "").trim();
  if (!altText) return;
  const cap = document.createElement("div");
  cap.className = "photosuite-caption";
  cap.textContent = altText;
  container.appendChild(cap);
}

export function ensureExif(container: HTMLElement): void {
  if (container.querySelector(".photosuite-exif")) return;
  const bar = document.createElement("div");
  bar.className = "photosuite-exif";
  container.appendChild(bar);
}