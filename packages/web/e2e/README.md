# Browser regression and source branch coverage

Run from the repository root:

```sh
npm install
npx playwright install chromium
npm run test:e2e
npm -w @emoji/web run test:e2e:coverage
```

`test:e2e` runs the browser journeys and always creates an Istanbul coverage report.
`test:e2e:coverage` additionally enforces **100% source branch coverage**. A passing
journey suite alone does not satisfy that gate. The gate is deliberately not
lowered to the measured percentage.

Reports are written to `packages/web/coverage/e2e/`:

- `index.html`: source-level coverage, including uncovered branch locations.
- `coverage-summary.json`: per-file statements, branches, functions, and lines.
- `coverage-final.json` and `lcov.info`: machine-readable source coverage.
- `gate.json`: measured totals, the 100% threshold, explicit pass/fail, and unvisited source files.
- `uncovered-branches.json`: every uncovered branch arm with its original TypeScript location.
- `raw/`: browser coverage collected per test and before full-page navigation.

Failure screenshots and traces are in `packages/web/test-results/`. The HTML
journey report is in `packages/web/playwright-report/`.

## What the browser tests exercise

| Area | Scenarios |
| --- | --- |
| API setup | Required initial dialog, empty/short/invalid keys, hidden/visible key, Enter submission, service failure, recovery, settings dismiss, reload persistence |
| Concept | Length validation, all five target markets, reference upload, character generation versus use uploaded character |
| Strategy | Loading, API fallback/error/empty response, retry, back, all expert accordions |
| Character | Loading, generation, regeneration, transport/empty-response errors, retry, specification expansion, reference reuse |
| Sticker batch | All 45 outputs, chunk scheduling, pending/loading/done/error, progress, retry/regenerate, edit/save/cancel |
| Processing | Real canvas processing and preview, cleanup toggle, outline white/black/thickness/opacity, preview background, continue/back |
| Metadata | Six languages, none selected, generation/failure/retry/regeneration, option selection/deselection, quality scores, clipboard |
| Export | Platform toggle/select all/none, individual and combined downloads, actual ZIP contents and image dimensions |
| Localization/layout | English, Korean, Japanese, Simplified Chinese and Traditional Chinese; browser preference detection, saved manual choice, language switching without state loss, mobile layouts, translated visible/accessibility labels |
| Public integration API | Separate `public-api.spec.ts` exercises the production automation interface and pipeline jobs |

The test requests use a fixed fake key and deterministic Gemini HTTP responses.
They never read `.env` or contact a paid AI service. The generated images are
small, valid PNG fixtures. Image processing, ZIP creation, browser downloads,
and the application state transitions execute their production implementation.
The 45-image scenario advances the browser clock over the real ten-second batch
intervals; it never skips an application stage or forces store state.

## Coverage scope and honest limitations

The denominator contains **every runtime TypeScript/TSX module in
`packages/shared/src` and `packages/web/src`**, including modules not reached by
the browser. Only test files, declarations and the MSW test-support folder are
excluded. Electron main/preload code is covered by its separate desktop suite;
web coverage must not be presented as full repository coverage.

Istanbul runs only on the E2E development server. HMR is disabled there so React
Fast Refresh implementation branches do not distort application coverage.
Source maps remap locations to the original TypeScript. Unvisited production
modules are instrumented and included at zero; no production condition is
ignored to make the gate pass.

The initial unchanged UI baseline is recorded in `baseline-coverage.json`.
A matching run after the design changes is recorded in `redesign-coverage.json`.
The final runs pass 64 original regressions and 79 redesigned tests (the same
64 plus 15 new design checks). Source branch coverage is 78.81% and 79.55%;
the 100% gate remains unmet. See [the verification report](../../../docs/testing.md).
These recorded runs must be refreshed after modifying tests or runtime source.
A percentage below 100 means the requested branch completion condition remains
unmet, even if every listed test passes.

## Repeating the original-source comparison

Create a detached worktree at the recorded baseline revision, install/symlink
its dependencies, and copy only the current `packages/web/e2e`,
`packages/web/scripts`, `packages/web/playwright.config.ts`,
`packages/web/vite.config.ts`, and `packages/web/package.json` into it. Keep its
`packages/shared/src` and `packages/web/src` unchanged. The Vite aliases resolve
the worktree's own shared source even when `node_modules` is shared.

Run the identical regression suite in each worktree. Exclude `design-*.spec.ts`
from the original baseline because those tests assert newly added behavior. For concurrent comparison use a
separate port, e.g. `E2E_PORT=5175 npm -w @emoji/web run test:e2e` in the baseline.
Do not run two Playwright invocations in one worktree simultaneously, because
each run intentionally starts with a clean coverage directory.
