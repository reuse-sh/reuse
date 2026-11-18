import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { expect, type Page, test } from "@playwright/test";
import { mount } from "./harness";

type Lightbox = {
  open(items: unknown[], index?: number): void;
  setItems(items: unknown[], index?: number): void;
  next(): void;
  goTo(index: number): void;
  zoomTo(scale: number): void;
  getState(): { index: number; isOpen: boolean; zoom: { scale: number } };
  close(): Promise<void>;
  on(type: string, listener: (event: { index: number }) => void): () => void;
};
type Window = globalThis.Window &
  typeof globalThis & { lightbox: Lightbox; changes: number[] };

async function open(
  page: Page,
  options: Record<string, unknown>,
  {
    count = 5,
    index = 0,
    captions = false,
    srcset = false,
    slots = false,
    styles = [] as string[],
  } = {},
) {
  await mount(page, "", ["lightbox/base.css", "lightbox/theme.css", ...styles]);
  await page.evaluate(
    async ([extra, total, start, captioned, widths, slotted]) => {
      const { createLightbox } = await import("/modules/lightbox/index.js");
      const photo = (i: number) =>
        `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="hsl(${i * 47} 60% 55%)"/></svg>`)}`;
      const slots = slotted
        ? {
            toolbarStart: ({ document }: { document: Document }) => {
              const node = document.createElement("span");
              node.className = "start-slot";
              return { node };
            },
            toolbarEnd: ({ document }: { document: Document }) => {
              const node = document.createElement("button");
              node.className = "re-lightbox-button end-slot";
              return { node };
            },
          }
        : undefined;
      const lightbox = createLightbox({ history: false, slots, ...extra });
      const changes: number[] = [];
      lightbox.on("change", () => changes.push(performance.now()));
      Object.assign(window, { lightbox, changes });
      lightbox.open(
        Array.from({ length: total }, (_, i) => ({
          src: photo(i),
          srcset: widths
            ? `${photo(i)} 600w, https://cdn.test/photo-${i}-2400.jpg 2400w, https://cdn.test/photo-${i}-1200.jpg 1200w`
            : undefined,
          previewSrc: photo(i),
          width: 1200,
          height: 800,
          caption: captioned ? `Caption ${i + 1}` : undefined,
        })),
        start,
      );
    },
    [options, count, index, captions, srcset, slots] as const,
  );
  await page.waitForTimeout(500);
}

const lightbox = (page: Page) =>
  page.evaluate(() => (window as Window).lightbox.getState());

const controls = [
  "close",
  "prev",
  "next",
  "counter",
  "zoom",
  "fullscreen",
  "download",
  "slideshow",
];

test("every control turned off is neither in the DOM nor in the tab order", async ({
  page,
}) => {
  await open(page, {
    controls: { close: false, arrows: false, counter: false, zoom: false },
  });
  for (const name of controls)
    await expect(page.locator(`.re-lightbox-${name}`)).toHaveCount(0);
  const reached = new Set<string>();
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press("Tab");
    reached.add(
      await page.evaluate(() => document.activeElement?.className ?? ""),
    );
  }
  expect(
    [...reached]
      .filter(Boolean)
      .every((name) => /re-lightbox-viewport/.test(name)),
  ).toBe(true);
  expect(await lightbox(page)).toMatchObject({ isOpen: true });
});

test("the controls sit in their corners in a fixed order", async ({ page }) => {
  await open(
    page,
    { controls: { fullscreen: true, download: true, slideshow: true } },
    { srcset: true, slots: true },
  );
  const order = await page.evaluate(() => ({
    start: [
      ...(document.querySelector(".re-lightbox-toolbar-start")?.children ?? []),
    ].map((element) => element.className),
    end: [
      ...(document.querySelector(".re-lightbox-toolbar-end")?.children ?? []),
    ].map((element) => element.className.replace("re-lightbox-button ", "")),
  }));
  expect(order).toEqual({
    start: ["re-lightbox-counter", "start-slot"],
    end: [
      "re-lightbox-zoom",
      "re-lightbox-slideshow",
      "re-lightbox-fullscreen",
      "re-lightbox-download",
      "end-slot",
      "re-lightbox-close",
    ],
  });
  await expect(page.locator(".re-lightbox-download")).toHaveAttribute(
    "href",
    "https://cdn.test/photo-0-2400.jpg",
  );
  await page.evaluate(() => (window as Window).lightbox.next());
  await expect(page.locator(".re-lightbox-download")).toHaveAttribute(
    "href",
    "https://cdn.test/photo-1-2400.jpg",
  );
});

async function openFiles(page: Page, files: string[], origin?: string) {
  await mount(page, "", ["lightbox/base.css", "lightbox/theme.css"], origin);
  await page.evaluate(async (sources) => {
    const { createLightbox } = await import("/modules/lightbox/index.js");
    const blob = URL.createObjectURL(
      new Blob(["photo"], { type: "image/jpeg" }),
    );
    const lightbox = createLightbox({
      history: false,
      controls: { download: true },
    });
    Object.assign(window, { lightbox });
    lightbox.open(
      sources.map((src) => ({
        src: src === "blob" ? blob : src,
        width: 1200,
        height: 800,
      })),
    );
  }, files);
  await page.waitForTimeout(500);
}

