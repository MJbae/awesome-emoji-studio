<div align="center">

# Awesome Emoji Studio

**一個角色，演出各種心情。**

讓 Gemini 把你的靈感變成一整組貼圖。

[**馬上試試 ↗**](https://awesome-emoji-studio.vercel.app) · [取得 Gemini API 金鑰](https://aistudio.google.com/apikey)

[English](README.md) · [한국어](README.ko.md) · [日本語](README.ja.md) · [简体中文](README.zh-CN.md) · **繁體中文**

</div>

![Awesome Emoji Studio：角色創作介面與生動的貼圖](docs/readme/showcase.png)

<p align="center"><sub>實際應用程式介面，畫面中的貼圖為模擬範例。</sub></p>

## 從靈感到貼圖

- **讓角色表情滿滿。** 設計角色，產生一組 45 種表情的貼圖。
- **做出你的風格。** 逐張調整圖片、去背、加上外框。
- **打包帶走。** 產生 5 種語言的標題與標籤，以 6 種平台格式匯出 ZIP，支援 LINE、KakaoTalk、Telegram 和 OGQ。

**開啟瀏覽器就能用，也能在桌面執行。** 不用架設後端。使用自己的 Gemini API 金鑰，AI 請求會直接傳送給 Google；圖片後製與 ZIP 打包都在本機完成。

## 在本機執行

需要 Node.js 22.12+ 與 npm。

```bash
git clone https://github.com/MJbae/awesome-emoji-studio.git
cd awesome-emoji-studio
npm install
npm run dev:web
```

桌面版請改用 `npm run dev:electron`，再到應用程式中填入 Gemini API 金鑰。

[開發指南](docs/development.md) · [設計展示](docs/process-design/README.md) · [語言審閱紀錄](docs/localization/README.md)

---

**把心情畫成表情。** 如果這個專案讓你冒出點子，點顆 ⭐，下次就能輕鬆找到。
