# Chinese locale naturalness review

Reviewed: 2026-09-23. Reviewer: dedicated Chinese localization AI agent, separate from implementation agent. Scope: every string in the English draft contract (254 leaf strings per locale), covering all seven workflow stages, settings, language selection, accessible names, expert roles, platform descriptions, and metadata option names.

## Decisions

| Locale | Decision | Keys reviewed | SHA-256 of approved JSON |
| --- | --- | --- | --- |
| zh-CN | **PASS** | 254/254 | `779b41f5128ebc47f67f2436e741e9608314f37b6358db012c0d2aa04c772625` |
| zh-TW | **PASS** | 254/254 | `95a28021697bf59ffca2fce934a92399d5cf29e5e7e419f3c3dfddaeaa8036a7` |

**Adoption gate:** Both named files are approved for implementation. No production locale file was changed by this reviewer. Changes to these strings after adoption should be reviewed again. These are AI language-review decisions, not claims of review by human native speakers or professional translators.

## Method and evidence

1. Read the complete English contract and both existing Chinese locale files.
2. Read the input and post-processing components to verify upload guidance, selected image counts, and action timing.
3. Rewrite each locale as a distinct regional text, rather than converting Simplified characters to Traditional characters.
4. Review all 254 strings in each locale for grammar, word order, familiar product language, imperative button wording, consistency across screen and accessible names, and correct variable placement.
5. Parse the resulting JSON files and compare all leaf key paths and interpolation-variable multisets against the English contract. Both files contain exactly 254 keys, no missing or extra keys, no empty strings, and identical variable names/counts to the contract.

## Regional wording decisions

| Context | Simplified Chinese | Traditional Chinese (Taiwan) | Reason |
| --- | --- | --- | --- |
| Product/collection | 表情包 / 表情 | 貼圖 / 一組貼圖 | Normal creator/chat vocabulary for each audience |
| Save/settings/export | 保存 / 设置 / 导出 | 儲存 / 設定 / 匯出 | Distinct regional software terminology |
| API credentials | 密钥 | 金鑰 | Conventional local security/UI vocabulary |
| Image quality | 高分辨率 | 高解析度 | Regional technical term |
| Remove background | 去除背景 | 去背 | Taiwan creators commonly understand 去背 directly |
| Outline | 描边 | 外框 | Familiar editing controls, consistent within each locale |
| Clipboard/loading | 剪贴板 / 加载 | 剪貼簿 / 載入 | Distinct regional interface terms |
| Language names | 英语 / 韩语 / 日语 | 英文 / 韓文 / 日文 | Familiar local language-selector labels |
| Placeholder personality | 爱嗑瓜子、爱打游戏 | 愛嗑瓜子、愛打電動 | Local colloquial voice, not character conversion |
| Metadata | 发布信息 | 上架資訊 | Plain creator-facing language, defined as title, description, tags in introductory copy |
| LINE formats | LINE 贴纸 / LINE 表情 | LINE 貼圖 / LINE 表情貼 | Preserve distinction between the two export types |

## Before-and-after examples

- Existing Simplified `开始制作表情贴套装` → `制作你的表情包`: removes an unnatural compound and names a familiar artifact.
- Existing Traditional `開始製作表情貼套組` → `製作你的專屬貼圖`: uses Taiwan terminology and a natural direct invitation.
- Existing mixed English `Key Visual` → `角色原图 / 角色原圖`: identifies the character source image used for the subsequent generated set.
- Existing Traditional `AI Metadata 生成器` with conflicting `中繼資料` elsewhere → consistent `用 AI 生成上架資訊`; subtitle defines actual outputs (`標題、說明和標籤`).
- Existing `自动且一致地生成套装中的…` → `正在生成 {{count}} 张风格统一的表情图片…`: natural modifier order and correct image classifier.
- Existing repeated metaphor `每一个表情，都是更多的表达。` → `用一个个表情，让聊天更有趣。`; Traditional independently uses `用一張張貼圖，讓聊天更有趣。`.
- English `Export Selected Platforms` → `按所选平台分别导出 / 依所選平台分別匯出`, contrasted with combined ZIP action using clear outcomes.

## Accuracy and consistency checks

- The supported language list contains exactly English, Korean, Japanese, Simplified Chinese, and Traditional Chinese. Collection copy says five languages.
- Brand and identifiers preserved: Awesome Emoji Studio, Gemini, AI, API, ZIP, PNG, JPG, WEBP, LINE, OGQ Market, KakaoTalk, Telegram. The API-key placeholder remains `AIza...`.
- Upload copy no longer claims an enforced 10 MB limit or ZIP extraction. The dormant uploader label describes multiple image uploads only.
- Post-processing count uses future tense (`将应用于 / 將套用至`) because the component applies settings in the next step. The English draft's past tense should be corrected by the English reviewer.
- Character counts use 字符 in Simplified and 字元 in Traditional; count variables are preserved. Image quantities consistently use 张 / 張.
- Accessible labels localize actions, status, step numbers, selected state, and dynamic placeholders. Screen-reader percentage labels use a spoken phrase (`百分之 {{count}}`).
- No publication or direct platform-upload action is claimed; export buttons describe local export/download behavior. Metadata labels refer to the information prepared for publication.
- The terminal sticker heading is neutral (`表情生成结果 / 貼圖生成結果`) because generation can finish with failed images. It does not claim success merely because all jobs stopped.
- Error messages identify the issue without assigning blame and use actionable, short language.
- Tone consistently addresses the user as 你 rather than mixing 你 and 您.

## Limits and required implementation checks

This is a dedicated AI linguistic review, not human native-speaker signoff. It confirms the wording in these files; browser rendering, truncation, font coverage, locale detection, persisted overrides, and E2E behavior must be verified by the implementation agent after adoption. Runtime content returned by Gemini can vary; these approved interface translations do not certify arbitrary generated model output. Traditional Chinese intentionally follows Taiwan usage; it is not a separate Hong Kong/Cantonese localization.
