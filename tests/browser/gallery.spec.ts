import { expect, type Page, test } from "@playwright/test";
import { framesUntilIdle, mount } from "./harness";

const shapes = [1.5, 0.67, 1, 1.78, 0.8, 2.4, 1.33, 0.56, 1.5, 1, 1.33, 0.75];

function picture(ratio: number, index: number) {
  const width = Math.round(ratio * 1000);
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="1000"><rect width="${width}" height="1000" fill="hsl(${(index * 47) % 360} 60% 55%)"/></svg>`,
  )}`;
}

function justifiedItems(count: number, captions = true) {
  return Array.from({ length: count }, (_, index) => {
    const ratio = shapes[index % shapes.length] * (1 + (index % 5) * 0.02);
    const caption =
      index % 3
        ? "Short"
        : "A much longer caption that wraps onto more than one line";
    return `<figure style="margin:0"><img class="re-justified-media" src="${picture(ratio, index)}" width="${Math.round(ratio * 1000)}" height="1000" alt="">${captions ? `<figcaption>${caption}</figcaption>` : ""}</figure>`;
  }).join("");
}

async function justified(
  page: Page,
  { count = 36, width = "1000px", options = "{}", script = true } = {},
) {
  await mount(
    page,
    `<div id="frame" style="width:${width}"><div id="gallery" class="re-justified">${justifiedItems(count)}</div></div>`,
    ["gallery/styles.css"],
  );
  if (script) {
    await page.evaluate(async (options) => {
      const { createJustifiedGallery } = await import(
        "/modules/gallery/index.js"
      );
      const gallery = createJustifiedGallery(
        document.getElementById("gallery") as HTMLElement,
        JSON.parse(options),
      );
      Object.assign(window, { gallery });
    }, options);
  }
}

/** The shown items grouped into lines by their top edge, with each line's measurements. */
function lines(page: Page) {
  return page.evaluate(() => {
    const gallery = document.getElementById("gallery") as HTMLElement;
    const box = gallery.getBoundingClientRect();
    const groups = new Map<number, HTMLElement[]>();
    for (const item of Array.from(gallery.children) as HTMLElement[]) {
      if (getComputedStyle(item).display === "none") continue;
      const top = Math.round(item.getBoundingClientRect().top);
      groups.set(top, [...(groups.get(top) ?? []), item]);
    }
    return [...groups.values()].map((line) => {
      const pictures = line.map((item) =>
        (item.matches("img")
          ? item
          : (item.querySelector("img") as HTMLElement)
        ).getBoundingClientRect(),
      );
      const heights = pictures.map((rect) => rect.height);
      return {
        count: line.length,
        open: line[0].hasAttribute("data-re-justified-row"),
        left: line[0].getBoundingClientRect().left - box.left,
        right:
          box.right -
          (line.at(-1) as HTMLElement).getBoundingClientRect().right,
        spread: Math.max(...heights) - Math.min(...heights),
        height: Math.max(...heights),
      };
    });
  });
}

const overflow = (page: Page) =>
  page.evaluate(() => {
    const gallery = document.getElementById("gallery") as HTMLElement;
    return gallery.scrollWidth - gallery.clientWidth;
  });

async function setWidth(page: Page, width: number) {
  await page.evaluate((width) => {
    (document.getElementById("frame") as HTMLElement).style.width =
      `${width}px`;
  }, width);
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
}

