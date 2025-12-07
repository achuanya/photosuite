/**
 * @file types.ts
 * @description 定义 Photosuite 及其模块使用的接口和类型定义
 */

/**
 * Photosuite 主配置项接口
 */
export interface PhotosuiteOptions extends ImageUrlOptions {
  /**
   * 图片选择器
   * @default "a.glightbox"
   * @description 用于选择需要应用 Photosuite 效果的图片或链接元素的选择器字符串
   */
  selector?: string;

  /**
   * 画廊名称
   * @default "markdown"
   * @description GLightbox 画廊的分组名称，同一组名称的图片可以相互切换
   */
  gallery?: string;

  /**
   * 是否启用 GLightbox
   * @default true
   * @description 控制是否加载并启用 GLightbox 灯箱功能
   */
  glightbox?: boolean;

  /**
   * GLightbox 配置项
   * @description 传递给 GLightbox 实例的原生配置对象
   */
  glightboxOptions?: Record<string, unknown>;

  /**
   * 是否启用图片 Alt 标题
   * @default true
   * @description 控制是否将图片的 alt 属性作为标题显示在图片下方
   */
  imageAlts?: boolean;

  /**
   * 是否启用 EXIF 信息
   * @default true
   * @description 控制是否显示图片的 EXIF 信息（目前仅显示占位样式，实际数据需自行处理）
   */
  exif?: boolean;

  /**
   * GLightbox CSS CDN 地址
   * @description 自定义 GLightbox CSS 文件的加载地址
   */
  glightboxCssUrl?: string;

  /**
   * GLightbox JS CDN 地址
   * @description 自定义 GLightbox JS 文件的加载地址
   */
  glightboxJsUrl?: string;
}

/**
 * GLightbox 模块初始化配置接口
 */
export interface GlightboxModuleOptions {
  /**
   * 图片选择器
   * @description 需要绑定 GLightbox 事件的元素选择器
   */
  selector: string;

  /**
   * 画廊名称
   * @description 图片分组名称
   */
  gallery: string;

  /**
   * GLightbox 原生配置
   */
  options?: Record<string, unknown>;

  /**
   * CSS 资源地址
   */
  cssUrl?: string;

  /**
   * JS 资源地址
   */
  jsUrl?: string;
}

/**
 * ImageUrl Rehype 插件配置接口
 */
export interface ImageUrlOptions {
  /**
   * 图片基础 URL
   * @example "https://cdn.example.com/images/"
   * @description 用于补全图片路径的基础 URL 前缀。
   */
  imageBase?: string;

  /**
   * 图片目录 Frontmatter Key
   * @default "imageDir"
   * @description 在 Markdown Frontmatter 中指定子目录名称的字段名。
   */
  imageDir?: string;

  /**
   * 是否使用文件名作为子目录
   * @default false
   * @description 如果为 true，则使用当前 Markdown 文件名（不含扩展名）作为子目录。
   */
  fileDir?: boolean;
}
