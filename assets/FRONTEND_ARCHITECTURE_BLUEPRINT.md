# 🎨 Frontend Architecture Blueprint

> **Purpose:** A complete, reusable reference for building production-grade, visually stunning web applications.
> Extracted from a real production project (Sinai Tech Portal) — every rule here has been battle-tested.

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Color System & Design Tokens](#2-color-system--design-tokens)
3. [Typography System](#3-typography-system)
4. [Icon System](#4-icon-system)
5. [Animation & Motion Design](#5-animation--motion-design)
6. [Component Architecture](#6-component-architecture)
7. [Glassmorphism & Card System](#7-glassmorphism--card-system)
8. [Button & Interactive Elements](#8-button--interactive-elements)
9. [Layout & Responsive Design](#9-layout--responsive-design)
10. [Dark/Light Mode System](#10-darklight-mode-system)
11. [Scrollbar & Micro-Details](#11-scrollbar--micro-details)
12. [Loading States & Skeleton UI](#12-loading-states--skeleton-ui)
13. [Navigation & Sidebar](#13-navigation--sidebar)
14. [Page Transitions](#14-page-transitions)
15. [RTL/LTR Internationalization](#15-rtlltr-internationalization)
16. [Print & PDF Export](#16-print--pdf-export)
17. [Performance Optimization](#17-performance-optimization)
18. [SEO Best Practices](#18-seo-best-practices)
19. [Accessibility (A11y)](#19-accessibility-a11y)
20. [PWA Configuration](#20-pwa-configuration)
21. [AI Prompts for Replication](#21-ai-prompts-for-replication)

---

## 1. Design Philosophy

### Core Principles
- **Premium Feel** — Every pixel should feel intentional. No generic defaults.
- **High Contrast** — Pure `#fafafa` text on dark, pure `#09090b` on light. Zero washed-out gray text.
- **Depth & Dimension** — Use glassmorphism, shadows, and subtle gradients to create visual depth.
- **Alive UI** — Micro-animations on every interaction (hover, focus, page transitions).
- **Content-First** — Design serves the content, never competes with it.

### What to NEVER Do
```
❌ Use default browser fonts (Times New Roman, Arial)
❌ Use default framework colors (purple/indigo/violet defaults)
❌ Use generic AI-bot icons (🤖, robot faces, sparkle ✨ defaults)
❌ Leave text at mid-gray opacity (zinc-400, zinc-500 on dark)
❌ Skip hover/focus states on interactive elements
❌ Use plain white cards without blur, border, or shadow
❌ Use color: inherit on dark mode without forcing contrast
❌ Ship without dark mode support
❌ Use pixel-based media queries without mobile-first approach
```

---

## 2. Color System & Design Tokens

### Primary Palette (Zinc/Slate based)

```css
/* ─── Custom Zinc Scale (fills the gaps between TW defaults) ─── */
--color-zinc-150: #f0f1f4;
--color-zinc-250: #e2e4e9;
--color-zinc-450: #90929e;
--color-zinc-550: #656773;
--color-zinc-650: #42444e;
--color-zinc-850: #1b1c22;

/* ─── Background & Foreground ─── */
--background-dark:  #09090b;    /* zinc-950 */
--background-light: #fafafa;    /* zinc-50  */
--foreground-dark:  #fafafa;
--foreground-light: #09090b;
```

### Accent Color System

| Purpose         | Color        | Hex       | Usage                              |
| --------------- | ------------ | --------- | ---------------------------------- |
| Primary Accent  | Cyan-500     | `#06b6d4` | Buttons, links, focus rings, glow  |
| Secondary       | Teal-600     | `#0d9488` | Gradient endpoints, secondary CTA  |
| Success         | Emerald-500  | `#10b981` | Status badges, success states      |
| Warning         | Amber-500    | `#f59e0b` | Warning badges, caution states     |
| Danger          | Red-500      | `#ef4444` | Error badges, destructive actions  |
| Scrollbar Thumb | Cyan (30%)   | `rgba(6, 182, 212, 0.3)` | Custom scrollbar styling |

### Gradient Recipes

```css
/* Primary CTA Gradient (Cyan → Teal) */
background: linear-gradient(135deg, #06b6d4, #0d9488);

/* Active Sidebar Link */
background: linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(13, 148, 136, 0.15));

/* Light Mode Active Sidebar */
background: linear-gradient(135deg, rgba(6, 182, 212, 0.08), rgba(13, 148, 136, 0.08));
```

### Hard Rule: Maximum Contrast Text

```css
/* DARK MODE: Force ALL gray text to pure white */
.dark [class*="text-zinc-3"],
.dark [class*="text-zinc-4"],
.dark [class*="text-zinc-5"],
.dark [class*="text-zinc-6"],
.dark [class*="text-zinc-7"],
.dark [class*="text-muted"] {
  color: #fafafa !important;
}

/* LIGHT MODE: Force ALL gray text to pure black */
.light-mode [class*="text-zinc-3"],
.light-mode [class*="text-zinc-4"],
.light-mode [class*="text-zinc-5"],
.light-mode [class*="text-zinc-6"],
.light-mode [class*="text-zinc-7"],
.light-mode [class*="text-muted"] {
  color: #09090b !important;
}
```

---

## 3. Typography System

### Font Stack

| Language | Font Family            | Weights Used           | CSS Variable             |
| -------- | ---------------------- | ---------------------- | ------------------------ |
| English  | **Lexend**             | 300-900                | `--font-lexend`          |
| Arabic   | **IBM Plex Sans Arabic** | 300, 400, 500, 600, 700 | `--font-ibm-plex-arabic` |
| System   | SF Pro / Segoe UI / Roboto | Fallback chain     | `--font-sans`            |

### Font Loading (Next.js Google Fonts)

```tsx
import { IBM_Plex_Sans_Arabic, Lexend } from "next/font/google";

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-ibm-plex-arabic",
  display: "swap",     // ← Always use swap for performance
});

const lexend = Lexend({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-lexend",
  display: "swap",
});
```

### CSS Font Rules

```css
/* Global sans-serif */
--font-sans: "Lexend", "IBM Plex Sans Arabic", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

/* Arabic text */
--font-arabic: var(--font-ibm-plex-arabic), "IBM Plex Sans Arabic", system-ui, sans-serif;

/* Text rendering quality */
body {
  font-feature-settings: "cv02", "cv03", "cv04", "cv11";
  letter-spacing: -0.01em;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

/* Arabic text readability */
[dir="rtl"] p,
[dir="rtl"] .prose,
[dir="rtl"] article {
  line-height: 1.65;    /* Slightly more line-height for Arabic */
}
```

### Font Weight Guide

| Element        | Weight | Tailwind Class |
| -------------- | ------ | -------------- |
| Headings       | 750-800 | `font-bold` → `font-extrabold` |
| Button text    | 750    | `font-bold` (custom 750) |
| Labels         | 700    | `font-bold` |
| Body text      | 400-500 | `font-normal` → `font-medium` |
| Captions       | 300-400 | `font-light` → `font-normal` |

---

## 4. Icon System

### Library: Lucide React

```bash
npm install lucide-react
```

### Rules

```
✅ Use Lucide React exclusively for all icons
✅ Tree-shake by importing only needed icons: import { Settings, User } from "lucide-react"
✅ Optimize bundle via next.config.ts: optimizePackageImports: ["lucide-react"]
✅ Use consistent sizing: size={18} for inline, size={20} for buttons, size={24} for headers
✅ Apply strokeWidth={2} or strokeWidth={1.75} for clean lines

❌ Never use emoji icons (🏠, ⚙️) in production UI
❌ Never use multiple icon libraries in the same project
❌ Never use generic AI robot/sparkle icons — use branded UI containers instead
❌ Never hardcode SVG paths — always use the Lucide component
```

### Example Pattern

```tsx
import { GraduationCap, BookOpen, BarChart3 } from "lucide-react";

// Inline with text
<span className="flex items-center gap-2">
  <GraduationCap size={18} strokeWidth={1.75} />
  <span>Academic Record</span>
</span>

// In a button
<button className="btn-primary px-4 py-2">
  <BookOpen size={20} className="mr-2" />
  Open Courses
</button>
```

---

## 5. Animation & Motion Design

### Libraries Used

| Library         | Purpose                                      |
| --------------- | -------------------------------------------- |
| **Framer Motion** | Layout animations, page transitions, modals |
| **GSAP**         | Complex scroll-driven animations, timelines  |
| **CSS Keyframes** | Lightweight loops (shimmer, float, pulse)   |

### Easing Curves

```css
/* Standard ease — buttons, cards, hover effects */
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

/* Quick snap — tooltips, dropdowns */
transition: all 0.2s ease;

/* Spring feel — page entrance */
animation: fadeInPage 0.12s cubic-bezier(0.16, 1, 0.3, 1) forwards;

/* Framer Motion spring */
transition={{ type: "spring", stiffness: 300, damping: 25 }}
```

### Page Transitions (Framer Motion)

```tsx
"use client";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

export function PageTransitionWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
```

### CSS Animation Library

```css
/* ─── Fade In (page sections, cards) ─── */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-fade-in { animation: fadeIn 0.35s ease-out both; }

/* ─── Floating Effect (decorative elements) ─── */
@keyframes floatSlow {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50%      { transform: translateY(-10px) rotate(1deg); }
}
.animate-float { animation: floatSlow 6s ease-in-out infinite; }

/* ─── Pulse Glow (background orbs) ─── */
@keyframes pulseGlow {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50%      { opacity: 0.7; transform: scale(1.05); }
}
.animate-pulse-glow { animation: pulseGlow 8s ease-in-out infinite; }

/* ─── Shine Sweep (premium text, logos) ─── */
@keyframes shine {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
.animate-shine { animation: shine 4s linear infinite; }

/* ─── Marquee (infinite scrolling ribbons) ─── */
@keyframes marquee-ltr {
  0%   { transform: translateX(0%); }
  100% { transform: translateX(-100%); }
}
@keyframes marquee-rtl {
  0%   { transform: translateX(0%); }
  100% { transform: translateX(100%); }
}
```

### Marquee Component Architecture

```css
.marquee-container {
  display: flex !important;
  flex-wrap: nowrap !important;
  overflow: hidden !important;
  user-select: none;
}

.marquee-group-ltr {
  flex-shrink: 0 !important;
  width: max-content !important;
  animation: marquee-ltr 32s linear infinite !important;
  will-change: transform;
}

/* Pause on hover */
.marquee-container:hover .marquee-group-ltr {
  animation-play-state: paused !important;
}
```

### Animation Performance Rules

```
✅ Always use will-change on animated elements (sparingly)
✅ Prefer transform and opacity animations (GPU-composited)
✅ Use contain: layout style paint on complex animated sections
✅ Set animation-play-state: paused on hidden/offscreen elements
✅ Limit GSAP ScrollTrigger to max ~10 instances per page

❌ Never animate width, height, top, left, margin, padding
❌ Never use setInterval for animations — use requestAnimationFrame or CSS
❌ Never nest will-change inside scrollable containers
```

---

## 6. Component Architecture

### File Structure

```
components/
├── ui/                         # Reusable UI primitives
│   ├── button.tsx             # <Button> with variants
│   ├── toast.tsx              # Toast notification system
│   ├── progress.tsx           # Progress bars
│   ├── accordion.tsx          # Collapsible sections
│   ├── animated-number.tsx    # Counting animations
│   ├── count-up.tsx           # Number count-up effect
│   ├── avatar-lightbox-modal.tsx  # Fullscreen image viewer
│   ├── grade-select.tsx       # Custom grade picker
│   └── course-search-picker.tsx   # Searchable select
├── navbar.tsx                 # Top navigation bar
├── MobileSidebar.tsx          # Slide-out mobile nav
├── MobileTaskbar.tsx          # Bottom mobile tab bar
├── GlobalSearchBar.tsx        # Command palette / search
├── page-transition-wrapper.tsx # Route transition animation
├── pwa-installer.tsx          # PWA install prompt
├── MaintenanceScreen.tsx      # Maintenance mode UI
└── guest-notice-banner.tsx    # Auth requirement banner
```

### Component Rules

```
✅ Every component is "use client" if it uses hooks/events
✅ Props use TypeScript interfaces, never `any`
✅ Modals use createPortal to escape stacking context issues
✅ Animation components wrap children, never force layout
✅ All interactive elements have unique id attributes for testing

❌ Never export non-page items from page.tsx files (Next.js rule)
❌ Never use inline styles — use Tailwind classes or CSS modules
❌ Never create components > 400 lines — split into sub-components
```

---

## 7. Glassmorphism & Card System

### Glass Card (Default)

```css
.card {
  background: rgba(255, 255, 255, 0.03);    /* near-transparent */
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);       /* Safari support */
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1.25rem;                   /* 20px */
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Light mode variant */
.light-mode .card {
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

/* Hover: lift + cyan glow */
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(6, 182, 212, 0.15);
  border-color: rgba(6, 182, 212, 0.3);
}
```

### Glow Card (Accent)

```css
.card-glow {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(6, 182, 212, 0.3);
  border-radius: 1.25rem;
  box-shadow: 0 0 20px rgba(6, 182, 212, 0.2);
}
```

### Glass Navbar

```css
.glass {
  background: rgba(9, 9, 11, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.light-mode .glass {
  background: rgba(255, 255, 255, 0.85);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}
```

---

## 8. Button & Interactive Elements

### Primary Button (Gradient)

```css
.btn-primary {
  background: linear-gradient(135deg, #06b6d4, #0d9488);
  color: #ffffff !important;
  font-weight: 750;
  border-radius: 0.75rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(6, 182, 212, 0.25);
  border: none;
  cursor: pointer;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(6, 182, 212, 0.45);
  filter: brightness(1.1);
}
```

### Secondary Button (Outline)

```css
.btn-secondary {
  background: transparent;
  border: 1.5px solid rgba(255, 255, 255, 0.15);
  font-weight: 700;
  border-radius: 0.75rem;
  transition: all 0.25s ease;
  cursor: pointer;
}

.btn-secondary:hover {
  border-color: #06b6d4;
  background: rgba(6, 182, 212, 0.05);
}
```

### Focus Ring (Global)

```css
*:focus-visible {
  outline: 2px solid transparent;
  outline-offset: 2px;
  box-shadow: 0 0 0 2px #06b6d4;   /* Cyan focus ring */
}
```

### Status Badges

```css
.badge-safe {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.2);
  padding: 0.125rem 0.625rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
}

.badge-warning {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.2);
  /* same structure */
}

.badge-danger {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
  /* same structure */
}
```

---

## 9. Layout & Responsive Design

### Mobile-First Trio Pattern

```
Mobile  (< 768px)  → Single column, bottom taskbar, slide-out sidebar
Tablet  (768-1024) → Collapsed sidebar, 2-column grids
Desktop (> 1024px) → Full sidebar, 3-4 column grids, hover effects
```

### Breakpoint Usage (Tailwind)

```tsx
// Mobile-first: start with mobile layout, add at breakpoints
<div className="
  grid grid-cols-1          /* Mobile: single column */
  md:grid-cols-2            /* Tablet: two columns */
  lg:grid-cols-3            /* Desktop: three columns */
  xl:grid-cols-4            /* Large: four columns */
  gap-4 md:gap-6
">
```

### Navigation Pattern

```
Mobile:  Bottom taskbar (MobileTaskbar.tsx) + hamburger → slide-out sidebar
Desktop: Fixed left sidebar + top navbar
```

### Scrollbar Stability

```css
html {
  overflow-y: scroll;
  scrollbar-gutter: stable;   /* Prevents layout shift */
}
```

### Container Pattern

```tsx
// Consistent page containers
<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
  {children}
</main>
```

---

## 10. Dark/Light Mode System

### Flash-Free Theme (Critical)

Place a **blocking script** in `<head>` that runs before paint:

```tsx
<script
  dangerouslySetInnerHTML={{
    __html: `(function(){
      try {
        var t = localStorage.getItem('app_theme') || localStorage.getItem('theme');
        if (t === 'light') {
          document.documentElement.classList.add('light-mode');
          document.documentElement.classList.remove('dark');
        } else {
          document.documentElement.classList.add('dark');
          document.documentElement.classList.remove('light-mode');
        }
      } catch(e) {}
    })()`,
  }}
/>
```

### CSS Strategy

```css
:root {
  --background: #fafafa;
  --foreground: #09090b;
}

.dark {
  --background: #09090b;
  --foreground: #fafafa;
}

body {
  background-color: var(--background);
  color: var(--foreground);
}
```

### Component-Level Dark Mode

```tsx
// Always provide both modes via Tailwind
<div className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
  <p className="text-zinc-900 dark:text-zinc-50">Always readable</p>
</div>
```

---

## 11. Scrollbar & Micro-Details

### Custom Scrollbar

```css
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: rgba(9, 9, 11, 0.3); }
::-webkit-scrollbar-thumb {
  background: rgba(6, 182, 212, 0.3);   /* Cyan accent */
  border-radius: 9999px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(6, 182, 212, 0.6);
}

/* Light mode */
.light-mode ::-webkit-scrollbar-track {
  background: rgba(250, 250, 250, 0.5);
}
```

### Hide Scrollbar Utility

```css
.scrollbar-none::-webkit-scrollbar { display: none; }
.scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
```

### Thin Scrollbar Variant

```css
.scrollbar-thin::-webkit-scrollbar { width: 4px; height: 4px; }
```

### Input Autofill Fix

```css
/* Prevent browser autofill from breaking dark mode */
input:-webkit-autofill {
  -webkit-background-clip: text;
  -webkit-text-fill-color: #09090b !important;
  transition: background-color 50000s ease-in-out 0s;
}
.dark input:-webkit-autofill {
  -webkit-text-fill-color: #fafafa !important;
}
```

---

## 12. Loading States & Skeleton UI

### Shimmer Wave Effect

```css
@keyframes shimmerWave {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.shimmer-wave {
  position: relative;
  overflow: hidden;
}

.shimmer-wave::after {
  position: absolute;
  top: 0; right: 0; bottom: 0; left: 0;
  transform: translateX(-100%);
  background-image: linear-gradient(90deg,
    rgba(255,255,255,0) 0,
    rgba(255,255,255,0.06) 20%,
    rgba(255,255,255,0.15) 60%,
    rgba(255,255,255,0));
  animation: shimmerWave 2s infinite cubic-bezier(0.4, 0, 0.2, 1);
  content: "";
}

/* Light mode variant */
.light-mode .shimmer-wave::after {
  background-image: linear-gradient(90deg,
    rgba(0,0,0,0) 0,
    rgba(0,0,0,0.03) 20%,
    rgba(0,0,0,0.07) 60%,
    rgba(0,0,0,0));
}
```

### Skeleton Usage Pattern

```tsx
// Skeleton card
<div className="shimmer-wave rounded-xl bg-zinc-800/50 h-40 w-full" />

// Skeleton text lines
<div className="space-y-3">
  <div className="shimmer-wave rounded h-4 w-3/4 bg-zinc-800/30" />
  <div className="shimmer-wave rounded h-4 w-1/2 bg-zinc-800/30" />
</div>
```

---

## 13. Navigation & Sidebar

### Sidebar Link Pattern

```css
.sidebar-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 1rem;
  font-size: 0.825rem;
  font-weight: 700;
  border-radius: 0.75rem;
  opacity: 0.75;
  transition: all 0.2s ease;
}

.sidebar-link:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.03);
}

/* Icon shift on hover */
.sidebar-link:hover svg {
  transform: translateX(-3px);    /* RTL */
}
[dir="ltr"] .sidebar-link:hover svg {
  transform: translateX(3px);     /* LTR */
}

/* Active state with gradient */
.sidebar-link.active {
  opacity: 1;
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(13, 148, 136, 0.15)) !important;
  border: 1px solid rgba(6, 182, 212, 0.2);
  color: #06b6d4 !important;
}
```

---

## 14. Page Transitions

### Scroll Reset on Navigation

```tsx
React.useEffect(() => {
  window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
}, [pathname]);
```

### Framer Motion Fade

```tsx
<motion.div
  key={pathname}
  initial={{ opacity: 0, y: 4 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -4 }}
  transition={{ duration: 0.22, ease: "easeOut" }}
>
  {children}
</motion.div>
```

---

## 15. RTL/LTR Internationalization

### Direction-Aware CSS

```css
/* RTL: Arabic typography */
html[dir="rtl"], [dir="rtl"] {
  font-family: var(--font-ibm-plex-arabic), "IBM Plex Sans Arabic", system-ui, sans-serif !important;
}

/* LTR: English typography */
html[dir="ltr"], [dir="ltr"] {
  font-family: "Lexend", "IBM Plex Sans Arabic", system-ui, sans-serif !important;
}
```

### Blocking Language Script

```js
// Runs before first paint — prevents direction flash
var lang = localStorage.getItem('app_lang') || 'ar';
document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
document.documentElement.lang = lang;
```

### Tailwind RTL Utilities

```tsx
// Use logical properties
<div className="ms-4 me-2">     {/* margin-inline-start/end */}
<div className="ps-4 pe-2">     {/* padding-inline-start/end */}
<div className="text-start">    {/* text-align: start */}
```

---

## 16. Print & PDF Export

```css
@media print {
  @page { size: A4 portrait; margin: 12mm; }

  body {
    background: #ffffff !important;
    color: #000000 !important;
    font-size: 11pt !important;
  }

  /* Hide all non-content */
  aside, header, nav, footer, button,
  .fixed, [role="dialog"] {
    display: none !important;
  }

  main {
    max-height: none !important;
    overflow: visible !important;
    padding: 0 !important;
    width: 100% !important;
  }

  .print\:block { display: block !important; }
  .print\:flex  { display: flex !important; }
  .print\:grid  { display: grid !important; }
}
```

---

## 17. Performance Optimization

### Next.js Config

```ts
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,       // Hide server identity
  compress: true,               // Enable gzip/brotli
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "clsx", "tailwind-merge"],
  },
  images: {
    formats: ["image/avif", "image/webp"],   // Modern formats first
    minimumCacheTTL: 31536000,               // 1 year cache
  },
};
```

### Cache Headers

```ts
// Static assets: immutable 1-year cache
{
  source: "/:all*(svg|jpg|jpeg|png|webp|avif|ico|woff|woff2)",
  headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
}

// Manifest: 1-day cache with stale-while-revalidate
{
  source: "/manifest.json",
  headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
}
```

### Performance Checklist

```
✅ next/font for zero-layout-shift font loading
✅ display: "swap" on all fonts
✅ Image: avif > webp > jpg/png priority
✅ Lazy-load below-fold components with dynamic import
✅ Preload critical assets: <link rel="preload" fetchPriority="high">
✅ Minimal DOM depth (max ~15 levels)
✅ optimizePackageImports in next.config for tree-shaking
✅ scrollbar-gutter: stable to prevent layout shift
```

---

## 18. SEO Best Practices

### Metadata Pattern

```tsx
export const metadata: Metadata = {
  title: {
    default: "Site Title | Full Description",
    template: "%s | Site Title"
  },
  description: "Compelling 150-160 char description with primary keywords.",
  keywords: ["keyword1", "keyword2", "keyword3"],
  authors: [{ name: "Author Name" }],
  openGraph: {
    title: "Site Title - Short Description",
    description: "Social sharing description.",
    url: "https://your-domain.com",
    siteName: "Site Name",
    locale: "ar_EG",         // or "en_US"
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Site Title",
    description: "Twitter card description.",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png"
  },
  verification: {
    google: "YOUR_GOOGLE_VERIFICATION_CODE",
  },
};
```

### SEO Checklist

```
✅ Unique <title> per page using metadata.title.template
✅ meta description on every page (150-160 chars)
✅ Single <h1> per page
✅ Semantic HTML5: <main>, <article>, <section>, <nav>, <aside>
✅ Open Graph + Twitter Card meta tags
✅ Canonical URL
✅ JSON-LD structured data for rich snippets
✅ Google Search Console verification
✅ Sitemap.xml generation
✅ robots.txt configuration
```

---

## 19. Accessibility (A11y)

### Standards

```
✅ Focus-visible rings on all interactive elements (2px cyan)
✅ aria-label on icon-only buttons
✅ role="dialog" + aria-modal="true" on modals
✅ Escape key closes modals
✅ Tab order follows visual order
✅ Color contrast ratio ≥ 4.5:1 for text (WCAG AA)
✅ alt text on all images
✅ Keyboard-navigable dropdowns and menus
✅ Skip-to-content link for screen readers
✅ No auto-playing audio or video
```

---

## 20. PWA Configuration

### Manifest Example

```json
{
  "name": "Your App Name",
  "short_name": "AppName",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#09090b",
  "theme_color": "#06b6d4",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### Mobile Web App Tags

```html
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="App Name" />
```

---

## 21. AI Prompts for Replication

Use these prompts when starting a new project to get this same quality from any AI assistant.

---

### 🎨 Prompt 1: Design System Setup

```
I'm building a production web application. Set up the complete design system with these EXACT standards:

COLOR SYSTEM:
- Primary accent: Cyan-500 (#06b6d4) with Teal-600 (#0d9488) as gradient endpoint
- Background: #09090b (dark), #fafafa (light)
- Maximum contrast text: #fafafa on dark, #09090b on light — NEVER use mid-gray text
- Custom zinc scale: zinc-150 (#f0f1f4), zinc-250 (#e2e4e9), zinc-450 (#90929e), zinc-550 (#656773), zinc-650 (#42444e), zinc-850 (#1b1c22)
- Status colors: Emerald (#10b981) for success, Amber (#f59e0b) for warning, Red (#ef4444) for danger

TYPOGRAPHY:
- English: "Lexend" from Google Fonts (weights 300-900)
- Arabic (if RTL): "IBM Plex Sans Arabic" (weights 300-700)
- System fallback: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
- Rendering: antialiased, optimizeLegibility, font-feature-settings "cv02" "cv03" "cv04" "cv11"
- Letter-spacing: -0.01em globally

ICONS:
- Use Lucide React exclusively, tree-shaken imports only
- Size 18 for inline, 20 for buttons, 24 for headers
- Never use emoji, multiple icon libraries, or generic AI robot icons

DO NOT use default framework colors (purple/indigo/violet).
DO NOT use default browser fonts.
```

---

### 🌊 Prompt 2: Glassmorphism & Components

```
Apply glassmorphism and premium component styling to my application:

CARD SYSTEM:
- Glass card: background rgba(255,255,255,0.03), backdrop-filter blur(12px), border 1px solid rgba(255,255,255,0.08), border-radius 1.25rem
- Light mode: background rgba(255,255,255,0.7), border rgba(0,0,0,0.06)
- Hover effect: translateY(-4px), box-shadow 0 12px 30px rgba(6,182,212,0.15), border-color rgba(6,182,212,0.3)
- Glow variant: permanent cyan border + box-shadow 0 0 20px rgba(6,182,212,0.2)

BUTTONS:
- Primary: linear-gradient(135deg, #06b6d4, #0d9488), font-weight 750, box-shadow 0 4px 12px rgba(6,182,212,0.25)
- Primary hover: translateY(-2px), box-shadow 0 8px 20px rgba(6,182,212,0.45), brightness(1.1)
- Secondary: transparent with 1.5px border, hover → cyan border + subtle fill
- Focus ring: box-shadow 0 0 0 2px #06b6d4 on :focus-visible

NAVBAR:
- Glass effect: background rgba(9,9,11,0.7), backdrop-filter blur(12px), border-bottom 1px solid rgba(255,255,255,0.05)

STATUS BADGES:
- Use pill shape (border-radius 9999px) with 10% opacity background + full color text + 20% opacity border
- Safe/Warning/Danger variants with Emerald/Amber/Red

All transitions use cubic-bezier(0.4, 0, 0.2, 1) at 0.3s duration.
```

---

### ✨ Prompt 3: Animation & Motion

```
Add a premium animation layer to my application:

PAGE TRANSITIONS (Framer Motion):
- Fade + slide: initial={{ opacity: 0, y: 4 }}, animate={{ opacity: 1, y: 0 }}, transition={{ duration: 0.22, ease: "easeOut" }}
- Scroll to top on every route change with behavior: "instant"

CSS ANIMATIONS:
- fadeIn: opacity 0→1 + translateY 8px→0, 0.35s ease-out
- floatSlow: translateY 0→-10px + rotate 0→1deg, 6s ease-in-out infinite (for decorative elements)
- pulseGlow: opacity 0.4→0.7 + scale 1→1.05, 8s ease-in-out infinite (for background orbs)
- shine: background-position sweep 200%→-200%, 4s linear infinite (for premium text effects)
- shimmerWave: translateX -100%→100%, 2s infinite with gradient overlay (for skeleton loading)

MARQUEE (infinite scrolling ribbons):
- Dual-track system: LTR and RTL variants
- 32s linear infinite, pauses on hover
- Duplicate content for seamless loop

PERFORMANCE RULES:
- Only animate transform and opacity (GPU-composited)
- Use will-change sparingly
- Never animate width, height, margin, padding, top, left
- Easing: cubic-bezier(0.4, 0, 0.2, 1) for standard, cubic-bezier(0.16, 1, 0.3, 1) for spring
```

---

### 🌓 Prompt 4: Dark/Light Mode

```
Implement a flash-free, zero-compromise dark/light mode system:

FLASH PREVENTION:
- Add a blocking <script> in <head> that reads localStorage BEFORE first paint
- Apply .dark or .light-mode class on <html> element immediately
- The script must also set dir="rtl"/"ltr" and lang attribute if multilingual

TEXT CONTRAST (CRITICAL):
- In dark mode: Override ALL zinc-300 through zinc-700, gray, neutral, slate, and muted-foreground text to #fafafa
- In light mode: Override ALL of the same to #09090b
- Use !important to ensure no utility class or component override breaks contrast
- Placeholder text: #71717a at 80% opacity (dark), #52525b at 85% opacity (light)

AUTOFILL FIX:
- input:-webkit-autofill: set -webkit-text-fill-color to match mode, transition background-color 50000s

SCROLLBAR:
- Dark: track rgba(9,9,11,0.3), thumb cyan 30%→60% on hover
- Light: track rgba(250,250,250,0.5), same thumb colors

OPACITY OVERRIDE:
- In dark mode, boost .opacity-60 elements to opacity: 0.85 for readability
```

---

### 📱 Prompt 5: Responsive Design & Layout

```
Implement mobile-first responsive design with these patterns:

BREAKPOINT STRATEGY:
- Mobile (< 768px): Single column, bottom taskbar, slide-out hamburger sidebar
- Tablet (768-1024px): Collapsed sidebar, 2-column grids
- Desktop (> 1024px): Full sidebar, 3-4 column grids, hover effects

NAVIGATION:
- Desktop: Fixed left sidebar + top glass navbar
- Mobile: Bottom tab bar (MobileTaskbar) with 4-5 primary actions + hamburger → slide-out sidebar (MobileSidebar)
- The slide-out sidebar uses Framer Motion for smooth open/close

LAYOUT STABILITY:
- html: overflow-y: scroll; scrollbar-gutter: stable; (prevents layout shift)
- body: min-height: calc(100vh + 1px); (ensures scrollbar is always present)

GRID PATTERN:
- grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6

CONTAINER:
- max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6

RTL/LTR:
- Use Tailwind logical properties: ms-*, me-*, ps-*, pe-*, text-start, text-end
- Mirror icon animations for RTL (translateX(-3px) RTL, translateX(3px) LTR)
```

---

### 🔍 Prompt 6: SEO & Performance

```
Optimize this application for SEO and maximum performance:

SEO:
- Unique <title> per page using Next.js metadata.title.template
- meta description 150-160 chars per page
- Single <h1> per page with proper heading hierarchy
- Open Graph + Twitter Card meta on every page
- Google Search Console verification meta tag
- Semantic HTML5: <main>, <article>, <section>, <nav>, <aside>
- All interactive elements must have unique id attributes

PERFORMANCE:
- next/font for zero-layout-shift Google Font loading with display: "swap"
- Image formats priority: avif > webp > jpg/png (via next.config images.formats)
- Static assets: Cache-Control "public, max-age=31536000, immutable"
- Manifest: Cache-Control "public, max-age=86400, stale-while-revalidate=604800"
- optimizePackageImports for tree-shaking: ["lucide-react", "framer-motion", "clsx", "tailwind-merge"]
- poweredByHeader: false (hide server identity)
- compress: true (gzip/brotli)
- Preload critical assets with fetchPriority="high"

PRINT/PDF:
- @media print stylesheet: A4 portrait, 12mm margins
- Hide all navigation, buttons, fixed elements, and dialogs
- Force white background + black text + 11pt font
- Support .print:block, .print:flex, .print:grid utility classes
```

---

### 🛡️ Prompt 7: Privacy & Security UI

```
Implement privacy-first UI patterns:

IMAGE VIEWER / LIGHTBOX:
- Disable right-click (onContextMenu preventDefault)
- Disable image drag (onDragStart preventDefault)
- Do NOT provide download buttons or external link options
- Use createPortal to render modal outside stacking context
- Close on Escape key and backdrop click

SECURITY HEADERS (next.config.ts):
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera=(), microphone=(), geolocation=()
- HSTS: max-age=63072000; includeSubDomains; preload
- CSP: strict default-src 'self' with explicit allowlists for scripts, styles, fonts, images, and connect-src
```

---

> **Usage:** Copy the relevant prompt(s) to any AI assistant when starting a new project.
> The prompts are designed to be self-contained — each one covers a specific concern and can be used independently or combined for a full-stack setup.
