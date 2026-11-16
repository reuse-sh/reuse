---
"@reuse-sh/gallery": patch
---

Add the gallery package: `createJustifiedGallery` lays pictures out in rows that keep their proportions and fill the width, and `createMasonry` stacks items into columns with native `display: grid-lanes` where the browser has it and a matching fallback elsewhere. The React entry adds `JustifiedGallery`, `Masonry`, `useJustifiedGallery` and `useMasonry`.
