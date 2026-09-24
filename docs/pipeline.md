# Pipeline design

**Pipeline designed by [MJbae](https://github.com/MJbae).**

Awesome Emoji Studio connects planning, character identity, image generation, local image processing, localized metadata, and platform packaging into one guided workflow. Gemini powers its AI stages; the application coordinates the stages and keeps their outputs available for the next steps.

[← Overview](../README.md) · [Developer guide](development.md)

## The seven stages

| Stage | What happens | Output |
| --- | --- | --- |
| **1. Concept** | Collect a character idea, optional reference image, and target language. | A shared input for the creative stages. |
| **2. AI strategy** | A market analysis feeds the art direction. Art and cultural perspectives run in parallel, then a synthesis selects a visual style and combines their advice. | Style choice, sales reasoning, cultural notes, and the three perspectives. |
| **3. Character identity** | Generate a base character, apply the chosen style, and extract its visual specification. An uploaded reference can also be used directly. | A reference image plus physical description, facial features, colors, distinguishing features, and art style. |
| **4. Expressions** | Use the strategy and character specification to plan 45 expressions. Each image request uses the shared character reference. Generation runs in batches; individual images can be retried or regenerated from an edited prompt. | A collection of images with individual status and prompts. |
| **5. Image processing** | Preview and apply background removal and optional outlines with the Canvas API. | Processed images, computed locally. |
| **6. Metadata** | Use sample sticker images, the strategy, and the character specification to propose three title/description/tag options per selected language. | Options in up to five languages, with model-generated scores and options users can select. |
| **7. Platform packaging** | Resize images, apply file names, add main/tab images where needed, and include selected metadata. | Individual or combined ZIPs for six formats across LINE, KakaoTalk, Telegram, and OGQ. |

The diagram in the README shows the order of the **UI workflow**. It is guided: users review results and choose when to continue. It does not imply one unattended API call performs every stage.

## What carries through

- **Creative direction:** the strategy informs expression planning and metadata.
- **Character identity:** the extracted specification shapes the expression plan; the shared reference image guides the generated artwork.
- **Output intent:** the target language guides generated copy, and the selected platform presets determine packaging.

These handoffs connect the stages. The metadata stage samples the generated stickers and character context; it does not require the postprocessed image data as its input.

## Follow the implementation

| Concern | Source |
| --- | --- |
| Guided UI, review points, processing, metadata, and export actions | [`App.tsx`](../packages/shared/src/App.tsx) |
| Expert perspectives, synthesis, image calls, and metadata | [`orchestrator.ts`](../packages/shared/src/services/gemini/orchestrator.ts) |
| Character and expression prompts | [`characterGen.ts`](../packages/shared/src/services/gemini/prompts/characterGen.ts) |
| Local background removal and outlines | [`services/image`](../packages/shared/src/services/image) |
| Resizing, individual ZIPs, and combined ZIPs | [`export.ts`](../packages/shared/src/services/image/export.ts) |
| Six export presets | [`platforms.ts`](../packages/shared/src/constants/platforms.ts) |
| Programmatic jobs, progress events, and cancellation | [`services/pipeline`](../packages/shared/src/services/pipeline) |

The programmatic `window.emoticon.runFullPipeline` currently runs generation and postprocessing. The UI implements the metadata and export steps separately; `window.emoticon.export` exposes export for existing jobs. The granular `runStage` endpoint remains unimplemented. See the [API contract](../packages/shared/src/types/api.ts).

AI requests send the required prompts and reference/sample images directly to Google. Background removal, outlines, resizing, and ZIP creation run on the user's device.

[Workflow screenshots](process-design/README.md) · [Language policy](localization/README.md) · [Verification scope](localization/README.md#검증)
