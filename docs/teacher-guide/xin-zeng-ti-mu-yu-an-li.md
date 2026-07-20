# 新增題目與案例

這個專案把題目當成可獨立審閱、可持續更新的 YAML 資料。新增一題通常不需要修改 React 或 Astro 程式；完成資料檔、驗證與審閱，就能在教師端的題庫中使用。

## 1. 從模板開始

1. 複製 [`content/cases/_template.yaml`](../../content/cases/_template.yaml)，放在 `content/cases/`。
2. 使用小寫英數、點號或連字號建立穩定檔名，例如 `school-platform-notice.zh-TW.yaml`。
3. 每一題都要有唯一的 `id`。若是翻譯版本，使用相同的 `translationGroupId`，但給它自己的 `id`、`locale`、`contentVersion` 與審閱日期。

## 2. 先填學習定位

請只選適合的年級區段，不要為了增加曝光而全部勾選：

- `1-2`、`3-4`、`5-6`：低年級閱讀負荷與決策步驟要更簡短，涉及金錢、帳號或威脅時要明確引導找可信任的大人。
- `7-9`：目前第一版的主要對象，可加入多個線索與兩步驟查證。
- `10-12`：可處理較長訊息、跨平台驗證與更細的風險比較。

`learning.topicId` 是活動連結使用、不隨翻譯改變的分類 ID；`learning.topic` 是教師端看到的本地化名稱，細節放在 `contexts`。同時補上 `dimensions`、`readingLevel`、`difficulty`、`skills`、`riskTypes`、`sensitiveContent` 與 `trustedAdultRecommended`，讓未來的分級與搜尋有可靠資料。

## 3. 編寫安全的情境

- `provenance.kind` 請如實選擇 `classic-pattern`、`fictional`、`documented` 或 `composite`。
- `documented` 與 `composite` 必須有 `sources` 和有來源支持的 `impact`；數字加上限定語，查不到的損失或人數保留未知。
- 只改寫事實，不複製新聞原文、截圖、照片或品牌素材；來源與授權請同步登錄 [第三方資源清冊](../THIRD_PARTY_RESOURCES.md)。
- 訊息中的姓名、帳號、電話與網址都要虛構或移除；網址請使用 `example.com` 等保留網域，避免把學生帶到可疑網站。
- 目前 schema 會自動套用 `anti-fraud.online-report` 與 `anti-fraud.consult`，題目 YAML 不必也不應重複這個欄位或官方網址。中英文使用相同 ID，由各語系資源檔提供在地化網站；未來若要增加其他資源，請先更新憲法、規格、驗證與資源清冊。

訊息、線索、選項與解析要讓學生練習「怎麼查證」：安全選項不只是說「這是詐騙」，也要說明停止操作、從既有入口確認、詢問可信任的大人，以及必要時如何求助或通報。

## 4. 送出前檢查

在專案根目錄執行：

```bash
pnpm schema:check
pnpm validate:content
pnpm test
pnpm format:check
```

若修改了 schema，先執行 `pnpm schema:generate`。也請依照 [`CASE_REVIEW_CHECKLIST.md`](../CASE_REVIEW_CHECKLIST.md) 檢查事實來源、兒少安全、閱讀負荷、鍵盤與手機版呈現。

## 5. Pull request 審閱流程

Pull request 請說明題目的教學目標、適用年級、來源與是否為真實案例。至少讓另一位熟悉兒少教育或該事件的人複核 documented/composite 案例；維護者確認內容驗證、來源授權與介面測試通過後，才把 `status` 改成 `published`。題目內容的新增與修訂應保持在 `content/cases/`，不要為了加題目直接改動應用程式碼。