test("Download offers only web, blob and raster data files", async ({
  page,
}) => {
  const files = [
    "javascript:alert(1)",
    "JAVASCRIPT:alert(1)",
    "\tjavascript:alert(1)",
    "data:text/html,%3Cscript%3Ealert(1)%3C/script%3E",
    "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'/%3E",
    "https://cdn.test/photo.jpg",
    "blob",
    "data:image/png;base64,iVBORw0KGgo=",
    "data:image/jpeg;base64,/9j/4AAQ",
    "data:image/gif;base64,R0lGODlh",
    "data:image/webp;base64,UklGRg==",
    "data:image/avif;base64,AAAAIGZ0eXA=",
  ];
  await openFiles(page, files);
  const offered: boolean[] = [];
  for (let index = 0; index < files.length; index++) {
    await page.evaluate((i) => (window as Window).lightbox.goTo(i), index);
    offered.push(await page.locator(".re-lightbox-download").isVisible());
  }
  expect(offered).toEqual([
    false,
    false,
    false,
    false,
    false,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
  ]);
});

test("Download saves a file from another origin without leaving the page", async ({
  page,
}) => {
  await page.route("https://cdn.test/photo.jpg", (route) =>
    route.fulfill({
      contentType: "image/jpeg",
      headers: { "access-control-allow-origin": "*" },
      body: "photo",
    }),
  );
  await openFiles(page, ["https://cdn.test/photo.jpg"]);
  const [file] = await Promise.all([
    page.waitForEvent("download"),
    page.click(".re-lightbox-download"),
  ]);
  expect(file.suggestedFilename()).toBe("photo.jpg");
  expect(page.url()).toBe("http://reuse.test/");
});

test("Download saves a file from another origin under its decoded name", async ({
  page,
}) => {
  await page.route("https://cdn.test/**", (route) =>
    route.fulfill({
      contentType: "image/jpeg",
      headers: { "access-control-allow-origin": "*" },
      body: "photo",
    }),
  );
  await openFiles(page, [
    "https://cdn.test/My%20Photo.jpg",
    "https://cdn.test/%D1%84%D0%BE%D1%82%D0%BE.jpg",
    "https://cdn.test/100%25%zz.jpg",
  ]);
  const names: string[] = [];
  for (const index of [0, 1, 2]) {
    await page.evaluate((i) => (window as Window).lightbox.goTo(i), index);
    const [file] = await Promise.all([
      page.waitForEvent("download"),
      page.click(".re-lightbox-download"),
    ]);
    names.push(file.suggestedFilename());
  }
  expect(names).toEqual(["My Photo.jpg", "фото.jpg", "100%25%zz.jpg"]);
});

test("Download frees the saved file's object URL a minute after the click, even when the viewer closes first", async ({
  page,
}) => {
  await page.clock.install();
  await page.addInitScript(() => {
    const revoked: string[] = [];
    const revoke = URL.revokeObjectURL;
    URL.revokeObjectURL = (url: string) => {
      revoked.push(url);
      revoke(url);
    };
    Object.assign(window, { revoked });
  });
  let answer = () => {};
  const answered = new Promise<void>((resolve) => {
    answer = resolve;
  });
  await page.route("https://cdn.test/photo.jpg", async (route) => {
    await answered;
    await route.fulfill({
      contentType: "image/jpeg",
      headers: { "access-control-allow-origin": "*" },
      body: "photo",
    });
  });
  await openFiles(page, ["https://cdn.test/photo.jpg"]);
  await page.click(".re-lightbox-download");
  await page.evaluate(() => (window as Window).lightbox.close());
  const download = page.waitForEvent("download");
  answer();
  await download;
  const revoked = () =>
    page.evaluate(
      () => (window as unknown as { revoked: string[] }).revoked.length,
    );
  await page.clock.runFor(59_000);
  expect(await revoked()).toBe(0);
  await page.clock.runFor(1_000);
  expect(await revoked()).toBe(1);
});

test("Download opens a file another origin keeps from scripts in a new tab", async ({
  page,
}) => {
  // Playwright answers a fulfilled cross-origin fetch with CORS headers, so a refused read is an aborted fetch.
  await page
    .context()
    .route("https://cdn.test/photo.jpg", (route) =>
      route.request().resourceType() === "fetch"
        ? route.abort()
        : route.fulfill({ contentType: "image/jpeg", body: "photo" }),
    );
  await openFiles(page, ["https://cdn.test/photo.jpg"]);
  const [popup] = await Promise.all([
    page.waitForEvent("popup"),
    page.click(".re-lightbox-download"),
  ]);
  await popup.waitForLoadState();
  expect(popup.url()).toBe("https://cdn.test/photo.jpg");
  expect(await popup.evaluate(() => window.opener)).toBeNull();
  expect(page.url()).toBe("http://reuse.test/");
});

test("Download opens a file whose fetch already failed as a plain link, so no popup blocker can stop it", async ({
  page,
}) => {
  await page
    .context()
    .route("https://cdn.test/photo.jpg", (route) =>
      route.request().resourceType() === "fetch"
        ? route.abort()
        : route.fulfill({ contentType: "image/jpeg", body: "photo" }),
    );
  await openFiles(page, ["https://cdn.test/photo.jpg"]);
  const failed = page.waitForEvent("requestfailed");
  await page.locator(".re-lightbox-download").dispatchEvent("pointerdown");
  await failed;
  await page.evaluate(() => {
    Object.assign(window, { prevented: [] as boolean[] });
    window.open = () => null;
    document.addEventListener("click", (event) =>
      (window as unknown as { prevented: boolean[] }).prevented.push(
        event.defaultPrevented,
      ),
    );
  });
  const [popup] = await Promise.all([
    page.waitForEvent("popup"),
    page.click(".re-lightbox-download"),
  ]);
  await popup.waitForLoadState();
  expect(popup.url()).toBe("https://cdn.test/photo.jpg");
  expect(await popup.evaluate(() => window.opener)).toBeNull();
  expect(
    await page.evaluate(
      () => (window as unknown as { prevented: boolean[] }).prevented,
    ),
  ).toEqual([false]);
  expect(page.url()).toBe("http://reuse.test/");
});

