<div align="center">

# Awesome Emoji Studio

**一个角色，装下所有心情。**

用 Gemini，把灵感变成一套表情包。

[**立即体验 ↗**](https://awesome-emoji-studio.vercel.app) · [获取 Gemini API 密钥](https://aistudio.google.com/apikey)

[English](README.md) · [한국어](README.ko.md) · [日本語](README.ja.md) · **简体中文** · [繁體中文](README.zh-TW.md)

</div>

![Awesome Emoji Studio：角色创作界面与丰富的表情图片](docs/readme/showcase.png)

<p align="center"><sub>真实应用界面，展示图片为模拟示例。</sub></p>

## 从灵感到表情包

- **让角色有戏。** 设计角色，生成 45 张表情图。
- **调出你的风格。** 逐张优化图片、去除背景、添加描边。
- **打包带走。** 生成 5 种语言的标题和标签，以 6 种平台格式导出 ZIP，适配 LINE、KakaoTalk、Telegram 和 OGQ。

**浏览器里就能用，也支持桌面运行。** 无需搭建后端。使用你自己的 Gemini API 密钥，AI 请求直接发送给 Google；图片后处理和 ZIP 打包在本地完成。

## 本地运行

需要 Node.js 22.12+ 和 npm。

```bash
git clone https://github.com/MJbae/awesome-emoji-studio.git
cd awesome-emoji-studio
npm install
npm run dev:web
```

桌面版请改用 `npm run dev:electron`，然后在应用中填入 Gemini API 密钥。

[开发指南](docs/development.md) · [设计画廊](docs/process-design/README.md) · [语言审校记录](docs/localization/README.md)

---

**让灵感有表情。** 如果这个项目给了你新点子，点颗 ⭐ 收藏，下次更好找。
