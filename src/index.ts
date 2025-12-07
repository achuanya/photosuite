export interface PhotosuiteInitOptions {
  selector?: string;
  gallery?: string;
  glightbox?: boolean;
  glightboxOptions?: Record<string, unknown>;
  imageAlts?: boolean;
  exif?: boolean;
  glightboxCssUrl?: string;
  glightboxJsUrl?: string;
}

export function initPhotosuite(opts: PhotosuiteInitOptions = {}) {
  const selector = opts.selector ?? "a.glightbox";
  const gallery = opts.gallery ?? "markdown";
  const enableLightbox = opts.glightbox ?? true;
  const enableAlts = opts.imageAlts ?? true;
  const enableExif = opts.exif ?? true;

  const start = () => {
    const tasks: Promise<any>[] = [];
    if (enableLightbox) {
      tasks.push(
        import("./modules/glightbox").then((m) =>
          m.initGlightboxModule({
            selector,
            gallery,
            options: opts.glightboxOptions,
            cssUrl: opts.glightboxCssUrl,
            jsUrl: opts.glightboxJsUrl,
          })
        )
      );
    }
    if (enableAlts) {
      tasks.push(import("./modules/imageAlts").then((m) => m.enableImageAlts(selector)));
    }
    if (enableExif) {
      tasks.push(import("./modules/exif").then((m) => m.enableExif(selector)));
    }
    if (tasks.length) Promise.all(tasks).catch(() => {});
  };

  if (document.readyState === "complete" || document.readyState === "interactive") start();
  else document.addEventListener("DOMContentLoaded", start);
}