test("Tab past Download fetches nothing, and Enter on it starts the fetch", async ({
  page,
}) => {
  const fetched: string[] = [];
  await page.route("https://cdn.test/photo.jpg", (route) => {
    if (route.request().resourceType() === "fetch")
      fetched.push(route.request().url());
    return route.fulfill({
      contentType: "image/jpeg",
      headers: { "access-control-allow-origin": "*" },
      body: "photo",
    });
  });
  await openFiles(page, ["https://cdn.test/photo.jpg"]);
  const focused = () =>
    page.evaluate(() => document.activeElement?.className ?? "");
  for (let i = 0; i < 8 && !(await focused()).includes("download"); i++)
    await page.keyboard.press("Tab");
  expect(await focused()).toContain("re-lightbox-download");
  await page.keyboard.press("Tab");
  await page.waitForTimeout(300);
  expect(fetched).toEqual([]);
  await page.keyboard.press("Shift+Tab");
  const [file] = await Promise.all([
    page.waitForEvent("download"),
    page.keyboard.press("Enter"),
  ]);
  expect(file.suggestedFilename()).toBe("photo.jpg");
  expect(fetched).toEqual(["https://cdn.test/photo.jpg"]);
});

test("Download saves a raster data file without leaving the page", async ({
  page,
}) => {
  await openFiles(page, ["data:image/png;base64,iVBORw0KGgo="]);
  const [file] = await Promise.all([
    page.waitForEvent("download"),
    page.click(".re-lightbox-download"),
  ]);
  expect(await file.failure()).toBeNull();
  expect(page.url()).toBe("http://reuse.test/");
});

test("Download saves a same-origin file without leaving the page", async ({
  page,
}) => {
  await openFiles(page, ["/photo.jpg"]);
  await page.route("http://reuse.test/photo.jpg", (route) =>
    route.fulfill({ contentType: "image/jpeg", body: "photo" }),
  );
  await expect(page.locator(".re-lightbox-download")).toHaveAttribute(
    "download",
    "",
  );
  const [file] = await Promise.all([
    page.waitForEvent("download"),
    page.click(".re-lightbox-download"),
  ]);
  expect(file.suggestedFilename()).toBe("photo.jpg");
  expect(page.url()).toBe("http://reuse.test/");
});

test("Download keeps the tab when a same-origin file redirects to another origin", {
  tag: "@desktop",
}, async ({ page, browserName }) => {
  // Playwright cannot fulfill a fetch with a redirect, so two real servers stand for the page and the other origin.
  const listen = async (server: Server) => {
    await new Promise<void>((resolve) =>
      server.listen(0, "127.0.0.1", resolve),
    );
    return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  };
  const files = createServer((_, response) =>
    response
      .writeHead(200, {
        "content-type": "image/jpeg",
        "access-control-allow-origin": "*",
      })
      .end("photo"),
  );
  const other = await listen(files);
  const site = createServer((_, response) =>
    response.writeHead(302, { location: `${other}/moved.jpg` }).end(),
  );
  const origin = await listen(site);
  // Chromium asks before a page it takes for public reaches a loopback server.
  if (browserName === "chromium")
    await page.context().grantPermissions(["local-network-access"]);
  try {
    await openFiles(page, ["/moved.jpg"], origin);
    await page.route(`${origin}/moved.jpg`, (route) => route.continue());
    const [file] = await Promise.all([
      page.waitForEvent("download"),
      page.click(".re-lightbox-download"),
    ]);
    expect(file.suggestedFilename()).toBe("moved.jpg");
    expect(page.url()).toBe(`${origin}/`);
    expect(await lightbox(page)).toMatchObject({ isOpen: true });
  } finally {
    site.close();
    files.close();
  }
});

test("the fullscreen button toggles the viewer's stage, and leaving fullscreen keeps it open", async ({
  page,
}) => {
  await open(page, { controls: { fullscreen: true } });
  const button = page.locator(".re-lightbox-fullscreen");
  await expect(button).toHaveAttribute("aria-label", "Enter full screen");
  await button.click();
  await expect
    .poll(() =>
      page.evaluate(() => document.fullscreenElement?.className ?? ""),
    )
    .toBe("re-lightbox-stage");
  await expect(button).toHaveAttribute("aria-label", "Exit full screen");
  await page.evaluate(() => document.exitFullscreen());
  await expect(button).toHaveAttribute("aria-label", "Enter full screen");
  expect(await lightbox(page)).toMatchObject({ isOpen: true });
});

test("without the Fullscreen API there is no fullscreen button", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(Document.prototype, "fullscreenEnabled", {
      get: () => false,
    }),
  );
  await open(page, { controls: { fullscreen: true } });
  await expect(page.locator(".re-lightbox-fullscreen")).toHaveCount(0);
});

test("in RTL previous sits on the right and next on the left, each icon mirrored", async ({
  page,
}) => {
  await mount(page, "", ["lightbox/base.css", "lightbox/theme.css"]);
  await page.evaluate(async () => {
    document.documentElement.dir = "rtl";
    const { createLightbox } = await import("/modules/lightbox/index.js");
    const icon = () =>
      document.createElementNS("http://www.w3.org/2000/svg", "svg");
    createLightbox({
      history: false,
      icons: { previous: icon, next: icon },
    }).open(
      Array.from({ length: 3 }, () => ({
        src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='800'/%3E",
        width: 1200,
        height: 800,
      })),
      1,
    );
  });
  await page.waitForTimeout(400);
  const arrows = await page.evaluate(() =>
    [".re-lightbox-prev", ".re-lightbox-next"].map((selector) => {
      const button = document.querySelector(selector) as HTMLElement;
      const { left, right } = button.getBoundingClientRect();
      return {
        left: Math.round(left),
        right: Math.round(right),
        scale: getComputedStyle(button.querySelector("svg") as Element).scale,
      };
    }),
  );
  expect(arrows).toEqual([
    { left: 1000 - 16 - 44, right: 1000 - 16, scale: "-1 1" },
    { left: 16, right: 16 + 44, scale: "-1 1" },
  ]);
});

