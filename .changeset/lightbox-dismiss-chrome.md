---
"@reuse-sh/lightbox": minor
---

The viewer now dismisses, taps and times its controls like a phone's photo app. A vertical swipe up or down carries the photo, fades the backdrop and the controls with it, and closes past 120px or a quick flick; a slower drag or a cancelled touch puts the photo back. On a phone a tap on the photo shows or hides the controls, a double tap zooms, and a tap beside the photo closes. With a mouse the controls hide after 2500ms without movement and while zoomed, and come back on a move, a key or focus; the new `autoHide` option changes the delay or, with `false`, keeps them up. Nothing hides the controls while one is hovered or focused.

The open flight now takes 400ms and the close flight 300ms on `cubic-bezier(0.32, 0.72, 0, 1)`, set by the theme's `--re-lightbox-open-duration`, `--re-lightbox-close-duration` and `--re-lightbox-ease`; `duration` still sets both. The controls fade in 160ms after the photo starts and fade out before it lands. Under reduced motion the photo fades in place.

Fixed: ArrowLeft and ArrowRight swap on a right-to-left page, and one image no longer shows disabled arrows and "1 / 1". Home and End go to the first and last image, and keys with Alt, Ctrl or Meta are left to the browser. The counter rolls its digits and is hidden from screen readers; a separate status region announces the image. Breaking: the counter is a `span` instead of an `output`, so read its text with `textContent`.
