---
"@reuse-sh/lightbox": minor
---

Video, audio, iframe, embed and HTML slides ship as separate modules: `@reuse-sh/lightbox/video`, `/audio`, `/iframe`, `/embed` and `/html` export `video()`, `audio()`, `iframe()`, `embed()` and `html()` for the new `content` option, and an item picks one with `type`. The embed module plays YouTube (from youtube-nocookie.com, Shorts at 9:16) and Vimeo links and `registerEmbed` adds providers. Only the current slide plays, a player starts by itself once when `autoplay` (default true) is on and a click opened the viewer, and gestures over a player leave it alone. `src` is optional for items with a type. Each module is its own file in `browser/`, and the core build carries none of them.
