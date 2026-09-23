# Developer guide

[← Overview](../README.md)

## Start

Use **Node.js 22.12+** and npm. The Node requirement includes the locked desktop build dependencies.

```bash
git clone https://github.com/MJbae/awesome-emoji-studio.git
cd awesome-emoji-studio
npm install
npm run dev:web
```

Open the local address printed by Vite (normally `http://localhost:5173`). Enter your own [Gemini API key](https://aistudio.google.com/apikey) in the app.

| Task | Command |
| --- | --- |
| Desktop development | `npm run dev:electron` |
| Web build | `npm run build:web` |
| Desktop build | `npm run build:electron` |
| macOS package | `npm -w @emoji/electron run package:mac` |
| Windows package | `npm -w @emoji/electron run package:win` |
| Unit tests and language review checks | `npm test` |
| Browser E2E | `npx playwright install chromium` then `npm run test:e2e` |
| Desktop E2E | `npm run test:e2e:electron` |
| Test type checks | `npm run test:e2e:typecheck` |
| Lint | `npm run lint` |

Browser regression tests use deterministic Gemini responses. Canvas processing, ZIP generation, downloads, and UI transitions run their real implementations. Passing these tests does not verify a live Gemini account or generation quality.

`npm run test:e2e:coverage` enforces the 100% source branch target. That target is **not yet met**; see the [latest verification record](localization/README.md#검증). Do not treat a passing scenario suite as 100% code coverage.

## Where things live

| Package | Responsibility |
| --- | --- |
| [`packages/shared`](../packages/shared/src) | React interface, state, Gemini calls, image processing, ZIP exports |
| [`packages/web`](../packages/web) | Vite web app and browser tests |
| [`packages/electron`](../packages/electron) | Desktop window, secure key storage, native file access |

AI requests send the relevant prompts and images directly to Google. Background removal, outlines, resizing, and ZIP creation run on the user's device. Web API keys use local storage; desktop keys use Electron's OS encryption support.

Export presets are defined in [`platforms.ts`](../packages/shared/src/constants/platforms.ts). They provide image dimensions, file names, and main/tab images for six formats. Exporting a ZIP does not guarantee storefront approval or enforce every listed file size limit.

## Browser automation API

The app exposes `window.emoticon` for programmatic generation and postprocessing:

```javascript
const jobId = await window.emoticon.runFullPipeline(
  { concept: 'a tiny tangerine who loves coffee', referenceImage: null, language: 'English' },
  'line_emoji',
);

const unsubscribe = window.emoticon.subscribe(jobId, (progress) => {
  console.log(progress.stage, progress.current, progress.total);
});

// To stop listening later: unsubscribe();
// To cancel generation: window.emoticon.cancelJob(jobId);
```

Read the [API contract](../packages/shared/src/types/api.ts) for job inspection, export, and postprocessing. The granular `runStage` endpoint is currently unimplemented; image/ZIP upload-only controls are not wired into the main UI.

## Language contributions

The app supports English, Korean, Japanese, Simplified Chinese, and Traditional Chinese. [Language selection and review policy](localization/README.md) explains detection, regional wording, and agent approval.

When changing copy, update the relevant catalog, obtain a language review, and update its approval record. `npm run check:i18n` checks completeness, interpolation tokens, and approved content hashes. Web builds and desktop packaging run this check.

[Design comparison](process-design/README.md) · [Original design verification](testing.md) · [Current language verification](localization/verification.json)
