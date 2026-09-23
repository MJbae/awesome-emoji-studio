# Japanese UI language validation

Result: **PASS — approved for implementation**, subject to the separate rendered UI check.

Reviewer: designated independent Japanese language validation AI agent. This is an AI language review; it is not a native human review or a guarantee about generated model outputs.

## Scope and method

Every string in the approved English contract was read against the existing Japanese locale and the seven-stage creative app context. Reviewed the Input, Strategy, PostProcess, and Metadata components to establish count units, labels, ordering, preview behavior, and output choices. All 254 Japanese leaf keys were reviewed for meaning, idiomatic wording, user action clarity, terminology, sentence endings, and placeholder preservation. No production source files were edited by the reviewer.

The approved draft is `ja-approved.json`. It preserves the English draft's key and interpolation contracts, localizes every UI/a11y/persona/platform/option label, and only keeps brand names and established format/technical abbreviations in Latin characters. The device-language wording follows the final root contract: saved manual choice, browser/device preference, English fallback. It makes no country/IP-detection claim.

## Consistency decisions

- The seven stages use コンセプト入力 / AIの分析 / キャラクター / 絵文字 / 仕上げ / メタデータ / 書き出し. English “Key Visual” and abbreviated メタ were removed.
- General outputs are 絵文字; each service's sticker product is スタンプ, including LINEスタンプ. LINE絵文字 stays distinct.
- メタデータ stays consistent in navigation and actions; its explanatory copy explicitly says タイトル・説明文・タグ so new users can understand it.
- Headers invite the user with 作ろう / 仕上げよう. Guidance uses polite です・ます / ください / しましょう. Compact buttons use natural action labels. There is no accidental mix of command forms or honorific levels.
- Images are counted with 枚, emoji items with 個, file formats with 種類. Placeholders keep the original tokens without changing number behavior.
- “Post-process” becomes 仕上げ and “outline” becomes 縁取り; 書き出し is used consistently for export. These fit Japanese image creation tools.
- Awesome Emoji Studio, Google Gemini, Gemini, LINE, KakaoTalk, OGQ, Telegram, API, AI, ZIP, PNG, JPG, WEBP and the API-key example remain unchanged intentionally.
- Removed claims of a 10 MB limit and ZIP extraction because those behaviors do not exist in the inspected upload handlers. Corrected six languages to five.
- `export.readyCount` describes selected output formats, matching the selectedCount value actually displayed by the component.

## Representative corrections

| Key | Previous Japanese | Approved Japanese | Reason |
| --- | --- | --- | --- |
| `input.title` | 絵文字セットの開始 | 絵文字セットを作ろう | Natural invitation instead of a literal noun phrase. |
| `input.referenceImage` | 参考画像（オプション） | 参考画像（任意） | Standard Japanese form wording for optional input. |
| `input.imageReqs` | PNG, JPG 最大10MB | PNG、JPG、WEBPなどの画像ファイル | Removes an unsupported file size claim. |
| `strategy.analyzing` | コンセプト戦略分析中 | コンセプトを分析中 | Removes an unnatural compound noun. |
| `strategy.panel` | AI専門家パネル | AIの専門家チーム | Makes the simulated specialist team understandable. |
| `stepper.character` | Key Visual | キャラクター | Localizes the English label and matches the actual character asset. |
| `stickers.generatingDesc` | セットの {{count}} 個の絵文字を自動で一貫して生成しています... | キャラクターの特徴をそろえて、{{count}}個の絵文字を生成しています… | Expresses consistency as preserving character traits. |
| `postprocess.outlineWhite` | 白アウトライン | 白い縁取り | Uses standard Japanese image editing wording. |
| `fileUpload.noValidImages` | 有効な画像がありません。PNG、JPG、WEBPまたはZIPをアップロードしてください。 | 対応する画像が見つかりません。画像ファイルを選んでください。 | Removes the unsupported ZIP option. |
| `fileUpload.autoExtractZip` | ZIP自動展開 | 複数の画像をまとめてアップロード | Describes actual multiple-image upload functionality. |
| `metadata.title` | AIメタデータジェネレーター | AIでメタデータを作ろう | Replaces a literal English loanword construction with an action. |
| `metadata.seo` | SEO | 見つけやすさ | Explains the actual searchability score. |
| `export.exportCombined` | 統合 ZIP エクスポート | 1つのZIPにまとめて書き出す | Makes the single ZIP behavior explicit. |
| `export.readyCount` | {{count}} プラットフォーム準備完了 | {{count}}種類の書き出し形式を選択中 | Describes selected output formats without awkward syntax. |
| `studio.poweredBy` | Powered by Gemini | Gemini搭載 | Removes untranslated English marketing copy. |
| `studio.previewTitle` | 小さなキャラクター。大きな個性。 | 小さなキャラクターに、たっぷりの個性を。 | Recasts English parallel wording into a natural Japanese phrase. |
| `studio.includesLanguages` | 6言語のメタデータ | 5言語のメタデータ | Corrects the supported-language count. |

