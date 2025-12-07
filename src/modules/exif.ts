import { ensurePhotosuiteContainer, ensureExif } from "./dom";

export async function enableExif(selector: string) {
  await import("../styles/exif.scss");
  const processed = new Set<HTMLElement>();
  const anchors = Array.from(document.querySelectorAll(selector));
  anchors.forEach((a) => {
    const container = ensurePhotosuiteContainer(a);
    if (processed.has(container)) return;
    const img = container.querySelector("img");
    if (!img) return;
    ensureExif(container);
    processed.add(container);
  });
  const imgs = Array.from(document.querySelectorAll("img"));
  imgs.forEach((img) => {
    const container = ensurePhotosuiteContainer(img);
    if (processed.has(container)) return;
    ensureExif(container);
    processed.add(container);
  });
}