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
    const layers = () =>
      [
        ...document.querySelectorAll<HTMLElement>(
          '[role="tooltip"] .re-floating-tooltip-content',
        ),
      ].map((element) => Number(getComputedStyle(element).opacity));
    const before = Math.max(...layers());
    over(remove);
    await frame();
    const leaving = document.querySelector<HTMLElement>(
      ".re-floating-tooltip-leaving",
    );
    return {
      before,
      after: Math.max(...layers()),
      leaving: Number(getComputedStyle(leaving as HTMLElement).opacity),
    };
  });
  expect(flash.after).toBeGreaterThan(0.25);
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
    const before = scale();
    event("pointerout");
    const out: number[] = [before];
    for (let i = 0; i < 12 && popup && !popup.hidden; i++) {
      await frame();
      out.push(scale());
    }
    return out;
  });
  expect(scales[0]).toBeLessThan(1);
  for (let i = 1; i < scales.length; i++)
    expect(scales[i]).toBeLessThanOrEqual(scales[i - 1] + 0.001);
});

test("rolls with the latest travel, keeps its margin and never blinks on a quick return", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1000, height: 700 });
  await page.mouse.move(2, 2);
  await mount(
    page,
    `<div id="rows" style="display:grid;width:400px;margin:80px">
      <button style="height:28px" data-re-tooltip="Inbox">Inbox</button>
      <button style="height:28px" data-re-tooltip="Drafts">Drafts</button>
    </div>
    <div id="edge" style="position:absolute;right:0;top:300px;display:flex;flex-direction:column;align-items:end">
      <button data-re-tooltip="A much longer hint that reaches the edge">Long</button>
      <button data-re-tooltip="Hi">Short</button>
    </div>`,
    ["interactions/styles.css"],
  );
  await page.addScriptTag({
    type: "module",
    content: `import { createFloatingTooltip } from "@reuse-sh/interactions";
      createFloatingTooltip(document.querySelector("#rows"), { delay: 0, closeDelay: 0 });
      createFloatingTooltip(document.querySelector("#edge"), { delay: 0, closeDelay: 0 });
      window.__ready = true;`,
  });
  await expect.poll(() => page.evaluate(() => "__ready" in window)).toBe(true);

  const inbox = await page.getByRole("button", { name: "Inbox" }).boundingBox();
  const drafts = await page
    .getByRole("button", { name: "Drafts" })
    .boundingBox();
  if (!inbox || !drafts) throw new Error("Rows are not on screen.");
  await page.mouse.move(inbox.x + 10, inbox.y + 4);
  await page.waitForTimeout(400);
  await page.mouse.move(inbox.x + 260, inbox.y + 6, { steps: 6 });
  await page.waitForTimeout(200);
  await page.mouse.move(inbox.x + 260, drafts.y + 6, { steps: 3 });
  const keyframe = await page.evaluate(() => {
    const body = document.querySelector<HTMLElement>(
      '[role="tooltip"]:not([hidden]) .re-floating-tooltip-content:not(.re-floating-tooltip-leaving)',
    );
    const reel = body?.getAnimations()[0]?.effect as KeyframeEffect | undefined;
    return String(reel?.getKeyframes()[0]?.translate ?? "");
  });
  expect(keyframe.startsWith("0")).toBe(true);
  await page.keyboard.press("Escape");

  const long = await page.getByRole("button", { name: "Long" }).boundingBox();
  const short = await page.getByRole("button", { name: "Short" }).boundingBox();
  if (!long || !short) throw new Error("Edge buttons are not on screen.");
  await page.mouse.move(long.x + long.width - 2, long.y + 6);
  await page.waitForTimeout(400);
  await page.mouse.move(short.x + short.width - 2, short.y + 6);
  await page.waitForTimeout(600);
  const right = await page.evaluate(async () => {
    const popup = [
      ...document.querySelectorAll<HTMLElement>('[role="tooltip"]'),
    ].find((element) => !element.hidden);
    const short = [...document.querySelectorAll("#edge button")][1];
    short.dispatchEvent(
      new PointerEvent("pointerout", {
        bubbles: true,
        pointerId: 1,
        pointerType: "mouse",
        relatedTarget: document.body,
      }),
    );
    let worst = 0;
    let shrinking = 0;
    for (let i = 0; i < 14 && popup && !popup.hidden; i++) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
      if (popup.style.transform.includes("scale(")) shrinking++;
      worst = Math.max(worst, popup.getBoundingClientRect().right);
    }
    return { worst, shrinking };
  });
  expect(right.shrinking).toBeGreaterThan(0);
  expect(right.worst).toBeLessThanOrEqual(1000 - 12 + 0.5);

  await page.keyboard.press("Escape");
  const returning = await page.evaluate(async () => {
    const inboxButton = document.querySelector<HTMLElement>("#rows button");
    const box = inboxButton?.getBoundingClientRect();
    const event = (type: string) =>
      inboxButton?.dispatchEvent(
        new PointerEvent(type, {
          bubbles: true,
          pointerId: 1,
          pointerType: "mouse",
          clientX: (box?.x ?? 0) + 10,
          clientY: (box?.y ?? 0) + 6,
          relatedTarget: type === "pointerout" ? document.body : null,
        }),
      );
    const frame = () =>
      new Promise((resolve) => requestAnimationFrame(resolve));
    event("pointerover");
    await frame();
    await frame();
    const popup = [
      ...document.querySelectorAll<HTMLElement>('[role="tooltip"]'),
    ].find((element) => !element.hidden);
    const opacity = () =>
      Number(getComputedStyle(popup as HTMLElement).opacity);
    const before = opacity();
    event("pointerout");
    await new Promise((resolve) => setTimeout(resolve, 0));
    event("pointerover");
    let low = 1;
    for (let i = 0; i < 12; i++) {
      await frame();
      low = Math.min(low, opacity());
    }
    return { before, low };
  });
  expect(returning.before).toBeLessThan(1);
  expect(returning.low).toBeGreaterThanOrEqual(returning.before - 0.05);
});

