# @reuse-sh/stage

A scripted cursor that plays your real components in a live, looping product demo. The scene is ordinary markup, designed at a fixed size and scaled to its container. The cursor sends real pointer events, so the components in it run their own code.

<!-- principles:start -->

## Principles

These are the rules the code keeps. An adaptation on any framework keeps them too.

- **Drive the real component.** The cursor sends pointer events to the element under it, so hover, press, drag and release run the component's own code. A control can capture the scripted pointer during its handlers and keep receiving drag events when the cursor leaves it.
- **Mark its events.** Scripted events bubble like real ones, so handlers delegated to a parent, such as React's, run too. isStageEvent tells them apart, so page code that closes on an outside press can ignore them.
- **Leave focus where it is.** Scene elements that are not native controls cannot take focus. When a component focuses a native control in the scene, focus goes back where it was, though the page has already seen a focusout.
- **Move like a hand.** The cursor travels on a shallow arc timed by distance, quick to leave and slow to land, and every press shows.
- **Land on a moving target.** A move measures its target on every frame, so it lands even when the layout shifts or the stage resizes mid-move.
- **Keep cursors independent.** Several cursors can use one scene and one clock. Each has its own pointer identity, press and capture. They stop together when the pass ends.
- **Start every pass from the first frame.** reset runs before every pass. A pass cut short by leaving the screen resets at once, so the scene never resumes halfway.
- **Play only when seen.** It plays while at least 40% of the stage is on screen and the page is visible, and stops otherwise.
- **Hold still for reduced motion.** With reduced motion the script never runs, the cursor hides and the scene shows its still frame.
- **Stay a picture to the keyboard.** The scene is hidden from assistive technology and its controls leave the tab order. The stage carries one label that says what the scene shows.
- **Hand over to the visitor.** An interactive stage hands the real component to the visitor on hover or touch. A press-to-interact stage hands it over on mouse press or touch tap. It plays again from the first frame 1.2 s after the mouse leaves or 4 s after the last touch, and never while focus is inside the scene.
- **Fail loud.** A target the scene lacks throws, and the error stops the stage instead of looping on a broken scene.
- **Restore the markup.** Destroy ends the pass, removes the cursor and listeners, gives the controls back their tab order and unwraps the scene.

<!-- principles:end -->

## Install

```sh
npm install @reuse-sh/stage
```

<!-- examples:start -->

## Usage

[Documentation](https://reuse.sh/demo-stage/getting-started)

### React

#### Package styles

Import the package stylesheet once in your main CSS. The components layer lets Tailwind utilities adapt its presentation.

```css
@import "@reuse-sh/stage/styles.css" layer(components);
```

#### Usage

Render the scene as children of Stage and mark the controls the cursor aims at with data-stage-target. The script is one pass. It plays again from reset until the stage leaves the screen.

```tsx
"use client";

import { Stage, type StageAct } from "@reuse-sh/stage/react";
import { useState } from "react";

export function ShareDemo() {
  const [open, setOpen] = useState(false);
  async function script(act: StageAct) {
    await act.click("share");
    await act.wait(1400);
    await act.click("done");
    await act.wait(600);
  }
  return (
    <Stage width={480} height={280} label="A pointer opens the share menu and closes it" script={script} reset={() => setOpen(false)} interactive className="rounded-xl bg-neutral-100">
      <div className="flex justify-end p-4">
        <button type="button" data-stage-target="share" onClick={() => setOpen(true)} className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm text-white">
          Share
        </button>
      </div>
      {open ? (
        <div className="mx-4 rounded-lg bg-white p-4 text-sm shadow-lg">
          <p>Anyone with the link can view.</p>
          <button type="button" data-stage-target="done" onClick={() => setOpen(false)} className="mt-3 rounded-md bg-neutral-100 px-3 py-1.5">
            Done
          </button>
        </div>
      ) : null}
    </Stage>
  );
}
```

#### Integration

The cursor clicks the real buttons, so their click handlers run the same code a visitor's click does. reset puts the scene back before every pass, and a pass should end where it began. With reduced motion the script never runs and the first frame stays. A scripted click is real, so keep links, clipboard writes and modal dialogs out of a scene.

### HTML + JavaScript

#### Usage

The root's content becomes the scene. Mark the controls the cursor aims at with data-stage-target.

```html
<div id="demo">
  <button type="button" data-stage-target="share">Share</button>
  <div id="share-menu" hidden>
    <p>Anyone with the link can view.</p>
    <button type="button" data-stage-target="done">Done</button>
  </div>
</div>
```

#### Styles

Import the package stylesheet once. The stage keeps the scene's proportions, so give it a width and the height follows.

```css
@import "@reuse-sh/stage/styles.css";

#demo { max-width: 480px; border-radius: 12px; background: #f2f2f1; }
#demo [data-stage-target="share"] { position: absolute; top: 16px; right: 16px; }
#share-menu { position: absolute; top: 60px; right: 16px; padding: 16px; border-radius: 10px; background: #fff; }
```

#### Initialize

Run this after the markup exists. The script is one pass, and the stage plays it again from reset while it stays on screen.

```javascript
import { createStage } from "@reuse-sh/stage";

const root = document.querySelector("#demo");
const menu = root.querySelector("#share-menu");
root.querySelector('[data-stage-target="share"]').addEventListener("click", () => { menu.hidden = false; });
root.querySelector('[data-stage-target="done"]').addEventListener("click", () => { menu.hidden = true; });
const stage = createStage(root, {
  width: 480,
  height: 280,
  label: "A pointer opens the share menu and closes it",
  interactive: true,
  reset: () => { menu.hidden = true; },
  async script(act) {
    await act.click("share");
    await act.wait(1400);
    await act.click("done");
    await act.wait(600);
  },
});
```

#### Integration

The cursor clicks the real buttons, so their click handlers run the same code a visitor's click does. reset puts the scene back before every pass, and a pass should end where it began. With reduced motion the script never runs and the first frame stays. A scripted click is real, so keep links, clipboard writes and modal dialogs out of a scene.

#### Cleanup

Run this when the view is removed. It stops the pass and puts the markup back.

```javascript
stage.destroy();
```

<!-- examples:end -->

## Documentation

- Demo stage: https://reuse.sh/demo-stage, agent guide https://reuse.sh/demo-stage/guide.md

## License

MIT
