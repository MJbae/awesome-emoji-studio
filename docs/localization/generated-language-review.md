# Generated-content language guidance review

Reviewed: 2026-09-23. Scope: prompt contracts for the five supported target languages. This concerns generated text; interface locale and target content language remain separate choices.

## Decisions

- English and Korean guidance: PASS, independently reviewed by `/root/review_en_ko`.
- Japanese guidance: PASS, independently reviewed by `/root/review_ja`; its recommended LINE スタンプ/絵文字 distinction was added.
- Simplified Chinese guidance: PASS, reviewed by `/root/review_zh` for Simplified script, mainland wording, readable short prose, and avoiding forced slang.
- Traditional Chinese guidance: PASS, reviewed by `/root/review_zh` for Traditional script, Taiwan Mandarin wording, and the LINE 貼圖/表情貼 distinction.

## Applied behavior

All expert analysis responses, strategy culturalNotes/salesReasoning, extracted character descriptions, emoji labels/categories, metadata title/description/tags, and metadata reasoning now receive explicit instructions to use the selected language. Technical imagePrompt values remain English action keywords to preserve the image-generation contract. JSON field names, enum values, numeric values, color codes, and appropriate brand names are preserved.

A shared helper normalizes unsupported legacy target-language values to English. The character extraction API adds an optional third language argument with English as the backward-compatible default; the lower-level prompt builder adds an optional second argument. The generation pipeline passes the selected target language. App call sites are updated by the implementation agent.

Chinese locale instructions are independently written for mainland and Taiwan audiences. Taiwan cultural guidance no longer assumes every concept needs lucky/festival imagery. Metadata instructions also cover reasoning explanations, which previously had no explicit field-level language guidance.

## Verification

23 focused Vitest tests pass. Tests cover every supported language across expert prompts and real orchestration request builders (with a mocked Gemini client), unchanged schemas/enums, technical prompt language separation, optional argument compatibility, unsupported legacy fallback, and explicit regional Chinese wording/script even when an optional language list is empty. Focused ESLint and shared production TypeScript checks passed. No live API requests were made.

## Limits

These tests confirm request construction and routing, not actual Gemini output fluency or model quality. The prompt's instruction to check idiomatic language is a model self-check. It is not an independent reviewer agent for every future generated response. The independent language agents reviewed the shipping interface strings and generation instructions before adoption. Generated content can still vary, and this report makes no claim of human native-speaker review or a successful live API test.