test.describe("justified gallery", () => {
  test("fills every full row and keeps one picture height per row at any width", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await justified(page);
    for (const width of [1000, 985, 731, 413, 1280]) {
      await setWidth(page, width);
      for (const line of await lines(page)) {
        expect(line.spread).toBeLessThan(0.1);
        if (!line.open) expect(Math.abs(line.right)).toBeLessThan(0.1);
      }
      expect(await overflow(page)).toBe(0);
    }
    expect(errors).toEqual([]);
  });

  test("keeps the rows through a scrollbar's width and breaks them again past the range", async ({
    page,
  }) => {
    // 24 of these pictures break differently at 1000px and 985px when laid out fresh.
    await justified(page, { count: 24 });
    const counts = async () => (await lines(page)).map((line) => line.count);
    const initial = await counts();
    await setWidth(page, 985);
    expect(await counts()).toEqual(initial);
    await setWidth(page, 1000);
    expect(await counts()).toEqual(initial);
    await setWidth(page, 731);
    expect(await counts()).not.toEqual(initial);
  });

  test("keeps every rect while hidden and after showing at the same width", async ({
    page,
  }) => {
    await justified(page);
    const rects = () =>
      page.evaluate(() =>
        Array.from(document.querySelectorAll("#gallery > *")).map((item) =>
          JSON.stringify(item.getBoundingClientRect()),
        ),
      );
    const before = await rects();
    await page.evaluate(() => {
      (document.getElementById("frame") as HTMLElement).style.display = "none";
    });
    await setWidth(page, 1000);
    await page.evaluate(() => {
      (document.getElementById("frame") as HTMLElement).style.display = "";
    });
    expect(await rects()).toEqual(before);
  });

  test("writes nothing when its own height brings the page scrollbar", async ({
    page,
  }) => {
    // Headless browsers draw overlay scrollbars; a styled one takes 15px, as on
    // desktops with classic scrollbars. 24 of these pictures break differently
    // at 1000px and 985px when laid out fresh.
    await mount(
      page,
      `<style>html::-webkit-scrollbar{width:15px}html::-webkit-scrollbar-thumb{background:#888}</style><div id="spacer"></div><div id="gallery" class="re-justified">${justifiedItems(24, false)}</div>`,
      ["gallery/styles.css"],
    );
    await page.evaluate(async () => {
      const root = document.documentElement;
      root.style.overflow = "hidden";
      const element = document.getElementById("gallery") as HTMLElement;
      const { createJustifiedGallery } = await import(
        "/modules/gallery/index.js"
      );
      Object.assign(window, { gallery: createJustifiedGallery(element) });
      // Taller than the window by 10px at full width, so the scrollbar comes.
      const spacer = document.getElementById("spacer") as HTMLElement;
      spacer.style.height = `${innerHeight - element.getBoundingClientRect().height + 10}px`;
      let writes = 0;
      new MutationObserver((records) => {
        writes += records.length;
      }).observe(element, { subtree: true, attributes: true });
      Object.assign(window, { writes: () => writes });
      root.style.overflow = "";
    });
    const widths = await framesUntilIdle(
      page,
      "document.documentElement.clientWidth",
      600,
    );
    expect(widths.length).toBeLessThanOrEqual(2);
    expect(await page.evaluate("writes()")).toBe(0);
    expect(await overflow(page)).toBe(0);
  });

  test("lays the last row out as asked", async ({ page }) => {
    await justified(page, { count: 14, options: '{"lastRow":"center"}' });
    const centered = (await lines(page)).at(-1);
    expect(centered?.open).toBe(true);
    expect(
      Math.abs((centered?.left ?? 0) - (centered?.right ?? 0)),
    ).toBeLessThan(1);

    await justified(page, { count: 14, options: '{"lastRow":"end"}' });
    expect(Math.abs((await lines(page)).at(-1)?.right ?? 1)).toBeLessThan(0.1);

    await justified(page, { count: 14, options: '{"lastRow":"justify"}' });
    for (const line of await lines(page)) {
      expect(Math.abs(line.right)).toBeLessThan(0.1);
    }

    await justified(page, { count: 14, options: '{"lastRow":"hide"}' });
    expect((await lines(page)).every((line) => !line.open)).toBe(true);

    await justified(page, { count: 36, options: '{"maxRows":2}' });
    expect(await lines(page)).toHaveLength(2);
  });

  test("lays out rows from the markup before any script runs", async ({
    page,
  }) => {
    await mount(
      page,
      `<div id="frame" style="width:1000px"><div id="gallery" class="re-justified">${Array.from(
        { length: 24 },
        (_, index) => {
          const ratio = shapes[index % shapes.length];
          return `<img src="${picture(ratio, index)}" width="${ratio * 1000}" height="1000" alt="" style="--re-ratio:${ratio}">`;
        },
      ).join("")}</div></div>`,
      ["gallery/styles.css"],
    );
    const found = await lines(page);
    expect(found.length).toBeGreaterThan(2);
    for (const line of found.slice(0, -1)) {
      expect(Math.abs(line.right)).toBeLessThan(1);
      expect(line.spread).toBeLessThan(1);
    }
    expect(await overflow(page)).toBe(0);
  });

  test("lays out a container in a frame from the parent document", async ({
    page,
  }) => {
    await mount(
      page,
      `<iframe id="canvas" style="width:820px;height:600px;border:0"></iframe>`,
      ["gallery/styles.css"],
    );
    const right = await page.evaluate(
      async (items) => {
        const frame = document.getElementById("canvas") as HTMLIFrameElement;
        const inner = frame.contentDocument as Document;
        inner.head.innerHTML = `<link rel="stylesheet" href="/modules/gallery/styles.css">`;
        await new Promise((resolve) =>
          inner.querySelector("link")?.addEventListener("load", resolve),
        );
        inner.body.style.margin = "0";
        inner.body.innerHTML = `<div class="re-justified">${items}</div>`;
        const { createJustifiedGallery } = await import(
          "/modules/gallery/index.js"
        );
        const element = inner.querySelector(".re-justified") as HTMLElement;
        createJustifiedGallery(element);
        const box = element.getBoundingClientRect();
        const first = Array.from(element.children).filter(
          (item) => !item.hasAttribute("data-re-justified-row"),
        );
        const top = first[0].getBoundingClientRect().top;
        const row = first.filter(
          (item) =>
            Math.round(item.getBoundingClientRect().top) === Math.round(top),
        );
        return (
          box.right - (row.at(-1) as Element).getBoundingClientRect().right
        );
      },
      justifiedItems(12, false),
    );
    expect(Math.abs(right)).toBeLessThan(0.1);
  });

  test("puts the markup back on destroy and stops watching", async ({
    page,
  }) => {
    await justified(page, { script: false });
    // Inline styles come back as the browser serialises them after an edit.
    const before = await page.evaluate(() => {
      for (const element of document.querySelectorAll<HTMLElement>("[style]")) {
        element.setAttribute("style", element.style.cssText);
      }
      return (document.getElementById("frame") as HTMLElement).innerHTML;
    });
    const after = await page.evaluate(async () => {
      const { createJustifiedGallery } = await import(
        "/modules/gallery/index.js"
      );
      const element = document.getElementById("gallery") as HTMLElement;
      const gallery = createJustifiedGallery(element, { maxRows: 2 });
      gallery.destroy();
      gallery.destroy();
      let writes = 0;
      new MutationObserver((records) => {
        writes += records.length;
      }).observe(element, { subtree: true, attributes: true });
      (document.getElementById("frame") as HTMLElement).style.width = "600px";
      element.append(element.children[0].cloneNode(true));
      await new Promise((resolve) => setTimeout(resolve, 100));
      element.lastElementChild?.remove();
      (document.getElementById("frame") as HTMLElement).style.width = "1000px";
      return {
        html: (document.getElementById("frame") as HTMLElement).innerHTML,
        writes,
      };
    });
    expect(after.html).toBe(before);
    expect(after.writes).toBe(0);
  });
});

