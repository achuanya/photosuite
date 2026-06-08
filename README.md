<div align="center">
  <a href="/">
    <img src="/public/logo.svg" alt="Photosuite" width="120" />
    <br/>
    <h1>Photosuite</h1>
  </a>

  <p>
    <a href="https://photosuite.lhasa.icu">Official Website</a> •
    <a href="https://github.com/achuanya/photosuite/releases">Latest Release</a> •
    <a href="https://github.com/achuanya/photosuite/blob/main/Changelog.md">Changelog</a> •
    <a href="./README.zh-CN.md">简体中文</a>
  </p>
</div>

Photosuite is a simple yet feature-rich image integration tailored for independent blogs. It modularly integrates lightbox, EXIF data, path resolution, image grid, and more into a single, zero-config package. Out of the box, no tedious configuration required—give your blog images a fresh look with just one line of code!

## Features

*   **Lightbox**: Customized Fancybox integration, minimalist and practical.
*   **Static EXIF**: Integrated `exiftool-vendored.js` supporting custom EXIF parameters.
*   **Path Resolution**: Just insert the filename, and the path is auto-resolved at build time.
*   **Captions**: Automatically displays image `alt` attributes as captions.
*   **Image Grid**: Automatically groups consecutive images (2-3) into a grid layout, each independently clickable.
*   **Extreme Performance**: All features are purely static, processed at build time, runtime dependency-free, modular, and loaded on demand.
*   **Zero-Config**: Default settings satisfy most needs, with rich options for deep customization.

## Installation

```bash
pnpm add photosuite
# or
npm install photosuite
# or
yarn add photosuite
```

## Quick Start

Integrating Photosuite with Astro is very simple, just add the following configuration to `astro.config.js`:

```javascript
import { defineConfig } from 'astro/config';
import photosuite from 'photosuite';
import "photosuite/dist/photosuite.css";

export default defineConfig({
  integrations: [
    photosuite({
      // [Required] Specify the CSS selector for the scope
      // Recommended: Your content container to avoid affecting other parts of the site. Supports multiple selectors separated by commas.
      scope: '#main', 
    })
  ]
});
```

Once configured, Photosuite will automatically process all images within your specified scope.

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

**Per-Page Filtering:**

`scope` is a CSS selector that only governs *client-side* behavior (lightbox, captions, grid). The EXIF rehype plugin runs at build time on **every** Markdown file's `<img>` tags and rewrites their DOM into `.photosuite-item` + `.photosuite-exif`. If you have non-article pages (e.g. `about.md`) outside the `scope` container, you'll still see the injected EXIF markup in the HTML.

To restrict EXIF injection to specific pages, use either of:

**Option 1 Glob patterns in config**:

```javascript
photosuite({
  scope: '#article',
  exif: {
    // Only process matched files; omit to process all
    include: ['src/content/posts/**/*.md'],
    // Skip matched files; takes precedence over include
    exclude: ['src/content/pages/**/*.md'],
  },
})
```

Patterns are matched against paths relative to the project root, normalized with `/` separators. Supported wildcards: `*` (within a segment), `**` (across segments), `?` (single character).

**Option 2 Frontmatter opt-out**:

```yaml
---
title: About
exif: false        # or: photosuite: false
---
```

Pages with `exif: false`, `photosuite: false`, or `photosuite.exif: false` in frontmatter are skipped regardless of `include`/`exclude`.

### 3. Image Grid

Photosuite supports automatically combining consecutive images into a grid layout. When 2-3 images are placed adjacently in Markdown, they will be automatically combined into a grid, and each image remains independently clickable.

**Markdown Usage:**

Two-image grid:
```markdown
![Image 1](photo1.jpg)
![Image 2](photo2.jpg)
```

Three-image grid:
```markdown
![Image 1](photo1.jpg)
![Image 2](photo2.jpg)
![Image 3](photo3.jpg)
```

**Features:**
- Automatically detects consecutive images (2-3 images)
- Each image has consistent width, evenly dividing the container
- Each image is independently clickable with lightbox support
- Interactive experience: Image zooms in slightly on hover
- Responsive design: automatically switches to single-column layout on mobile devices

