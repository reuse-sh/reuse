#!/usr/bin/env node
import { execFileSync, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  openSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = execFileSync("git", ["rev-parse", "--show-toplevel"], {
  encoding: "utf8",
}).trim();
const map = JSON.parse(
  readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "features.json"),
    "utf8",
  ),
);
const state = join(
  tmpdir(),
  `verify-reuse-${createHash("sha1").update(root).digest("hex").slice(0, 10)}`,
);
mkdirSync(state, { recursive: true });

function port() {
  if (process.env.REUSE_PORT) return Number(process.env.REUSE_PORT);
  const launch = join(root, ".claude/launch.json");
  if (existsSync(launch)) {
    const site = JSON.parse(readFileSync(launch, "utf8")).configurations?.find(
      (configuration) => configuration.name === "site",
    );
    if (site?.port) return site.port;
  }
  return 4300;
}
const origin = `http://127.0.0.1:${port()}`;

async function answers() {
  try {
    return (await fetch(`${origin}/sitemap.xml`)).ok;
  } catch {
    return false;
  }
}

async function sitemapPaths() {
  const xml = await (await fetch(`${origin}/sitemap.xml`)).text();
  return [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(
    ([, loc]) => new URL(loc).pathname,
  );
}

function featureFor(path) {
  for (const feature of map.features) {
    if (!feature.expand) continue;
    const match = new RegExp(feature.expand).exec(path);
    if (
      match &&
      !map.features.some((fixed) => fixed.path === path && !fixed.expand)
    )
      return { feature, groups: match.groups ?? {} };
  }
  return undefined;
}

async function features() {
  const fixed = map.features.filter((feature) => !feature.expand);
  const expanded = [];
  for (const path of await sitemapPaths()) {
    if (fixed.some((feature) => feature.path === path)) continue;
    const found = featureFor(path);
    if (!found) continue;
    const { feature, groups } = found;
    const suffix = [groups.library, groups.page].filter(Boolean).join("/");
    expanded.push({
      ...feature,
      id: `${feature.id}:${suffix}`,
      path,
      url: `^${path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
      library: groups.library,
    });
  }
  return [...fixed, ...expanded];
}

function globToRegExp(glob) {
  let source = "";
  for (let index = 0; index < glob.length; index++) {
    const char = glob[index];
    if (char === "*" && glob[index + 1] === "*") {
      source += ".*";
      index++;
      if (glob[index + 1] === "/") index++;
    } else if (char === "*") source += "[^/]*";
    else source += char.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${source}$`);
}

function trackedFiles() {
  return execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard"],
    {
      cwd: root,
      encoding: "utf8",
    },
  )
    .split("\n")
    .filter(Boolean);
}

function packageGlobs(feature) {
  if (!feature.library) return [];
  const catalog = readFileSync(
    join(root, "packages/catalog/src/index.ts"),
    "utf8",
  );
  const block = catalog
    .split(/slug: "/)
    .find((part) => part.startsWith(`${feature.library}"`));
  const name = block && /packageName: "@reuse-sh\/([^"]+)"/.exec(block)?.[1];
  return name ? [`packages/${name}/src/**`] : [];
}

function codeOf(feature) {
  return [...feature.code, ...packageGlobs(feature)];
}

async function list(args) {
  const all = await features();
  const base = optionOf(args, "--affected");
  if (!base) {
    for (const feature of all) console.log(feature.id);
    return 0;
  }
  const changed = [
    ...execFileSync("git", ["diff", "--name-only", base], {
      cwd: root,
      encoding: "utf8",
    }).split("\n"),
    ...execFileSync("git", ["ls-files", "--others", "--exclude-standard"], {
      cwd: root,
      encoding: "utf8",
    }).split("\n"),
  ].filter(Boolean);
  const shared = map.shared.map(globToRegExp);
  const hitsShared = changed.some((file) =>
    shared.some((glob) => glob.test(file)),
  );
  const picked = new Set();
  const claimed = new Set();
  for (const feature of all) {
    const globs = codeOf(feature).map(globToRegExp);
    for (const file of changed)
      if (globs.some((glob) => glob.test(file))) {
        picked.add(feature.id);
        claimed.add(file);
      }
  }
  for (const file of changed)
    if (shared.some((glob) => glob.test(file))) claimed.add(file);
  for (const feature of all)
    if (hitsShared || picked.has(feature.id)) console.log(feature.id);
  for (const file of changed)
    if (!claimed.has(file)) console.error(`unmapped ${file}`);
  return 0;
}

function optionOf(args, flag) {
  const index = args.indexOf(flag);
  return index === -1 ? undefined : args[index + 1];
}

function optionsOf(args, flag) {
  return args.flatMap((arg, index) => (args[index - 1] === flag ? [arg] : []));
}

function routeFiles() {
  const app = join(root, "apps/site/app");
  const routes = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (/^(page\.tsx|route\.ts)$/.test(entry)) {
        const route =
          `/${relative(app, dirname(full))}`.replace(/\/$/, "") || "/";
        routes.push(route === "" ? "/" : route);
      } else if (entry === "sitemap.ts") routes.push("/sitemap.xml");
      else if (entry === "not-found.tsx" && dir === app)
        routes.push("/_not-found");
    }
  };
  walk(app);
  return routes;
}