test("rolls a slow sweep sideways and brings a hint back from where it is leaving", async ({
  page,
}) => {
  await page.mouse.move(2, 2);
  await mount(
    page,
    `<div id="bar" style="display:flex;padding:80px">
      <button style="width:80px;height:32px" data-re-tooltip="Bold">Bold</button>
      <button style="width:80px;height:32px" data-re-tooltip="Italic">Italic</button>
    </div>
    <div id="live" style="display:flex;padding:80px">
      <button style="width:80px" data-live="a">A</button>
      <button style="width:80px" data-live="b">B</button>
    </div>`,
    ["interactions/styles.css"],
  );
  await page.addScriptTag({
    type: "module",
    content: `import { createFloatingTooltip } from "@reuse-sh/interactions";
      createFloatingTooltip(document.querySelector("#bar"), { delay: 0, selector: "[data-re-tooltip]" });
      const nodes = {};
      for (const key of ["a", "b"]) {
        const node = document.createElement("span");
        node.textContent = "Hint " + key.toUpperCase();
        nodes[key] = node;
      }
      createFloatingTooltip(document.querySelector("#live"), {
        delay: 0,
        selector: "[data-live]",
        content: (trigger) => nodes[trigger.dataset.live],
      });
      window.__ready = true;`,
  });
  await expect.poll(() => page.evaluate(() => "__ready" in window)).toBe(true);
  const bold = await page.getByRole("button", { name: "Bold" }).boundingBox();
  if (!bold) throw new Error("No toolbar.");
  await page.mouse.move(bold.x + 4, bold.y + 16);
  await page.waitForTimeout(400);
  for (let x = 5; x <= 79; x++) await page.mouse.move(bold.x + x, bold.y + 16);
  await page.mouse.move(bold.x + 81, bold.y + 19);
  const sideways = await page.evaluate(() => {
    const body = [
      ...document.querySelectorAll<HTMLElement>(
        '[role="tooltip"]:not([hidden]) .re-floating-tooltip-content:not(.re-floating-tooltip-leaving)',
      ),
    ][0];
    const reel = body?.getAnimations()[0]?.effect as KeyframeEffect | undefined;
    return String(reel?.getKeyframes()[0]?.translate ?? "");
  });
  expect(sideways, `keyframe ${sideways}`).toMatch(/%$|% 0(px)?$/);
  await page.keyboard.press("Escape");

  const a = await page
    .getByRole("button", { name: "A", exact: true })
    .boundingBox();
  const b = await page
    .getByRole("button", { name: "B", exact: true })
    .boundingBox();
  if (!a || !b) throw new Error("No live triggers.");
  await page.mouse.move(a.x + 20, a.y + 8);
  await page.waitForTimeout(400);
  await page.mouse.move(b.x + 20, b.y + 8, { steps: 2 });
  await page.waitForTimeout(60);
  await page.mouse.move(a.x + 60, a.y + 8, { steps: 2 });
  const layers = await page.evaluate(async () => {
    await new Promise((resolve) => requestAnimationFrame(resolve));
    return [
      ...document.querySelectorAll<HTMLElement>(
        '[role="tooltip"]:not([hidden]) .re-floating-tooltip-content',
      ),
    ].map((element) => ({
      text: element.textContent,
      opacity: Number(getComputedStyle(element).opacity),
    }));
  });
  const visibleA = layers.filter(
    (layer) => layer.text === "Hint A" && layer.opacity > 0.05,
  );
  expect(visibleA).toHaveLength(1);
  expect(layers.every((layer) => layer.text !== "")).toBe(true);
});