test("in RTL the counter reads 2 / 3 for the second of three photos, and an Arabic counter reads right to left", async ({
  page,
}) => {
  await mount(page, "", ["lightbox/base.css", "lightbox/theme.css"]);
  const order = (strings: Record<string, unknown>) =>
    page.evaluate(async (arabic) => {
      document.documentElement.dir = "rtl";
      const { createLightbox } = await import("/modules/lightbox/index.js");
      const lightbox = createLightbox({
        history: false,
        strings: arabic
          ? {
              counter: (index: number, count: number) =>
                `${(index + 1).toLocaleString("ar-EG")} من ${count.toLocaleString("ar-EG")}`,
            }
          : {},
      });
      lightbox.open(
        Array.from({ length: 3 }, () => ({
          src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='800'/%3E",
          width: 1200,
          height: 800,
        })),
        1,
      );
      const numbers = [
        ...document.querySelectorAll(".re-lightbox-counter-number"),
      ].map((number) => ({
        text: number.textContent,
        left: Math.round(number.getBoundingClientRect().left),
      }));
      lightbox.destroy();
      return numbers
        .sort((a, b) => a.left - b.left)
        .map((number) => number.text);
    }, Boolean(strings.arabic));
  expect(await order({})).toEqual(["2", "3"]);
  expect(await order({ arabic: true })).toEqual(["٣", "٢"]);
});