## Contract verification

- JSON parsed successfully; 254/254 leaf keys present; no missing or extra keys.
- All 22 strings containing interpolation tokens match the English token names and multiplicities exactly.
- Every value is a nonempty string.
- Latin text audit found only the intentional brands, API-key example, and technical/format abbreviations listed above.
- Approved JSON SHA-256: `d2a03f51bd1cbaca462ebaf4dc4cc92023aeb1cdba43258ac60869d4b55c83d1`.

## Exhaustive review register

Each row below was reviewed for semantic accuracy and natural Japanese UI usage. “PASS” refers to copy approval, not rendered layout or the quality of live AI-generated content.

| Key | Approved text | Review |
| --- | --- | --- |
| `app.title` | Awesome Emoji Studio | PASS |
| `app.apiConnected` | API接続済み | PASS |
| `app.apiMissing` | APIキー未設定 | PASS |
| `app.analysisFailed` | 分析に失敗しました | PASS |
| `app.charGenFailed` | キャラクターの生成に失敗しました | PASS |
| `app.noImageToExport` | 書き出す画像がありません | PASS |
| `app.exportFailed` | 書き出しに失敗しました | PASS |
| `stepper.input` | コンセプト入力 | PASS |
| `stepper.inputShort` | 入力 | PASS |
| `stepper.strategy` | AIの分析 | PASS |
| `stepper.strategyShort` | 分析 | PASS |
| `stepper.character` | キャラクター | PASS |
| `stepper.characterShort` | キャラ | PASS |
| `stepper.stickers` | 絵文字 | PASS |
| `stepper.stickersShort` | 絵文字 | PASS |
| `stepper.postprocess` | 仕上げ | PASS |
| `stepper.postprocessShort` | 仕上げ | PASS |
| `stepper.metadata` | メタデータ | PASS |
| `stepper.metadataShort` | 情報 | PASS |
| `stepper.export` | 書き出し | PASS |
| `stepper.exportShort` | 書き出し | PASS |
| `input.step1` | ステップ1 | PASS |
| `input.title` | 絵文字セットを作ろう | PASS |
| `input.subtitle` | どんなキャラクターを作りたいか教えてください。AIがアイデアを形にします。 | PASS |
| `input.conceptLabel` | キャラクターのコンセプト | PASS |
| `input.conceptPlaceholder` | 例：ひまわりの種とゲームが大好きな、ぽっちゃりしたかわいいハムスター | PASS |
| `input.charsNeeded` | あと{{count}}文字入力してください | PASS |
| `input.charsCount` | {{count}}文字 | PASS |
| `input.targetMarket` | 対象の言語・地域 | PASS |
| `input.referenceImage` | 参考画像（任意） | PASS |
| `input.upload` | 画像を選択 | PASS |
| `input.orDrag` | またはここにドラッグ | PASS |
| `input.imageReqs` | PNG、JPG、WEBPなどの画像ファイル | PASS |
| `input.clickToChange` | 選択して画像を変更 | PASS |
| `input.useAsBase` | 参考画像をそのままキャラクターに使う | PASS |
| `input.skipCharGen` | AIによるキャラクター生成を省き、アップロードした画像を使います。 | PASS |
| `input.analyzeConcept` | コンセプトを分析 → | PASS |
| `strategy.analyzing` | コンセプトを分析中 | PASS |
| `strategy.analyzingDesc` | AIの専門家チームがコンセプトを分析しています… | PASS |
| `strategy.retryAnalysis` | もう一度分析 | PASS |
| `strategy.back` | 戻る | PASS |
| `strategy.panel` | AIの専門家チーム | PASS |
| `strategy.title` | 絵文字の制作プラン | PASS |
| `strategy.subtitle` | AIが提案した絵文字セットの制作プランを確認しましょう。 | PASS |
| `strategy.culturalNotes` | 文化・習慣への配慮 | PASS |
| `strategy.salesReasoning` | 販売戦略 | PASS |
| `strategy.expertInsights` | 専門家からのアドバイス | PASS |
| `strategy.clickForDetails` | 詳細を見る | PASS |
| `strategy.next` | 次へ → | PASS |
| `character.step3` | ステップ3 | PASS |
| `character.designing` | キャラクターを生成中 | PASS |
| `character.designingDesc` | AIの制作プランをもとにキャラクターを生成しています。 | PASS |
| `character.title` | キャラクターを作ろう | PASS |
| `character.subtitle` | 生成されたキャラクターを確認しましょう。 | PASS |
| `character.generatedChar` | 生成されたキャラクター | PASS |
| `character.regenerate` | 再生成 | PASS |
| `character.retry` | もう一度試す | PASS |
| `character.notGeneratedYet` | 画像はまだ生成されていません | PASS |
| `character.charInfo` | キャラクターの設定 | PASS |
| `character.physicalDesc` | 外見 | PASS |
| `character.facialFeatures` | 顔の特徴 | PASS |
| `character.colorPalette` | カラーパレット | PASS |
| `character.distinguishingFeatures` | 特徴的なポイント | PASS |
| `character.artStyle` | 絵柄 | PASS |
| `character.expandDetails` | 詳細を表示 | PASS |
| `character.toEmojiGen` | 絵文字の生成へ → | PASS |
| `stickers.generating` | 絵文字を自動生成中 | PASS |
| `stickers.generatingDesc` | キャラクターの特徴をそろえて、{{count}}個の絵文字を生成しています… | PASS |
| `stickers.generatingTitle` | 絵文字セットを生成中 | PASS |
| `stickers.processing` | 処理中… {{done}} / {{total}} | PASS |
| `stickers.completed` | 生成完了：成功{{done}}個、失敗{{error}}個 | PASS |
| `stickers.regenPrompt` | 生成の指示文 | PASS |
| `stickers.cancel` | キャンセル | PASS |
| `stickers.saveAndRegen` | 保存して再生成 | PASS |
| `stickers.completeTitle` | 絵文字の生成結果 | PASS |
| `postprocess.step5` | 仕上げ | PASS |
| `postprocess.title` | 絵文字を仕上げよう | PASS |
| `postprocess.subtitle` | 仕上げの設定を調整しましょう。次のステップに進むと、設定が自動で適用されます。 | PASS |
| `postprocess.applyCount` | {{count}}枚の画像に適用します。 | PASS |
| `postprocess.livePreview` | 仕上がりプレビュー | PASS |
| `postprocess.selectImage` | プレビューする画像を選んでください | PASS |
| `postprocess.cleanup` | 自動補正 | PASS |
| `postprocess.removeBg` | 背景を削除 | PASS |
| `postprocess.removeBgDesc` | 画像の背景を自動で削除します。 | PASS |
| `postprocess.outlineEffect` | 縁取り | PASS |
| `postprocess.enableOutline` | 縁取りを付ける | PASS |
| `postprocess.style` | スタイル | PASS |
| `postprocess.outlineWhite` | 白い縁取り | PASS |
| `postprocess.outlineBlack` | 黒い縁取り | PASS |
| `postprocess.thickness` | 太さ | PASS |
| `postprocess.opacity` | 不透明度 | PASS |
| `fileUpload.label` | 絵文字の画像をアップロード | PASS |
| `fileUpload.noValidImages` | 対応する画像が見つかりません。画像ファイルを選んでください。 | PASS |
| `fileUpload.tooManyImages` | 画像の枚数が多すぎます。{{max}}枚まで選んでください。 | PASS |
| `fileUpload.processing` | ファイルを処理中… | PASS |
| `fileUpload.dragOrClick` | ここに画像をドラッグするか、クリックして選択 | PASS |
| `fileUpload.formatInfo` | 画像ファイルを一度に{{max}}枚まで | PASS |
| `fileUpload.autoExtractZip` | 複数の画像をまとめてアップロード | PASS |
| `fileUpload.highResSupport` | 高解像度の画像に対応 | PASS |
| `fileUpload.browserOnly` | ブラウザ内で処理 | PASS |
| `selectionGrid.selected` | 選択中： | PASS |
| `selectionGrid.selectAll` | すべて選択 | PASS |
| `selectionGrid.clear` | 選択を解除 | PASS |
| `metadata.generating` | メタデータを自動生成中 | PASS |
| `metadata.generatingDesc` | Geminiがタイトル・説明文・タグを生成しています… | PASS |
| `metadata.step6` | ステップ6 | PASS |
| `metadata.title` | AIでメタデータを作ろう | PASS |
| `metadata.subtitle` | 作成する言語を選んでください（複数選択可）。Geminiが絵文字を分析し、各言語に合ったタイトル・説明文・タグを作ります。 | PASS |
| `metadata.generate` | メタデータを生成 | PASS |
| `metadata.results` | 生成結果 | PASS |
| `metadata.selected` | 選択済み | PASS |
| `metadata.select` | 選択 | PASS |
| `metadata.titleLabel` | タイトル | PASS |
| `metadata.descLabel` | 説明文 | PASS |
| `metadata.tags` | タグ | PASS |
| `metadata.copied` | コピーしました | PASS |
| `metadata.copy` | コピー | PASS |
| `metadata.qualityScore` | 品質スコア | PASS |
| `metadata.naturalness` | 自然さ | PASS |
| `metadata.tone` | 文体 | PASS |
| `metadata.seo` | 見つけやすさ | PASS |
| `metadata.creativity` | 独創性 | PASS |
| `metadata.optionTypes.personality` | 個性重視 | PASS |
| `metadata.optionTypes.utility` | 日常向け | PASS |
| `metadata.optionTypes.creative` | アイデア重視 | PASS |
| `export.title` | 絵文字セットを書き出そう | PASS |
| `export.subtitle` | 公開先のサービスを選んで、絵文字セットをダウンロードしましょう。 | PASS |
| `export.selectPlatforms` | 公開先を選択 | PASS |
| `export.selectAll` | すべて選択 | PASS |
| `export.deselectAll` | すべて解除 | PASS |
| `export.exportSelected` | 選んだ公開先ごとに書き出す | PASS |
| `export.exportCombined` | 1つのZIPにまとめて書き出す | PASS |
| `export.exporting` | 書き出し中… | PASS |
| `export.exportProgress` | 書き出しの進行状況 | PASS |
| `export.exportComplete` | 書き出し完了 | PASS |
| `export.exportFailed` | 失敗 | PASS |
| `export.dimensions` | 画像サイズ | PASS |
| `export.format` | ファイル形式 | PASS |
| `export.mainImage` | メイン画像 | PASS |
| `export.tabImage` | タブ画像 | PASS |
| `export.maxSize` | ファイルサイズの上限 | PASS |
| `export.readyCount` | {{count}}種類の書き出し形式を選択中 | PASS |
| `export.categoryLine` | LINE | PASS |
| `export.categoryKakaotalk` | KakaoTalk | PASS |
| `export.categoryEtc` | その他 | PASS |
| `setup.apiTitle` | APIキーの設定 | PASS |
| `setup.apiSubtitle` | Google GeminiのAPIキーを入力してください | PASS |
| `setup.apiKeyLabel` | Gemini APIキー | PASS |
| `setup.apiKeyPlaceholder` | AIza... | PASS |
| `setup.showKey` | APIキーを表示 | PASS |
| `setup.hideKey` | APIキーを非表示 | PASS |
| `setup.keyStorageInfo` | APIキーはこの端末に保存され、Google Geminiへのリクエストにのみ使われます。 | PASS |
| `setup.keyIssue` | APIキーの取得先： | PASS |
| `setup.validating` | 確認中… | PASS |
| `setup.saveAndContinue` | 保存して続ける | PASS |
| `setup.minError` | APIキーは10文字以上で入力してください。 | PASS |
| `setup.invalidError` | APIキーが無効です。入力内容を確認してください。 | PASS |
| `studio.skipToContent` | 作業エリアへ移動 | PASS |
| `studio.brandTagline` | 小さなアイデアから、豊かな表現を。 | PASS |
| `studio.settings` | 設定 | PASS |
| `studio.workspace` | ワークスペース | PASS |
| `studio.sidebarTitle` | ひとつのセットを、いろいろな場所へ。 | PASS |
| `studio.sidebarDescription` | 人と人がつながる場所へ、あなたのキャラクターを届けよう。 | PASS |
| `studio.footer` | 絵文字ひとつで、気持ちがもっと伝わる。 | PASS |
| `studio.poweredBy` | Gemini搭載 | PASS |
| `studio.newCollection` | 新しいセット | PASS |
| `studio.required` | 必須 | PASS |
| `studio.madeOfIdeas` | アイデアをかたちに | PASS |
| `studio.previewTitle` | 小さなキャラクターに、たっぷりの個性を。 | PASS |
| `studio.previewDescription` | あなたのアイデアに表情を付けて、キャラクターの世界を広げよう。 | PASS |
| `studio.sampleAlt` | さまざまな表情をした4体のみかんのキャラクター | PASS |
| `studio.collectionIncludes` | 作成できるもの | PASS |
| `studio.includesImages` | 表情豊かな45個の絵文字 | PASS |
| `studio.includesLanguages` | 5言語のメタデータ | PASS |
| `studio.includesExports` | 6種類の書き出し形式 | PASS |
| `studio.exampleNote` | イラストは参考例です。あなただけのキャラクターを作りましょう。 | PASS |
| `language.interface` | 表示言語 | PASS |
| `language.autoDetected` | 端末の言語設定を使用 | PASS |
| `language.names.en` | 英語 | PASS |
| `language.names.ko` | 韓国語 | PASS |
| `language.names.ja` | 日本語 | PASS |
| `language.names.zh-CN` | 中国語（簡体字） | PASS |
| `language.names.zh-TW` | 中国語（繁体字） | PASS |
| `language.targetHint` | 生成する内容の言語と対象地域を選んでください。 | PASS |
| `a11y.home` | ホームへ移動 | PASS |
| `a11y.apiSettings` | API接続の設定 | PASS |
| `a11y.settings` | 設定を開く | PASS |
| `a11y.workflow` | 制作のステップ | PASS |
| `a11y.stage` | ステップ{{number}}：{{label}} | PASS |
| `a11y.closeModal` | ダイアログを閉じる | PASS |
| `a11y.concept` | キャラクターのコンセプトを入力 | PASS |
| `a11y.targetLanguage` | 生成する内容の言語 | PASS |
| `a11y.language` | 言語：{{language}} | PASS |
| `a11y.uploadReference` | 参考画像をアップロード | PASS |
| `a11y.referencePreview` | 参考画像のプレビュー | PASS |
| `a11y.analyze` | コンセプトを分析して次へ進む | PASS |
| `a11y.retryAnalysis` | もう一度分析する | PASS |
| `a11y.back` | 前に戻る | PASS |
| `a11y.continueCharacter` | キャラクターの生成へ進む | PASS |
| `a11y.insight` | {{persona}}からのアドバイス | PASS |
| `a11y.regenerateCharacter` | キャラクターを再生成 | PASS |
| `a11y.generatedCharacter` | 生成されたキャラクター | PASS |
| `a11y.retryCharacter` | キャラクターの生成をもう一度試す | PASS |
| `a11y.toggleCharacterDetails` | キャラクター設定の詳細を開閉 | PASS |
| `a11y.continueStickers` | 絵文字の生成へ進む | PASS |
| `a11y.generationProgress` | 絵文字の生成状況 | PASS |
| `a11y.continueProcessing` | 仕上げへ進む | PASS |
| `a11y.emojiGrid` | 絵文字の一覧 | PASS |
| `a11y.emoji` | 絵文字{{id}}：{{label}} | PASS |
| `a11y.regenerateEmoji` | 絵文字{{id}}を再生成 | PASS |
| `a11y.editEmoji` | 絵文字{{id}}の生成指示を編集 | PASS |
| `a11y.retryEmoji` | 絵文字{{id}}の生成をもう一度試す | PASS |
| `a11y.editPrompt` | 生成の指示文を編集 | PASS |
| `a11y.saveRegenerate` | 保存して再生成 | PASS |
| `a11y.previewBackground` | プレビューの背景色 | PASS |
| `a11y.whiteBackground` | 白い背景 | PASS |
| `a11y.blackBackground` | 黒い背景 | PASS |
| `a11y.processingPreview` | 仕上がりのプレビュー | PASS |
| `a11y.continueMetadata` | メタデータの作成へ進む | PASS |
| `a11y.outlineStyle` | 縁取りのスタイル：{{style}} | PASS |
| `a11y.outlineThickness` | 縁取りの太さ：{{count}}ピクセル | PASS |
| `a11y.outlineOpacity` | 縁取りの不透明度：{{count}}パーセント | PASS |
| `a11y.metadataLanguage` | メタデータを作成する言語を選択 | PASS |
| `a11y.metadataLanguages` | メタデータの言語 | PASS |
| `a11y.generateMetadata` | メタデータを生成 | PASS |
| `a11y.regenerateMetadata` | メタデータを再生成 | PASS |
| `a11y.continueExport` | 書き出しへ進む | PASS |
| `a11y.selectMetadata` | 「{{option}}」のメタデータを選択 | PASS |
| `a11y.copyTags` | タグをクリップボードにコピー | PASS |
| `a11y.exportSelected` | 選んだ公開先ごとに書き出す | PASS |
| `a11y.exportCombined` | 1つのZIPにまとめて書き出す | PASS |
| `a11y.exportProgress` | {{platform}}向けの書き出し状況 | PASS |
| `a11y.selectImages` | 仕上げる画像を選択 | PASS |
| `a11y.selectAllImages` | すべての画像を選択 | PASS |
| `a11y.clearSelection` | 選択を解除 | PASS |
| `a11y.imageSelectionGrid` | 選択できる画像の一覧 | PASS |
| `a11y.selectedImage` | {{name}}（選択済み） | PASS |
| `a11y.loading` | 読み込み中 | PASS |
| `personas.market` | 市場分析の専門家 | PASS |
| `personas.art` | アートディレクター | PASS |
| `personas.culture` | 文化の専門家 | PASS |
| `personas.chief` | 制作の統括責任者 | PASS |
| `platforms.ogq_sticker.label` | OGQスタンプ | PASS |
| `platforms.ogq_sticker.description` | OGQマーケット向けのスタンプ | PASS |
| `platforms.line_sticker.label` | LINEスタンプ | PASS |
| `platforms.line_sticker.description` | LINEで使えるスタンプセット | PASS |
| `platforms.line_emoji.label` | LINE絵文字 | PASS |
| `platforms.line_emoji.description` | LINEのトークで使える小さな絵文字 | PASS |
| `platforms.kakaotalk_emoticon.label` | KakaoTalkスタンプ | PASS |
| `platforms.kakaotalk_emoticon.description` | KakaoTalkで使える静止画のスタンプ | PASS |
| `platforms.kakaotalk_mini.label` | KakaoTalkミニスタンプ | PASS |
| `platforms.kakaotalk_mini.description` | KakaoTalkで使える小さな静止画スタンプ | PASS |
| `platforms.telegram_static.label` | Telegramスタンプ | PASS |
| `platforms.telegram_static.description` | Telegramで使える静止画のスタンプ | PASS |