const heights = [
  67, 97, 134, 171, 215, 95, 132, 169, 213, 93, 130, 167, 211, 91, 128, 165,
  209, 89, 126, 163, 207, 87, 124, 161,
];
// Item positions native grid lanes give this markup at tolerance 1em,
// measured in WebKit 26.6 (Playwright 1.63).
const nativeRects = [
  [0, 0],
  [157.5, 0],
  [315, 0],
  [0, 109],
  [472.5, 0],
  [315, 146],
  [472.5, 227],
  [315, 253],
  [0, 292],
  [157.5, 292],
  [315, 434],
  [157.5, 397],
  [0, 517],
  [157.5, 576],
  [315, 576],
  [472.5, 576],
  [157.5, 679],
  [315, 753],
  [0, 740],
  [315, 854],
  [472.5, 854],
  [0, 878],
  [157.5, 900],
  [0, 977],
];

async function masonry(
  page: Page,
  { tolerance = "1em", forceFallback = false } = {},
) {
  await mount(
    page,
    `<style>#masonry{width:620px;font-size:16px;--re-masonry-columns:4;--re-masonry-gap:10px;--re-masonry-row-gap:12px;--re-masonry-tolerance:${tolerance}}${forceFallback ? "#masonry.re-masonry{display:grid}" : ""}#masonry>div{background:#ccc}</style>
<div id="masonry" class="re-masonry">${heights
      .map(
        (height, index) =>
          `<div style="height:${height}px${index % 7 === 3 ? ";grid-column:span 2" : ""}"></div>`,
      )
      .join("")}</div>`,
    ["gallery/styles.css"],
  );
  return page.evaluate(async (forceFallback) => {
    if (forceFallback) CSS.supports = () => false;
    const { createMasonry } = await import("/modules/gallery/index.js");
    const instance = createMasonry(
      document.getElementById("masonry") as HTMLElement,
    );
    Object.assign(window, { masonry: instance });
    return instance.native;
  }, forceFallback);
}

