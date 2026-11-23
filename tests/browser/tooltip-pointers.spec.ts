import { expect, type Locator, test } from "@playwright/test";
import { mount } from "./harness";

async function rememberPointerId(trigger: Locator) {
  await trigger.evaluate((element) => {
    element.addEventListener(
      "pointerover",
      (event) => {
        element.dataset.pointerId = String((event as PointerEvent).pointerId);
      },
      { once: true },
    );
  });
}

test("fades from the current tilt and reverses the fade on re-entry", async ({
  page,
}) => {
  await mount(
    page,
    '<div id="root"><button style="margin:80px;width:180px" data-re-tooltip="Save">Save</button></div>',
    ["interactions/styles.css"],
  );
  await page.addScriptTag({
    type: "module",
    content: `import { createFloatingTooltip } from "@reuse-sh/interactions";
      createFloatingTooltip(document.querySelector("#root"), { delay: 0, closeDelay: 0 });
      window.__ready = true;`,
  });
  await expect.poll(() => page.evaluate(() => "__ready" in window)).toBe(true);
  const trigger = page.getByRole("button", { name: "Save" });
  const tip = page.getByRole("tooltip");
  await rememberPointerId(trigger);
  await trigger.hover({ position: { x: 20, y: 8 } });
  await expect(tip).toHaveText("Save");
  const result = await trigger.evaluate(async (element) => {
    const popup = document.querySelector<HTMLElement>('[role="tooltip"]');
    if (!popup) throw new Error("Tooltip was not mounted");
    const box = element.getBoundingClientRect();
    const dispatch = (type: string, x: number) =>
      element.dispatchEvent(
        new PointerEvent(type, {
          bubbles: true,
          pointerId: Number(element.dataset.pointerId),
          pointerType: "mouse",
          clientX: box.x + x,
          clientY: box.y + 8,
        }),
      );
    const frames = () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
    const angle = () =>
      Number(/rotate\(([^d]+)deg\)/.exec(popup.style.transform)?.[1]);
    for (const x of [45, 75, 100, 130]) {
      dispatch("pointermove", x);
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
    }
    const before = angle();
    dispatch("pointerout", 181);
    await frames();
    const opacity = Number(getComputedStyle(popup).opacity);
    const during = angle();
    const visibleDuring = !popup.hidden;
    dispatch("pointerover", 100);
    await frames();
    return {
      before,
      during,
      opacity,
      visibleDuring,
      restoredOpacity: Number(getComputedStyle(popup).opacity),
    };
  });
  expect(Math.abs(result.before)).toBeGreaterThan(0.25);
  expect(result.visibleDuring).toBe(true);
  expect(Math.sign(result.during)).toBe(Math.sign(result.before));
  expect(result.opacity).toBeGreaterThan(0);
  expect(result.opacity).toBeLessThan(1);
  expect(result.restoredOpacity).toBeGreaterThan(result.opacity);
  await expect(tip).toHaveText("Save");
  await page.mouse.move(0, 0);
  await expect(tip).toBeHidden();
  await expect(trigger).not.toHaveAttribute("aria-describedby");
});

test("keeps a single popup through rapid one-line and two-line swaps", async ({
  page,
}) => {
  await mount(
    page,
    `<div id="root" style="display:flex;gap:8px;padding:80px">
      <button data-re-tooltip="Open ticket">Ticket</button>
      <button data-re-tooltip-template="reply-tip">Reply</button>
      <button data-re-tooltip="Archive">Archive</button>
    </div>
    <template id="reply-tip"><div>Send reply</div><div>Command + Enter</div></template>`,
    ["interactions/styles.css"],
  );
  await page.addScriptTag({
    type: "module",
    content: `import { createFloatingTooltip } from "@reuse-sh/interactions";
      const root = document.querySelector("#root");
      const tooltip = createFloatingTooltip(root, { delay: 0, side: "top" });
      window.__removeTrigger = () => root.lastElementChild.remove();
      window.__destroyTooltip = () => tooltip.destroy();`,
  });
  await expect
    .poll(() => page.evaluate(() => "__destroyTooltip" in window))
    .toBe(true);

  const ticket = page.getByRole("button", { name: "Ticket" });
  const reply = page.getByRole("button", { name: "Reply" });
  const archive = page.getByRole("button", { name: "Archive" });
  const tip = page.getByRole("tooltip");
  await ticket.hover();
  await expect(tip).toHaveText("Open ticket");
  const id = await tip.getAttribute("id");
  const first = await tip.boundingBox();
  await reply.hover();
  await expect(tip).toHaveAttribute("id", id ?? "");
  await expect(tip.locator("div")).toHaveText([
    "Send reply",
    "Command + Enter",
  ]);
  await expect(ticket).not.toHaveAttribute("aria-describedby");
  await expect
    .poll(async () => (await tip.boundingBox())?.height ?? 0)
    .toBeGreaterThan(first?.height ?? 0);
  await ticket.hover();
  await archive.hover();
  await expect(tip).toHaveAttribute("id", id ?? "");
  await expect(tip).toHaveText("Archive");
  await expect(reply).not.toHaveAttribute("aria-describedby");
  await expect
    .poll(async () => (await tip.boundingBox())?.height)
    .toBe(first?.height);
  await page.evaluate("window.__removeTrigger()");
  await expect(tip).toBeHidden();
  await page.evaluate("window.__destroyTooltip()");
  await expect(page.getByRole("tooltip", { includeHidden: true })).toHaveCount(
    0,
  );
});

