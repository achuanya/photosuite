export async function enableExif(selector: string) {
  await import("../styles/exif.scss");
  const nodes = new Set<Element>();
  document.querySelectorAll(selector).forEach((n) => nodes.add(n));
  document.querySelectorAll(".photosuite-item").forEach((n) => nodes.add(n));
  document.querySelectorAll("img").forEach((img) => {
    const p = img.parentElement as Element | null;
    if (p) nodes.add(p);
  });
  nodes.forEach((p) => {
    const container = (p.closest(".photosuite-item") || p) as HTMLElement;
    if (container.querySelector(".photosuite-exif")) return;
    const img = container.querySelector("img");
    if (!img) return;
    if (!container.classList.contains("photosuite-item")) {
      container.classList.add("photosuite-item");
    }
    const bar = document.createElement("div");
    bar.className = "photosuite-exif";
    container.appendChild(bar);
  });
}