const masonryRects = (page: Page) =>
  page.evaluate(() => {
    const box = (
      document.getElementById("masonry") as HTMLElement
    ).getBoundingClientRect();
    return Array.from(document.querySelectorAll("#masonry > *")).map((item) => {
      const rect = item.getBoundingClientRect();
      return [
        Math.round((rect.left - box.left) * 100) / 100,
        Math.round((rect.top - box.top) * 100) / 100,
      ];
    });
  });

test.describe("masonry", () => {
  test("the fallback places items where native grid lanes put them", async ({
    page,
  }) => {
    expect(await masonry(page, { forceFallback: true })).toBe(false);
    expect(await masonryRects(page)).toEqual(nativeRects);
  });

  test("native grid lanes and the fallback agree at every tolerance", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== "webkit", "grid lanes ship in WebKit only");
    for (const tolerance of ["1em", "0px", "40px", "infinite"]) {
      expect(await masonry(page, { tolerance })).toBe(true);
      const native = await masonryRects(page);
      await masonry(page, { tolerance, forceFallback: true });
      expect(await masonryRects(page)).toEqual(native);
    }
  });

  test("places the items again when a picture grows and when items change", async ({
    page,
  }) => {
    await masonry(page, { forceFallback: true });
    await page.evaluate(() => {
      const first = document.querySelector("#masonry > div") as HTMLElement;
      first.style.height = "300px";
    });
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
    const overlaps = () =>
      page.evaluate(() => {
        const rects = Array.from(document.querySelectorAll("#masonry > *")).map(
          (item) => item.getBoundingClientRect(),
        );
        return rects.some((a, i) =>
          rects.some(
            (b, j) =>
              i < j &&
              a.left < b.right - 0.5 &&
              b.left < a.right - 0.5 &&
              a.top < b.bottom - 0.5 &&
              b.top < a.bottom - 0.5,
          ),
        );
      });
    expect(await overlaps()).toBe(false);
    await page.evaluate(async () => {
      const element = document.getElementById("masonry") as HTMLElement;
      element.children[2].remove();
      const extra = document.createElement("div");
      extra.style.height = "120px";
      element.prepend(extra);
      await new Promise((resolve) => setTimeout(resolve));
    });
    expect(await overlaps()).toBe(false);
  });

  test("puts the markup back on destroy", async ({ page }) => {
    await mount(
      page,
      `<div id="masonry" class="re-masonry" style="width:620px">${heights
        .slice(0, 8)
        .map((height) => `<div style="height:${height}px"></div>`)
        .join("")}</div>`,
      ["gallery/styles.css"],
    );
    const same = await page.evaluate(async () => {
      CSS.supports = () => false;
      const element = document.getElementById("masonry") as HTMLElement;
      for (const item of element.querySelectorAll<HTMLElement>("[style]")) {
        item.setAttribute("style", item.style.cssText);
      }
      const before = element.outerHTML;
      const { createMasonry } = await import("/modules/gallery/index.js");
      const instance = createMasonry(element);
      const placed = element.outerHTML !== before;
      instance.destroy();
      instance.destroy();
      return placed && element.outerHTML === before;
    });
    expect(same).toBe(true);
  });
});