test("a narrow right-to-left viewer with a side caption keeps next at its edge", async ({
  page,
}) => {
  await page.setViewportSize({ width: 600, height: 700 });
  await mount(page, "", ["lightbox/base.css", "lightbox/theme.css"]);
  await page.evaluate(async () => {
    document.documentElement.dir = "rtl";
    const { createLightbox } = await import("/modules/lightbox/index.js");
    const photo = (i: number) =>
      `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="hsl(${i * 47} 60% 55%)"/></svg>`)}`;
    createLightbox({ history: false, caption: "side" }).open(
      [0, 1, 2].map((i) => ({
        src: photo(i),
        width: 1200,
        height: 800,
        caption: `Caption ${i + 1}`,
      })),
      1,
    );
  });
  await page.waitForTimeout(500);
  const next = await page.locator(".re-lightbox-next").boundingBox();
  const prev = await page.locator(".re-lightbox-prev").boundingBox();
  expect(Math.round(next?.x ?? 0)).toBe(16);
  expect(Math.round(600 - (prev?.x ?? 0) - (prev?.width ?? 0))).toBe(16);
});

test("a side column sits at the end edge, left in RTL, and turns into the bottom strip at 700px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1000, height: 700 });
  await mount(page, "", ["lightbox/base.css", "lightbox/theme.css"]);
  await page.evaluate(() =>
    document.documentElement.setAttribute("dir", "rtl"),
  );
  await page.evaluate(async () => {
    const { createLightbox } = await import("/modules/lightbox/index.js");
    const lightbox = createLightbox({ history: false, thumbnails: "side" });
    lightbox.open(
      Array.from({ length: 12 }, () => ({
        src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='800'/%3E",
        width: 1200,
        height: 800,
      })),
    );
  });
  await page.waitForTimeout(400);
  const strip = page.locator(".re-lightbox-thumbnails");
  const column = await strip.boundingBox();
  if (!column) throw new Error("No strip");
  expect(column.x).toBeLessThan(100);
  expect(column.height).toBeGreaterThan(column.width * 4);
  await page.setViewportSize({ width: 700, height: 700 });
  await expect(
    page.locator(".re-lightbox-footer .re-lightbox-thumbnails"),
  ).toHaveCount(1);
  const row = await strip.boundingBox();
  if (!row) throw new Error("No strip");
  expect(row.width).toBeGreaterThan(row.height * 4);
  expect(row.y).toBeGreaterThan(500);
});

const offCenter = (page: Page) =>
  page.evaluate(() => {
    const strip = document.querySelector(".re-lightbox-thumbnails");
    const thumb = strip?.querySelector('[aria-current="true"]');
    if (!strip || !thumb) return Number.NaN;
    const a = strip.getBoundingClientRect();
    const b = thumb.getBoundingClientRect();
    return Math.abs(b.left + b.width / 2 - (a.left + a.width / 2));
  });

test("the carousel's own stylesheet on the page leaves the slides edge to edge and the 3:2 thumbnails 66 by 44px, 8px apart", async ({
  page,
}) => {
  await open(
    page,
    { thumbnails: "bottom" },
    { styles: ["carousel/styles.css"] },
  );
  const layout = await page.evaluate(() => {
    const viewport = document.querySelector(
      ".re-lightbox-viewport",
    ) as HTMLElement;
    const slides = viewport.querySelectorAll<HTMLElement>(".re-lightbox-slide");
    const [first, second] = [
      ...document.querySelectorAll(".re-lightbox-thumbnails button"),
    ].map((thumb) => thumb.getBoundingClientRect());
    return {
      pitch: slides[1].offsetLeft - slides[0].offsetLeft,
      width: viewport.clientWidth,
      thumb: [first.width, first.height],
      gap: second.left - first.right,
    };
  });
  expect(layout).toEqual({
    pitch: layout.width,
    width: layout.width,
    thumb: [66, 44],
    gap: 8,
  });
});

test("the active thumbnail stays centered from the first photo to the fortieth", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page, { thumbnails: "bottom" }, { count: 40 });
  for (let index = 0; index < 40; index++) {
    if (index) await page.evaluate(() => (window as Window).lightbox.next());
    await expect.poll(() => offCenter(page)).toBeLessThanOrEqual(2);
  }
});

test("a click on thumbnail 38 pages there without a fade and the strip ends with 38 centered", async ({
  page,
}) => {
  await open(page, { thumbnails: "bottom" }, { count: 40 });
  const opacities = page.evaluate(
    () =>
      new Promise<number[]>((resolve) => {
        const viewport = document.querySelector(".re-lightbox-viewport");
        const seen: number[] = [];
        const start = performance.now();
        const tick = () => {
          if (viewport) seen.push(Number(getComputedStyle(viewport).opacity));
          if (performance.now() - start < 800) requestAnimationFrame(tick);
          else resolve(seen);
        };
        requestAnimationFrame(tick);
      }),
  );
  await page.getByRole("button", { name: "Show image 38" }).click();
  expect(Math.min(...(await opacities))).toBe(1);
  expect((await lightbox(page)).index).toBe(37);
  await expect.poll(() => offCenter(page)).toBeLessThanOrEqual(2);
});

test("thumbnails clicked 60ms apart while the strip centers each one open every photo", {
  tag: "@desktop",
}, async ({ page }) => {
  await open(page, { thumbnails: "bottom" }, { count: 8 });
  const opened: number[] = [];
  for (const index of [3, 1, 5, 2, 6]) {
    const box = await page
      .getByRole("button", { name: `Show image ${index + 1}` })
      .boundingBox();
    if (!box) throw new Error(`Thumbnail ${index + 1} has no box.`);
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    opened.push((await lightbox(page)).index);
    await page.waitForTimeout(60);
  }
  expect(opened).toEqual([3, 1, 5, 2, 6]);
});

test("a second click on a thumbnail while the strip centers it still ends with it centered", {
  tag: "@desktop",
}, async ({ page }) => {
  await open(page, { thumbnails: "bottom" }, { count: 40 });
  const thumb = page.getByRole("button", { name: "Show image 6" });
  await thumb.click();
  await page.waitForTimeout(80);
  const box = await thumb.boundingBox();
  if (!box) throw new Error("Thumbnail 6 has no box.");
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  expect((await lightbox(page)).index).toBe(5);
  await expect.poll(() => offCenter(page)).toBeLessThanOrEqual(2);
});

test("bottom thumbnails take each photo's proportions up to 3:1, square without a size and 24px at the narrowest, and the ring takes the active one's size", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page, { thumbnails: "bottom" });
  const ringOff = () =>
    page.evaluate(() => {
      const ring = document.querySelector(".re-lightbox-thumbnail-ring");
      const thumb = document.querySelector(
        '.re-lightbox-thumbnails [aria-current="true"]',
      );
      if (!ring || !thumb) return Number.NaN;
      const a = ring.getBoundingClientRect();
      const b = thumb.getBoundingClientRect();
      return Math.max(
        Math.abs(a.left - b.left),
        Math.abs(a.top - b.top),
        Math.abs(a.width - b.width),
      );
    });
  const widths = await page.evaluate(() => {
    const src = (
      document.querySelector(".re-lightbox-thumbnails img") as HTMLImageElement
    ).src;
    (window as Window).lightbox.setItems([
      { src, thumbnailSrc: src, width: 1200, height: 800 },
      { src: `${src}#2`, thumbnailSrc: src },
      { src: `${src}#3`, thumbnailSrc: src, width: 300, height: 1200 },
      { src: `${src}#4`, thumbnailSrc: src, width: 1600, height: 400 },
    ]);
    return [...document.querySelectorAll(".re-lightbox-thumbnails button")].map(
      (thumb) => thumb.getBoundingClientRect().width,
    );
  });
  expect(widths).toEqual([66, 44, 24, 132]);
  for (const index of [1, 2, 3]) {
    await page.evaluate((i) => (window as Window).lightbox.goTo(i), index);
    await expect.poll(ringOff).toBeLessThanOrEqual(1);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(ringOff).toBeLessThanOrEqual(1);
});

const ringBox = (page: Page) =>
  page.evaluate(() => {
    const ring = document.querySelector(".re-lightbox-thumbnail-ring");
    const strip = document.querySelector(".re-lightbox-thumbnails");
    if (!ring || !strip) return undefined;
    const a = ring.getBoundingClientRect();
    const b = strip.getBoundingClientRect();
    return {
      x: a.left + a.width / 2 - (b.left + b.width / 2),
      y: a.top + a.height / 2 - (b.top + b.height / 2),
      top: a.top,
      left: a.left,
    };
  });

const slideOffset = (page: Page) =>
  page.evaluate(() => {
    const { index } = (window as Window).lightbox.getState();
    const viewport = document.querySelector(".re-lightbox-viewport");
    const slide = document.querySelectorAll(".re-lightbox-slide")[index];
    if (!viewport || !slide) return Number.NaN;
    return Math.abs(
      slide.getBoundingClientRect().left -
        viewport.getBoundingClientRect().left,
    );
  });

