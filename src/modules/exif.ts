export async function enableExif(selector: string) {
  await import("../styles/exif.css");
  const nodes = new Set<Element>();
  document.querySelectorAll(selector).forEach((n) => nodes.add(n));
  document.querySelectorAll(".photosuite-figure").forEach((n) => nodes.add(n));
  document.querySelectorAll("img").forEach((img) => {
    const p = img.parentElement as Element | null;
    if (p) nodes.add(p);
  });
  nodes.forEach((p) => {
    const has = p.querySelector(".photosuite-exif");
    if (has) return;
    const img = p.querySelector("img");
    if (!img) return;
    const el = p as HTMLElement;
    if (!el.classList.contains("photosuite-exif-parent") && p.tagName.toLowerCase() !== "figure") {
      el.classList.add("photosuite-exif-parent");
    }
    const bar = document.createElement("div");
    bar.className = "photosuite-exif";
    p.appendChild(bar);
  });
}
