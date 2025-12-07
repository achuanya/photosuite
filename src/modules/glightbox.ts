import type { GlightboxModuleOptions } from "../types";

function wrap(img: Element, gallery: string) {
  const src = (img as HTMLImageElement).currentSrc || (img as HTMLImageElement).src || "";
  if (!src) return;
  const altText = String(img.getAttribute("alt") || "").trim();
  const a = document.createElement("a");
  a.href = src;
  a.className = "glightbox";
  a.dataset.gallery = gallery;
  if (altText) a.dataset.title = altText;
  const parent = img.parentElement as HTMLElement;
  parent.replaceChild(a, img);
  a.appendChild(img);
}

function sync(a: Element, gallery: string) {
  const img = a.querySelector("img") as HTMLImageElement | null;
  if (!img) return;
  const finalSrc = img.currentSrc || img.src;
  if (finalSrc && a.getAttribute("href") !== finalSrc) a.setAttribute("href", finalSrc);
  const alt = img.getAttribute("alt");
  if (alt && !(a as HTMLElement).dataset.title) (a as HTMLElement).dataset.title = alt;
  if (!(a as HTMLElement).dataset.gallery) (a as HTMLElement).dataset.gallery = gallery;
}

function loadCss(href: string) {
  if (!href) return;
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

function loadJs(src: string): Promise<void> {
  return new Promise((resolve) => {
    if (!src) return resolve();
    if (typeof (window as any).GLightbox === "function") return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    document.head.appendChild(s);
  });
}

export async function initGlightboxModule(opts: GlightboxModuleOptions) {
  const selector = opts.selector;
  const gallery = opts.gallery;
  const cssUrl = opts.cssUrl || "https://cos.lhasa.icu/dist/glightbox/glightbox.min.css";
  const jsUrl = opts.jsUrl || "https://cos.lhasa.icu/dist/glightbox/glightbox.min.js";

  const imgs = Array.from(document.querySelectorAll("img"));
  imgs.forEach((el) => {
    const p = el.parentElement;
    const isA = p && p.tagName.toLowerCase() === "a";
    const hasClass = isA && (p as HTMLElement).classList.contains("glightbox");
    if (!isA || !hasClass) wrap(el, gallery);
  });

  const anchors = Array.from(document.querySelectorAll(selector));
  anchors.forEach((a) => sync(a, gallery));

  loadCss(cssUrl);
  await loadJs(jsUrl);

  const run = () => {
    const anyGL = (window as any).GLightbox;
    if (typeof anyGL === "function") {
      const inst = (window as any).__glightboxInstance;
      if (inst && inst.destroy) inst.destroy();
      const baseOpts = Object.assign({}, opts.options || {}, { selector });
      (window as any).__glightboxInstance = anyGL(baseOpts);
    }
  };
  run();
}