test("a mouse drag on the strip keeps the ring still, opens each photo at once as its thumbnail reaches the ring, and loads full files only after the strip settles", {
  tag: "@desktop",
}, async ({ page }) => {
  const requested: string[] = [];
  await page.route("https://cdn.test/**", (route) => {
    requested.push(route.request().url());
    return route.abort();
  });
  await open(page, { thumbnails: "bottom" }, { count: 20, srcset: true });
  await expect.poll(() => requested.length).toBeGreaterThan(0);
  const before = await ringBox(page);
  if (!before) throw new Error("No ring");
  expect(Math.abs(before.x)).toBeLessThanOrEqual(1);
  const first = await page
    .getByRole("button", { name: "Show image 1", exact: true })
    .boundingBox();
  if (!first) throw new Error("Thumbnail 1 has no box.");
  const pitch = first.width + 8;
  requested.length = 0;
  await page.mouse.move(first.x + first.width / 2, first.y + first.height / 2);
  await page.mouse.down();
  const seen: number[] = [];
  for (let step = 1; step <= 30; step++) {
    await page.mouse.move(
      first.x + first.width / 2 - (step * pitch * 3) / 30,
      first.y + first.height / 2,
    );
    const { index } = await lightbox(page);
    if (seen.at(-1) !== index) {
      seen.push(index);
      expect(await slideOffset(page)).toBeLessThanOrEqual(1);
    }
    const ring = await ringBox(page);
    expect(ring?.left).toBeCloseTo(before.left, 0);
    expect(ring?.top).toBeCloseTo(before.top, 0);
  }
  expect(seen).toEqual([0, 1, 2, 3]);
  expect(requested).toEqual([]);
  await page.mouse.up();
  await expect
    .poll(async () => {
      const { index } = await lightbox(page);
      return (
        (await offCenter(page)) <= 2 &&
        requested.some((url) => url.includes(`photo-${index}-`))
      );
    })
    .toBe(true);
  expect((await lightbox(page)).index).toBeGreaterThanOrEqual(3);
  expect(Math.abs((await ringBox(page))?.x ?? Number.NaN)).toBeLessThanOrEqual(
    1,
  );
});

test("the side column keeps the ring at its middle, a wheel over it opens the photo under the ring, and paging moves that photo's thumbnail under the ring", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page, { thumbnails: "side" }, { count: 20 });
  const centered = () =>
    page.evaluate(() => {
      const ring = document.querySelector(".re-lightbox-thumbnail-ring");
      const thumb = document.querySelector(
        '.re-lightbox-thumbnails [aria-current="true"]',
      );
      if (!ring || !thumb) return Number.NaN;
      const a = ring.getBoundingClientRect();
      const b = thumb.getBoundingClientRect();
      return Math.max(Math.abs(a.top - b.top), Math.abs(a.left - b.left));
    });
  const before = await ringBox(page);
  if (!before) throw new Error("No ring");
  expect(Math.abs(before.y)).toBeLessThanOrEqual(1);
  await expect.poll(centered).toBeLessThanOrEqual(1);
  const strip = await page.locator(".re-lightbox-thumbnails").boundingBox();
  if (!strip) throw new Error("No strip");
  await page.mouse.move(strip.x + strip.width / 2, strip.y + strip.height / 2);
  await page.mouse.wheel(0, 52 * 4);
  await expect
    .poll(async () => (await lightbox(page)).index)
    .toBeGreaterThan(0);
  await expect.poll(centered).toBeLessThanOrEqual(1);
  expect((await ringBox(page))?.top).toBeCloseTo(before.top, 0);
  await page.evaluate(() => (window as Window).lightbox.goTo(12));
  await expect.poll(centered).toBeLessThanOrEqual(1);
  expect((await lightbox(page)).index).toBe(12);
  expect((await ringBox(page))?.top).toBeCloseTo(before.top, 0);
});

test("a wheel over the bottom strip that scrolls in one step opens the photo under the ring", {
  tag: "@desktop",
}, async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page, { thumbnails: "bottom" }, { count: 20 });
  const strip = await page.locator(".re-lightbox-thumbnails").boundingBox();
  if (!strip) throw new Error("No strip");
  await page.mouse.move(strip.x + strip.width / 2, strip.y + strip.height / 2);
  const scrolled = () =>
    page.evaluate(
      () => document.querySelector(".re-lightbox-thumbnails")?.scrollLeft ?? 0,
    );
  const start = await scrolled();
  await page.mouse.wheel(52 * 4, 0);
  await expect.poll(scrolled).toBeGreaterThan(start + 100);
  await expect
    .poll(async () => (await lightbox(page)).index)
    .toBeGreaterThan(0);
  await expect.poll(() => ringOnCurrent(page)).toBeLessThanOrEqual(1);
});

// rgb() reports 0-255 and color(srgb) reports 0-1, so both come back as 0-1.
const channels = (color: string) => {
  const values = (color.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
  return color.startsWith("rgb") ? values.map((value) => value / 255) : values;
};

test("a button's hover follows a theme's own control color, and the default stays dark", {
  tag: "@desktop",
}, async ({ page }) => {
  await open(page, { className: "pale" }, { count: 2 });
  await page.addStyleTag({
    content:
      ".re-lightbox.pale{--re-lightbox-control:#fff;--re-lightbox-foreground:#111}",
  });
  const close = page.getByRole("button", { name: "Close gallery" });
  const hovered = async () => {
    await page.mouse.move(0, 0);
    await close.hover();
    await page.waitForTimeout(100);
    return channels(
      await close.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      ),
    );
  };
  for (const channel of await hovered()) {
    expect(channel).toBeGreaterThan(0.8);
    expect(channel).toBeLessThan(0.95);
  }
  await page.evaluate(() =>
    document.querySelector(".re-lightbox")?.classList.remove("pale"),
  );
  for (const channel of await hovered()) expect(channel).toBeLessThan(0.3);
});

