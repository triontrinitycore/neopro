# NEOPRO LOGO - BRAND GUIDELINES
## Panduan Penggunaan Logo untuk Web App

---

## 📐 SPESIFIKASI LOGO

### Dimensi & Format
```
Logo Original: 1024x1024px (square format)
Format File: PNG dengan transparent background
Color Space: sRGB
Resolution: 72 DPI (web) / 300 DPI (print)
```

### Logo Anatomy
```
┌─────────────────────────────┐
│                             │
│    [Blue Arrow Up]          │ ← Geometric icon (house/pointer shape)
│    [Gray Arrow Down]        │ ← Represents "Neo" (new) + "Pro" (professional)
│                             │
│       N e o P r o           │ ← Clean, modern typography
│                             │
└─────────────────────────────┘

Symbol Meaning:
- Blue Arrow Up: Forward movement, innovation, solutions
- Gray Arrow Down: Foundation, stability, reliability
- House Shape: Home, safety, community
- Interconnected: Unity, network, collaboration
```

---

## 🎨 COLOR PALETTE

### Primary Colors
```css
/* Main Blue (Icon) */
--neopro-blue: #3B82F6;
--neopro-blue-light: #60A5FA;
--neopro-blue-dark: #2563EB;

/* Main Gray (Icon) */
--neopro-gray: #64748B;
--neopro-gray-light: #94A3B8;
--neopro-gray-dark: #475569;

/* Background Colors */
--background-primary: #0F172A;    /* Slate-900 */
--background-secondary: #1E293B;  /* Slate-800 */
--background-tertiary: #334155;   /* Slate-700 */

/* Text Colors */
--text-primary: #FFFFFF;
--text-secondary: #CBD5E1;        /* Slate-300 */
--text-muted: #94A3B8;           /* Slate-400 */
```

### Gradient Variations
```css
/* Primary Gradient */
background: linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%);

/* Dark Gradient (for backgrounds) */
background: linear-gradient(to bottom right, #1E293B, #0F172A);

/* Accent Gradient */
background: linear-gradient(45deg, #3B82F6, #8B5CF6);
```

---

## 📏 SIZE VARIATIONS

### Web Application Sizes
```
Favicon: 16x16, 32x32, 48x48
Mobile Icon: 180x180 (iOS), 192x192 (Android)
Navbar: 40-48px height
Header: 64-96px height
Hero Section: 128-160px height
Splash Screen: 200-256px height
```

### Minimum Size
```
Smallest usable size: 24px height
Below 24px: Use icon only (without text)
```

### Clear Space
```
Minimum clear space around logo = Height of logo ÷ 4

Example:
If logo height = 48px
Clear space = 12px on all sides
```

---

## 🎯 LOGO VARIANTS

### 1. Full Logo (Primary)
```
Use: Main website, app headers, marketing materials
Context: When space allows horizontal layout
Minimum width: 120px
```

### 2. Icon Only
```
Use: Favicon, app icon, social media profile, mobile navbar
Context: Square format, limited space
Minimum size: 24x24px
```

### 3. Stacked Logo
```
Use: Vertical layouts, mobile splash screens
Context: Tall narrow spaces
Icon on top, text below
```

### 4. Monochrome Versions
```
White on Dark: Primary use for dark UI
Dark on Light: For light backgrounds (use sparingly)
Single Color: For printing, watermarks
```

---

## ✅ DO'S - Correct Usage

### ✓ Proper Placements
```
✓ Use on dark backgrounds (primary)
✓ Maintain aspect ratio when scaling
✓ Provide adequate clear space
✓ Use high-resolution files
✓ Center align when standalone
✓ Left align in navigation bars
✓ Use official color palette
✓ Pair with brand typography
```

### ✓ Responsive Behavior
```
Desktop (>1024px):  Full logo with text
Tablet (768-1024px): Full logo, slightly smaller
Mobile (<768px):    Icon only in navbar, full logo in hero
```

### ✓ Animation Guidelines
```
✓ Fade in/out: 0.3-0.5s duration
✓ Scale: Max 110%, ease-in-out
✓ Rotate: Max ±5 degrees for subtle effect
✓ Float/Bounce: 3-5s duration for hero sections
```

---

## ❌ DON'TS - Incorrect Usage

### ✗ Prohibited Actions
```
✗ DO NOT stretch or distort
✗ DO NOT rotate (except subtle animations)
✗ DO NOT change colors arbitrarily
✗ DO NOT add drop shadows (built-in)
✗ DO NOT place on busy backgrounds
✗ DO NOT outline the logo
✗ DO NOT rearrange elements
✗ DO NOT use low-resolution files
✗ DO NOT place too close to edges
✗ DO NOT use on light backgrounds without adjustment
```

### ✗ Color Mistakes
```
✗ DO NOT use rainbow colors
✗ DO NOT invert colors randomly
✗ DO NOT add gradients to text
✗ DO NOT use neon/fluorescent colors
```

---

## 🖥️ IMPLEMENTATION EXAMPLES

### HTML - Basic Usage
```html
<!-- Full Logo -->
<img 
  src="/assets/neopro-logo.png" 
  alt="NeoPro Emergency Response" 
  class="h-12 w-auto"
/>

<!-- With Link -->
<a href="/" class="flex items-center gap-2 hover:opacity-80 transition">
  <img src="/assets/neopro-logo.png" alt="NeoPro" class="h-10" />
</a>

<!-- Favicon -->
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
```

