export interface PhotosuiteOptions {
  selector?: string;
  gallery?: string;
  glightbox?: boolean;
  glightboxOptions?: Record<string, unknown>;
  imageAlts?: boolean;
  exif?: boolean;
  glightboxCssUrl?: string;
  glightboxJsUrl?: string;
}

export interface GlightboxModuleOptions {
  selector: string;
  gallery: string;
  options?: Record<string, unknown>;
  cssUrl?: string;
  jsUrl?: string;
}