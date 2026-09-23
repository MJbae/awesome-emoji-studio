import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    globals: true,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      reportsDirectory: './coverage/unit',
      include: [
        resolve(__dirname, 'src/main/**/*.ts'),
        resolve(__dirname, 'src/preload/**/*.ts'),
        resolve(__dirname, '../shared/src/platform/adapter.ts'),
      ],
      allowExternal: true,
      exclude: [],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
});
