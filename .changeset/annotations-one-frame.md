---
"@reuse-sh/annotations": minor
---

The editor draws one frame: a selected area or line keeps its own outline with handles on its corners and ends, instead of a second frame around it. A new `onPreview` option reports the marks while a drag reshapes them, and the React `AnnotationEditor` uses it, so the mark itself follows the drag.
