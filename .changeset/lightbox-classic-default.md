---
"@reuse-sh/lightbox": minor
---

The default theme is now Classic, the look the reuse.sh site uses: a pale room, white round 40px controls with a light ring shadow and 18px icons, the counter as a pill in the top start corner, the caption under the photo, and the thumbnail strip below it. The built-in icons are the site's icons, and the zoom button shows Lucide's zoom-in icon, and zoom-out while zoomed.

Breaking changes:

- `theme.css` no longer gives the dark look. `themes/dark.css` after it gives dark colors on the Classic layout; the old 44px blurred buttons and the caption backing are gone.
- `theme.css` keeps room under the photo for the caption (`--re-lightbox-caption-room`, 30px) and the bottom strip (`--re-lightbox-strip-room`, 64px), through `--re-lightbox-bottom-room`, and sets `--re-lightbox-padding` to 24px, 12px below 560px of width.
- `--re-lightbox-blur` is gone: the controls have no backdrop blur. Controls draw `--re-lightbox-ring` instead.
- Defaults changed: `--re-lightbox-button-size` 40px, `--re-lightbox-icon-size` 18px, `--re-lightbox-press-scale` 0.95, `--re-lightbox-gap` 8px, `--re-lightbox-footer-inset` and `--re-lightbox-arrow-inset` follow `--re-lightbox-inset`, `--re-lightbox-thumbnail-radius` 8px, `--re-lightbox-thumbnail-gap` 6px, and `--re-lightbox-control-hover` mixes 5% of the foreground.
- New custom properties: `--re-lightbox-muted` for the caption (80% of the foreground over the background by default), `--re-lightbox-ring`, `--re-lightbox-thumbnail-background`, `--re-lightbox-caption-room` and `--re-lightbox-strip-room`. `themes/dark.css` and `themes/page.css` set the colors among them.
