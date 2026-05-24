import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const dir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      include: [
        "src/engine/ThreatEngine.ts",
        "src/modules/levels/levelMath.ts",
        "src/modules/automod/automodText.ts",
      ],
      thresholds: { lines: 65, functions: 65 },
    },
  },
  resolve: {
    alias: {
      "@sentinel/shared": path.resolve(dir, "../shared/src/index.ts"),
      "@sentinel/database": path.resolve(dir, "../database/src/index.ts"),
    },
  },
});
