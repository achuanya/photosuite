import './style.css'
import { photosuite } from './index'

photosuite({
  glightbox: false,
  imageAlts: true,
  exif: true,
  glightboxOptions: {
    loop: true,
    touchNavigation: true
  }
})