---
"@reuse-sh/carousel": minor
---

The loop no longer writes a slide's `transform`. It draws a slide in another period through `--re-carousel-shift`, which the package CSS applies as `translate`, and marks the period in `data-re-cycle`. A looping strip now needs the package stylesheet, or a rule of your own that applies `translate: var(--re-carousel-shift)` to slides whose `data-re-cycle` is not 0.

Every slide carries `--re-carousel-offset`, its distance from where it would rest aligned in slide widths, updated every frame while the strip moves, so CSS effects such as a coverflow can read it. The loop now stays off while any slide has no width, and turns on at the next refresh once it has one.

With `group: N` or `group: "page"`, only the first slide of each group keeps `scroll-snap-align`, so touch and trackpad swipes and a released mouse drag move a whole group, like the buttons. `destroy()` gives every slide its own value back.

New: `take(owner, { onInterrupt })` hands the position to your own driver, such as a marquee, and `state.seamSlides` lists the slides a looping strip shows while it crosses the seam, for eager image loading.
