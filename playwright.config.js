import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  use: { baseURL: "http://localhost:5173", headless: true },
  webServer: {
    command:
      process.platform === "win32"
        ? "npm.cmd run dev -- --host 127.0.0.1"
        : "npm run dev -- --host 127.0.0.1",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
  },
});