**Configuration:**
```javascript
photosuite({
  // ...
  // Disable image grid
  imageGrid: false,
})
```

### 4. Lightbox & Captions

Fancybox has been customized to differ slightly from the official version.

Supports native configuration, refer to: [Fancybox](https://fancyapps.com/fancybox/)

```javascript
photosuite({
  // ...
  // Disable lightbox
  fancybox: false, 
  
  // Disable captions
  imageAlts: false,

  // Fancybox native options
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

## Complete Configuration Reference

### Parameter List

| Parameter | Type | Required | Default | Description |
| :--- | :--- | :---: | :--- | :--- |
| `scope` | `string` | ✅ | - | **Scope**. CSS selector, only processes images within this container. Supports multiple selectors separated by commas. |
| `selector` | `string` | ❌ | `"a[data-fancybox]"` | **Image Selector**. Specifies which images need lightbox effect. |
| `imageBase` | `string` | ❌ | - | **Base Image URL**. Prefix used for splicing relative paths. |
| `imageDir` | `string` | ❌ | `"imageDir"` | **Directory Field Name**. Field name in Markdown Frontmatter to specify image subdirectory. |
| `fileDir` | `boolean` | ❌ | `false` | **Filename Archiving**. Whether to automatically use Markdown filename as image subdirectory. |
| `fancybox` | `boolean` | ❌ | `true` | **Enable Lightbox**. Whether to load Fancybox module. |
| `imageAlts` | `boolean` | ❌ | `true` | **Enable Captions**. Whether to display `alt` attribute as image caption. |
| `imageGrid` | `boolean` | ❌ | `true` | **Enable Image Grid**. Whether to combine consecutive images (2-3) into a grid layout. |
| `exif` | `boolean` \| `object` | ❌ | `true` | **Enable EXIF**. `false` to disable, `true` for default config, or pass object to customize via fields:[]. |
| `fancyboxOptions` | `object` | ❌ | - | **Native Lightbox Config**. Configuration items passed through to Fancybox. |

### Full Configuration Code Example

```javascript
import photosuite from 'photosuite';
import "photosuite/dist/photosuite.css";

photosuite({
  // ----------------
  // Required
  // ----------------
  scope: '#main', // Your content container class name
  
  // ----------------
  // Optional (Values below are defaults)
  // ----------------
  
  // Basic Settings
  selector: 'a[data-fancybox]',
  
  // Path Resolution
  imageBase: '', 
  imageDir: 'imageDir',
  fileDir: false,

  // Feature Toggles
  fancybox: true,
  imageAlts: true,
  imageGrid: true,
  
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
    separator: ' · ',     // Separator
    // Per-page filtering (since v0.3.1)
    include: undefined,   // string[] of glob patterns; omit to process all pages
    exclude: undefined,   // string[] of glob patterns; takes precedence over include
  },

  // Fancybox native options
  fancyboxOptions: {
    wheel: "slide", // Enable wheel navigation
    Hash: false,    // Disable URL hash
    Html: { // HTML content configuration
      video: { // Video configuration
        autoplay: false, // Disable video autoplay
      },
    },
    Carousel: { // Carousel configuration
      Thumbs: false, // Disable thumbnails
      infinite: false, // Disable infinite loop
      Toolbar: { // Toolbar configuration
        display: { // Display items configuration
          left: ["counter"], // Left side: page counter
          right: ["autoplay", "close"], // Right side: autoplay and close buttons
        },
      },
    },
  }
})
```

## FAQ

**Q: My non-article pages (e.g. about page) still show EXIF info even though they're outside the `scope` container.**
A: `scope` only controls *client-side* behavior. The EXIF rehype plugin runs at build time on every Markdown file. Restrict it via `exif.include` / `exif.exclude` glob patterns, or add `exif: false` to a page's frontmatter. See [EXIF Data Display § Per-Page Filtering](#2-exif-data-display).

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

## Users

- [Frevia](https://www.frevia.site)
- [ZhiJun's Blog](https://blog.zhijun.io)

If you are using using Photosuite, please edit this file to add your blog.

## License

[GPL-3.0](./LICENSE)