const ringOnCurrent = (page: Page) =>
  page.evaluate(() => {
    const ring = document.querySelector(".re-lightbox-thumbnail-ring");
    const thumb = document.querySelector(
      '.re-lightbox-thumbnails [aria-current="true"]',
    );
    if (!ring || !thumb) return Number.NaN;
    const a = ring.getBoundingClientRect();
    const b = thumb.getBoundingClientRect();
    return Math.abs(a.left + a.width / 2 - (b.left + b.width / 2));
  });

test("the strip is one tab stop: Tab reaches the active thumbnail, and arrows, Home and End page the viewer with focus on the thumbnail under the ring", async ({
  page,
}) => {
  await open(page, { thumbnails: "bottom" }, { count: 40, index: 2 });
  const focused = () =>
    page.evaluate(() => document.activeElement?.getAttribute("aria-label"));
  for (let i = 0; i < 8 && (await focused()) !== "Show image 3"; i++)
    await page.keyboard.press("Tab");
  expect(await focused()).toBe("Show image 3");
  for (const [key, index] of [
    ["ArrowRight", 3],
    ["End", 39],
    ["ArrowLeft", 38],
    ["Home", 0],
  ] as const) {
    await page.keyboard.press(key);
    await expect.poll(async () => (await lightbox(page)).index).toBe(index);
    expect(await focused()).toBe(`Show image ${index + 1}`);
    await expect.poll(() => ringOnCurrent(page)).toBeLessThanOrEqual(1);
  }
  await page.keyboard.press("Enter");
  expect((await lightbox(page)).index).toBe(0);
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
  expect(await focused()).toBe("Show image 1");
});

test("a mouse drag on the strip reports and announces the photo once, when the strip settles, and leaves the tab stop on it", {
  tag: "@desktop",
}, async ({ page, browserName }) => {
  await open(page, { thumbnails: "bottom" }, { count: 20 });
  await page.evaluate(() => {
    const status = document.querySelector(".re-lightbox-status") as Element;
    const announced: string[] = [];
    new MutationObserver(() =>
      announced.push(status.textContent ?? ""),
    ).observe(status, { childList: true, characterData: true, subtree: true });
    Object.assign(window, { announced });
    (window as Window).changes.length = 0;
  });
  const first = await page
    .getByRole("button", { name: "Show image 1", exact: true })
    .boundingBox();
  if (!first) throw new Error("Thumbnail 1 has no box.");
  const pitch = first.width + 8;
  const y = first.y + first.height / 2;
  await page.mouse.move(first.x + first.width / 2, y);
  await page.mouse.down();
  for (let step = 1; step <= 30; step++)
    await page.mouse.move(
      first.x + first.width / 2 - (step * pitch * 4) / 30,
      y,
    );
  await page.mouse.up();
  await expect
    .poll(() => page.evaluate(() => (window as Window).changes.length))
    .toBeGreaterThan(0);
  await expect.poll(() => offCenter(page)).toBeLessThanOrEqual(2);
  await page.evaluate(async () => {
    for (let frame = 0; frame < 20; frame++)
      await new Promise(requestAnimationFrame);
  });
  const out = await page.evaluate(() => {
    const thumbs = [
      ...document.querySelectorAll<HTMLElement>(
        ".re-lightbox-thumbnails button",
      ),
    ];
    return {
      index: (window as Window).lightbox.getState().index,
      changes: (window as Window).changes.length,
      announced: (window as Window & { announced: string[] }).announced,
      focused: thumbs.indexOf(document.activeElement as HTMLElement),
      tabStop: thumbs.findIndex((thumb) => thumb.tabIndex === 0),
    };
  });
  expect(out.index).toBeGreaterThanOrEqual(3);
  expect(out.changes).toBe(1);
  expect(out.announced).toEqual([`Image ${out.index + 1} of 20`]);
  expect(out.tabStop).toBe(out.index);
  if (browserName === "chromium") expect(out.focused).toBe(out.index);
  else expect([-1, out.index]).toContain(out.focused);
});

test("a side caption panel at 1280px never covers the photo", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await open(page, { caption: "side" }, { captions: true });
  const aside = await page.locator(".re-lightbox-aside").boundingBox();
  const photo = await page
    .locator('.re-lightbox-slide[aria-hidden="false"] .re-lightbox-frame')
    .boundingBox();
  if (!aside || !photo) throw new Error("Missing part");
  expect(photo.x + photo.width).toBeLessThanOrEqual(aside.x);
  // The panel exists from the first frame, so the open flight runs to its end.
  expect(
    await page.evaluate(() =>
      [
        ".re-lightbox-backdrop",
        '.re-lightbox-slide[aria-hidden="false"] .re-lightbox-frame',
      ].map(
        (selector) =>
          getComputedStyle(document.querySelector(selector) as Element).opacity,
      ),
    ),
  ).toEqual(["1", "1"]);
  await expect(
    page.locator(".re-lightbox-aside .re-lightbox-caption"),
  ).toHaveText("Caption 1");
});

test("a 1000ms slideshow stops for a zoom at 500ms and moves on 500ms after the zoom ends", async ({
  page,
}) => {
  await open(page, {
    controls: { slideshow: true },
    slideshow: { interval: 1000 },
  });
  const button = page.locator(".re-lightbox-slideshow");
  await button.evaluate((element: HTMLElement) => element.click());
  await expect(button).toHaveAttribute("aria-label", "Stop slideshow");
  await page.waitForTimeout(500);
  await page.evaluate(() => (window as Window).lightbox.zoomTo(2));
  await page.waitForTimeout(1200);
  expect((await lightbox(page)).index).toBe(0);
  const resumed = await page.evaluate(() => {
    (window as Window).lightbox.zoomTo(1);
    return performance.now();
  });
  await expect.poll(async () => (await lightbox(page)).index).toBe(1);
  const changed = await page.evaluate(() => (window as Window).changes[0]);
  expect(changed - resumed).toBeGreaterThan(380);
  expect(changed - resumed).toBeLessThan(700);
});

