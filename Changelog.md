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