# README editorial review

The five editions lead with the production pipeline and explicitly credit its designer, [MJbae](https://github.com/MJbae). Gemini is credited for the AI stages.

[English](../../README.md) · [한국어](../../README.ko.md) · [日本語](../../README.ja.md) · [简体中文](../../README.zh-CN.md) · [繁體中文](../../README.zh-TW.md)

Each edition has a compact seven-stage diagram, three points explaining the design, a collapsed interface preview, and the same four setup commands. Details about stage inputs, outputs, and implementation live in the [pipeline design](../pipeline.md) and [developer guide](../development.md).

Separate language agents reviewed the English/Korean, Japanese, and Chinese editions. Simplified Chinese and Traditional Chinese were edited for mainland and Taiwan usage. These are AI editorial reviews, not human native-speaker certifications.

[English/Korean review](en-ko-review.md) · [Japanese review](ja-review.md) · [Chinese review](zh-review.md)

## Verification

- All five editions rendered successfully through GitHub's Markdown API, including the responsive `picture` element.
- Each Mermaid diagram renders seven nodes and six transitions. Desktop and mobile SVGs have identical stage order.
- GitHub HTML was checked in a local preview at 1100, 390, and 320 px. Desktop selects the horizontal diagram; mobile selects the vertical one. No page overflow or broken images.
- The studio image stays collapsed until requested.
- Relative links, language navigation, author attribution, and setup commands were checked.
- The pipeline description matches the guided UI. Documentation distinguishes it from the programmatic generation/postprocessing API.

`showcase.png` is an actual app screen with mock artwork. It is not evidence of a live Gemini generation. No application source or dependencies were changed.