test("the slideshow waits while the mouse is over the controls", async ({
  page,
}) => {
  await open(page, {
    controls: { slideshow: true },
    slideshow: { interval: 600 },
  });
  await page.locator(".re-lightbox-slideshow").click();
  await page.waitForTimeout(1000);
  expect((await lightbox(page)).index).toBe(0);
  await page.mouse.move(500, 350);
  await expect.poll(async () => (await lightbox(page)).index).toBe(1);
});

test("the last photo without loop goes back to the first, at once under reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(
    page,
    { controls: { slideshow: true }, slideshow: { interval: 300 } },
    { count: 3, index: 2 },
  );
  await page
    .locator(".re-lightbox-slideshow")
    .evaluate((element: HTMLElement) => element.click());
  await expect.poll(async () => (await lightbox(page)).index).toBe(0);
  expect(
    await page.evaluate(() =>
      document
        .querySelector<HTMLElement>(".re-lightbox-slideshow")
        ?.style.getPropertyValue("--re-lightbox-slideshow-progress"),
    ),
  ).toBe("0");
});

test("the last of 40 photos without loop goes back to the first without showing an empty slide", async ({
  page,
}) => {
  await open(
    page,
    { controls: { slideshow: true }, slideshow: { interval: 300 } },
    { count: 40, index: 39 },
  );
  const blank = await page.evaluate(async () => {
    const viewport = document.querySelector(
      ".re-lightbox-viewport",
    ) as HTMLElement;
    const button = document.querySelector(
      ".re-lightbox-slideshow",
    ) as HTMLElement;
    button.click();
    let blank = 0;
    await new Promise<void>((done) => {
      const tick = () => {
        const port = viewport.getBoundingClientRect();
        const slides = [
          ...viewport.querySelectorAll<HTMLElement>(".re-lightbox-slide"),
        ];
        for (const slide of slides) {
          const box = slide.getBoundingClientRect();
          if (
            box.right > port.left + 1 &&
            box.left < port.right - 1 &&
            !slide.querySelector(".re-lightbox-frame")
          )
            blank++;
        }
        const first = slides[0].getBoundingClientRect();
        const back = (window as Window).lightbox.getState().index === 0;
        if (back && button.getAttribute("aria-label") === "Stop slideshow")
          button.click();
        if (back && Math.abs(first.left - port.left) < 1) done();
        else requestAnimationFrame(tick);
      };
      tick();
    });
    return blank;
  });
  expect(blank).toBe(0);
});

test("theme.css takes its font sizes, blur and control timings from --re-lightbox-* properties", async ({
  page,
}) => {
  await open(page, { thumbnails: "bottom" }, { captions: true });
  await page.addStyleTag({
    content:
      ".re-lightbox{--re-lightbox-glyph-size:30px;--re-lightbox-font-size:15px;--re-lightbox-counter-font-size:11px;--re-lightbox-blur:4px;--re-lightbox-control-duration:120ms;--re-lightbox-ring-duration:60ms}",
  });
  const styles = await page.evaluate(() => {
    const css = (selector: string) =>
      getComputedStyle(document.querySelector(selector) as Element);
    return {
      glyph: css(".re-lightbox-close").fontSize,
      blur: css(".re-lightbox-counter").backdropFilter,
      rotate: css(".re-lightbox-close").transitionDuration,
      counter: css(".re-lightbox-counter").fontSize,
      caption: css(".re-lightbox-caption").fontSize,
      thumbnail: css(".re-lightbox-thumbnails button").transitionDuration,
      ring: css(".re-lightbox-thumbnail-ring").transitionDuration,
    };
  });
  expect(styles).toEqual({
    glyph: "30px",
    blur: "blur(4px)",
    rotate: "0.12s",
    counter: "11px",
    caption: "15px",
    thumbnail: "0.12s",
    ring: "0.06s, 0.06s",
  });
});

test("the photos theme is white with the controls and fades to black over 300ms without them", async ({
  page,
}) => {
  await mount(page, "", [
    "lightbox/base.css",
    "lightbox/theme.css",
    "lightbox/themes/photos.css",
  ]);
  await page.evaluate(async () => {
    const { createLightbox } = await import("/modules/lightbox/index.js");
    createLightbox({ history: false, autoHide: 600 }).open([
      {
        src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='800'/%3E",
        width: 1200,
        height: 800,
      },
    ]);
  });
  const backdrop = page.locator(".re-lightbox-backdrop");
  const color = () =>
    backdrop.evaluate((element) => getComputedStyle(element).backgroundColor);
  await expect.poll(color).toBe("rgb(255, 255, 255)");
  const midway = await page.evaluate(
    () =>
      new Promise<string>((resolve) => {
        const dialog = document.querySelector("dialog");
        const element = document.querySelector(".re-lightbox-backdrop");
        if (!dialog || !element) return resolve("");
        new MutationObserver((_, observer) => {
          if (dialog.dataset.chrome !== "hidden") return;
          observer.disconnect();
          setTimeout(
            () => resolve(getComputedStyle(element).backgroundColor),
            100,
          );
        }).observe(dialog, { attributes: true });
      }),
  );
  expect(midway).not.toBe("rgb(255, 255, 255)");
  expect(midway).not.toBe("rgb(0, 0, 0)");
  await expect.poll(color).toBe("rgb(0, 0, 0)");
});