## Limitations and follow-up

Static language approval is complete. Rendered Japanese desktop/mobile UI will be checked after integration for clipping, wrapping, untranslated labels, and consistency with screen context. API-generated titles, descriptions, prompts and error details are dynamic content outside this static locale approval; live service behavior and native-human linguistic certification are not claimed.

## Follow-up semantic correction

PASS: `stickers.completeTitle` is approved as **絵文字の生成結果**. The screen is also shown after partial or complete generation failure, so the neutral “generation results” heading accurately covers every terminal outcome. It replaces **絵文字セットができました**, which implied success. Reviewed before production adoption.

## Generated-copy instruction review

PASS: independently reviewed the Japanese branch and shared contract of `services/gemini/prompts/writingGuidance.ts`. Idiomatic contemporary Japanese, friendly です・ます explanations, concise labels, avoiding translated English syntax/formal business wording/forced slang, preserving names/numbers/JSON enums, and a final tone/idiom check are appropriate. This approves the instruction design; it does not claim that live Gemini outputs have been evaluated.

## Rendered input review and compact navigation labels

Japanese input was visually reviewed at 1440 px and 390 px after integration. Main copy, form labels, cards, descriptions, and actions are natural and readable; no horizontal overflow was found. The mobile step labels キャラクター and メタデータ wrapped their final characters onto a second line. Approved compact labels are **キャラ** and **情報**, respectively, for `stepper.characterShort` and `stepper.metadataShort` only. Full desktop labels remain キャラクター and メタデータ. Both shortened labels remain clear in the numbered creation workflow. Final rendered workflow review follows the complete E2E run.

## Final rendered verification

PASS: reviewed the final Japanese desktop/mobile workflow, including metadata results and export cards. The full browser suite passed 107/107 scenarios and checked the Japanese workflow at 320/390/768/1024 px. See `ja-ui-review.md` for screenshot locations, specific findings and mock/live-content limitations. Source branch coverage remains 79.88%; language and E2E scenario approval does not claim the 100% source gate is satisfied.
