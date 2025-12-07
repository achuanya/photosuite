import './style.css'
import { photosuite } from './index'

photosuite({
  glightbox: true,
  imageAlts: true,
  exif: true,
  glightboxOptions: {
    loop: true,
    touchNavigation: true
  }
})