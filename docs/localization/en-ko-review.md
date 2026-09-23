# English and Korean UI language review

Reviewer: a dedicated language review agent, separate from the implementation agent. Review date: 2026-09-23. This is an AI language and UI copy review, not a claim of human native-speaker approval.

## Decision

- English (`en`): **PASS for adoption**, 254 of 254 contract strings reviewed; 266 final strings including 12 English plural variants.
- Korean (`ko`): **PASS for adoption**, 254 of 254 contract strings reviewed and localized.
- Scope: visible labels, guidance, progress and errors, all seven creation stages, settings, language names, screen reader labels, expert personas, platform names/descriptions, and metadata option labels.
- Missing contract keys: 0 in either candidate. Placeholder name/count mismatches: 0 in either candidate. Product brand `Awesome Emoji Studio` retained exactly.

Approved candidates: `/tmp/emoji-locale-review/en-approved.json` and `/tmp/emoji-locale-review/ko-approved.json`. These files must be adopted only after this recorded PASS; subsequent new copy requires review.

## Review method

Read the complete English draft and existing Korean catalog, then checked copy against InputStage, StrategyStage, CharacterStage, StickerBatchStage, PostProcessStage, MetadataStage, ExportStage, FileUpload, SelectionGrid, ProcessingOptions, ApiKeyModal and the metadata generation prompt. Reviewed every string for meaning, idiomatic phrasing, consistent terminology, helpful action labels, UI brevity and interpolation safety. Programmatically compared all flattened contract keys and interpolation variables. Browser/device language preference and explicit user selection are the intended language policy; the device-language label reflects that policy.

## Findings corrected before approval

| Area | Problem | Approved treatment |
| --- | --- | --- |
| Character creation | `Key Visual` is unexplained design jargon, including in Korean copy. | `Character` / `캐릭터`, with concise appearance and style labels. |
| Metadata | `Metadata` and `SEO` conceal what consumers get; progress misleadingly said generation was automatic. | Visible English titles describe titles, descriptions and tags; Korean uses `소개 문구`, `제목`, `설명`, `태그`. Descriptions clearly instruct selecting languages and generating. Search score is `Searchability` / `검색 적합성`. |
| AI score | Quality score was not identified as AI assessment. | `AI quality score` / `AI 평가 점수`. |
| Post-processing | English said changes were already applied. | Future tense explicitly says changes apply on continuing, with affected-image count. |
| Platform selection | `platforms ready` confused selection with finished exports. | `platforms selected` / `플랫폼 …개 선택됨`. |
| Downloads | Separate platform archives versus a combined archive were unclear. | `Download ZIPs by platform` and `Download one combined ZIP`; equivalent Korean action labels. |
| Uploads | Existing Korean promised ZIP extraction and an unenforced 10 MB cap. | Actual supported image uploads, no ZIP extraction claim, no unenforced size cap. |
| Locale scope | Korean marketing copy advertised 6 languages. | Exactly 5 languages. |
| Errors | Every API validation failure was called an invalid key. | Key and connectivity check guidance without asserting a specific cause. |
| Count grammar | English `1 chars`, `1 images`, and `1 platforms`. | `_one` and `_other` variants for six count-based strings. Korean counts already work without plural forms. |
| Actions | Repeated textual arrows and inconsistent English title case. | Sentence case, short verbs, arrows removed from translated strings. |
| Selection | Generic `Clear` / `초기화` could imply resetting the workflow. | `Deselect all` / `전체 해제`. |
| Accessibility | New English-only accessibility strings were absent in Korean. | All accessible labels localized with intact dynamic values; draft English a11y labels retained for established test selectors. |

## Language decisions

English uses friendly, concise consumer-facing language: `Create your emoji set`, `Meet your character`, `Add the finishing touches`. It avoids formal production terms where ordinary words describe the task. `Emoji` is used throughout the creation flow; individual platform cards keep their own sticker/emoticon terminology. Uppercase abbreviations API, PNG, JPG, WEBP and ZIP and brand spellings remain intact.

Korean uses `콘셉트` consistently, straightforward noun labels, and polite explanatory language. Primary creation actions use `만들기` / `다시 만들기`; technical prompts remain `생성 프롬프트`, a familiar term needed to identify what the editor changes. The tone is approachable without exaggerated claims. `외곽선` is used consistently instead of switching between 외곽선 and 테두리. `기기 언어에 맞추기` clearly describes the language preference behavior. Locale names are 한국어, 영어, 일본어, 중국어 (간체), 중국어 (번체). Korean platform descriptions use established names such as 카카오톡 이모티콘 and 텔레그램 스티커.

