import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import istanbul from 'vite-plugin-istanbul';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    ...(process.env.E2E_COVERAGE === '1' ? [istanbul({
      cwd: path.resolve(__dirname, '../..'),
      include: ['packages/shared/src/**/*.{ts,tsx}', 'packages/web/src/**/*.{ts,tsx}'],
      exclude: ['**/*.test.*', '**/*.d.ts', '**/msw/**'],
      extension: ['.ts', '.tsx'],
      requireEnv: false,
    })] : []),
  ],
  server: {
    hmr: process.env.E2E_COVERAGE === '1' ? false : undefined,
    watch: { ignored: ['**/coverage/**', '**/test-results/**', '**/playwright-report/**'] },
  },
  resolve: {
    alias: {
      '@emoji/shared/css': path.resolve(__dirname, '../shared/src/index.css'),
      '@emoji/shared': path.resolve(__dirname, '../shared/src/App.tsx'),
      '@': path.resolve(__dirname, '../shared/src'),
    },
  },
  define: {
    'process.env': {},
  },
});
