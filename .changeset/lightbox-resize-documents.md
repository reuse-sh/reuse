---
"@reuse-sh/lightbox": minor
---

A window resize or a device rotation no longer drops the zoom. The lightbox handles it once per frame, keeps the current photo and the point at the screen center where they are, and keeps a photo at rest at rest. A lightbox inside a frame, or made in the parent page for a frame's document, locks only that document's scroll and returns focus there, and `bindLightboxGallery` works on a root inside a frame.