test("keeps a wide rich hint inside a narrow viewport", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await mount(
    page,
    `<div id="root"><button data-re-tooltip-template="reply-tip">Reply</button></div>
    <template id="reply-tip">
      <div>Send this message to the customer who opened the support ticket</div>
      <div>Command + Enter</div>
    </template>`,
    ["interactions/styles.css"],
  );
  await page.addScriptTag({
    type: "module",
    content: `import { createFloatingTooltip } from "@reuse-sh/interactions";
      createFloatingTooltip(document.querySelector("#root"), { delay: 0, side: "right" });`,
  });
  const tip = page.getByRole("tooltip", { includeHidden: true });
  await expect(tip).toHaveCount(1);
  await page.mouse.move(319, 639);
  await page.getByRole("button", { name: "Reply" }).hover();
  await expect(tip).toBeVisible();
  const box = await tip.boundingBox();
  if (!box) throw new Error("Tooltip has no viewport box");
  expect(box.x).toBeGreaterThanOrEqual(12);
  expect(box.x + box.width).toBeLessThanOrEqual(308);
});

test("keeps the viewport margin while content grows at the edge", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await mount(
    page,
    `<div id="root" style="position:absolute;right:1px;top:80px">
      <button data-re-tooltip="Open">A</button>
      <button data-re-tooltip="The customer has requested a refund for the annual plan">B</button>
    </div>`,
    ["interactions/styles.css"],
  );
  await page.addScriptTag({
    type: "module",
    content: `import { createFloatingTooltip } from "@reuse-sh/interactions";
      createFloatingTooltip(document.querySelector("#root"), { delay: 0, tilt: 0 });`,
  });
  const first = page.getByRole("button", { name: "A", exact: true });
  const tip = page.getByRole("tooltip", { includeHidden: true });
  await expect(tip).toHaveCount(1);
  await rememberPointerId(first);
  await first.hover();
  await expect(tip).toHaveText("Open");
  const pointerId = Number(await first.getAttribute("data-pointer-id"));
  const farthestRight = await page
    .getByRole("button", { name: "B", exact: true })
    .evaluate(async (button, pointerId) => {
      const popup = document.querySelector<HTMLElement>('[role="tooltip"]');
      if (!popup) throw new Error("Tooltip was not mounted");
      button.dispatchEvent(
        new PointerEvent("pointerover", {
          bubbles: true,
          pointerType: "mouse",
          pointerId,
          clientX: 307,
          clientY: 90,
        }),
      );
      let right = 0;
      for (let index = 0; index < 15; index++) {
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => setTimeout(resolve)),
        );
        right = Math.max(right, popup.getBoundingClientRect().right);
      }
      return right;
    }, pointerId);
  await expect(tip).toHaveText(
    "The customer has requested a refund for the annual plan",
  );
  expect(farthestRight).toBeLessThanOrEqual(308.1);
});

test("the visitor's pointer takes a tooltip over from a scripted one", async ({
  page,
}) => {
  await mount(
    page,
    `<div id="root" style="display:flex;gap:80px;padding:80px">
      <button data-re-tooltip="Scripted">Scripted</button>
      <button data-re-tooltip="Visitor">Visitor</button>
    </div>`,
    ["interactions/styles.css"],
  );
  await page.addScriptTag({
    type: "module",
    content: `import { createFloatingTooltip } from "@reuse-sh/interactions";
      createFloatingTooltip(document.querySelector("#root"), { delay: 0 });
      window.__ready = true;`,
  });
  await expect.poll(() => page.evaluate(() => "__ready" in window)).toBe(true);
  const tip = page.getByRole("tooltip");
  await page.evaluate(() => {
    const scripted = document.querySelector("button") as HTMLElement;
    const box = scripted.getBoundingClientRect();
    scripted.dispatchEvent(
      new PointerEvent("pointerover", {
        bubbles: true,
        pointerId: 1931,
        pointerType: "mouse",
        isPrimary: true,
        clientX: box.left + 10,
        clientY: box.top + 10,
      }),
    );
  });
  await expect(tip).toHaveText("Scripted");
  const visitor = await page
    .getByRole("button", { name: "Visitor" })
    .boundingBox();
  if (!visitor) throw new Error("The visitor's trigger is not on screen.");
  await page.mouse.move(visitor.x + 10, visitor.y + 10, { steps: 4 });
  await expect(tip).toHaveText("Visitor");
});
