import { defineConfig, devices } from "@playwright/test";

const site = "http://127.0.0.1:4300";
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
    // Tests tagged @touch run on both phones, tests tagged @desktop on both laptops.
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
    reuseExistingServer: !process.env.CI,
  },
});
