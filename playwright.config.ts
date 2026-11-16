import { defineConfig, devices } from "@playwright/test";

const site = "http://127.0.0.1:4300";

export default defineConfig({
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? "github" : "list",
  use: { ...devices["Desktop Chrome"], viewport: { width: 1000, height: 700 } },
  projects: [
    { name: "packages", testDir: "tests/browser" },
    {
      // Native grid lanes ship in WebKit only, so the gallery is also checked there.
      name: "webkit",
      testDir: "tests/browser",
      testMatch: "gallery.spec.ts",
      use: {
        ...devices["Desktop Safari"],
        viewport: { width: 1000, height: 700 },
      },
    },
    { name: "site", testDir: "tests/site", use: { baseURL: site } },
  ],
  webServer: {
    command: "pnpm --filter @reuse-sh/site start",
    url: site,
    reuseExistingServer: !process.env.CI,
  },
});
