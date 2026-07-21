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
- 供 10–12 年級展示使用的已審閱英文案例，搭配美國在地官方查證與求助資源。
- 簡訊、聊天與 Email 畫面，以及可信、詐騙、資訊不足三種判斷。
- 學生自主練習與教師投影帶領兩種純靜態模式。
- 教師頁分開呈現靜態與即時模式；兩邊都會依 10／20／30 分鐘建議 2／4／6 題，
  並讓教師確認、增減或替換案例後再開始。
- 可選用的即時班級互動模式：教師投影完整題目，學生手機只顯示題號與選項。
- 帶內容版本的活動連結與瀏覽器端 QR Code。
- 每題得分說明、最終學習成果、真實案例來源及具限定語的影響資料。
- 作答解析後顯示各語系的官方查證與諮詢資源。
- 中英文介面架構完整；10–12 年級英文展示題目已發布，之後可獨立持續擴充。

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
pnpm worker:typecheck
pnpm schema:check
pnpm validate:content
pnpm test
pnpm test:worker
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
[SECURITY.md](SECURITY.md)使用 GitHub 私人漏洞表單通報；社群互動遵循
[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)。

## 部署與使用範圍

完整的純靜態體驗部署於 GitHub Pages；另提供 Cloudflare Durable Objects
短期教室 room 的可選參考後端，不會成為靜態學習核心的必要條件。專案公開
服務只作展示，學校可自行部署相容後端並調整人數、題數與房間時間。詳見
[連接或替換後端的操作步驟](docs/DEPLOYMENT.md#connect-a-compatible-classroom-backend)、
[部署說明](docs/DEPLOYMENT.md)及[使用範圍與隱私](docs/USAGE_AND_PRIVACY.md)。

## 授權

- 程式碼：[Apache-2.0](LICENSE)
- 原創教育內容：[CC BY-SA 4.0](CONTENT-LICENSE.md)
- 外部資源：依各自條款，並記錄於第三方資源清冊
