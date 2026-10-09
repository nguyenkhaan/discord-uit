# Screenshot-to-HTML Conversion Rules

Use these rules whenever converting a screenshot, mockup, or composite design image into an HTML page.

## 1. Analyze Before Building

- Identify each distinct page or screen in the source image before writing code.
- Separate the design into three categories:
  1. photographic or raster assets;
  2. interface text and controls;
  3. logos, icons, and decorative graphics.
- Determine which elements belong to the photographed scene and which were overlaid by the UI design.
- Record the visible copy, hierarchy, colors, spacing, proportions, and responsive intent.
- Do not assume the screenshot's outer canvas, presentation frame, or mockup background is part of the website.

## 2. Image Extraction

- Extract only genuine image assets, such as photographs, illustrations, thumbnails, avatars, textures, or standalone brand marks.
- Do not export an entire screenshot section when it contains interface text, buttons, form controls, navigation, or other elements that can be implemented in HTML/CSS.
- Remove only UI text and UI decorations that were overlaid on the source image. Reconstruct the hidden background cleanly.
- Preserve real details that belong to the photographed scene, including signs, lettering on buildings, monument inscriptions, physical logos, environmental details, lighting, and perspective.
- Never remove or rewrite real-world text merely because it appears inside a photograph.
- Enhance extracted assets when needed: correct obvious compression damage, improve sharpness carefully, and export at a resolution suitable for responsive cropping.
- Do not hallucinate new architecture, objects, branding, text, or scenery during enhancement.
- Prefer efficient web formats such as WebP for photographic backgrounds. Keep transparency only when the asset genuinely requires it.
- Use descriptive filenames such as `login-background.webp`, not generic names such as `image1.png`.
- Do not extract interface icons from screenshots as raster images.

## 3. Text and Typography

- Render all interface copy with semantic HTML and CSS. This includes headings, descriptions, labels, helper text, links, tabs, and button text.
- Do not flatten editable interface text into background images.
- Reproduce the source wording exactly unless the task explicitly requests copy changes.
- Preserve the intended hierarchy through font size, weight, line height, width, and spacing—not by converting text into images.
- Use responsive type sizing where appropriate, but keep body text and form labels readable at every breakpoint.
- Logos that include a wordmark should be implemented as a standalone asset plus HTML text, or as accessible SVG/HTML, when the layout requires independent scaling.

## 4. Icons

- Use an established CDN-hosted icon library for interface icons instead of extracting icons from the source screenshot.
- Reference icons directly in the HTML using the library's supported markup or components.
- Choose the closest available icon based on meaning, stroke weight, size, and visual style.
- Use one consistent icon library across a page unless the design requires a brand-specific standalone mark.
- Pin the CDN dependency to an explicit version. Add `integrity` and `crossorigin` attributes when the provider publishes them.
- Do not replace recognizable UI icons with emoji, arbitrary text characters, or low-resolution image crops.
- Treat brand logos separately from general UI icons. Preserve or recreate the correct brand asset rather than substituting an unrelated library icon.
- Mark decorative icons with `aria-hidden="true"`. Icon-only interactive controls must also have an accessible name such as `aria-label`.
- If the target environment cannot load external CDN resources, report the limitation instead of silently embedding extracted screenshot icons.

## 5. Build a Real Full-Screen Page

- Treat each screen as a complete website page, not as a card embedded inside a showcase canvas.
- The root page must fill at least the full viewport width and height.
- Do not add an outer border, rounded frame, card shadow, presentation margin, or decorative page padding unless it is visibly part of the actual product UI.
- Page content must reach the viewport edges where the design implies an edge-to-edge layout.
- Do not reproduce whitespace surrounding a mockup as website spacing.
- Avoid nested frame-like containers that make the page look like a screenshot placed inside another page.
- Use the extracted image as a real responsive background or media panel, then layer HTML content independently.

## 6. Responsive Layout

- Support desktop, tablet, and mobile from the first implementation.
- Verify at minimum: 320px, 768px, 1024px, and 1440px widths.
- On desktop, preserve the intended split between visual content and functional content without wrapping the layout in an outer card.
- On mobile, stack or restructure sections when necessary; do not merely shrink the desktop layout until it becomes unreadable.
- Use `object-fit: cover` and intentional focal positioning for photographic assets. Confirm important subjects and real-world signage are not accidentally hidden at key breakpoints.
- Allow vertical scrolling when content is taller than the viewport. Never reduce form controls below comfortable readable and touch-friendly sizes merely to avoid scrolling.
- Prevent horizontal overflow at every supported width.

## 7. Forms and Controls

- Rebuild inputs, checkboxes, tabs, links, and buttons as native HTML controls.
- Do not use cropped image fragments as interactive controls.
- Provide visible labels, appropriate input types, autocomplete attributes, and keyboard-visible focus states.
- Use a minimum interactive target close to 44px; increase it when the reference design supports larger controls.
- Keep form typography and control dimensions proportional. Increasing text should not leave inputs or buttons visually undersized.
- Preserve validation and security boundaries when connecting the static page to real application behavior.

## 8. Accessibility and Semantics

- Use one logical page heading and maintain a valid heading hierarchy.
- Use semantic landmarks such as `main`, `section`, `form`, and `button`.
- Decorative background images must use empty alternative text or CSS backgrounds.
- Meaningful standalone images require concise alternative text.
- Do not nest interactive controls inside labels for another control.
- Ensure adequate color contrast and do not rely on color alone to communicate state.
- Respect reduced-motion preferences when motion is present.

## 9. Verification Checklist

Before considering the conversion complete, confirm that:

- The page is edge-to-edge and has no unintended outer frame or margin.
- Every interface text element is selectable HTML text.
- Extracted images contain no interface headings, descriptions, buttons, or form text.
- Real text and logos belonging to the photographed scene remain intact.
- Images are sharp enough for their largest rendered size and use an appropriate web format.
- Desktop, tablet, and mobile layouts match the same design intent.
- There is no horizontal overflow at 320px, 768px, 1024px, or 1440px.
- Forms remain readable, keyboard accessible, and touch friendly.
- Local asset paths resolve and the browser console contains no relevant errors.
- CDN icon resources load successfully, use a pinned version, and have no broken glyphs.

## 10. Scope Discipline

- Match the supplied design before introducing creative changes.
- Do not add features, dependencies, animations, or configuration that the requested page does not need.
- When the screenshot is ambiguous, preserve existing product conventions and choose the smallest implementation that faithfully reproduces the visible design.
