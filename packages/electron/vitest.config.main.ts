import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/main/**/*.test.ts'],
    globals: true,
  },
});
