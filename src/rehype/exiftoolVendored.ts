/**
 * @file exiftoolVendored.ts
 * @description Rehype 插件，用于在编译时使用 exiftool-vendored 提取图片 EXIF 信息并注入到 HTML 中
 *
 * 性能优化：
 * - 持久化磁盘缓存（node_modules/.cache/photosuite/），以图片 URL 为键，避免每次 dev 重复联网解析
 * - HTTP Range 仅下载文件头部（JPEG 的 EXIF 位于开头），减少传输量
 * - 下载并发限制 + 超时 + 重试，避免 TLS 连接风暴导致的 ECONNRESET
 */

import { exiftool } from "exiftool-vendored";
import * as fs from "node:fs";
import * as fsp from "node:fs/promises";
import * as path from "node:path";
import * as http from "node:http";
import * as https from "node:https";
import * as os from "node:os";
import { URL } from "node:url";

// 定义简单的 AST 节点类型，避免引入 hast 依赖
interface Node {
  type: string;
  tagName?: string;
  properties?: Record<string, any>;
  children?: Node[];
  value?: string;
  [key: string]: any;
}

/**
 * 提取并裁剪后的 EXIF 数据类型
 */
type ExifData = Awaited<ReturnType<typeof handleExif>>;

/**
 * 解析后的 EXIF 配置（含默认值）
 */
interface ResolvedExifOptions {
  cache: boolean;
  concurrency: number;
  timeout: number;
  headerBytes: number;
  fields: string[];
  separator: string;
}

/**
 * 默认展示字段
 */
const DEFAULT_FIELDS = ['Model', 'LensModel', 'FocalLength', 'FNumber', 'ExposureTime', 'ISO', 'DateTimeOriginal'];

/**
 * 从插件配置解析出 EXIF 选项，未配置项使用默认值
 *
 * @param options - 插件配置项
 * @returns 解析后的配置
 */
function resolveExifOptions(options: any): ResolvedExifOptions {
  const e = (typeof options.exif === 'object' && options.exif !== null ? options.exif : {}) as any;
  return {
    cache: e.cache !== false,
    concurrency: typeof e.concurrency === 'number' && e.concurrency > 0 ? e.concurrency : 6,
    timeout: typeof e.timeout === 'number' && e.timeout > 0 ? e.timeout : 15000,
    headerBytes: typeof e.headerBytes === 'number' && e.headerBytes >= 0 ? e.headerBytes : 131072,
    fields: Array.isArray(e.fields) && e.fields.length > 0 ? e.fields : DEFAULT_FIELDS,
    separator: typeof e.separator === 'string' ? e.separator : ' · ',
  };
}

/* -------------------------------------------------------------------------- */
/* 并发信号量                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * 简单的异步信号量，用于限制同时进行的下载数量
 */
class Semaphore {
  private available: number;
  private waiters: Array<() => void> = [];

  constructor(max: number) {
    this.available = Math.max(1, max);
  }

  /**
   * 获取一个许可，需在完成后调用返回的 release
   */
  async acquire(): Promise<() => void> {
    if (this.available > 0) {
      this.available--;
    } else {
      await new Promise<void>((resolve) => this.waiters.push(resolve));
    }
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.release();
    };
  }

  private release(): void {
    const next = this.waiters.shift();
    if (next) {
      // 直接把许可移交给等待者，不增加计数
      next();
    } else {
      this.available++;
    }
  }
}

// 模块级单例：跨所有 Markdown 文件共享，实现全局并发限制
let semaphore: Semaphore | null = null;
function getSemaphore(concurrency: number): Semaphore {
  if (!semaphore) {
    semaphore = new Semaphore(concurrency);
  }
  return semaphore;
}

/* -------------------------------------------------------------------------- */
/* 持久化磁盘缓存                                                              */
/* -------------------------------------------------------------------------- */

const CACHE_VERSION = 1;

interface CacheFile {
  version: number;
  // value 为 ExifData 表示有可用 EXIF；为 null 表示「已解析但无可用 EXIF」的负缓存
  entries: Record<string, ExifData | null>;
}

