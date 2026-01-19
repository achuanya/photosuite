/**
 * @file types.ts
 * @description 定义 Photosuite 及其模块使用的接口和类型定义
 */

/**
 * Photosuite 主配置项接口
 */
export interface PhotosuiteOptions extends ImageUrlOptions {
  /**
   * 生效范围
   * @description 仅限 CSS 选择器范围内生效，支持多值逗号分隔
   */
  scope: string;

  /**
   * 图片选择器
   * @default "a[data-fancybox]"
   * @description 用于选择需要应用 Photosuite 效果的图片或链接元素的选择器字符串
   */
  selector?: string;

  /**
   * 画廊名称
   * @default "markdown"
   * @description Fancybox 画廊的分组名称，同一组名称的图片可以相互切换
   */
  gallery?: string;

  /**
   * 是否启用 Fancybox
   * @default true
   * @description 控制是否加载并启用 Fancybox 灯箱功能
   */
  fancybox?: boolean;

  /**
   * Fancybox 配置项
   * @description 传递给 Fancybox 实例的原生配置对象
   */
  fancyboxOptions?: Record<string, unknown>;

  /**
   * 是否启用图片 Alt 标题
   * @default true
   * @description 控制是否将图片的 alt 属性作为标题显示在图片下方
   */
  imageAlts?: boolean;

  /**
   * 是否启用图片拼图
   * @default true
   * @description 控制是否将连续的图片（2-3张）组合成拼图布局
   */
  imageGrid?: boolean;

  /**
   * 是否启用 EXIF 信息
   * @default true
   * @description 控制是否显示图片的 EXIF 信息。在 Markdown 中使用时，会在编译时自动提取并嵌入 EXIF 数据。
   * 可以传递对象进行更细粒度的配置。
   */
  exif?: boolean | PhotosuiteExifOptions;

}

/**
 * Fancybox 模块初始化配置接口
 */
export interface FancyboxModuleOptions {
  /**
   * 生效范围
   */
  scope: string;

  /**
   * 图片选择器
   * @description 需要绑定 Fancybox 事件的元素选择器
   */
  selector: string;

  /**
   * 画廊名称
   * @description 图片分组名称
   */
  gallery: string;

  /**
   * Fancybox 原生配置
   */
  options?: Record<string, unknown>;
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

/**
 * EXIF 配置选项
 */
export interface PhotosuiteExifOptions {
  /**
   * 是否启用
   * @default true
   */
  enabled?: boolean;

  /**
   * 需要展示的 EXIF 字段及其顺序
   * @default ['Model', 'LensModel', 'FocalLength', 'FNumber', 'ExposureTime', 'ISO', 'DateTimeOriginal']
   */
  fields?: ('Make' | 'Model' | 'LensModel' | 'FocalLength' | 'FNumber' | 'ExposureTime' | 'ISO' | 'DateTimeOriginal')[];

  /**
   * 分隔符
   * @default " · "
   */
  separator?: string;
}
