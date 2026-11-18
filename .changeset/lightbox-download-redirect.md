---
"@reuse-sh/lightbox": patch
---

Download fetches a same-origin file too, so a server that redirects it to another origin no longer navigates the tab in Firefox and Safari. Only `blob:` and `data:` files download natively.
