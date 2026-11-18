/**
 * One input and what each photo viewer does with it. "None" means the viewer has no such input
 * or ignores it. decision is the number of the owner's decision (epic VPF-246, 2026-11-15; 10 on 2026-11-17)
 * behind the reuse column; a row whose reuse column matches none of the native ones needs one.
 */
export interface GestureRow {
  input: string;
  ios: string;
  macos: string;
  google: string;
  reuse: string;
  decision?: number;
}

/** The lightbox's inputs beside iOS Photos, macOS Photos and Google Photos on the web. */
export const lightboxGestures: readonly GestureRow[] = [
  {
    input: "Swipe sideways",
    ios: "Next or previous photo",
    macos: "Next or previous photo",
    google: "Next or previous photo",
    reuse: "Next or previous photo",
  },
  {
    input: "Swipe down",
    ios: "Closes to the photo's tile",
    macos: "None",
    google: "Closes to the photo's tile",
    reuse: "Closes to the photo's tile",
  },
  {
    input: "Swipe up",
    ios: "Shows the details",
    macos: "None",
    google: "Shows the details",
    reuse: "Closes to the photo's tile",
    decision: 7,
  },
  {
    input: "Tap on the photo",
    ios: "Hides or shows the controls",
    macos: "None",
    google: "Hides or shows the controls",
    reuse: "Hides or shows the controls",
    decision: 1,
  },
  {
    input: "Mouse click on the photo",
    ios: "None",
    macos: "None",
    google: "None",
    reuse: "Zooms in, or back to fit",
    decision: 1,
  },
  {
    input: "Tap or click beside the photo",
    ios: "Hides or shows the controls",
    macos: "None",
    google: "Hides or shows the controls",
    reuse: "Closes to the photo's tile",
    decision: 1,
  },
  {
    input: "Double tap",
    ios: "Zooms in, or back to fit",
    macos: "None",
    google: "Zooms in, or back to fit",
    reuse: "Zooms in, or back to fit",
  },
  {
    input: "Pinch",
    ios: "Zooms; pinching in below fit closes",
    macos: "Zooms",
    google: "Zooms",
    reuse: "Zooms; pinching in below fit closes",
    decision: 8,
  },
  {
    input: "Swipe against a zoomed photo's edge",
    ios: "Pages within the same swipe",
    macos: "Pages within the same swipe",
    google: "Pages within the same swipe",
    reuse: "Stretches; a second swipe pages",
    decision: 6,
  },
  {
    input: "Escape while zoomed",
    ios: "None",
    macos: "Back to the grid",
    google: "Closes",
    reuse: "Closes",
    decision: 2,
  },
  {
    input: "Left and right arrow keys",
    ios: "None",
    macos: "Previous or next photo",
    google: "Previous or next photo",
    reuse: "Previous or next photo",
  },
  {
    input: "Back",
    ios: "None",
    macos: "None",
    google: "Closes",
    reuse: "Closes",
    decision: 3,
  },
  {
    input: "Mouse wheel at fit",
    ios: "None",
    macos: "None",
    google: "None",
    reuse: "None",
    decision: 9,
  },
  {
    input: "Ctrl or Cmd with the wheel, trackpad pinch",
    ios: "None",
    macos: "Zooms",
    google: "Zooms",
    reuse: "Zooms",
  },
  {
    input: "Long press or right click",
    ios: "The system menu: copy, share, save",
    macos: "The system menu: copy, share, save",
    google: "The browser's image menu",
    reuse: "The browser's image menu",
  },
  {
    input: "Cmd or Ctrl and C",
    ios: "None",
    macos: "Copies the photo",
    google: "None",
    reuse: "Copies the photo",
  },
  {
    input: "Mouse drag on the photo",
    ios: "None",
    macos: "Drops the file where it lands",
    google: "Drops the file where it lands",
    reuse: "Next or previous photo",
    decision: 10,
  },
];
