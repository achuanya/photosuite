export async function enableImageAlts(selector: string) {
  await import("../styles/image-alts.css");
  const anchors = Array.from(document.querySelectorAll(selector));
  anchors.forEach((a) => {
    const parent = a.parentElement as HTMLElement | null;
    if (!parent) return;
    if (parent.tagName.toLowerCase() !== "figure") {
      const figure = document.createElement("figure");
      figure.className = "photosuite-figure";
      parent.replaceChild(figure, a);
      figure.appendChild(a);
    }
    const img = a.querySelector("img");
    if (!img) return;
    const altText = String(img.getAttribute("alt") || "").trim();
    if (!altText) return;
    const existing = (a.parentElement as Element).querySelector(".photosuite-figcaption");
    if (existing) return;
    const cap = document.createElement("figcaption");
    cap.className = "photosuite-figcaption";
    cap.textContent = altText;
    (a.parentElement as Element).appendChild(cap);
  });

  const imgs = Array.from(document.querySelectorAll("img"));
  imgs.forEach((img) => {
    const p = img.parentElement as HTMLElement | null;
    const isAnchor = p && p.tagName.toLowerCase() === "a" && p.classList.contains("glightbox");
    if (isAnchor) return;
    if (!p) return;
    if (p.tagName.toLowerCase() !== "figure") {
      const figure = document.createElement("figure");
      figure.className = "photosuite-figure";
      p.replaceChild(figure, img);
      figure.appendChild(img);
      const altText = String(img.getAttribute("alt") || "").trim();
      if (!altText) return;
      const cap = document.createElement("figcaption");
      cap.className = "photosuite-figcaption";
      cap.textContent = altText;
      figure.appendChild(cap);
    }
  });
}
