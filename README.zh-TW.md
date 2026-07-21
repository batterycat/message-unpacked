# Message, Unpacked.｜訊息拆解所

繁體中文 · [English](README.md)

**訊息拆解所**是一個靜態優先、開放原始碼的防詐教育網站，讓學生在採取
行動前，練習拆解可疑或資訊不足的簡訊、聊天訊息與 Email。教師不必建立帳號
或名單，就能產生活動連結與 QR Code。

[立即體驗](https://batterycat.github.io/message-unpacked/) ·
[開啟教師手冊](https://batterycat.gitbook.io/message-unpacked-docs/) ·
[教師快速開課](https://batterycat.github.io/message-unpacked/zh-TW/teacher/)

> 本專案使用 OpenAI Codex 與 GPT-5.6 sol/terra 完成架構、實作、測試、在地化與審查。
> [了解本專案如何負責任地使用 AI](#codex-與-gpt-56-的使用方式)。

![Message, Unpacked. 學習體驗](public/assets/hero-message-check.png)

## 現有內容

- **97 則已審閱案例**——72 則繁體中文涵蓋臺灣五個學習階段，另有 25 則供
  10–12 年級展示的英文案例，搭配美國在地官方資源；擴大使用前仍需由當地
  教育工作者審閱。
- **每題三種判斷**——可信、詐騙、資訊不足，以簡訊、聊天或 Email 呈現。
  第三種才是重點：練習辨認「還無法判斷」的時刻，而不是把每則訊息都當成詐騙。
- **兩種教學模式**——不需後端的學生自主與教師投影模式，另有可選用的即時
  班級互動：教師投影完整題目，學生手機只顯示題號與選項。
- **開始前由教師掌控**——學習階段、主題、10／20／30 分鐘長度，以及可增減
  替換的題目清單，兩種模式共用。
- **帶內容版本的活動連結與瀏覽器端 QR Code**，不需帳號、名單或蒐集學生資料。
- **附來源的作答解析**——得分說明、線索拆解、具限定語的真實案例影響資料，
  以及各語系的官方查證與諮詢資源。

目前正式範圍請見 [產品規格](docs/PRODUCT_SPEC.md)，程式與資料邊界請見
[架構文件](docs/ARCHITECTURE.md)。

## 本機執行

需要 Node.js 22.12 以上與 pnpm 11。

```bash
pnpm install --frozen-lockfile
pnpm dev
```

靜態學習體驗不需要後端即可完整使用。若要在本機測試選用的即時班級互動，請先在
一個終端機啟動 room service：

```bash
pnpm worker:dev --port 8787 \
  --var LIVE_ROOMS_ENABLED:true \
  --var ALLOWED_ORIGINS:http://127.0.0.1:4321
```

再於另一個終端機啟動網站：

```bash
PUBLIC_ROOM_SERVICE_URL=http://127.0.0.1:8787 pnpm dev
```

**不需要任何範例資料或初始化。** 完整題庫以 YAML 形式存放在
`content/cases/`，在 build 時驗證並打包。沒有資料庫、沒有 API key、
不需要建立帳號。

## 如何測試

```bash
pnpm check     # 一行跑完下列所有檢查
```

其中最關鍵的幾項：

| 指令                    | 驗證什麼                                                                                 |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| `pnpm validate:content` | 每則案例都能解析，並通過編輯規則——計分級距、分類一致性、覆蓋率、敏感內容標記與求助資源。 |
| `pnpm test`             | 單元與元件行為，包含計分與活動連結的契約。                                               |
| `pnpm test:worker`      | 即時教室協定在真實 Workers runtime 下的角色隔離、票證驗證與房間到期。                    |
| `pnpm test:e2e`         | 瀏覽器端完整流程。需先執行 `pnpm exec playwright install`，因此不含在 `pnpm check`。     |
| `pnpm test:a11y`        | 代表性頁面的自動無障礙檢查。                                                             |

`pnpm validate:content` 是比較特別的一項。本專案的主要風險在內容而非程式，
所以編輯決策被寫成 CI 檢查，而不是靠審閱時的記憶——規則與理由請見
[題目編寫規範](docs/CONTENT_AUTHORING.md)。

## Codex 與 GPT-5.6 的使用方式

**產品本身不執行任何模型。** 這是一個純靜態網站，沒有推論、沒有 API key，
執行時不依賴任何 AI 服務。Codex 與 GPT-5.6 是開發環境，依角色分工：

- **GPT-5.6 sol**——構想與架構設計。界定教學問題、決定「不依賴後端的學習核心」
  與「選用即時課堂服務」的 static-first 切分方式，以及題目 schema 的形狀。
- **GPT-5.6 terra**——依上述決策進行開發：元件、schema、測試、文件、在地化
  檢查與反覆的程式碼審查。

### Codex 加速了哪些工作

多數加速發生在「機械但規模大就容易出錯」的地方——從 Zod 契約產生 JSON
Schema、維持兩套語系目錄同步、撰寫 Durable Object 測試，以及為了一條規則
變更掃過 97 個 YAML 檔。一次橫跨整個題庫的計分校準，從一週縮短為一個下午。

它也是有用的對立讀者。請它反過來論證一則案例的問題，能挖出單一作者容易
忽略的狀況：懲罰正確判斷的選項、詐騙也寫得出來的「可信」訊號，以及一次
批次取代悄悄改壞了引用的警方新聞稿標題。

### 哪些由人決定

所有決定「學生學到什麼」的判斷，都由人做出並審閱，理由也寫下來而非空口聲明：

- 什麼構成決定性紅旗、什麼才算真正的資訊不足——見
  [題目編寫規範](docs/CONTENT_AUTHORING.md)
- 每個計分級距的意義，讓「只透露一部分」永遠不會比謹慎得分高
- 哪些情境適合哪個年段、哪些需要可信任的大人在場
- 引用來源是否真的支持文中的說法；每則 documented 案例都重新開啟原始網址
  逐行核對
- 不做什麼——不做帳號、排名、行為檔案與長期課堂紀錄

`pnpm validate:content` 裡的編輯規則就是用來固定這些決策，讓未來的貢獻者
或模型都無法悄悄偏離。

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
