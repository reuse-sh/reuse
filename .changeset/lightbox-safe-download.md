---
"@reuse-sh/lightbox": patch
---

The Download button appears only for an `http:`, `https:` or `blob:` file, so a `data:` or `javascript:` URL from markup is never offered. A file from another origin is fetched and saved under its own name instead of navigating the page away, and opens in a new tab when its server does not allow the fetch.
