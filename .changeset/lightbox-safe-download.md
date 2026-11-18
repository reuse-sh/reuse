---
"@reuse-sh/lightbox": minor
---

The Download button appears only for an `http:`, `https:` or `blob:` file or a PNG, JPEG, GIF, WebP or AVIF `data:` image, so a `javascript:` URL or another `data:` type from markup is never offered. A file from another origin is fetched once the button is pressed or focused and saved under its decoded name instead of navigating the page away. When its server does not allow the fetch, the click opens it in a new tab.
