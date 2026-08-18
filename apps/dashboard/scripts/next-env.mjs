#!/usr/bin/env node
// Runs the Next.js CLI, loading the monorepo root .env only when it exists.
// Node 20 (used in CI) has no --env-file-if-exists, and a plain --env-file
// aborts with exit code 9 when the file is missing (CI provides env vars
// through the workflow environment instead of a .env file).
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const envFile = path.resolve(scriptDir, "../../../.env");
const nextBin = path.resolve(scriptDir, "../node_modules/next/dist/bin/next");

const nodeArgs = existsSync(envFile) ? [`--env-file=${envFile}`] : [];
const result = spawnSync(
  process.execPath,
  [...nodeArgs, nextBin, ...process.argv.slice(2)],
  { stdio: "inherit" },
);
process.exit(result.status ?? 1);
