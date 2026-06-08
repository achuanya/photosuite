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

  /**
   * 是否启用磁盘缓存
   * @default true
   * @description 将提取到的 EXIF 数据持久化到 node_modules/.cache/photosuite/ 下，
   * 以图片 URL 为键。CDN 图片（文件名含时间戳，内容不可变）在后续 dev 启动时直接命中缓存，
   * 避免重复联网下载与解析。设为 false 可禁用缓存。
   */
  cache?: boolean;

  /**
   * 远程图片下载的最大并发数
   * @default 6
   * @description 限制同时进行的图片下载数量，避免 TLS 连接风暴导致 ECONNRESET。
   */
  concurrency?: number;

  /**
   * 单次下载请求的超时时间（毫秒）
   * @default 15000
   */
  timeout?: number;

  /**
   * 下载时仅请求的文件头字节数
   * @default 131072
   * @description 通过 HTTP Range 请求仅下载文件头部（JPEG 的 EXIF 位于文件开头），
   * 大幅减少传输量。设为 0 则下载完整文件。
   */
  headerBytes?: number;

  /**
   * 仅对匹配的 Markdown 文件启用 EXIF 注入
   * @example ["src/content/posts/**\/*.md"]
   * @description 相对于项目根目录的 glob 模式数组。未配置时对所有 Markdown 生效。
   * 支持 `*`（匹配单段）、`**`（跨段匹配）、`?`（匹配单字符）。
   */
  include?: string[];

  /**
   * 跳过匹配的 Markdown 文件，不进行 EXIF 注入
   * @example ["src/content/pages/**\/*.md"]
   * @description 相对于项目根目录的 glob 模式数组。优先级高于 include。
   * 也可在单个页面的 frontmatter 中设置 `exif: false` 或 `photosuite: false` 跳过该页。
   */
  exclude?: string[];
}
