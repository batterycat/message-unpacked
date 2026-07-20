# Message, Unpacked.｜訊息拆解所

繁體中文 · [English](README.md)

**訊息拆解所**是一個靜態優先、開放原始碼的防詐教育網站，讓學生在採取
行動前，練習拆解可疑或資訊不足的簡訊、聊天訊息與 Email。教師不必建立帳號
或名單，就能產生活動連結與 QR Code。

[立即體驗](https://batterycat.github.io/message-unpacked/) ·
[開啟教師手冊](https://batterycat.gitbook.io/message-unpacked-docs/) ·
[教師快速開課](https://batterycat.github.io/message-unpacked/zh-TW/teacher/)

![Message, Unpacked. 學習體驗](public/assets/hero-message-check.png)

## 現有內容

- 72 則已審閱繁體中文案例，涵蓋臺灣五個學習階段。
- 簡訊、聊天與 Email 畫面，以及可信、詐騙、資訊不足三種判斷。
- 學生自主練習與教師投影帶領兩種模式。
- 帶內容版本的活動連結與瀏覽器端 QR Code。
- 每題得分說明、最終學習成果、真實案例來源及具限定語的影響資料。
- 作答解析後顯示各語系的官方查證與諮詢資源。
- 中英文介面架構完整；英文題目待人工審閱翻譯後再發布。

目前正式範圍請見 [產品規格](docs/PRODUCT_SPEC.md)，程式與資料邊界請見
[架構文件](docs/ARCHITECTURE.md)。

## 本機執行

需要 Node.js 22.12 以上與 pnpm 11。

```bash
pnpm install --frozen-lockfile
pnpm dev
```

送出 Pull Request 前請執行：

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm schema:check
pnpm validate:content
pnpm test
pnpm license:check
pnpm build
pnpm test:e2e
pnpm build:subpath
pnpm check:subpath
```

## 參與維護

請先閱讀 [貢獻指南](CONTRIBUTING.md)與[專案憲法](CONSTITUTION.md)。新增題目
請從 [`content/cases/_template.yaml`](content/cases/_template.yaml) 開始，並依照
[題目編寫規範](docs/CONTENT_AUTHORING.md)及
[案例審閱清單](docs/CASE_REVIEW_CHECKLIST.md)進行。

所有外部套件、來源、引文、資料集、Action 或媒體素材，都必須先登錄於
[第三方資源清冊](docs/THIRD_PARTY_RESOURCES.md)。安全問題請依
[SECURITY.md](SECURITY.md)私下通報；社群互動遵循
[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)。

## 部署與使用範圍

第一階段部署於 GitHub Pages。未來的即時教室 room 與 Go 地端單一執行檔是
獨立適配器，不會成為靜態學習核心的必要條件。詳見
[部署說明](docs/DEPLOYMENT.md)及[使用範圍與隱私](docs/USAGE_AND_PRIVACY.md)。

## 授權

- 程式碼：[Apache-2.0](LICENSE)
- 原創教育內容：[CC BY-SA 4.0](LICENSE-CONTENT.md)
- 外部資源：依各自條款，並記錄於第三方資源清冊
