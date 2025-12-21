![Sample Image](public/Wild-squirrel-feeding-interaction-with-hand-in-natural-forest.png)

# Photosuite

[Official Website](https://photosuite.lhasa.icu) • [Latest Release](https://github.com/achuanya/photosuite/releases) • [Changelog](https://github.com/achuanya/photosuite/main/Changelog.md) • [简体中文](./README.zh-CN.md)

Photosuite is a simple yet feature-rich image integration tailored for independent blogs. It modularly integrates lightbox, EXIF data, path resolution, and more into a single, zero-config package. Out of the box, no tedious configuration required—give your blog images a fresh look with just one line of code!

## Features

*   **Lightbox**: Customized and integrated GLightbox for a more minimalist and practical experience.
*   **EXIF**: Integrated `exiftool-vendored.js` for fast execution and broad coverage.
*   **Path Resolution**: Simply insert the filename, and it automatically resolves the absolute path.
*   **Captions**: Automatically extracts the image's `alt` attribute to display as a caption.
*   **Performance**: Purely static, modular features, loaded on demand.
*   **Zero-Config Start**: Default settings satisfy most needs, while offering rich options for deep customization.

## Installation

```bash
pnpm add photosuite
# or
npm install photosuite
# or
yarn add photosuite
```

## Quick Start

> **Note**: `scope` is the only **required** field, used to specify the scope where the plugin takes effect, avoiding impact on other parts of the site.

```javascript
import { defineConfig } from 'astro/config';
import photosuite from 'photosuite';

export default defineConfig({
  integrations: [
    photosuite({
      // [Required] Specify the CSS selector for the scope
      // Recommended: Your content container. Supports multiple selectors separated by commas.
      scope: '#main', 
    })
  ]
});
```

Once configured, Photosuite will automatically process all images in your Markdown/MDX files.

## Features & Configuration

### 1. Path Resolution

Managing image paths in blog posts can be tedious. Photosuite offers flexible resolution strategies that you can configure according to your needs.

**Scenario A: All images in a single domain/directory**

```javascript
photosuite({
  scope: '#main',
  imageBase: 'https://cdn.example.com/images/',
})
```

**Markdown Usage:**
```markdown
![My Photo](photo.jpg) 
<!-- Resolves to: https://cdn.example.com/images/photo.jpg -->
```

**Scenario B: Separate image directory per post (Default)**

You can specify the directory name in the Frontmatter:

```yaml
---
title: My First GitHub PR
imageDir: "2025-11-26-my-first-github-pr"
---

![My Photo](photo.jpg) 
<!-- Resolves to: https://cdn.example.com/images/2025-11-26-my-first-github-pr/photo.jpg -->
```

**Scenario C: Use filename as directory**

```javascript
photosuite({
  scope: '#main',
  imageBase: 'https://cdn.example.com/',
  fileDir: true, // Enable this option
})
```

If your post filename is `2025-11-26-my-first-github-pr.md`, the image path automatically resolves to:

`https://cdn.example.com/images/2025-11-26-my-first-github-pr/photo.jpg`

### 2. EXIF Data Display

Photosuite uses `exiftool-vendored.js` to extract information at build time.

**Default Configuration:**
Default display: Camera Model, Lens Model, Focal Length, Aperture, Shutter Speed, ISO, Date Original.

> NIKON Z 30 · NIKKOR Z DX 16-50mm f/3.5-6.3 VR · 20.5 mm · ƒ/3.8 · 1/15 · ISO 1000 · 2025/12/9

**Custom Configuration:**

```javascript
photosuite({
  // ...
  exif: {
    enabled: true,
    // Custom fields: Focal Length, Aperture, Shutter Speed, ISO
    fields: ['FocalLength', 'FNumber', 'ExposureTime', 'ISO'], 
    // Custom separator
    separator: ' · ' 
  }
})
```

### 3. Lightbox & Captions

GLightbox has been customized to differ slightly from the official version.

Supports native configuration, refer to: [GLightbox](https://github.com/achuanya/glightbox)

```javascript
photosuite({
  // ...
  // Disable lightbox
  glightbox: false, 
  
  // Disable captions
  imageAlts: false,

  // Pass native GLightbox options
  glightboxOptions: {
    loop: true,
    zoomable: true,
  }
})
```

## Complete Configuration Reference

### Parameter List

| Parameter | Type | Required | Default | Description |
| :--- | :--- | :---: | :--- | :--- |
| `scope` | `string` | ✅ | - | **Scope**. CSS selector, only processes images within this container. Supports multiple selectors separated by commas. |
| `selector` | `string` | ❌ | `"a.glightbox"` | **Image Selector**. Specifies which images need lightbox effect. |
| `imageBase` | `string` | ❌ | - | **Base Image URL**. Prefix used for splicing relative paths. |
| `imageDir` | `string` | ❌ | `"imageDir"` | **Directory Field Name**. Field name in Markdown Frontmatter to specify image subdirectory. |
| `fileDir` | `boolean` | ❌ | `false` | **Filename Archiving**. Whether to automatically use Markdown filename as image subdirectory. |
| `glightbox` | `boolean` | ❌ | `true` | **Enable Lightbox**. Whether to load GLightbox module. |
| `imageAlts` | `boolean` | ❌ | `true` | **Enable Captions**. Whether to display `alt` attribute as image caption. |
| `exif` | `boolean` \| `object` | ❌ | `true` | **Enable EXIF**. `false` to disable, `true` for default config, or pass object to customize via fields:[]. |
| `glightboxOptions` | `object` | ❌ | - | **Native Lightbox Config**. Configuration items passed through to GLightbox. |

### Full Configuration Code Example

```javascript
photosuite({
  // ----------------
  // Required
  // ----------------
  scope: '#main', // Your content container class name
  
  // ----------------
  // Optional (Values below are defaults)
  // ----------------
  
  // Basic Settings
  selector: 'a.glightbox',
  
  // Path Resolution
  imageBase: '', 
  imageDir: 'imageDir',
  fileDir: false,

  // Feature Toggles
  glightbox: true,
  imageAlts: true,
  
  // EXIF Detailed Configuration
  exif: {
    enabled: true,
    fields: [
      'Model',            // Camera Model
      'LensModel',        // Lens Model
      'FocalLength',      // Focal Length
      'FNumber',          // Aperture
      'ExposureTime',     // Shutter Speed
      'ISO',              // ISO
      'DateTimeOriginal'  // Date Original
    ],
    separator: ' · '      // Separator
  },

  // Native GLightbox Configuration
  glightboxOptions: {
    loop: true,
    touchNavigation: true,
    closeOnOutsideClick: true
  }
})
```

## FAQ

**Q: Why isn't EXIF data showing?**
A: Please check the following:
1. Does the image contain EXIF data? (Some compression tools strip EXIF)
2. EXIF data is only displayed when at least the exposure triangle (Focal Length, Aperture, Shutter Speed) is present.

**Q: I only want to use Photosuite on certain images, what should I do?**
A: You can precisely control the scope via CSS selectors (comma-separated for multiple selectors). For example, only take effect inside elements with ID `#main`:

```javascript
photosuite({
  scope: '#main',
  // ... other configurations
})
```

## Contributors

One line of code, one plugin, for independent blogs, it is insignificant, like dust.

But we insist on taking root in this soil, letting thought be free, and letting the soul rest!

[![](https://contrib.rocks/image?repo=achuanya/photosuite)](https://github.com/achuanya/photosuite/graphs/contributors)

## Supporters
[![Stargazers repo roster for @achuanya/photosuite](https://reporoster.com/stars/achuanya/photosuite)](https://github.com/achuanya/photosuite/stargazers)

## License

[GPL-3.0](./LICENSE)
