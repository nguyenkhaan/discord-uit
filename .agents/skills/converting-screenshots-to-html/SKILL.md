---
name: converting-screenshots-to-html
description: Use when converting screenshots, mockups, or composite reference images into responsive HTML/CSS pages, especially when deciding what to extract as an image versus rebuild as interface code.
---

# Converting Screenshots to HTML

## Overview

Convert the reference into a real, accessible website—not a screenshot displayed inside a webpage. Separate photographic assets from interface content, then rebuild the interface with semantic HTML and responsive CSS.

## Required Reference

Before analyzing or editing, read `docs/pages/codes/rule.md` completely. Treat it as the project-specific source of truth for image extraction, typography, icons, full-screen layout, responsiveness, and verification.

## Output Contract

1. Identify every distinct page represented in the source image.
2. Classify each visible element as:
   - a genuine raster asset;
   - interface text or control;
   - a UI icon;
   - real text or branding physically present in the photographed scene.
3. Extract and enhance only genuine raster assets. Remove overlaid interface copy while preserving real signs, monument inscriptions, architectural logos, lighting, and composition.
4. Render headings, descriptions, labels, links, buttons, tabs, and form controls as semantic HTML.
5. Use a version-pinned CDN icon library for UI icons. Do not crop icons from the screenshot.
6. Build each result as an edge-to-edge full-screen page. Do not reproduce the mockup canvas, outer card, rounded presentation frame, or surrounding screenshot margins.
7. Adapt the layout for desktop, tablet, and mobile. Reflow content instead of shrinking a fixed screenshot composition.
8. Verify at 320px, 768px, 1024px, and 1440px. Check asset loading, text readability, keyboard focus, control sizing, and horizontal overflow.

## Implementation Guidance

- Match the source design before introducing creative changes.
- Reuse shared CSS when multiple pages belong to the same visual system.
- Keep extracted images in `docs/pages/images/` and generated HTML/CSS in `docs/pages/codes/`, unless the user specifies other paths.
- Inspect browser screenshots after implementation and correct layout or focal-position issues.
- Keep forms visually functional, but do not invent backend behavior that was not requested.

## Common Mistakes

- Cropping an entire panel with text and controls baked into it.
- Centering the result inside a decorative card or browser-like frame.
- Making mobile layouts horizontally scroll instead of reflowing.
- Removing real-world signage while cleaning UI overlays.
- Extracting low-resolution icons instead of using the required CDN library.
- Declaring completion without checking all required breakpoints.