### CSS - Styling
```css
/* Logo container */
.logo-container {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: transform 0.3s ease;
}

.logo-container:hover {
  transform: scale(1.05);
}

/* Responsive logo */
.logo-responsive {
  height: 3rem; /* 48px */
  width: auto;
  object-fit: contain;
}

@media (max-width: 768px) {
  .logo-responsive {
    height: 2rem; /* 32px */
  }
}

/* Loading animation */
@keyframes logo-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.logo-loading {
  animation: logo-pulse 2s infinite;
}
```

### React Component
```jsx
const Logo = ({ size = 'md', variant = 'full' }) => {
  const sizes = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-16',
    xl: 'h-24'
  };

  return (
    <div className="logo-container">
      <img
        src="/assets/neopro-logo.png"
        alt="NeoPro"
        className={`${sizes[size]} w-auto object-contain`}
      />
      {variant === 'full' && (
        <span className="text-white font-bold text-xl">
          NeoPro
        </span>
      )}
    </div>
  );
};
```

---

## 📱 PLATFORM-SPECIFIC GUIDELINES

### Web App
```
Navbar: 40-48px height, left aligned
Footer: 48-64px height, centered
Loading: 96-128px, animated pulse/bounce
404 Page: 128px, centered with sad expression variant
```

### Mobile App (iOS/Android)
```
App Icon: 1024x1024px (square, rounded corners auto-applied)
Splash Screen: Full logo, 200px height, centered
Tab Bar: Icon only, 25x25pt (@3x = 75x75px)
Push Notification: Icon only, 40x40pt
```

### Social Media
```
Facebook: 180x180px (profile), 820x312px (cover with logo)
Instagram: 110x110px (profile pic)
Twitter: 400x400px (profile), 1500x500px (header)
LinkedIn: 300x300px (logo), 1584x396px (cover)
```

### Email Signature
```
Height: 50-60px
Format: PNG with transparent background
Placement: Left of name/title
Link to: https://neopro.id
```

---

## 🎨 BACKGROUND USAGE

### Recommended Backgrounds
```
✓ Solid dark colors (#0F172A to #334155)
✓ Dark gradients (slate-900 to slate-700)
✓ Dark photos with 50%+ overlay
✓ Blurred dark images
```

### Light Background Alternative
```
For rare light background use:
- Add dark outline/stroke
- Use shadow: 0 2px 8px rgba(0,0,0,0.3)
- Ensure 4.5:1 contrast ratio minimum
```

---

## ⚡ PERFORMANCE OPTIMIZATION

### File Formats
```
Web: PNG-24 (with transparency) or WebP
Print: SVG (vector) or PNG at 300 DPI
Icon: ICO multi-size for favicon
```

### Compression
```
PNG: TinyPNG or ImageOptim
WebP: Quality 80-85
SVG: SVGO optimizer
Max file size: <50KB for web
```

### Loading Strategy
```
1. Use <link rel="preload"> for above-fold logo
2. Lazy load footer logo
3. Use srcset for responsive images
4. Implement fade-in animation on load
```

---

## 🌐 ACCESSIBILITY

### Alt Text Guidelines
```
Navbar: "NeoPro" or "NeoPro Home"
Hero: "NeoPro Emergency Response System"
Footer: "NeoPro Logo"
Icon only: "NeoPro"
```

### Contrast Requirements
```
Logo on background: Minimum 3:1 (graphic objects)
Text portion: Minimum 4.5:1 (normal text)
Interactive logo: 3:1 with focus indicator
```

### Focus States
```
Keyboard focus:
- Outline: 2px solid white
- Outline offset: 2px
- Border radius: 4px
```

---

## 📊 BRAND CONSISTENCY CHECKLIST

Before publishing any material with logo:

- [ ] Logo is correct size for medium
- [ ] Clear space is maintained
- [ ] Colors match brand palette
- [ ] File is high resolution
- [ ] Background provides adequate contrast
- [ ] Logo is not distorted
- [ ] Responsive behavior tested
- [ ] Accessibility standards met
- [ ] Loading performance optimized
- [ ] Alt text is descriptive

---

## 🔄 VERSION CONTROL

```
Current Version: v1.0
Last Updated: February 2024
Next Review: August 2024

Version History:
v1.0 (Feb 2024) - Initial brand guidelines
```

---

## 📞 BRAND SUPPORT

Need logo files or have questions?

**Email:** brand@neopro.id  
**Download Assets:** https://neopro.id/brand-assets  
**Brand Portal:** https://brand.neopro.id  

---

## 📦 ASSET PACKAGE CONTENTS

```
neopro-brand-kit/
├── logos/
│   ├── neopro-logo-full.png          # Full logo (1024px)
│   ├── neopro-logo-icon.png          # Icon only (512px)
│   ├── neopro-logo-white.png         # White version
│   ├── neopro-logo-monochrome.png    # Single color
│   └── neopro-logo.svg               # Vector format
├── favicons/
│   ├── favicon-16x16.png
│   ├── favicon-32x32.png
│   ├── apple-touch-icon.png
│   └── favicon.ico
├── mobile/
│   ├── ios-icon-180x180.png
│   ├── android-icon-192x192.png
│   └── splash-screen.png
├── social/
│   ├── facebook-profile.png
│   ├── twitter-profile.png
│   ├── instagram-profile.png
│   └── linkedin-profile.png
└── guidelines/
    ├── brand-guidelines.pdf
    └── usage-examples.pdf
```

---

**NeoPro** - Empowering Communities Through Technology 🚀

*This document is confidential and proprietary to NeoPro.*