let cachePromise: Promise<CacheFile> | null = null;
let cacheDirty = false;
let writing: Promise<void> = Promise.resolve();

/**
 * 缓存文件路径：node_modules/.cache/photosuite/exif-cache.json
 */
function cacheFilePath(): string {
  return path.join(process.cwd(), 'node_modules', '.cache', 'photosuite', 'exif-cache.json');
}

/**
 * 懒加载缓存文件（模块级仅执行一次）。文件不存在或损坏时返回空缓存。
 */
function loadCache(): Promise<CacheFile> {
  if (!cachePromise) {
    cachePromise = (async () => {
      try {
        const raw = await fsp.readFile(cacheFilePath(), 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && parsed.version === CACHE_VERSION && parsed.entries && typeof parsed.entries === 'object') {
          return parsed as CacheFile;
        }
      } catch {
        // 文件不存在 / JSON 损坏 / 版本不匹配 —— 从空缓存开始
      }
      return { version: CACHE_VERSION, entries: {} };
    })();
  }
  return cachePromise;
}

/**
 * 将缓存原子写入磁盘（仅在有改动时）。通过 writing 链串行化，避免并发写损坏。
 */
async function flushCache(): Promise<void> {
  if (!cacheDirty || !cachePromise) return;
  const cache = await cachePromise;
  cacheDirty = false;

  writing = writing.then(async () => {
    const file = cacheFilePath();
    const dir = path.dirname(file);
    await fsp.mkdir(dir, { recursive: true });
    const tmp = path.join(dir, `.exif-cache.${process.pid}.${Date.now()}.tmp`);
    await fsp.writeFile(tmp, JSON.stringify(cache), 'utf-8');
    await fsp.rename(tmp, file);
  }).catch(() => {
    // 写缓存失败不应影响构建
  });

  await writing;
}

/* -------------------------------------------------------------------------- */
/* 网络下载                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * 判断是否为 HTTP/HTTPS URL
 *
 * @param u - URL 字符串
 * @returns 是否为网络链接
 */
