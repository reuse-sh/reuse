---
"@reuse-sh/lightbox": minor
---

A photo more than twice as tall as it is wide, such as a long screenshot, now rests in a window clear of the controls: the padding below the toolbar, beside the arrows and above the caption. When it runs past two windows it scrolls inside that window, so the counter, zoom, close and caption never sit on it. A 1px ring in the new `--re-lightbox-media-ring` custom property outlines the window, 14% of `--re-lightbox-foreground` in `theme.css`, so a pale page keeps its edge on a pale room in every theme. Zooming in opens the window to the whole screen.
