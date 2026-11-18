---
"@reuse-sh/lightbox": patch
---

Two viewers no longer leave a dead Back entry behind. When one viewer closes or is destroyed while another viewer's history entry sits above its own, its entry is skipped once it becomes the current one.
