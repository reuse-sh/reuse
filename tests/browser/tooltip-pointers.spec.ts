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
  await expect
    .poll(() => tip.evaluate((popup) => popup.style.transform))
    .not.toContain("scale(");
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

test("a rail tooltip leans with vertical pointer travel from the edge it hangs on", async ({
  page,
}) => {
  await mount(
    page,
    '<div id="root" style="position:fixed;top:40px;right:20px;display:flex;flex-direction:column;gap:2px"><button style="width:40px;height:40px" data-re-tooltip="Customer">C</button><button style="width:40px;height:40px" data-re-tooltip="Sales">S</button><button style="width:40px;height:40px" data-re-tooltip="Tickets">T</button></div>',
    ["interactions/styles.css"],
  );
  await page.addScriptTag({
    type: "module",
    content: `import { createFloatingTooltip } from "@reuse-sh/interactions";
      createFloatingTooltip(document.querySelector("#root"), { delay: 0, closeDelay: 0, side: "left", track: { x: "anchor" } });
      window.__ready = true;`,
  });
  await expect.poll(() => page.evaluate(() => "__ready" in window)).toBe(true);
  const first = page.getByRole("button", { name: "C" });
  await first.hover({ position: { x: 20, y: 6 } });
  await expect(page.getByRole("tooltip")).toHaveText("Customer");
  const box = await first.boundingBox();
  if (!box) throw new Error("Trigger has no box");
  const angles: number[] = [];
  for (let y = box.y + 10; y < box.y + 110; y += 8) {
    await page.mouse.move(box.x + 20, y);
    angles.push(
      await page.evaluate(() =>
        Number(
          /rotate\(([^d]+)deg\)/.exec(
            document.querySelector<HTMLElement>('[role="tooltip"]')?.style
              .transform ?? "",
          )?.[1] ?? 0,
        ),
      ),
    );
  }
  expect(Math.max(...angles)).toBeGreaterThan(0.5);
  await page.mouse.move(box.x + 20, box.y + 100);
  await expect
    .poll(() =>
      page.evaluate(() =>
        Number(
          /rotate\(([^d]+)deg\)/.exec(
            document.querySelector<HTMLElement>('[role="tooltip"]')?.style
              .transform ?? "",
          )?.[1] ?? 1,
        ),
      ),
    )
    .toBe(0);
});

