<div align="center">

# Awesome Emoji Studio

**ひとつのキャラクターに、いろんな表情を。**

Geminiで、アイデアをスタンプセットに。

[**今すぐ試す ↗**](https://awesome-emoji-studio.vercel.app) · [Gemini APIキーを取得](https://aistudio.google.com/apikey)

[English](README.md) · [한국어](README.ko.md) · **日本語** · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md)

</div>

![Awesome Emoji Studio：キャラクター作成画面と表情豊かなスタンプの作例](docs/readme/showcase.png)

<p align="center"><sub>実際のアプリ画面。イラストは表示用のサンプルです。</sub></p>

## アイデアから、伝わる表情へ

- **いろんな気持ちを、ひとつのセットに。** キャラクターを考え、45種類の表情をまとめて生成。
- **こだわりを形に。** 画像を1枚ずつ調整し、背景を透過して、縁取りを追加できます。
- **まとめて書き出し。** タイトルとタグを5言語で生成。LINE・KakaoTalk・Telegram・OGQ向けの6形式でZIPを書き出せます。

**ブラウザでも、デスクトップでも。** バックエンドの構築は不要です。ご自身のGemini APIキーをご用意ください。AIへのリクエストはGoogleに直接送信され、画像の後処理とZIP作成はお使いの端末内で行われます。

## ローカルで起動

Node.js 22.12以上とnpmを用意してください。

```bash
git clone https://github.com/MJbae/awesome-emoji-studio.git
cd awesome-emoji-studio
npm install
npm run dev:web
```

デスクトップ版は、代わりに`npm run dev:electron`で起動します。アプリ内でGemini APIキーを設定してください。

[開発ガイド](docs/development.md) · [デザインギャラリー](docs/process-design/README.md) · [各言語のレビュー](docs/localization/README.md)

---

**あなたらしい表情を、作ろう。** 気に入ったら、⭐でブックマークして、また遊びに来てください。
