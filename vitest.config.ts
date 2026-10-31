import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@/lib": path.resolve(__dirname, "./src/lib"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "app/**/*.test.ts"],
    // The Chrome extension's source lives under src/ too (content/,
    // background/, sidepanel/, plus a few loose files) — see
    // ../Extension/vitest.config.ts, which is the ONLY runner for these.
    // They need jsdom + a fake `chrome` global, neither of which this
    // (Node-environment, backend-only) config provides, so they're
    // explicitly excluded here rather than failing under the wrong
    // environment.
    exclude: [
      "**/node_modules/**",
      "src/content/**",
      "src/background/**",
      "src/sidepanel/**",
      "src/build-output.test.ts",
      "src/lib/api-client.test.ts",
      "src/lib/storage.test.ts",
    ],
    globalSetup: ["./vitest.global-setup.ts"],
    // PDF/browser-backed tests (pdf-parse, Playwright) are consistently
    // slower than the default 5s, especially under parallel test load.
    testTimeout: 20_000,
    // All test files share one SQLite file (see vitest.global-setup.ts).
    // Phase 4 introduced FK relations across Job/Resume/JobAnalysis/
    // ResumeJobMatch, so concurrent test files doing broad `deleteMany()`
    // cleanup could race across files. Running files sequentially avoids
    // that class of flakiness cheaply, at a small cost to wall-clock time.
    fileParallelism: false,
  },
});
