# 維護與發布流程

這份文件是開源維護者的操作清單。程式碼、案例資料、授權紀錄與教師
手冊的來源分工如下：

- 程式碼、案例 YAML、測試與治理文件以 repository 為準。
- `docs/teacher-guide/` 是 GitBook 同步來源；GitBook 是教師閱讀介面。
- `docs/THIRD_PARTY_RESOURCES.md` 是外部軟體、來源、媒體與服務的登錄簿。
- `CONSTITUTION.md` 是所有內容與程式變更的不可違反規則。

## 新增或更新案例

1. 先建立 Issue，說明手法、適用年級、學習目標與預計來源；不要貼真實
   個資、可用的詐騙網址或完整受版權保護的訊息截圖。
2. 依 `docs/CONTENT_AUTHORING.md` 與 `docs/CASE_REVIEW_CHECKLIST.md` 建立
   `content/cases/` YAML。真實事件必須使用可追溯來源、合格的影響數字與
   review date。
3. 執行 `pnpm schema:check`、`pnpm validate:content`、`pnpm test`，並在
   PR 描述中列出來源、授權與敏感內容處理。
4. 至少由一位熟悉國中教學現場的人員檢查措辭、難度、非羞辱性與討論引導；
   真實事件的數字與來源另外核對。
5. 合併前確認案例狀態為 `published`、外部資源已登錄，且沒有把來源原文
   或圖片誤當成 CC BY-SA 內容。

## 程式碼與依賴變更

- 新增依賴、GitHub Action、字型、圖示、圖片、資料集或引用前，先更新
  `docs/THIRD_PARTY_RESOURCES.md` 並完成授權檢查。
- PR 至少執行 `pnpm format:check`、`pnpm lint`、`pnpm typecheck`、
  `pnpm test`、`pnpm license:check` 與 `pnpm build`；介面變更再執行
  `pnpm test:e2e` 和 `pnpm test:a11y`。
- 不把 URL 中的 activity 設定當成秘密或權限；任何未來同步服務都要先
  另做威脅模型與隱私審查。

## GitBook 與靜態網站發布

1. 在 local 完成檢查後建立有意義的 commit。
2. 推送 `main` 後確認 GitHub Pages 的 `Deploy GitHub Pages` workflow 成功。
3. 確認 GitBook connector 已同步 `docs/teacher-guide/`，再用教師快速開課、
   學生自主練習與教師投影模式各走一次 smoke test。
4. 若文件來源與 GitBook 畫面不一致，以 repository 內容修正後重新同步；
   不直接在 GitBook 編輯而讓來源分叉。

## 漏洞回報與公開前檢查

- Repository administrator 必須啟用 GitHub Private vulnerability reporting；
  啟用後把正式私人表單連結寫入 `SECURITY.md`，每次發布前再確認仍可使用。
- 不接受公開 Issue 中的敏感漏洞、有效惡意網址、學生資料、憑證或可利用
  步驟；一律改用私人通報管道。
- 公開前再次檢查 `SECURITY.md`、`CONSTITUTION.md`、授權檔案與第三方登錄簿，
  並確認 Pages 與 GitBook 都是從已審查的 `main` revision 發布。

## 定期維護

- 新增案例或發現官方服務名稱、網址、電話變更時，立即更新 response
  resource registry 與第三方來源紀錄。
- 每次內容發布前重新檢查來源可取得性、review date、官方連結與案例影響
  敘述；缺少資料要顯示「公開資料未揭露」，不能補成零。
- 每次重大 UI 或依賴升級後，重新執行自動化 a11y，並安排 VoiceOver 與
  NVDA 的人工 smoke test。
