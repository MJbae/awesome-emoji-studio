# Pipeline README: English and Korean editorial review

Result: **PASS**

Reviewed candidates: `/tmp/emoji-pipeline-readme/README.md` and `/tmp/emoji-pipeline-readme/README.ko.md`.

## Positioning and language

- The opening centers the owner's designed production pipeline. Both versions explicitly credit MJbae for its design and identify Gemini as the AI engine.
- English is concise and natural. The seven-stage flow communicates the product before the benefit bullets, while the optional screenshot stays collapsed.
- Korean uses natural product language: 제작 흐름, 외형 명세, 배경 제거, 외곽선, and 내보내기. It adapts the English meaning without reproducing English sentence patterns. The invitation to star is short and polite.
- Korean was authored and self-edited by this review agent. English was reviewed independently from its author.

## Source and parity checks

- The diagram has the same seven nodes and six edges, in UI order: concept, strategy, character/specification, 45 expressions, image cleanup, metadata in five languages, and six ZIP export formats.
- The diagram describes the guided UI workflow, with user review and regeneration. It makes no claim that the public `runFullPipeline` API executes all seven stages.
- Market, art, and cultural perspectives are used in strategy generation. Character specifications inform expression ideas, while the common reference image is sent with individual image-generation requests.
- Suggested English precision edit: “Character details shape the expression plan, and a shared reference image guides the artwork.” Korean uses this distinction. The original wording that both “guide every expression” is broadly true, but the edit explains their separate roles more clearly.
- Suggested English diagram clarity edit: “Background removal” rather than “Background.” Korean explicitly says 배경 제거.
- Both retain 45 / 5 / 6, the same platform names, root-level language navigation, the same image path, and the same four quickstart commands.
- Both require a Gemini API key and Node.js 22.12+. AI requests are accurately described as going to Google; image processing and ZIP generation happen on the user's device.
- The screenshot caption identifies mock artwork. No claims of fully automatic production, one-click completion, free API access, guaranteed store approval, or live AI verification are introduced.

No remaining Korean language or factual blockers. English is approved with the two optional clarity edits above.

## Live Demo CTA correction

PASS — reviewed the requested demo-link wording in all five editions: Live Demo / 라이브 데모 / ライブデモ / 在线演示 / 線上示範. The destination and pipeline description are unchanged.