test("grows in from the pointer corner and rolls the next hint in from the direction of travel", async ({
  page,
}) => {
  await page.mouse.move(2, 2);
  await mount(
    page,
    `<div id="root" style="display:flex;gap:8px;padding:80px">
      <button data-re-tooltip="Open ticket">Ticket</button>
      <button data-re-tooltip="Archive">Archive</button>
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
  const ticket = page.getByRole("button", { name: "Ticket" });
  const archive = page.getByRole("button", { name: "Archive" });
  const tip = page.getByRole("tooltip");

  const sampleGrow = page.evaluate(
    () =>
      new Promise<number[]>((resolve) => {
        const scales: number[] = [];
        const start = performance.now();
        const sample = () => {
          const popup = document.querySelector<HTMLElement>('[role="tooltip"]');
          if (popup && !popup.hidden)
            scales.push(
              Number(/scale\(([\d.]+)\)/.exec(popup.style.transform)?.[1] ?? 1),
            );
          if (performance.now() - start < 500) requestAnimationFrame(sample);
          else resolve(scales);
        };
        sample();
      }),
  );
  await ticket.hover();
  const scales = await sampleGrow;
  expect(Math.min(...scales)).toBeLessThan(0.99);
  expect(scales.at(-1)).toBe(1);
  await expect(tip).toHaveText("Open ticket");

  const sampleReel = page.evaluate(
    () =>
      new Promise<
        Array<{
          leaving: string | null;
          hidden: string | null;
          x: number;
          opacity: number;
        }>
      >((resolve) => {
        const out: Array<{
          leaving: string | null;
          hidden: string | null;
          x: number;
          opacity: number;
        }> = [];
        const start = performance.now();
        const sample = () => {
          const body = document.querySelector<HTMLElement>(
            '[role="tooltip"] .re-floating-tooltip-content:not(.re-floating-tooltip-leaving)',
          );
          const leaving = document.querySelector<HTMLElement>(
            ".re-floating-tooltip-leaving",
          );
          if (body)
            out.push({
              leaving: leaving?.textContent ?? null,
              hidden: leaving?.getAttribute("aria-hidden") ?? null,
              x: Number.parseFloat(getComputedStyle(body).translate) || 0,
              opacity: Number(getComputedStyle(body).opacity),
            });
          if (performance.now() - start < 700) requestAnimationFrame(sample);
          else resolve(out);
        };
        sample();
      }),
  );
  await archive.hover();
  const frames = await sampleReel;
  const rolling = frames.filter((frame) => frame.leaving !== null);
  expect(rolling.length).toBeGreaterThan(0);
  expect(rolling.every((frame) => frame.leaving === "Open ticket")).toBe(true);
  expect(rolling.every((frame) => frame.hidden === "true")).toBe(true);
  expect(Math.max(...rolling.map((frame) => frame.x))).toBeGreaterThan(4);
  expect(frames.at(-1)).toEqual({
    leaving: null,
    hidden: null,
    x: 0,
    opacity: 1,
  });
  await expect(tip).toHaveText("Archive");
});

test("an interrupted roll and an early exit continue from what is on screen", async ({
  page,
}) => {
  await page.mouse.move(2, 2);
  await mount(
    page,
    `<div id="root" style="display:flex;gap:8px;padding:80px">
      <button data-re-tooltip="Open ticket">Ticket</button>
      <button data-re-tooltip="Archive">Archive</button>
      <button data-re-tooltip="Delete forever">Delete</button>
    </div>`,
    ["interactions/styles.css"],
  );
  await page.addScriptTag({
    type: "module",
    content: `import { createFloatingTooltip } from "@reuse-sh/interactions";
      createFloatingTooltip(document.querySelector("#root"), { delay: 0, closeDelay: 0 });
      window.__ready = true;`,
  });
  await expect.poll(() => page.evaluate(() => "__ready" in window)).toBe(true);
  const ticket = page.getByRole("button", { name: "Ticket" });
  await ticket.hover();
  await expect(page.getByRole("tooltip")).toHaveText("Open ticket");
  await page.waitForTimeout(500);

  const flash = await page.evaluate(async () => {
    const [, archive, remove] = [
      ...document.querySelectorAll<HTMLElement>("#root button"),
    ];
    const at = (element: HTMLElement) => {
      const box = element.getBoundingClientRect();
      return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    };
    const over = (element: HTMLElement) =>
      element.dispatchEvent(
        new PointerEvent("pointerover", {
          bubbles: true,
          pointerId: 1,
          pointerType: "mouse",
          clientX: at(element).x,
          clientY: at(element).y,
        }),
      );
    const frame = () =>
      new Promise((resolve) => requestAnimationFrame(resolve));
    over(archive);
    for (let i = 0; i < 4; i++) await frame();
    const body = document.querySelector<HTMLElement>(
      '[role="tooltip"] .re-floating-tooltip-content:not(.re-floating-tooltip-leaving)',
    );
    const before = Number(getComputedStyle(body as HTMLElement).opacity);
    over(remove);
    await frame();
    const leaving = document.querySelector<HTMLElement>(
      ".re-floating-tooltip-leaving",
    );
    return {
      before,
      leaving: Number(getComputedStyle(leaving as HTMLElement).opacity),
      text: leaving?.textContent,
    };
  });
  expect(flash.text).toBe("Archive");
  expect(flash.before).toBeLessThan(1);
  expect(flash.leaving).toBeLessThanOrEqual(flash.before + 0.01);

  await page.keyboard.press("Escape");
  await expect(page.getByRole("tooltip")).toBeHidden();
  const scales = await page.evaluate(async () => {
    const [ticketButton] =
      document.querySelectorAll<HTMLElement>("#root button");
    const box = ticketButton.getBoundingClientRect();
    const event = (type: string) =>
      ticketButton.dispatchEvent(
        new PointerEvent(type, {
          bubbles: true,
          pointerId: 1,
          pointerType: "mouse",
          clientX: box.x + 10,
          clientY: box.y + 8,
          relatedTarget: type === "pointerout" ? document.body : null,
        }),
      );
    const frame = () =>
      new Promise((resolve) => requestAnimationFrame(resolve));
    const popup = document.querySelector<HTMLElement>('[role="tooltip"]');
    const scale = () =>
      Number(/scale\(([\d.]+)\)/.exec(popup?.style.transform ?? "")?.[1] ?? 1);
    event("pointerover");
    await frame();
    await frame();
    event("pointerout");
    const out: number[] = [];
    for (let i = 0; i < 12 && popup && !popup.hidden; i++) {
      await frame();
      out.push(scale());
    }
    return out;
  });
  for (let i = 1; i < scales.length; i++)
    expect(scales[i]).toBeLessThanOrEqual(scales[i - 1] + 0.001);
});
