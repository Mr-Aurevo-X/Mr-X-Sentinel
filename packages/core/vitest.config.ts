import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const dir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: { environment: "node" },
  resolve: {
    alias: {
      "@sentinel/shared": path.resolve(dir, "../shared/src/index.ts"),
      "@sentinel/database": path.resolve(dir, "../database/src/index.ts"),
    },
  },
});
