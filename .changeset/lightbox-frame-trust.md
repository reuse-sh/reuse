---
"@reuse-sh/lightbox": minor
---

`embed()` plays only YouTube, Vimeo and providers added with `registerEmbed()`; any other URL now opens a blank frame instead of loading the page. Every frame from another origin, from `iframe()` or `embed()` and registered providers included, now gets `sandbox="allow-scripts allow-same-origin allow-forms allow-presentation allow-popups"`, so a framed page and the popups it opens can no longer navigate your tab. A same-origin page still loads unsandboxed, so an open redirect on your own site defeats the sandbox. The `sandbox` option replaces the default.
