# Awesome Emoji Studio

> From concept to store-ready emoji pack — powered by AI.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Gemini](https://img.shields.io/badge/Google%20Gemini-AI-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![Electron](https://img.shields.io/badge/Electron-40-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![License](https://img.shields.io/badge/License-MIT-blue)](#license)

Most AI image generators stop at "here's a picture." Awesome Emoji Studio goes further — it produces **market-ready emoji packs** that meet the exact submission requirements of real storefronts. Enter a character concept, and the platform handles everything: market strategy, 45-image batch generation, background removal, outline rendering, multilingual SEO metadata, and platform-specific ZIP packaging for **7 different marketplaces**.

**[Live Demo](https://awesome-emoji-studio.vercel.app)**

---

## Highlights

- **Market-Ready Output**: Not just generated images, but store-submission-ready packages with correct dimensions, naming conventions, tab/main images, and metadata for KakaoTalk, LINE, Telegram, and OGQ Market.
- **AI Expert Panel**: Four AI personas (Market Analyst, Art Director, Cultural Expert, Chief Creative Director) collaborate to build a data-driven creative strategy before a single pixel is drawn.
- **Zero Backend**: Fully serverless. Gemini API calls, image processing, and ZIP generation all happen client-side. Your API key never leaves your device.
- **Three Interfaces, One Codebase**: Web (Vite + Vercel), Desktop (Electron), and CLI (Commander + Sharp) share ~80% of code through a monorepo architecture.
- **Pure Canvas Image Engine**: Background removal (Sobel edge detection + flood fill + defringing) and outline rendering built entirely with the Canvas API — no native dependencies in the browser.

---

## How It Works

```
                         Awesome Emoji Studio Pipeline
 ┌─────────────────────────────────────────────────────────────────────────┐
 │                                                                         │
 │  ┌──────────┐   ┌───────────────────────┐   ┌────────────────────────┐  │
 │  │  CONCEPT │   │    AI EXPERT PANEL    │   │   CHARACTER DESIGN    │  │
 │  │  INPUT   │──▶│                       │──▶│                       │  │
 │  │          │   │  Market Analyst       │   │  Base character       │  │
 │  │ Text +   │   │  Art Director         │   │  generation +         │  │
 │  │ Ref Img  │   │  Cultural Expert      │   │  style refinement     │  │
 │  │ + Market │   │  ──────────────────   │   │                       │  │
 │  │          │   │  Chief Creative Dir.  │   │                       │  │
 │  └──────────┘   └───────────────────────┘   └───────────┬────────────┘  │
 │                                                         │               │
 │  ┌──────────────────────────────────────────────────────▼────────────┐  │
 │  │                    BATCH GENERATION (45 images)                   │  │
 │  │  Theme-based category distribution · Chunked parallel generation  │  │
 │  │  Rate limit management · CharacterSpec consistency enforcement    │  │
 │  └──────────────────────────────────┬───────────────────────────────┘  │
 │                                     │                                   │
 │  ┌──────────────────────────────────▼───────────────────────────────┐  │
 │  │                      POST-PROCESSING                             │  │
 │  │  Sobel edge detection ─▶ Flood fill ─▶ Defringing ─▶ Outline    │  │
 │  │  Pure Canvas API · No external dependencies                      │  │
 │  └──────────────────────────────────┬───────────────────────────────┘  │
 │                                     │                                   │
 │  ┌──────────────────────┐  ┌────────▼───────────────────────────────┐  │
 │  │  MULTILINGUAL SEO    │  │         PLATFORM EXPORT                │  │
 │  │  METADATA            │  │                                        │  │
 │  │                      │  │  7 platforms · Auto-resize · Tab/Main  │  │
 │  │  5 languages         │  │  images · Naming conventions · ZIP     │  │
 │  │  3 strategy options  │  │                                        │  │
 │  │  Self-scoring (4ax)  │  │  KakaoTalk · LINE · Telegram · OGQ    │  │
 │  └──────────────────────┘  └────────────────────────────────────────┘  │
 │                                                                         │
 └─────────────────────────────────────────────────────────────────────────┘
```

---

## Architecture

### AI Expert Panel (Multi-Agent Prompting)

The strategy phase doesn't rely on a single prompt. Instead, four specialized AI personas analyze the concept sequentially:

1. **Market Analyst** evaluates trends, competition, and positioning for the target market (Korea, Japan, or Taiwan).
2. **Art Director** defines visual style, proportions, and expression range.
3. **Cultural Expert** adapts humor, gestures, and themes for cultural fit.
4. **Chief Creative Director** synthesizes all inputs into a final production plan with 45 categorized emoji ideas.

This approach produces significantly more coherent and market-aware emoji packs than single-prompt generation.

### Monorepo + Shared Core

```
packages/
├── shared/        ← ~80% of all code lives here
│   ├── services/gemini/     AI orchestration + prompt engineering
│   ├── services/image/      Canvas-based image processing engine
│   ├── services/pipeline/   Pipeline state machine + orchestration
│   ├── store/               Zustand 5 (5 slices + persist)
│   ├── components/          React 19 UI (7 stage components)
│   ├── bridge/              window.emoticon API + EventBus
│   ├── platform/            Web/Electron adapters (Bridge pattern)
│   ├── i18n/                5-language translations
│   └── types/               Domain types + API contracts
├── web/           ← Thin Vite SPA shell
├── electron/      ← Thin Electron shell (contextIsolation + sandbox)
└── cli/           ← Commander + Sharp adapter
```

Platform-specific behavior is handled through a **Bridge pattern** — `@emoji/shared` defines the interfaces, and each platform package provides the concrete implementation. The web adapter uses Canvas API for image processing; the CLI adapter uses Sharp.

### Gemini Model Fallback Chain

The AI pipeline includes automatic model fallback. If the primary model (e.g., `gemini-3.1-pro-preview`) fails or hits rate limits, the system transparently switches to fallback models, adapting to each model's capability differences.

### Programmatic API

The web build exposes `window.emoticon` for scripting and automation:

```javascript
// Start a full pipeline run from the browser console
const jobId = await window.emoticon.runFullPipeline(
  { concept: 'office worker rabbit', referenceImage: null, language: 'Korean' },
  'kakaotalk_emoticon',
);

// Subscribe to progress events
const unsubscribe = window.emoticon.subscribe(jobId, ({ stage, current, total, message }) => {
  console.log(stage, `${current}/${total}`, message);
});

// Cancel at any time
window.emoticon.cancelJob(jobId);
```

---

## Features

### Batch Emoji Generation
- 45 emoji images generated from a single character concept
- Theme-based category distribution (greetings, emotions, daily life, etc.)
- CharacterSpec enforcement for visual consistency across all images
- Chunked parallel generation with rate limit management (~15-25 min)

### Image Post-Processing
- **Background removal**: Sobel edge detection + flood fill + defringing algorithm
- **Outline generation**: Circular offset rendering with adjustable thickness and opacity
- All implemented with pure Canvas API — zero native dependencies in the browser
- Post-process-only mode: upload existing images (PNG/JPG/ZIP, up to 120) and apply processing without AI generation

### Platform Export

Produces submission-ready ZIP packages for 7 platforms:

| Platform | Content Size | Tab Size | Includes | Category |
|----------|-------------|----------|----------|----------|
| KakaoTalk Emoticon | 360 x 360 | 96 x 74 | main.png + tab.png + 45 emojis | KakaoTalk |
| KakaoTalk Mini | 180 x 180 | 96 x 74 | tab.png + 45 emojis | KakaoTalk |
| LINE Sticker | 370 x 320 | 96 x 74 | main.png + tab.png + 45 stickers | LINE |
| LINE Emoji | 180 x 180 | 96 x 74 | tab.png + 45 emojis | LINE |
| Telegram Static Sticker | 512 x 512 | 100 x 100 | tab.png + 45 stickers (max 512KB) | Etc |
| Telegram Custom Emoji | 100 x 100 | 100 x 100 | tab.png + 45 emojis (max 512KB) | Etc |
| OGQ Sticker | 740 x 640 | 96 x 74 | main.png + tab.png + 45 stickers | Etc |

### Multilingual SEO Metadata
- Auto-generated titles, descriptions, and tags in 5 languages (EN, KO, JA, zh-TW, zh-CN)
- 3 metadata strategy options
- 4-axis self-evaluation scoring for quality assessment

### Cultural Optimization
- Market-specific category distribution for Korea, Japan, and Taiwan
- Culturally-adapted prompts (humor, gestures, expressions)

---

## Getting Started

### Prerequisites

- **Node.js** >= 18
- **npm** >= 9
- **Gemini API Key** — get one free at [Google AI Studio](https://aistudio.google.com/apikey)

### Installation

```bash
git clone https://github.com/user/awesome-emoji-studio.git
cd awesome-emoji-studio
npm install
```

### Run

```bash
# Web (opens at http://localhost:5173)
npm run dev:web

# Desktop
npm run dev:electron

# CLI
npm run dev:cli -- config set-key <YOUR_GEMINI_API_KEY>
npm run dev:cli -- generate -c "cute office cat" --auto -o ./output
```

### Build

```bash
npm run build:web         # Production web build
npm run build:electron    # Production desktop build
npm run build:cli         # Production CLI build
```

### Test

```bash
npm run test              # Unit tests (Vitest)
npm run test:e2e          # E2E tests (Playwright)
npm run lint              # ESLint
```

---

## Security

- API keys are stored only in browser `localStorage` (web) or OS `safeStorage` (Electron). They are never transmitted to any server.
- Fully client-side architecture: all AI calls go directly from your browser/app to the Gemini API.
- No backend server. No data collection. No telemetry.

---

## License

MIT
