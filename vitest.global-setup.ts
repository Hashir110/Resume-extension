import { execSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import path from "node:path";

// A dedicated SQLite file, never the dev database — every test file's
// afterEach/afterAll does broad deleteMany() cleanup, which would otherwise
// destroy real local dev.db data. `fileParallelism: false` in
// vitest.config.ts means every test file in the run shares this one file
// safely (no concurrent-writer races).
const TEST_DB_PATH = path.resolve(__dirname, "prisma/vitest-test.db");
const TEST_DATABASE_URL = `file:./vitest-test.db`;

export default async function setup() {
  if (existsSync(TEST_DB_PATH)) rmSync(TEST_DB_PATH);

  // Vitest propagates env vars set here to every test file/worker in this
  // run, so every test's `import { prisma } from "@/lib/db"` connects to
  // this file, not whatever DATABASE_URL .env.local has for local dev.
  process.env.DATABASE_URL = TEST_DATABASE_URL;

  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    cwd: __dirname,
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: "inherit",
  });

  return function teardown() {
    if (existsSync(TEST_DB_PATH)) rmSync(TEST_DB_PATH);
  };
}
