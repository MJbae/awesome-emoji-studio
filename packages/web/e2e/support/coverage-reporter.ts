import { execFileSync } from 'node:child_process';
import type { Reporter } from '@playwright/test/reporter';

export default class CoverageReporter implements Reporter {
  async onEnd() {
    try {
      execFileSync(process.execPath, ['scripts/e2e-coverage.mjs'], { stdio: 'inherit' });
    } catch {
      return { status: 'failed' as const };
    }
  }
}
