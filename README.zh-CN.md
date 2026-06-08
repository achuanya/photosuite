<div align="center">
  <a href="/">
    <img src="/public/logo.svg" alt="Photosuite" width="120" />
    <br/>
    <h1>Photosuite</h1>
  </a>

  <p>
    <a href="https://photosuite.lhasa.icu">官方网站</a> •
    <a href="https://github.com/achuanya/photosuite/releases">最新版本</a> •
    <a href="https://github.com/achuanya/photosuite/blob/main/Changelog.md">更新日志</a> •
    <a href="./README.md">English</a>
  </p>
</div>

Photosuite 是一款简单易用但功能丰富的图像插件，它将灯箱、EXIF、路径补全、拼图等功能，模块化整合在一个零配置的插件中。开箱即用，无需繁琐的配置，一行代码即可让您的图片焕然一新！

## 特性

- **封装灯箱**：私人定制 Fancybox 灯箱，简约、实用
- **静态EXIF**：集成 exiftool-vendored.js 支持自定义 EXIF 参数
- **路径解析**：插入图片只需要写文件名，在构建时自动补全路径
- **图片说明**：自动获取图片 alt 进行图片说明展示
- **分组拼图**：连续的图片（2-3张）自动组合成拼图布局，每张图片独立可点击
- **极致性能**：以上纯静态，只在构建时完成，运行无依赖，功能模块化，按需加载
- **零配置启动**：默认配置即可满足绝大多数需求，同时也提供丰富的选项供深度定制

## 安装

```bash
pnpm add photosuite
# 或
npm install photosuite
# 或
yarn add photosuite
```

## 快速开始

Astro 集成 Photosuite 非常简单，只需要在 `astro.config.js` 中添加以下配置：

```javascript
import { defineConfig } from 'astro/config';
import photosuite from 'photosuite';
import "photosuite/dist/photosuite.css";

export default defineConfig({
  integrations: [
    photosuite({
      // [必填] 指定生效范围的 CSS 选择器
      // 建议指定为您的文章容器，避免影响网站其他部分。支持多个选择器，用逗号分隔
      scope: '#main',
    })
  ]
});
```

配置完成后，Photosuite 会自动处理您指定范围内的所有图片。

## 功能详解与配置

### 1. 路径解析

在写博客时，图片路径往往很麻烦。Photosuite 提供了灵活的路径解析策略，您可以根据实际情况进行配置

**场景 A：所有图片都在一个域名下**

```javascript
photosuite({
  scope: '#main',
  imageBase: 'https://cdn.example.com/images/',
})
```

**Markdown 写法：**

```markdown
![我的照片](photo.jpg) 
<!-- 最终解析为: https://cdn.example.com/images/photo.jpg -->
```

**场景 B：每篇文章有独立的图片目录（默认）**

您可以在 Frontmatter 中指定目录名：

```yaml
---
title: 我的第一次 GitHub PR
imageDir: "2025-11-26-my-first-github-pr"
---

![我的照片](photo.jpg) 
<!-- 最终解析为: https://cdn.example.com/images/2025-11-26-my-first-github-pr/photo.jpg -->
```

**场景 C：以文件名为目录**

```javascript
photosuite({
  scope: '#main',
  imageBase: 'https://cdn.example.com/',
  fileDir: true, // 开启此选项
})
```

如果您的文章文件名是 `2025-11-26-my-first-github-pr.md`，图片路径会自动解析为：

`https://cdn.example.com/images/2025-11-26-my-first-github-pr/photo.jpg`

### 2. EXIF 信息展示

Photosuite 使用 `exiftool-vendored.js` 在构建时提取信息。

**默认配置：**
默认显示：相机型号、镜头型号、焦距、光圈、快门速度、ISO、拍摄时间。

> NIKON Z 30 · NIKKOR Z DX 16-50mm f/3.5-6.3 VR · 20.5 mm · ƒ/3.8 · 1/15 · ISO 1000 · 2025/12/9

**自定义配置：**

```javascript
photosuite({
  // ...
  exif: {
    enabled: true,
    // 自定义显示字段：焦距、光圈、快门速度、ISO
    fields: ['FocalLength', 'FNumber', 'ExposureTime', 'ISO'], 
    // 自定义分隔符
    separator: ' · ' 
  }
})
```

