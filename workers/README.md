# Cloudflare Durable Objects room prototype

這是第二階段的同步服務骨架。每個 `/rooms/{roomName}` 對應一個
Durable Object instance，提供教師投影與學生裝置之間的即時訊息交換。

## 目前提供

- WebSocket room：`GET /rooms/{roomName}`，room name 為 6–64 個英數、底線或
  連字號。
- `hello` 宣告 `teacher` 或 `student` 角色；每個 room 同時只接受一個教師
  連線。
- 教師可切換 `lobby`、`question`、`debrief` 階段。
- 學生只送出 `caseId` 與 `choiceId`，room 回傳匿名 tally，不保存姓名、裝置
  ID 或個別作答歷史。
- `ALLOWED_ORIGIN` 可限制瀏覽器 Origin；未設定時僅適合本機開發。

## 本地執行

需要先安裝開源的 Wrangler CLI，並登入 Cloudflare：

```bash
pnpm dlx wrangler dev --config workers/wrangler.toml
```

部署前設定 `ALLOWED_ORIGIN`，再執行：

```bash
pnpm dlx wrangler deploy --config workers/wrangler.toml
```

## 安全邊界

這一版是同步協定與 Durable Object adapter，不是公開課堂服務的完整身份驗證。
教師角色是 room 內的第一個 claim，沒有帳號、登入或持久化學生資料；正式公開
前仍需加入教師邀請碼／短期 token、速率限制、連線逾時與濫用監控的隱私審查。

第一階段靜態網站不依賴這個 Worker；沒有 room URL 時，原本的自主練習與投影
模式仍照常運作。前端接線應使用 `src/domain/room/protocol.ts` 的型別與驗證，
不要在 UI 重新定義訊息格式。
