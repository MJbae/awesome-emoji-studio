<div align="center">

# Awesome Emoji Studio

**One concept. A complete emoji production pipeline.**

Pipeline designed by [MJbae](https://github.com/MJbae). AI stages powered by Gemini.

[**Try the pipeline ↗**](https://awesome-emoji-studio.vercel.app) · [Explore the design](docs/pipeline.md)

**English** · [한국어](README.ko.md) · [日本語](README.ja.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md)

</div>

<div align="center">
<picture>
  <source media="(max-width: 600px)" srcset="docs/readme/pipeline/en-mobile.svg">
  <img src="docs/readme/pipeline/en-desktop.svg" alt="Concept → AI strategy → Character + spec → 45 expressions → Background removal + outlines → Metadata 5 languages → ZIP exports 6 formats">
</picture>
</div>

- **Plan before generating.** Market, art, and cultural perspectives shape the creative strategy.
- **Carry the character forward.** Character details shape the expression plan, and a shared reference image guides the artwork.
- **Finish the workflow.** Process images, generate titles and tags, then package for LINE, KakaoTalk, Telegram, and OGQ.

Review the results and regenerate along the way. The pipeline runs in the browser or desktop app, with no backend to set up. AI requests go directly to Google; image processing and ZIP creation stay local.

<details>
<summary><strong>See the studio</strong></summary>

![Awesome Emoji Studio interface](docs/readme/showcase.png)

<sub>Actual app interface with illustrative mock artwork.</sub>

</details>

## Run locally

Node.js 22.12+ and npm. Bring your own [Gemini API key](https://aistudio.google.com/apikey).

```bash
git clone https://github.com/MJbae/awesome-emoji-studio.git
cd awesome-emoji-studio
npm install
npm run dev:web
```

For desktop, use `npm run dev:electron`. Enter your key in the app.

[Pipeline design](docs/pipeline.md) · [Developer guide](docs/development.md) · [Language reviews](docs/localization/README.md)

---

**Like the pipeline?** Give it a ⭐ and build something expressive.
