---
"@reuse-sh/lightbox": patch
---

A photo at a URL without an extension, such as an image CDN URL with `?w=1200`, no longer costs a HEAD request. The viewer asks for the type only when the file decodes at 300x150, the size a browser gives an SVG without its own width and height.