function isHttpUrl(u: string): boolean {
  try {
    const x = new URL(u);
    return x.protocol === "http:" || x.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * 单次下载尝试：支持 Range 头部下载、重定向追踪、超时
 *
 * @param u - 文件 URL
 * @param opts - 解析后的配置
 * @param redirectCount - 当前重定向次数
 * @returns 临时文件路径和清理函数
 */
function downloadAttempt(
  u: string,
  opts: ResolvedExifOptions,
  redirectCount: number
): Promise<{ path: string; cleanup: () => Promise<void> }> {
  return new Promise((resolve, reject) => {
    const mod = u.startsWith("https:") ? https : http;
    const headers: Record<string, string> = {};
    if (opts.headerBytes > 0) {
      headers["Range"] = `bytes=0-${opts.headerBytes - 1}`;
    }

    const req = mod.get(u, { headers }, (res) => {
      const status = res.statusCode || 0;

      // 处理重定向
      if (status >= 300 && status < 400 && res.headers.location) {
        res.resume(); // 释放响应资源
        if (redirectCount >= 5) {
          reject(new Error("Too many redirects"));
          return;
        }
        const next = new URL(res.headers.location, u).toString();
        downloadAttempt(next, opts, redirectCount + 1).then(resolve, reject);
        return;
      }

      // 206 = 部分内容（Range 生效）；200 = 服务器忽略 Range 返回完整文件
      if (status !== 200 && status !== 206) {
        res.resume();
        reject(new Error("HTTP " + status));
        return;
      }

      const tmpDir = os.tmpdir();
      let ext = ".bin";
      try {
        ext = path.extname(new URL(u).pathname) || ".bin";
      } catch {}
      const tmpPath = path.join(
        tmpDir,
        `exif-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
      );

      const writer = fs.createWriteStream(tmpPath);
      res.pipe(writer);
      writer.on("finish", () => {
        resolve({
          path: tmpPath,
          cleanup: async () => {
            try {
              await fsp.unlink(tmpPath);
            } catch {}
          },
        });
      });
      writer.on("error", (err) => {
        try {
          fs.unlinkSync(tmpPath);
        } catch {}
        reject(err);
      });
    });

    req.setTimeout(opts.timeout, () => {
      req.destroy(Object.assign(new Error("timeout"), { code: "ETIMEDOUT" }));
    });
    req.on("error", reject);
  });
}

/**
 * 下载文件到临时目录（带一次重试）
 *
 * @param u - 文件 URL
 * @param opts - 解析后的配置
 * @returns 临时文件路径和清理函数
 */
async function downloadToTemp(
  u: string,
  opts: ResolvedExifOptions
): Promise<{ path: string; cleanup: () => Promise<void> }> {
  try {
    return await downloadAttempt(u, opts, 0);
  } catch (e: any) {
    const code = e && e.code;
    if (code === "ECONNRESET" || code === "ETIMEDOUT" || code === "ECONNREFUSED") {
      // 连接被重置 / 超时：立即重试一次
      return await downloadAttempt(u, opts, 0);
    }
    throw e;
  }
}

/* -------------------------------------------------------------------------- */
/* EXIF 解析与渲染                                                             */
/* -------------------------------------------------------------------------- */

/**
 * 读取图片 EXIF 信息
 *
 * @param filePath - 图片文件路径
 * @returns EXIF 数据对象
 */
async function handleExif(filePath: string) {
  const tags = await exiftool.read(filePath);
  return {
    SourceFile: tags.SourceFile,
    ExifToolVersion: tags.ExifToolVersion,
    MIMEType: tags.MIMEType,
    FileType: tags.FileType,
    Make: tags.Make,
    Model: tags.Model,
    LensModel: tags.LensModel,
    DateTimeOriginal: tags.DateTimeOriginal,
    CreateDate: tags.CreateDate,
    ModifyDate: tags.ModifyDate,
    ImageWidth: tags.ImageWidth,
    ImageHeight: tags.ImageHeight,
    GPSLatitude: tags.GPSLatitude,
    GPSLongitude: tags.GPSLongitude,
    FNumber: tags.FNumber,
    ExposureTime: tags.ExposureTime,
    ISO: tags.ISO,
    FocalLength: tags.FocalLength,
    warnings: tags.warnings || [],
    errors: tags.errors || [],
  };
}

/**
 * 格式化 EXIF 字段
 */
function formatField(key: string, value: any): string {
  if (value === undefined || value === null) return "";

  switch (key) {
    case 'FNumber':
      return `ƒ/${Number(value).toFixed(1)}`;
    case 'ExposureTime':
      if (typeof value === 'number') {
        if (value >= 1) return `${value}s`;
        return `1/${Math.round(1 / value)}s`;
      }
      return value.toString();
    case 'ISO':
      return `ISO ${value}`;
    case 'FocalLength':
      // exiftool may return string "34 mm" or number 34
      const valStr = value.toString();
      return valStr.endsWith('mm') ? valStr : `${valStr}mm`;
    case 'DateTimeOriginal':
      // 运行时为 ExifDateTime 实例；经缓存 JSON 往返后为 { year, month, day, ... } 普通对象
      if (typeof value === 'object' && value.year) {
        return `${value.year}/${value.month}/${value.day}`;
      }
      return value.toString();
    default:
      return value.toString();
  }
}

/**
 * 提取图片 EXIF 数据
 *
 * 成功读取但缺少曝光三要素时返回 null（可作为负缓存）；
 * 下载或解析过程中发生错误时抛出异常（不应被负缓存，下次重试）。
 *
 * @param src - 图片地址（URL 或本地路径）
 * @param file - VFile 对象
 * @param opts - 解析后的配置
 * @returns EXIF 数据，或 null（无可用 EXIF）
 */
async function extractExif(src: string, file: any, opts: ResolvedExifOptions): Promise<ExifData | null> {
  let filePath = "";
  let cleanup: (() => Promise<void>) | undefined;

  try {
    if (isHttpUrl(src)) {
      // 仅对网络下载施加并发限制；解析本地临时文件不占用许可
      const release = await getSemaphore(opts.concurrency).acquire();
      try {
        const dl = await downloadToTemp(src, opts);
        filePath = dl.path;
        cleanup = dl.cleanup;
      } finally {
        release();
      }
    } else {
      // 本地文件路径解析
      if (path.isAbsolute(src)) {
        filePath = src;
      } else {
        const dir = path.dirname(file.path);
        filePath = path.resolve(dir, src);
      }
      if (!fs.existsSync(filePath)) {
        const decoded = decodeURIComponent(filePath);
        if (fs.existsSync(decoded)) {
          filePath = decoded;
        } else {
          return null;
        }
      }
    }

    if (!filePath || !fs.existsSync(filePath)) {
      return null;
    }

    const data = await handleExif(filePath);

    // 检查曝光三要素（光圈 / 快门 / ISO），不完整则视为无可用 EXIF
    const hasExposure = data.FNumber && data.ExposureTime && data.ISO;
    if (!hasExposure) {
      return null;
    }

    return data;
  } finally {
    if (cleanup) await cleanup();
  }
}

/**
 * 将 EXIF 文本写入 img 节点的 data-photosuite-exif 属性
 *
 * 不再于构建期直接生成 .photosuite-item / .photosuite-exif 的 DOM 结构，
 * 而是把 EXIF 文本作为数据载荷挂在 img 上，由客户端在 scope 命中后再渲染。
 * 这样 scope 不匹配的页面（例如未含 #article 的 about 页）就不会出现孤立的
 * EXIF 条。
 *
 * @param node - img 节点
 * @param data - EXIF 数据
 * @param opts - 解析后的配置
 */
function renderExifNode(node: Node, data: ExifData, opts: ResolvedExifOptions): void {
  const parts = opts.fields
    .map((field: string) => {
      const val = (data as any)[field];
      if (!val) return null;
      return formatField(field, val);
    })
    .filter(Boolean);

  if (parts.length === 0) return;

  const text = parts.join(opts.separator);

  if (!node.properties) node.properties = {};
  node.properties['data-photosuite-exif'] = text;
}

/**
 * 处理单个 img 节点
 *
 * 优先读取缓存；缓存未命中时下载/解析图片并写入缓存。
 *
 * @param node - AST 节点
 * @param file - VFile 对象
 * @param opts - 解析后的配置
 */
async function processNode(node: Node, file: any, opts: ResolvedExifOptions) {
  const src = node.properties?.src;
  if (!src) return;

  const remote = isHttpUrl(src);
  const useCache = opts.cache && remote;

  let data: ExifData | null | undefined;

  // 1. 查缓存（仅远程图片）
  if (useCache) {
    const cache = await loadCache();
    if (Object.prototype.hasOwnProperty.call(cache.entries, src)) {
      data = cache.entries[src];
    }
  }

  // 2. 缓存未命中：解析并写入缓存
  if (data === undefined) {
    try {
      data = await extractExif(src, file, opts);
    } catch (e) {
      // 下载 / 解析失败（网络等基础设施错误）：不写入负缓存，下次重试
      console.warn(`[photosuite] Failed to get EXIF for ${src}:`, e);
      return;
    }

    if (useCache) {
      const cache = await loadCache();
      cache.entries[src] = data;
      cacheDirty = true;
    }
  }

  // 3. 无可用 EXIF（负缓存或本次解析无结果）
  if (!data) return;

  // 4. 渲染
  renderExifNode(node, data, opts);
}

/**
 * ExiftoolVendored Rehype 插件
 *
 * 遍历 HTML AST，查找 img 标签，提取 EXIF 信息并注入到 DOM 结构中
 *
 * @param options - 插件配置项
 * @returns Transformer 函数
 */
export function exiftoolVendored(options: any = {}) {
  const opts = resolveExifOptions(options);

  return async (tree: Node, file: any) => {
    const promises: Promise<void>[] = [];

    const visit = (node: Node) => {
      if (node.type === 'element' && node.tagName === 'img') {
        promises.push(processNode(node, file, opts));
      }

      if (node.children) {
        node.children.forEach(visit);
      }
    };

    visit(tree);

    if (promises.length > 0) {
      await Promise.all(promises);
    }

    // 本文件处理完毕后，将本轮新增的缓存落盘（仅在有改动时实际写入）
    if (opts.cache) {
      await flushCache();
    }
  };
}
