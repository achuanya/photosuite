## [v0.3.0](https://github.com/achuanya/photosuite/compare/v0.2.0...v0.3.0) (2026-06-07)

### 性能优化

- **EXIF 提取大幅提速**，解决每次 `pnpm dev` 长时间等待的问题
  - 新增持久化磁盘缓存（`node_modules/.cache/photosuite/`），以图片 URL 为键。
    CDN 图片内容不可变，后续 dev 启动直接命中缓存，跳过联网下载与解析
  - 下载改用 HTTP Range 仅获取文件头部（JPEG 的 EXIF 位于开头），大幅减少传输量
  - 新增下载并发限制（默认 6）+ 请求超时 + 失败重试，修复并发联网导致的 `ECONNRESET`
  - 对「已解析但无可用 EXIF」的图片做负缓存，避免重复下载；网络/HTTP 错误不进入负缓存，下次自动重试

### 新增配置

- `exif.cache`：是否启用磁盘缓存（默认 `true`）
- `exif.concurrency`：远程图片最大下载并发数（默认 `6`）
- `exif.timeout`：单次下载超时毫秒数（默认 `15000`）
- `exif.headerBytes`：下载的文件头字节数，`0` 表示下载完整文件（默认 `131072`）

---

## [v0.2.0](https://github.com/achuanya/photosuite/compare/v0.1.2...v0.2.0) (2026-01-18)

### 新增功能

- **自动拼图**
  - 不引入新语法，通过连续插入图片即可自动生成拼图
  - 自动处理图片布局，支持混合比例图片等高对齐（最多 3 张）

- **灯箱组件更换**
  - 核心组件由 GLightbox 更换为 Fancybox (v6.1.7)

- **产品页面**
  - 引入 Astro 6 框架，响应式设计
  - 添加 Artalk UI 评论系统
  - 添加 Umami 统计分析

---

## [v0.1.2](https://github.com/achuanya/photosuite/compare/v0.1.1...v0.1.2) (2025-12-28)

### Bug 修复

- 修正模块导入路径并简化package.json配置
- 将photosuite的导入路径从'photosuite'改为'photosuite/client'以明确区分客户端使用
- 简化exports配置，移除冗余的模块导出路径

---

## [v0.1.1](https://github.com/achuanya/photosuite/compare/v0.1.0...v0.1.1) (2025-12-28)

### Bug 修复
- 修复空 EXIF 条目仍然显示的问题，当 EXIF 内容为空时自动隐藏
- 优化 EXIF 数据处理逻辑，仅在曝光三要素（光圈 / 快门 / ISO）完整时才显示
- 客户端不再自动创建空 EXIF 条目，与构建阶段的处理逻辑保持一致

## [v0.1.0](https://github.com/achuanya/photosuite/compare/v0.1.0...v0.1.0) (2025-12-28)

PhotoSuite 首个版本正式发布！

这是 PhotoSuite 的第一个公开版本，标志着项目的正式起步。本版本完成了基础架构搭建与核心功能实现，为后续功能扩展和性能优化打下基础。

### 新增功能
- 完成 PhotoSuite 核心项目结构搭建
- 实现图片路径解析机制
- 集成 `exiftool-vendored.js`，支持图片元信息读取
- 定制并集成 GLightbox 灯箱组件
- 自动读取图片 `alt` 信息并用于标题展示
- 纯静态架构，功能模块化设计，支持按需加载

### 后续计划
- 实现图片懒加载与占位符支持
- 优化 PhotoSuite 资源加载与性能表现

- 当前版本仍处于早期阶段（`0.1.0`），功能与接口在后续版本中可能会发生调整，欢迎提交 Issue 或参与贡献