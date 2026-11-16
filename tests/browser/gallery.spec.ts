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
  test("sizes a picture element like an image", async ({ page }) => {
    await mount(
      page,
      `<div id="frame" style="width:1000px"><div id="gallery" class="re-justified">${Array.from(
        { length: 12 },
        (_, index) => {
          const ratio = shapes[index];
          return `<picture><img src="${picture(ratio, index)}" width="${Math.round(ratio * 1000)}" height="1000" alt=""></picture>`;
        },
      ).join("")}</div></div>`,
      ["gallery/styles.css"],
    );
    await page.evaluate(async () => {
      const { createJustifiedGallery } = await import(
        "/modules/gallery/index.js"
      );
      createJustifiedGallery(document.getElementById("gallery") as HTMLElement);
    });
    for (const line of await lines(page)) {
      if (!line.open) expect(Math.abs(line.right)).toBeLessThan(0.1);
      expect(line.spread).toBeLessThan(0.1);
    }
    expect(await overflow(page)).toBe(0);
  });
});

// Rows A at 1000px are taller than this window and bring the scrollbar; at
// 985px a row of A leaves the range and rows B, shorter than the window, win;
// at 1000px a row of B leaves the range and A would win again.
const flipping = [
  2.4824, 0.7227, 2.5838, 0.7185, 2.609, 1.9347, 0.8785, 0.6872, 1.4271, 1.5132,
  0.8345, 0.5968, 2.5427, 0.6159, 0.5604, 1.5632, 1.8899, 1.0763, 0.6991,
  1.3407, 0.7356, 1.6317, 1.4227, 1.0856, 0.8084, 0.8408, 1.0763, 2.6232,
  0.6078, 1.3813, 0.8423, 2.576, 1.0364, 0.6739,
];

// Ratios found by search: rows laid out at the full width bring a scrollbar
// of this width, and rows laid out without its width take it away again.
const scrollbarCases = [
  {
    scrollbar: 15,
    height: 2661,
    ratios: flipping,
  },
  {
    // As wide as a classic scrollbar at 33% page zoom.
    scrollbar: 50,
    height: 3311,
    ratios: [
      0.6097, 0.6989, 1.0516, 2.0888, 1.807, 1.7029, 0.7117, 1.992, 0.7629,
      2.0824, 1.5327, 2.1309, 1.9298, 1.3614, 2.3631, 1.4538, 0.8395, 0.752,
      2.5194, 1.864, 0.9896, 1.6236, 1.056, 2.217, 2.0076, 2.4964, 0.8114,
      2.4683, 1.0699, 1.4735, 1.3164, 0.8996, 1.231, 0.8448,
    ],
  },
];

