---
"@reuse-sh/lightbox": patch
---

`embed()` plays only YouTube, Vimeo and providers added with `registerEmbed()`; any other URL now opens a blank frame instead of loading the page. `iframe()` sandboxes a page from another origin with `allow-scripts allow-same-origin allow-forms allow-presentation`, so a framed page can no longer navigate your tab or open popups. A same-origin page still loads unsandboxed, and the `sandbox` option replaces the default.
