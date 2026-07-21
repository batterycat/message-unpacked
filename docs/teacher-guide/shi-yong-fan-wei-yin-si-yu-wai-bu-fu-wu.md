# 使用範圍、隱私與外部服務

這份說明用來界定 Message, Unpacked. 可以提供什麼協助；它不是正式的法律
意見。

## 教育用途

網站使用事先編寫、審閱的案例，讓學生練習判讀與查證習慣。網站不會替學生
判定一則真實訊息是真是假，也不能取代警方、法律、金融、輔導或校方專業人員
針對個案的判斷。

案例、損失資料、官方資源與處理程序可能更新。請留意案例中的來源與查核日期，
並以官方網站目前公告為準。

## 不要輸入真實訊息與個人資料

目前的靜態網站不要求學生姓名、帳號、電話、班級名單或真實對話。請不要把
真實訊息、可疑網址、密碼、驗證碼、付款資料或其他人的個資貼進 GitHub Issue、
題目檔案或課堂投影畫面。

自主練習與純靜態投影的作答與活動進度只存在目前的瀏覽器頁面，沒有由本專案
營運的作答資料庫或班級分析服務。

## 即時班級互動的資料

網站有設定可選的 room 服務時，學生分頁會取得一個隨機參與憑證。後端只保存
憑證摘要與目前這一題的答案，不收姓名、座號、Email、名單或學校帳號。作答中
教師只看到加入與已作答人數；揭曉後只顯示匿名分布，並刪除每位參與者的目前
答案，不建立跨題個人歷程、排名或成績。

教師結束 room 或達到設定期限後，會刪除作用中的 room 狀態。託管業者仍可能
依政策處理 IP 位址、瀏覽器資訊、服務紀錄、濫用訊號及備份／復原資料，因此
這不代表所有供應商備份都會立即完成實體刪除。

## GitHub Pages 與 GitBook

體驗網站使用 GitHub Pages，教師手冊使用 GitBook 發布。這些服務可能依各自
政策處理 IP 位址、瀏覽器資訊、開啟頁面、來源頁面與服務紀錄等基本技術資料：

- [GitHub Privacy Statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement)
- [GitBook Privacy Statement](https://gitbook.com/docs/policies/privacy-and-security/statement)
- [GitBook Cookie 說明](https://gitbook.com/docs/policies/privacy-and-security/statement/cookies)

GitBook 的搜尋、AI 助理或頁面評分功能，可能另外把讀者輸入的查詢、提示或
評分送到 GitBook。不要在這些控制項輸入真實訊息、個人資料、憑證或可疑網址。
本專案建議先關閉選用的 AI 助理與頁面評分，除非已另外確認課堂用途並更新
隱私說明。

可選的參考 room 服務使用 Cloudflare Workers 與 Durable Objects：

- [Cloudflare Privacy Policy](https://www.cloudflare.com/privacypolicy/)
- [Cloudflare Durable Objects 說明](https://developers.cloudflare.com/durable-objects/)

參考部署也會以暫時性的網路來源鍵做建房與加入流量限制，降低自動化濫用。
專案不把這個鍵寫進 room 資料或應用程式紀錄；網路與流量限制中繼資料仍由
Cloudflare 依其政策處理。

本專案不會從 GitHub Pages 或 GitBook 取得學生的逐題作答紀錄。未來若加入
分析、真實訊息判讀、帳號、名單、成績或持久作答紀錄，必須先完成新的隱私
審查與說明，才能公開使用。

## 外部連結與緊急情況

網站提供官方查證與求助連結，但不保證第三方服務隨時可用，也不代表對該網站
其他內容背書。離開本網站前，請確認機關名稱與網址。

若已涉及金錢、帳號、人身安全或可能的犯罪，應先停止對方要求的操作、保留現有
證據、告訴可信任的大人，並使用當下適合的正式管道。不要把教學題目的解析當成
緊急服務或個案法律判斷。

最後查核：2026-07-21。