async function mapCommand() {
  let problems = 0;
  const files = trackedFiles();
  for (const glob of [
    ...map.shared,
    ...map.features.flatMap((feature) => feature.code),
  ]) {
    const pattern = globToRegExp(glob);
    if (!files.some((file) => pattern.test(file))) {
      console.log(`glob-matches-nothing ${glob}`);
      problems++;
    }
  }
  const covered = new Set([
    ...map.features.map((feature) => feature.route),
    ...Object.keys(map.omit),
  ]);
  for (const route of routeFiles())
    if (!covered.has(route)) {
      console.log(`uncovered-route ${route}`);
      problems++;
    }
  const fixed = map.features.filter((feature) => !feature.expand);
  for (const path of await sitemapPaths())
    if (!fixed.some((feature) => feature.path === path) && !featureFor(path)) {
      console.log(`uncovered-path ${path}`);
      problems++;
    }
  if (!problems) console.log("ok map");
  return problems ? 1 : 0;
}

async function start() {
  if (await answers()) {
    console.log(`ok running ${origin}`);
    return 0;
  }
  const log = join(state, "site.log");
  const child = spawn("env", [`REUSE_PORT=${port()}`, "pnpm", "dev"], {
    cwd: root,
    detached: true,
    stdio: ["ignore", openSync(log, "a"), openSync(log, "a")],
  });
  child.unref();
  writeFileSync(join(state, "pid"), String(child.pid));
  for (let attempt = 0; attempt < 120; attempt++) {
    if (await answers()) {
      console.log(`ok started ${origin} pid ${child.pid} log ${log}`);
      return 0;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  console.log(`fail start no answer from ${origin}, see ${log}`);
  return 1;
}

function stop() {
  const file = join(state, "pid");
  if (!existsSync(file)) {
    console.log("ok nothing started by verify");
    return 0;
  }
  const pid = Number(readFileSync(file, "utf8"));
  try {
    process.kill(-pid, "SIGTERM");
    console.log(`ok stopped ${pid}`);
  } catch {
    console.log(`ok ${pid} already gone`);
  }
  rmSync(file);
  return 0;
}

function listenerCwd() {
  try {
    const pid = execFileSync("lsof", [`-tiTCP:${port()}`, "-sTCP:LISTEN"], {
      encoding: "utf8",
    })
      .split("\n")
      .filter(Boolean)[0];
    const out = execFileSync("lsof", ["-a", "-p", pid, "-d", "cwd", "-Fn"], {
      encoding: "utf8",
    });
    return /\nn(.*)/.exec(out)?.[1];
  } catch {
    return undefined;
  }
}

async function doctor() {
  let problems = 0;
  const report = (ok, line, fix) => {
    console.log(ok ? `ok ${line}` : `fail ${line} -> ${fix}`);
    if (!ok) problems++;
  };
  report(
    existsSync(join(root, "node_modules/.pnpm")),
    "install",
    "pnpm install --frozen-lockfile",
  );
  const up = await answers();
  report(
    up,
    `app answers at ${origin}`,
    "node .claude/skills/verify-reuse/verify.mjs start",
  );
  if (up) {
    const cwd = listenerCwd();
    report(
      Boolean(cwd?.startsWith(root)),
      `server runs from this checkout (${cwd ?? "unknown"})`,
      "stop the other server, then start",
    );
  }
  try {
    const { chromium } = await import("@playwright/test");
    report(
      existsSync(chromium.executablePath()),
      "playwright chromium",
      "pnpm exec playwright install chromium",
    );
  } catch (error) {
    report(
      false,
      `playwright (${error.message})`,
      "pnpm install --frozen-lockfile",
    );
  }
  report(true, "session not needed, the site has no sign-in");
  return problems ? 1 : 0;
}

async function audit(page) {
  return page.evaluate(() => {
    const found = [];
    const root = document.scrollingElement ?? document.documentElement;
    const width = root.clientWidth;
    if (root.scrollWidth > width)
      found.push({
        kind: "page-scroll-x",
        detail: `${root.scrollWidth} > ${width}`,
      });
    const describe = (element) => {
      const name =
        element.getAttribute("aria-label") ||
        element.textContent?.trim().replace(/\s+/g, " ").slice(0, 40) ||
        element.getAttribute("title") ||
        "";
      const id = element.id ? `#${element.id}` : "";
      const cls =
        typeof element.className === "string"
          ? `.${element.className.trim().split(/\s+/).slice(0, 3).join(".")}`
          : "";
      return `${element.tagName.toLowerCase()}${id}${cls} "${name}"`;
    };
    const visible = (element) => {
      const style = getComputedStyle(element);
      if (
        style.visibility === "hidden" ||
        style.display === "none" ||
        Number(style.opacity) === 0
      )
        return false;
      if (element.closest("[inert],[aria-hidden=true],dialog:not([open])"))
        return false;
      const rect = element.getBoundingClientRect();
      return rect.width > 1 && rect.height > 1;
    };
    const scrolledX = (element) => {
      for (
        let node = element.parentElement;
        node && node !== document.body;
        node = node.parentElement
      ) {
        const overflow = getComputedStyle(node).overflowX;
        if (overflow !== "visible") return true;
      }
      return false;
    };
    const controls = [
      ...document.querySelectorAll(
        'a[href],button,input,select,textarea,summary,[role=button],[role=tab],[role=link],[role=menuitem],[tabindex]:not([tabindex="-1"])',
      ),
    ].filter(visible);
    for (const element of controls) {
      const rect = element.getBoundingClientRect();
      const inline =
        element.tagName === "A" &&
        getComputedStyle(element).display === "inline" &&
        element.closest("p,li,td,dd");
      if (!inline && (rect.width < 24 || rect.height < 24))
        found.push({
          kind: "small-target",
          detail: `${Math.round(rect.width)}x${Math.round(rect.height)} ${describe(element)}`,
        });
      const name =
        element.getAttribute("aria-label") ||
        element.getAttribute("aria-labelledby") ||
        element.getAttribute("title") ||
        element.textContent?.trim() ||
        element.querySelector("img[alt]:not([alt=''])") ||
        element.labels?.length;
      if (!name) found.push({ kind: "no-name", detail: describe(element) });
      if (rect.right > width + 1 && !scrolledX(element))
        found.push({
          kind: "past-viewport",
          detail: `right ${Math.round(rect.right)} ${describe(element)}`,
        });
    }
    const parse = (value) => {
      const match = /rgba?\(([^)]+)\)/.exec(value);
      if (!match) return undefined;
      const [r, g, b, a = 1] = match[1]
        .split(/[ ,/]+/)
        .filter(Boolean)
        .map(Number);
      return { r, g, b, a };
    };
    const luminance = ({ r, g, b }) => {
      const channel = (value) => {
        const c = value / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
    };
    const backgroundOf = (element) => {
      for (let node = element; node; node = node.parentElement) {
        const style = getComputedStyle(node);
        if (style.backgroundImage !== "none") return undefined;
        const color = parse(style.backgroundColor);
        if (color && color.a >= 0.95) return color;
        if (color && color.a > 0) return undefined;
      }
      return { r: 255, g: 255, b: 255, a: 1 };
    };
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
    );
    const seen = new Set();
    for (let text = walker.nextNode(); text; text = walker.nextNode()) {
      const element = text.parentElement;
      if (
        !element ||
        seen.has(element) ||
        !text.textContent?.trim() ||
        !visible(element)
      )
        continue;
      seen.add(element);
      if (element.closest("pre,code,svg,[data-code-role]")) continue;
      const style = getComputedStyle(element);
      const color = parse(style.color);
      const background = backgroundOf(element);
      if (!color || !background) continue;
      const blended = {
        r: color.r * color.a + background.r * (1 - color.a),
        g: color.g * color.a + background.g * (1 - color.a),
        b: color.b * color.a + background.b * (1 - color.a),
      };
      const [light, dark] = [luminance(blended), luminance(background)].sort(
        (x, y) => y - x,
      );
      const ratio = (light + 0.05) / (dark + 0.05);
      const size = Number.parseFloat(style.fontSize);
      const large =
        size >= 24 || (size >= 18.66 && Number(style.fontWeight) >= 700);
      if (ratio < (large ? 3 : 4.5))
        found.push({
          kind: "contrast",
          detail: `${ratio.toFixed(2)} ${style.color} on rgb(${background.r},${background.g},${background.b}) ${describe(element)}`,
        });
      if (
        (style.overflow === "hidden" || style.overflowX === "hidden") &&
        style.textOverflow !== "ellipsis" &&
        element.scrollWidth > element.clientWidth + 1 &&
        element.clientWidth > 0
      )
        found.push({
          kind: "clipped-text",
          detail: `${element.scrollWidth} > ${element.clientWidth} ${describe(element)}`,
        });
    }
    return found;
  });
}

async function focusAudit(page, presses = 60) {
  const found = [];
  const seen = new Set();
  await page.evaluate(() => {
    document.activeElement?.blur();
    window.scrollTo(0, 0);
  });
  for (let press = 0; press < presses; press++) {
    await page.keyboard.press("Tab");
    const result = await page.evaluate(() => {
      const element = document.activeElement;
      if (!element || element === document.body) return undefined;
      if (element.tagName === "IFRAME") return { key: "iframe", visible: true };
      const style = getComputedStyle(element);
      const outlined = (node) => {
        const own = getComputedStyle(node);
        return (
          own.outlineStyle !== "none" && Number.parseFloat(own.outlineWidth) > 0
        );
      };
      let wrapperRing = false;
      for (
        let node = element.parentElement, depth = 0;
        node && depth < 3;
        node = node.parentElement, depth++
      )
        if (outlined(node)) wrapperRing = true;
      const ring =
        outlined(element) || style.boxShadow !== "none" || wrapperRing;
      const rect = element.getBoundingClientRect();
      const label =
        element.getAttribute("aria-label") ||
        element.textContent?.trim().replace(/\s+/g, " ").slice(0, 40) ||
        element.tagName;
      return {
        key: `${element.tagName}|${label}|${Math.round(rect.x)}|${Math.round(rect.y + scrollY)}`,
        visible: ring || element.matches(":focus-visible") === false,
        detail: `${element.tagName.toLowerCase()} "${label}"`,
        ring,
      };
    });
    if (!result) continue;
    if (seen.has(result.key)) break;
    seen.add(result.key);
    if (!result.ring && result.key !== "iframe")
      found.push({ kind: "no-focus-ring", detail: result.detail });
  }
  return found;
}

async function check(args) {
  const all = await features();
  const ids = args.includes("--all")
    ? all.map((feature) => feature.id)
    : args.filter(
        (arg, index) =>
          !arg.startsWith("--") && !args[index - 1]?.startsWith("--"),
      );
  const out = optionOf(args, "--out") ?? join(state, `shots-${Date.now()}`);
  const width = Number(optionOf(args, "--width") ?? 1280);
  const height = Number(optionOf(args, "--height") ?? 800);
  const blocks = optionsOf(args, "--block");
  const doAudit = args.includes("--audit");
  const full = !args.includes("--viewport");
  mkdirSync(out, { recursive: true });
  const { chromium } = await import("@playwright/test");
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion: args.includes("--reduced-motion")
      ? "reduce"
      : "no-preference",
  });
  await context.route("https://cdn.visitors.now/**", (route) =>
    route.fulfill({ contentType: "application/javascript", body: "" }),
  );
  for (const glob of blocks)
    await context.route(glob, (route) => route.abort("failed"));
  let failures = 0;
  const queue = ids.map(
    (id) => all.find((feature) => feature.id === id) ?? { id, missing: true },
  );
  const worker = async () => {
    for (let feature = queue.shift(); feature; feature = queue.shift()) {
      const shot = join(out, `${feature.id.replace(/[/:]/g, "_")}.png`);
      if (feature.missing) {
        console.log(`fail ${feature.id} unknown feature -`);
        failures++;
        continue;
      }
      if (
        (feature.minWidth && width < feature.minWidth) ||
        (feature.maxWidth && width > feature.maxWidth)
      ) {
        console.log(`skip ${feature.id}`);
        continue;
      }
      const page = await context.newPage();
      const errors = [];
      let loads = 0;
      page.on("load", () => {
        loads++;
        if (loads === 4)
          errors.push(
            "reload loop: the page reloaded 3 times, clear apps/site/.next/dev and start again",
          );
      });
      page.on("pageerror", (error) =>
        errors.push(`page error: ${error.message}`),
      );
      page.on("console", (message) => {
        if (
          message.type() === "error" &&
          !/Failed to load resource/.test(message.text())
        )
          errors.push(`console: ${message.text().slice(0, 160)}`);
      });
      page.on("response", (response) => {
        const own = response.url().startsWith(origin);
        if (
          own &&
          response.status() >= 400 &&
          !(
            response.url() === origin + feature.path &&
            feature.status === response.status()
          )
        )
          errors.push(`HTTP ${response.status()} ${response.url()}`);
      });
      page.on("requestfailed", (request) => {
        if (request.url().startsWith(origin) && !blocks.length)
          errors.push(`request failed ${request.url()}`);
      });
      try {
        const response = await page.goto(origin + feature.path, {
          waitUntil: "networkidle",
          timeout: 30_000,
        });
        if ((response?.status() ?? 0) !== (feature.status ?? 200))
          errors.push(`status ${response?.status()}`);
        for (const step of feature.steps ?? []) {
          if (step.click) await page.locator(step.click).first().click();
          if (step.press) await page.keyboard.press(step.press);
          if (step.hover) await page.locator(step.hover).first().hover();
        }
        await page.waitForURL(
          (url) => new RegExp(feature.url).test(url.pathname),
          { timeout: 10_000 },
        );
        await page
          .locator(feature.proof)
          .first()
          .waitFor({ state: "visible", timeout: 10_000 });
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(300);
        if (doAudit) {
          const findings = await audit(page);
          if (args.includes("--focus"))
            findings.push(...(await focusAudit(page)));
          writeFileSync(
            shot.replace(/\.png$/, ".audit.json"),
            JSON.stringify(findings, null, 2),
          );
          const counts = {};
          for (const finding of findings)
            counts[finding.kind] = (counts[finding.kind] ?? 0) + 1;
          for (const [kind, count] of Object.entries(counts))
            console.log(`warn ${feature.id} ${kind} ${count}`);
        }
        await page.screenshot({ path: shot, fullPage: full, timeout: 30_000 });
      } catch (error) {
        errors.push(error.message.split("\n")[0]);
        await page
          .screenshot({ path: shot, fullPage: full, timeout: 30_000 })
          .catch(() => {});
      }
      if (errors.length) {
        console.log(`fail ${feature.id} ${errors.join(" | ")} ${shot}`);
        failures++;
      } else console.log(`ok ${feature.id}`);
      await page.close();
    }
  };
  await Promise.all(
    Array.from({ length: Number(optionOf(args, "--jobs") ?? 4) }, worker),
  );
  await browser.close();
  console.log(`screenshots ${out}`);
  return failures ? 1 : 0;
}

const [command, ...args] = process.argv.slice(2);
const commands = {
  start,
  stop,
  doctor,
  list: () => list(args),
  check: () => check(args),
  map: mapCommand,
};
if (!commands[command]) {
  console.log(
    "usage: verify.mjs start|doctor|list [--affected <base>]|check <id>...|--all [--out dir] [--width px] [--height px] [--block glob] [--audit] [--viewport] [--reduced-motion] [--jobs n]|map|stop",
  );
  process.exit(2);
}
process.exit(await commands[command]());
