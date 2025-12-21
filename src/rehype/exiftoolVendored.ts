/**
 * @file exiftoolVendored.ts
 * @description Rehype 插件，用于在编译时使用 exiftool-vendored 提取图片 EXIF 信息并注入到 HTML 中
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
 * 下载文件到临时目录
 * 
 * @param u - 文件 URL
 * @returns 临时文件路径和清理函数
 */
async function downloadToTemp(u: string): Promise<{ path: string; cleanup: () => Promise<void> }> {
  const tmpDir = os.tmpdir();
  const ext = path.extname(u) || ".bin";
  const tmpPath = path.join(tmpDir, `exif-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  
  const writer = fs.createWriteStream(tmpPath);
  const mod = u.startsWith("https:") ? https : http;
  
  await new Promise((resolve, reject) => {
    const req = mod.get(u, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Handle redirect
        // Note: Simple redirect handling, might need recursion if multiple redirects
        // For now, let's assume one level or fail, to keep it simple as per user snippet
      }

      if (res.statusCode !== 200) {
        reject(new Error("HTTP " + res.statusCode));
        return;
      }
      res.pipe(writer);
      writer.on("finish", resolve);
      writer.on("error", reject);
    });
    req.on("error", reject);
  });

  return {
    path: tmpPath,
    cleanup: async () => {
      try {
        await fsp.unlink(tmpPath);
      } catch {}
    }
  };
}

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
      if (typeof value === 'object' && value.year) {
        return `${value.year}/${value.month}/${value.day}`;
      }
      return value.toString();
    default:
      return value.toString();
  }
}

/**
 * 处理单个节点
 * 
 * 下载或解析图片，提取 EXIF 信息并修改节点结构
 * 
 * @param node - AST 节点
 * @param file - VFile 对象
 * @param options - 配置项
 */
async function processNode(node: Node, file: any, options: any) {
  const src = node.properties?.src;
  if (!src) return;

  let filePath = "";
  let cleanup: (() => Promise<void>) | undefined;

  try {
    if (isHttpUrl(src)) {
      const dl = await downloadToTemp(src);
      filePath = dl.path;
      cleanup = dl.cleanup;
    } else {
      // Local file
      if (path.isAbsolute(src)) {
         filePath = src; 
      } else {
         const dir = path.dirname(file.path);
         filePath = path.resolve(dir, src);
      }
    }

    if (filePath && (fs.existsSync(filePath) || isHttpUrl(src))) {
       if (!fs.existsSync(filePath)) {
          filePath = decodeURIComponent(filePath);
       }
       
       if (fs.existsSync(filePath)) {
         const data = await handleExif(filePath);
         
         // 检查曝光三要素
         const hasExposure = data.FNumber || data.ExposureTime || data.ISO;
         if (!hasExposure) {
            return;
         }

         // 获取配置
         const exifOptions = (typeof options.exif === 'object' ? options.exif : {}) as any;
         const fields = exifOptions.fields || ['Model', 'LensModel', 'FocalLength', 'FNumber', 'ExposureTime', 'ISO', 'DateTimeOriginal'];
         const separator = exifOptions.separator || ' · ';

         const parts = fields.map((field: string) => {
            const val = data[field as keyof typeof data];
            if (!val) return null;
            return formatField(field, val);
         }).filter(Boolean);
         
         if (parts.length === 0) return;

         const text = parts.join(separator);

         // Mutate the AST
         const originalProps = { ...node.properties };
         
         node.tagName = 'div';
         node.properties = { className: ['photosuite-item'] };
         node.children = [
           {
             type: 'element',
             tagName: 'img',
             properties: originalProps,
             children: []
           },
           {
             type: 'element',
             tagName: 'div',
             properties: { className: ['photosuite-exif'] },
             children: [{ type: 'text', value: text }]
           }
         ];
       }
    }

  } catch (e) {
    console.warn(`[photosuite] Failed to get EXIF for ${src}:`, e);
  } finally {
    if (cleanup) await cleanup();
  }
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
  return async (tree: Node, file: any) => {
    const promises: Promise<void>[] = [];

    const visit = (node: Node) => {
      if (node.type === 'element' && node.tagName === 'img') {
        promises.push(processNode(node, file, options));
      }

      if (node.children) {
        node.children.forEach(visit);
      }
    };

    visit(tree);
    
    if (promises.length > 0) {
        await Promise.all(promises);
    }
  };
}
