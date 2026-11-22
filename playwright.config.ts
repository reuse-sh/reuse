import { createServer } from "node:net";
import { defineConfig, devices } from "@playwright/test";

function freePort(): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = createServer().listen(0, "127.0.0.1", () => {
      const { port } = server.address() as { port: number };
      server.close(() => resolve(String(port)));
    });
    server.on("error", reject);
  });
}

process.env.REUSE_TEST_PORT ??= await freePort();
const site = `http://127.0.0.1:${process.env.REUSE_TEST_PORT}`;
const phone = { width: 390, height: 844 };
const laptop = { width: 1440, height: 900 };

export default defineConfig({
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? "github" : "list",
  use: { ...devices["Desktop Chrome"], viewport: { width: 1000, height: 700 } },
  projects: [
    {
      name: "packages",
      testDir: "tests/browser",
      grepInvert: /@touch|@desktop/,
    },
    {
      // Native grid lanes ship in WebKit only, so the gallery is also checked there.
      name: "webkit",
      testDir: "tests/browser",
      testMatch: "gallery.spec.ts",
      grepInvert: /@touch|@desktop/,
      use: {
        ...devices["Desktop Safari"],
        viewport: { width: 1000, height: 700 },
      },
    },
    {
      name: "chromium-touch",
      testDir: "tests/browser",
      grep: /@touch/,
      use: { ...devices["Pixel 7"], viewport: phone, screen: phone },
    },
    {
      name: "webkit-touch",
      testDir: "tests/browser",
      grep: /@touch/,
      use: { ...devices["iPhone 13"], viewport: phone, screen: phone },
    },
    {
      name: "chromium-desktop",
      testDir: "tests/browser",
      grep: /@desktop/,
      use: { ...devices["Desktop Chrome"], viewport: laptop },
    },
    {
      name: "webkit-desktop",
      testDir: "tests/browser",
      grep: /@desktop/,
      use: { ...devices["Desktop Safari"], viewport: laptop },
    },
    {
      name: "firefox-desktop",
      testDir: "tests/browser",
      grep: /@desktop/,
      use: { ...devices["Desktop Firefox"], viewport: laptop },
    },
    { name: "site", testDir: "tests/site", use: { baseURL: site } },
  ],
  webServer: {
    command: "pnpm --filter @reuse-sh/site start",
    url: site,
    env: { REUSE_PORT: process.env.REUSE_TEST_PORT },
  },
});
