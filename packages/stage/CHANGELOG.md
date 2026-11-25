# @reuse-sh/stage

## 0.2.0

### Minor Changes

- 66a14c6: Support pointer capture for scripted drags and multiple independent cursors in one scene. Interactive scenes can also hand over on a mouse press or touch tap, and autoplay can be disabled while the scene stays interactive.

## 0.1.0

### Minor Changes

- 8589b03: New package: Demo stage. `createStage` and the React `Stage` play a looping product demo in which a scripted cursor drives your real components with pointer events. A scene is designed at a fixed size and scales to its container, plays only while on screen, starts every pass from `reset`, holds a still frame under reduced motion, keeps focus where it was and can hand over to a visitor's pointer.
