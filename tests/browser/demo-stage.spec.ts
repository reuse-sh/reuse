import { expect, test } from "@playwright/test";
import { mount } from "./harness.js";

test("a scripted drag keeps pointer capture outside the control", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await mount(
    page,
    `
    <div id="demo" style="width:300px">
      <div id="slider" style="position:absolute;top:20px;left:20px;width:80px;height:40px">
        <button data-stage-target="thumb">Thumb</button>
      </div>
      <output></output>
    </div>
    <script type="module">
      import { createStage, isStageEvent } from "@reuse-sh/stage";
      const slider = document.querySelector("#slider");
      const output = document.querySelector("output");
      slider.onpointerdown = (event) => slider.setPointerCapture(event.pointerId);
      slider.onpointermove = (event) => {
        if (slider.hasPointerCapture(event.pointerId) && event.clientX > 200)
          output.value = "dragged";
      };
      slider.onpointerup = (event) => {
        if (isStageEvent(event) && slider.hasPointerCapture(event.pointerId))
          output.value += " and released";
      };
      slider.onlostpointercapture = () => { output.value += " capture"; };
      createStage(document.querySelector("#demo"), {
        width: 300, height: 100, delay: 0, label: "A slider demo",
        async script(act) {
          await act.press("thumb");
          await act.move({ x: 240, y: 60 });
          await act.release();
          await act.wait(10_000);
        },
      });
    </script>
  `,
    ["stage/styles.css"],
  );
  await expect
    .poll(async () =>
      errors.length
        ? errors.join(", ")
        : await page.locator("output").textContent(),
    )
    .toBe("dragged and released capture");
});

test("two cursors capture independent controls and cancel together on takeover", async ({
  page,
}) => {
  await page.mouse.move(450, 140);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await mount(
    page,
    `
    <div id="demo" style="width:300px;height:100px;margin:80px">
      <button data-stage-target="left" style="position:absolute;left:12px;top:20px">Left</button>
      <button data-stage-target="right" style="position:absolute;right:12px;top:20px">Right</button>
      <output style="position:absolute;bottom:0"></output>
    </div>
    <script type="module">
      import { createStage } from "@reuse-sh/stage";
      const output = document.querySelector("output");
      const captured = new Map();
      const canceled = [];
      for (const button of document.querySelectorAll("button")) {
        button.onpointerdown = (event) => {
          button.setPointerCapture(event.pointerId);
          captured.set(button, event.pointerId);
          if (new Set(captured.values()).size === 2) output.value = "Both pressed";
        };
        button.onpointercancel = (event) => {
          if (captured.get(button) === event.pointerId && button.hasPointerCapture(event.pointerId))
            canceled.push(button.textContent);
          if (canceled.length === 2) output.value = canceled.sort().join(" and ");
        };
      }
      createStage(document.querySelector("#demo"), {
        width:300,height:100,delay:0,interactive:true,label:"Two cursors",
        additionalCursors:[{x:120,y:80}],
        async script(left, [right]) {
          await Promise.all([left.press("left"), right.press("right")]);
          await left.wait(10_000);
        },
      });
    </script>
  `,
    ["stage/styles.css"],
  );
  await expect(page.locator("output")).toHaveText("Both pressed");
  await expect(page.locator(".re-stage-cursor[data-pressed]")).toHaveCount(2);
  await page.locator("#demo").hover();
  await expect(page.locator("#demo")).toHaveAttribute("data-visitor", "");
  await expect(page.locator("output")).toHaveText("Left and Right");
  await expect(page.locator(".re-stage-cursor[data-pressed]")).toHaveCount(0);
  expect(errors).toEqual([]);
});