**按页面过滤：**

`scope` 是一个 CSS 选择器，只控制**客户端**行为（灯箱、标题、拼图）。EXIF rehype 插件在**构建时**对**所有** Markdown 中的 `<img>` 进行处理，将其改写为 `.photosuite-item` + `.photosuite-exif` 的 DOM 结构。如果你有非文章页（如 `about.md`）不在 `scope` 容器内，构建产物的 HTML 中仍然会出现 EXIF 注入的标签。

要限定 EXIF 注入只作用于特定页面，可任选其一：

**方式一 配置 glob 模式**：

```javascript
photosuite({
  scope: '#article',
  exif: {
    // 仅处理匹配的文件；未配置时处理所有 Markdown
    include: ['src/content/posts/**/*.md'],
    // 跳过匹配的文件；优先级高于 include
    exclude: ['src/content/pages/**/*.md'],
  },
})
```

模式相对于项目根目录解析，分隔符自动归一化为 `/`。支持通配符：`*`（段内任意字符）、`**`（跨段匹配）、`?`（单字符）。

**方式二 Frontmatter 单页 opt-out**：

```yaml
---
title: 关于
exif: false        # 或：photosuite: false
---
```

页面 frontmatter 含 `exif: false`、`photosuite: false` 或 `photosuite.exif: false` 时直接跳过，优先级高于 `include` / `exclude`。

### 2. 图片拼图

Photosuite 支持自动将连续的图片组合成拼图布局。当 Markdown 中有 2-3 张图片紧挨着时，它们会自动组合成拼图，且每张图片都独立可点击。

**Markdown 写法：**

两张图片拼图：

```markdown
![图片1](photo1.jpg)
![图片2](photo2.jpg)
```

三张图片拼图：

```markdown
![图片1](photo1.jpg)
![图片2](photo2.jpg)
![图片3](photo3.jpg)
```

**特性：**

- 自动检测连续的图片（2-3张）
- 每张图片宽度一致，均分容器宽度
- 每张图片独立可点击，都支持灯箱功能
- 交互体验：鼠标悬停时图片自动轻微放大
- 响应式设计：移动端自动切换为单列布局

**配置：**

```javascript
photosuite({
  // ...
  // 关闭拼图功能
  imageGrid: false,
})
```

### 4. 灯箱与标题

Fancybox 经过我定制后，与官方版本有些许差异

