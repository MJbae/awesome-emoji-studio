# README editorial review

The repository overview is available in five short, parallel editions:

- [English](../../README.md)
- [한국어](../../README.ko.md)
- [日本語](../../README.ja.md)
- [简体中文](../../README.zh-CN.md)
- [繁體中文](../../README.zh-TW.md)

Each edition uses one image, three benefit bullets, two sections, and the same four setup commands. The English overview was reduced from 204 to 44 lines. Detailed technical information lives in the [developer guide](../development.md).

Separate language agents reviewed the English/Korean, Japanese, and Chinese editions for natural wording and factual consistency. Simplified Chinese and Traditional Chinese were edited separately for mainland and Taiwan usage. These are AI editorial reviews, not human native-speaker certifications.

[English/Korean review](en-ko-review.md) · [Japanese review](ja-review.md) · [Chinese review](zh-review.md)

## Verification

- All five editions rendered successfully through GitHub's Markdown API.
- The returned GitHub HTML was checked in a local responsive preview at 1100, 390, and 320 px: no page overflow or broken image.
- All relative links resolve. Language navigation links to the other four editions.
- Setup commands match the repository URL and available npm scripts.
- Node.js 22.12+ reflects the locked desktop build dependency requirements.
- The live studio and API-key entry links returned HTTP 200; the latter redirects to Google sign-in.

`showcase.png` is an actual English app screen from the local development build, with sample character artwork and a fake local key. It shows the interface, not a live Gemini generation result. No application source or dependencies were changed in this README update.
