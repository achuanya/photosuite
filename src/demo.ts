import './style.css'
import { initPhotosuite } from './index'

initPhotosuite({
  glightbox: false,
  imageAlts: true,
  exif: true,
  glightboxOptions: {
    loop: true,
    touchNavigation: true
  }
})