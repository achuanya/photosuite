import { ensurePhotosuiteContainer, ensureCaption } from "./dom";

export async function enableImageAlts(selector: string) {
  await import("../styles/image-alts.scss");
  const processed = new Set<HTMLElement>();
  const anchors = Array.from(document.querySelectorAll(selector));
  anchors.forEach((a) => {
    const container = ensurePhotosuiteContainer(a);
    if (processed.has(container)) return;
    ensureCaption(container);
    processed.add(container);
  });
  const imgs = Array.from(document.querySelectorAll("img"));
  imgs.forEach((img) => {
    const container = ensurePhotosuiteContainer(img);
    if (processed.has(container)) return;
    ensureCaption(container);
    processed.add(container);
  });
}