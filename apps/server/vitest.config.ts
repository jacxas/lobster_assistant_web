import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { defineConfig } from "vitest/config";

// DATA_DIR único por ejecución: los tests no tocan la BD de desarrollo
export default defineConfig({
  test: {
    env: {
      DATA_DIR: mkdtempSync(join(tmpdir(), "lobster-test-")),
    },
  },
});
