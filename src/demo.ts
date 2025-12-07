/**
 * @file demo.ts
 * @description 演示页面的入口脚本，用于展示 Photosuite 的功能
 */

import './style.css'
import { photosuite } from './index'

// 初始化 Photosuite，启用所有功能并配置 GLightbox 选项
photosuite({
  glightbox: true,
  imageAlts: true,
  exif: true,
  glightboxOptions: {
    loop: true,
    touchNavigation: true
  }
})