## Checks and limitations

Structural validation passed for all 254 contract keys in each locale. Additional English plural variants retain the same interpolation variables as their base keys. No production files were modified by this review agent before approval.

The review approves bundled interface copy only. User text and future Gemini responses are not reviewed by this static catalog check. AI-generated content needs the project's model-generation behavior and evaluation mechanisms. This copy review cannot certify live API behavior or rendered layout; the implementation agent will run UI and E2E validation after adopting the candidates.

## Final status heading revision

Re-reviewed `stickers.completeTitle` against the component's terminal-state condition, which includes failed images. Approved neutral headings: English **Emoji generation results**; Korean **이모지 생성 결과**. Both are concise and idiomatic, and accurately label completed generation attempts even if every image failed. This supersedes the earlier readiness wording. **PASS for adoption** for this revision in both locales.

## Rendered setup inspection

Inspected the live development UI at `http://localhost:5190` using native Chrome UI control. Device preference selected Korean on first load. Reviewed Korean and English API setup modals visually and through the accessibility tree; all labels and explanatory copy were natural and complete, the five-language selector offered exactly English, 한국어, 日本語, 简体中文 and 繁體中文, and switching to English updated the modal and accessible names immediately. No clipping or text overflow was visible at the desktop viewport. No API key was entered. Remaining creation stages require the mock-backed rendered captures and are not claimed as visually verified by this setup inspection.

## Generated-writing guidance review

Reviewed English and Korean entries in `packages/shared/src/services/gemini/prompts/writingGuidance.ts`: **PASS**. English uses familiar conversational language and sentence case; Korean asks for idiomatic contemporary wording, friendly 해요체 in explanations, short labels and consistent speech levels. Instructions preserve names, brands, numbers, technical identifiers and schema field names/enums. These are appropriate generation constraints. The prompt's final language check is a model self-check, not an independent agent review of every future generated response.

## Final workflow screenshot review

Reviewed 20 current E2E captures across English and Korean: input, strategy, character, generated emojis, finishing touches, metadata selection, metadata results, and export. Coverage of the visual review included 390 px mobile and 1024 px desktop layouts, plus the Korean 1440 px input screen. Captures were read from `packages/web/test-results/design-accessibility-redes-0e098-68-and-1024-pixel-viewports-chromium/`, `design-accessibility-redes-30a3d-68-and-1024-pixel-viewports-chromium/`, and the matching English/Korean locale-detection output folders.

**Language/content decision: PASS for English and Korean.** Headings, action labels, metadata language names, metadata option labels, selected states, expert names, platform descriptions and export actions display the approved, natural wording. Neutral completed-generation headings are present. Mobile metadata and export controls fit without text clipping or horizontal overflow in the inspected captures. English titles and descriptions inside Korean generation-result cards are supplied mock response content, not untranslated interface strings; these captures cannot assess live model output quality.

**Minor layout finding reported to implementation:** at 390 px, the English mobile stepper breaks `Character` between `Characte` and `r`. The wording itself remains approved; a layout adjustment to keep the word together is recommended. The Korean stepper labels fit. No catalog change was requested by this finding. Workflow screenshots also intentionally exercise keyboard focus; the visible skip-to-workspace badge in the strategy capture is that focus state, not stray text.

This review did not rerun E2E tests or modify production source. The implementation agent separately reported 107 passing E2E cases. Functional source branch coverage and the earlier 100% goal are outside the linguistic approval and are not certified by this PASS.

## Compact English navigation revision

Reviewed and approved `stepper.strategyShort = Plan` and `stepper.characterShort = Design` for narrow navigation. **PASS for adoption.** `Plan` naturally summarizes the creative strategy step; `Design` identifies the character design stage within this ordered creation workflow. Both are brief, familiar English nouns suitable for navigation. Full labels remain `AI strategy` and `Character`, and the page headings retain their more specific descriptions. This replaces the earlier short labels to prevent splitting a word across lines at 320–390 px. The implementation agent will apply the accompanying padding and word-break adjustment; this language review changes only the approved English candidate and report.