支持原生配置，可参考：[Fancybox](https://fancyapps.com/fancybox/)

```javascript
photosuite({
  // ...
  // 关闭灯箱功能
  fancybox: false,
  
  // 关闭图片标题
  imageAlts: false,

  // Fancybox 原生配置传递
  fancyboxOptions: {
    Carousel: {
      infinite: false,
      Toolbar: {
        display: {
          left: ["infobar"],
          middle: [],
          right: ["slideshow", "download", "thumbs", "close"],
        },
      },
    },
  }
})
```

## 完整配置参考

### 参数列表

| 参数                | 类型                    |  必填 | 默认值                  | 说明                                            |
| :---------------- | :-------------------- | :-: | :------------------- | :-------------------------------------------- |
| `scope`           | `string`              |  ✅  | -                    | **生效范围**。CSS 选择器，仅处理该容器内的图片，可包含多个选择器，用逗号分隔    |
| `selector`        | `string`              |  ❌  | `"a[data-fancybox]"` | **图片选择器**。指定哪些图片需要启用灯箱效果                      |
| `imageBase`       | `string`              |  ❌  | -                    | **图片基础 URL**。用于拼接相对路径的前缀                      |
| `imageDir`        | `string`              |  ❌  | `"imageDir"`         | **目录字段名**。在 Markdown Frontmatter 中指定图片目录的字段名称 |
| `fileDir`         | `boolean`             |  ❌  | `false`              | **文件名归档**。是否自动使用 Markdown 文件名作为图片子目录          |
| `fancybox`        | `boolean`             |  ❌  | `true`               | **启用灯箱**。是否加载 Fancybox 模块                     |
| `imageAlts`       | `boolean`             |  ❌  | `true`               | **启用标题**。是否将 `alt` 属性显示为图片标题                  |
| `imageGrid`       | `boolean`             |  ❌  | `true`               | **启用拼图**。是否将连续的图片（2-3张）组合成拼图布局                |
| `exif`            | `boolean` \| `object` |  ❌  | `true`               | **启用 EXIF**。可通过 fields:\[] 配置显示选项             |
| `fancyboxOptions` | `object`              |  ❌  | -                    | **灯箱原生配置**。透传给 Fancybox 的配置项                  |

### 全部配置代码示例

```javascript
import photosuite from 'photosuite';
import "photosuite/dist/photosuite.css";

photosuite({
  // ----------------
  // 必填项
  // ----------------
  scope: '#main', // 您的文章容器类名

  // ----------------
  // 选填项 (以下均为默认值)
  // ----------------
  
  // 基础设置
  selector: 'a[data-fancybox]',
  
  // 路径解析
  imageBase: '', 
  imageDir: 'imageDir',
  fileDir: false,

  // 功能开关
  fancybox: true,
  imageAlts: true,
  imageGrid: true,
  
  // EXIF 详细配置
  exif: {
    enabled: true,
    fields: [
      'Model',            // 相机型号
      'LensModel',        // 镜头型号
      'FocalLength',      // 焦距
      'FNumber',          // 光圈
      'ExposureTime',     // 快门速度
      'ISO',              // 感光度
      'DateTimeOriginal'  // 拍摄时间
    ],
    separator: ' · ',     // 分隔符
    // 按页面过滤（v0.3.1 起支持）
    include: undefined,   // string[] glob 模式；未配置时处理所有页面
    exclude: undefined,   // string[] glob 模式；优先级高于 include
  },

  // Fancybox 原生配置传递
  fancyboxOptions: {
    wheel: "slide", // 支持滚轮切换
    Hash: false,    // 禁用 URL 哈希
    Html: {
      video: {
        autoplay: false, // 禁用视频自动播放
      },
    },
    Carousel: {
      Thumbs: false, // 关闭缩略图
      infinite: false, // 禁用无限循环
      Toolbar: {
        display: {
          left: ["counter"], // 左上角显示页码
          right: ["autoplay", "close"], // 右上角显示自动播放和关闭按钮
        },
      },
    },
  }
})
```

## 常见问题

**1.我的非文章页（如关于页）虽然不在 `scope` 容器内，为什么仍然带有 EXIF 信息？**
A: `scope` 仅控制**客户端**行为。EXIF rehype 插件在**构建时**对所有 Markdown 生效。可使用 `exif.include` / `exif.exclude` glob 模式过滤，或在页面 frontmatter 中添加 `exif: false`。详见 [EXIF 信息展示 § 按页面过滤](#2-exif-信息展示)。

**2.为什么 EXIF 信息没有显示？**
A: 请检查以下几点：

1. 图片是否包含 EXIF 信息（某些压缩工具会去除 EXIF）
2. EXIF 信息至少有曝光三要素（焦距、光圈、快门速度）时，才会显示

**3.我想只在某些图片上使用 Photosuite，怎么办？**
A: 您可以通过 CSS 选择器精确控制范围（多个选择器用逗号分隔）例如，只在类名为 `'#main` 的元素内部生效：

```javascript
photosuite({
  scope: '#main',
  // ... 其他配置
})
```

注意：`scope` 只影响客户端行为；若希望服务端 EXIF 注入也只对特定页面生效，请使用 `exif.include` / `exif.exclude` 或 frontmatter opt-out（见上）。

## 贡献者们

一行代码，一个插件，对于独立博客而言，微不足道，如同尘埃。

但我们偏要在这片土壤中扎根，让思想自由，让灵魂安放！

[![](https://contrib.rocks/image?repo=achuanya/photosuite)](https://github.com/achuanya/photosuite/graphs/contributors)

## 他们在用

- [Frevia](https://www.frevia.site)
- [ZhiJun's Blog](https://blog.zhijun.io)

如果你也在使用 Photosuite，可自行编辑加入！

## 开源许可协议

[GPL-3.0](./LICENSE)