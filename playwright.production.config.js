import { defineConfig } from "@playwright/test";
import config from "./playwright.config.js";

export default defineConfig({
  ...config,
  use: { ...config.use, baseURL: "http://localhost:5174" },
  webServer: {
    command: `${process.platform === "win32" ? "npm.cmd" : "npm"} run preview -- --host 127.0.0.1 --port 5174`,
    url: "http://localhost:5174",
    reuseExistingServer: false,
  },
});
