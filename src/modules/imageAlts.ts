export async function enableImageAlts(selector: string) {
  await import("../styles/image-alts.scss");
  const anchors = Array.from(document.querySelectorAll(selector));
  anchors.forEach((a) => {
    const parent = a.parentElement as HTMLElement | null;
    if (!parent) return;
    if (!parent.classList.contains("photosuite-item")) {
      const wrapper = document.createElement("div");
      wrapper.className = "photosuite-item";
      parent.replaceChild(wrapper, a);
      wrapper.appendChild(a);
    }
    const img = a.querySelector("img");
    if (!img) return;
    const altText = String(img.getAttribute("alt") || "").trim();
    if (!altText) return;
    const existing = (a.parentElement as Element).querySelector(".photosuite-caption");
    if (existing) return;
    const cap = document.createElement("div");
    cap.className = "photosuite-caption";
    cap.textContent = altText;
    (a.parentElement as Element).appendChild(cap);
  });

  const imgs = Array.from(document.querySelectorAll("img"));
  imgs.forEach((img) => {
    const p = img.parentElement as HTMLElement | null;
    const isAnchor = p && p.tagName.toLowerCase() === "a" && p.classList.contains("glightbox");
    if (isAnchor) return;
    if (!p) return;
    if (!p.classList.contains("photosuite-item")) {
      const wrapper = document.createElement("div");
      wrapper.className = "photosuite-item";
      p.replaceChild(wrapper, img);
      wrapper.appendChild(img);
      const altText = String(img.getAttribute("alt") || "").trim();
      if (!altText) return;
      const cap = document.createElement("div");
      cap.className = "photosuite-caption";
      cap.textContent = altText;
      wrapper.appendChild(cap);
    }
  });
}
