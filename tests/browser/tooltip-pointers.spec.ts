import { expect, test } from "@playwright/test";
import { mount } from "./harness";

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