for (const { scrollbar, height, ratios } of scrollbarCases) {
  test(`a justified gallery settles when its own height brings and removes a ${scrollbar}px page scrollbar`, async ({
    playwright,
    browserName,
  }) => {
    test.skip(
      browserName !== "chromium",
      "classic scrollbars in Chromium only",
    );
    // Playwright starts Chromium with --hide-scrollbars; without it the page
    // scrollbar takes space, as on desktops with classic scrollbars.
    const browser = await playwright.chromium.launch({
      ignoreDefaultArgs: ["--hide-scrollbars"],
    });
    try {
      const page = await browser.newPage({ viewport: { width: 1000, height } });
      await mount(
        page,
        `<style>::-webkit-scrollbar{width:${scrollbar}px;background:#eee}::-webkit-scrollbar-thumb{background:#999}</style><div id="gallery" class="re-justified">${ratios
          .map(
            (ratio) =>
              `<div style="--re-ratio:${ratio}"><div class="re-justified-media" style="background:#888"></div></div>`,
          )
          .join("")}</div>`,
        ["gallery/styles.css"],
      );
      await page.evaluate(async () => {
        const element = document.getElementById("gallery") as HTMLElement;
        const { createJustifiedGallery } = await import(
          "/modules/gallery/index.js"
        );
        createJustifiedGallery(element);
        let writes = 0;
        new MutationObserver((records) => {
          writes += records.length;
        }).observe(element, { subtree: true, attributes: true });
        Object.assign(window, { writes: () => writes });
      });
      const widths = await framesUntilIdle(
        page,
        "document.documentElement.clientWidth",
        600,
      );
      expect(widths.length).toBeLessThanOrEqual(3);
      const settled = await page.evaluate("writes()");
      await page.waitForTimeout(500);
      expect(await page.evaluate("writes()")).toBe(settled);
      expect(await overflow(page)).toBe(0);
    } finally {
      await browser.close();
    }
  });
}

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
  { tolerance = "1em", forceFallback = false, fontSize = 16 } = {},
) {
  await mount(
    page,
    `<style>#masonry{width:620px;font-size:${fontSize}px;--re-masonry-columns:4;--re-masonry-gap:10px;--re-masonry-row-gap:12px;--re-masonry-tolerance:${tolerance}}${forceFallback ? "#masonry.re-masonry{display:grid}" : ""}#masonry>div{background:#ccc}</style>
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
    for (const tolerance of [
      "1em",
      "0px",
      "40px",
      "infinite",
      "1rem",
      "3vw",
      "5%",
      "calc(1em + 30px)",
      "-20px",
      "calc(5% - 100px)",
      "min(10%, 40px)",
      "max(5%, 10px)",
      "clamp(0px, 10%, 40px)",
    ]) {
      // A font size other than the root's tells em, rem and the default apart.
      expect(await masonry(page, { tolerance, fontSize: 40 })).toBe(true);
      const native = await masonryRects(page);
      await masonry(page, { tolerance, forceFallback: true, fontSize: 40 });
      expect(await masonryRects(page), tolerance).toEqual(native);
    }
  });

  test("measures items in their own lane under auto-fit, and reads a percentage row gap as none", async ({
    page,
  }) => {
    const layout = async (
      columns: string,
      rowGap: string,
      width = 800,
      count = 12,
    ) => {
      await mount(
        page,
        `<style>#masonry{width:${width}px;column-gap:10px;row-gap:${rowGap};grid-template-columns:${columns}}#masonry>div{background:#ccc}#masonry img{display:block;width:100%;height:auto}</style>
<div id="masonry" class="re-masonry">${heights
          .slice(0, count)
          .map(
            (height, index) =>
              `<div><img alt="" width="200" height="${height + (index % 3) * 40}" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='${height + (index % 3) * 40}'/%3E"></div>`,
          )
          .join("")}</div>`,
        ["gallery/styles.css"],
      );
      await page.evaluate(async () => {
        await Promise.all(
          Array.from(document.images).map((image) =>
            image.decode().catch(() => undefined),
          ),
        );
        CSS.supports = () => false;
        const { createMasonry } = await import("/modules/gallery/index.js");
        createMasonry(document.getElementById("masonry") as HTMLElement);
        await new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        );
      });
      return masonryRects(page);
    };
    const filled = await layout("repeat(auto-fill, minmax(150px, 1fr))", "0px");
    expect(await layout("repeat(auto-fit, minmax(150px, 1fr))", "0px")).toEqual(
      filled,
    );
    expect(await layout("repeat(auto-fill, minmax(150px, 1fr))", "5%")).toEqual(
      filled,
    );
    // Tracks of a fractional width differ by a hair, so the lanes are
    // measured one start at a time: auto-fit must not collapse then either.
    const uneven = await layout(
      "repeat(auto-fill, minmax(150px, 1fr))",
      "0px",
      812,
    );
    expect(
      await layout("repeat(auto-fit, minmax(150px, 1fr))", "0px", 812),
    ).toEqual(uneven);
    // Fewer items than lanes: grid lanes keep the empty lanes of auto-fit,
    // so the items are as wide as under auto-fill.
    const few = await layout(
      "repeat(auto-fill, minmax(150px, 1fr))",
      "0px",
      800,
      2,
    );
    expect(
      await layout("repeat(auto-fit, minmax(150px, 1fr))", "0px", 800, 2),
    ).toEqual(few);
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
