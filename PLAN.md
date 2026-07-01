# YouTube 播放清單反轉擴充功能規劃

## 任務目標

開發一個可在 Zen 瀏覽器使用的瀏覽器擴充功能，讓使用者在 YouTube 播放清單頁面或播放清單播放頁面中，一鍵將目前播放清單的觀看順序反轉。

主要解決情境：

- 有些播放清單由最早影片排到最新影片。
- 使用者想從最新影片開始看，卻必須手動拉到清單最下方。
- 從最後一部開始播放時，YouTube 不會自然接續播放前面的影片。
- 目前缺少符合此需求、可直接使用的擴充功能。

## 可行性評估

### Zen 瀏覽器相容性

可行。Zen Browser 官方文件表示 Zen 基於 Mozilla Firefox，因此可從 Mozilla Add-ons 安裝 Firefox 擴充功能；Firefox 佈景主題不支援，但一般擴充功能屬於可用範圍。

參考來源：

- [Zen Browser Extensions documentation](https://docs.zen-browser.app/user-manual/extensions)
- [Mozilla MDN WebExtensions Content scripts](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/content_scripts)
- [Mozilla MDN WebExtensions Content scripts overview](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts)

因此本專案建議以 Firefox WebExtension 作為第一版目標，並盡量使用標準 WebExtension API，保留未來支援 Chrome / Edge 的可能性。

### 技術可行性

可行，但需要避開一個重要限制：YouTube 原生播放清單的真實播放順序不一定能透過修改畫面 DOM 直接改變。比較穩定的做法不是強行改 YouTube 內部播放器狀態，而是由擴充功能讀取目前播放清單中的影片連結，建立「反轉後的播放佇列」，再用導頁方式控制下一部影片。

第一版建議採用：

- 在 YouTube 播放清單區塊旁加入「反轉播放」按鈕。
- 讀取目前畫面上的播放清單影片項目。
- 將影片順序反轉後，跳到反轉後的第一支影片。
- 當影片快結束或 YouTube 切換影片時，擴充功能依照反轉後順序導向下一支影片。
- 使用 `storage` 暫存目前 playlist id、反轉後影片 id 清單與目前索引。

### 主要限制與風險

- YouTube 前端 DOM 結構常變動，選擇器需要寫得保守，並保留錯誤提示。
- 播放清單可能是動態載入，第一版若只讀取已載入項目，長清單可能需要先捲動載入更多影片。
- YouTube 自動播放、登入狀態、地區限制、私人影片、已刪除影片可能影響播放流程。
- 若只靠前端 DOM，不使用 YouTube Data API，就不需要 API key，但對超長播放清單的完整性較弱。
- 若未來使用 YouTube Data API，可完整取得播放清單順序，但需要 API key、配額管理與額外設定，第一版不建議先做。

## 建議開發方向

### MVP 範圍

第一版先做到「可手動啟動反轉播放」，避免過早加入複雜設定。

功能包含：

- 僅在 `youtube.com` 播放清單相關頁面啟用。
- 在播放清單面板加入一個清楚的反轉按鈕。
- 支援從目前播放清單建立反轉後影片順序。
- 點擊後導向反轉順序的第一支影片。
- 播放完一支影片後，自動導向反轉順序中的下一支。
- 提供簡單狀態提示，例如「已啟用反轉播放」、「找不到播放清單項目」。
- 提供停止反轉播放的方式，例如再次點擊按鈕或在擴充功能 popup 中停止。

暫不納入 MVP：

- 上架 Mozilla Add-ons。
- YouTube Data API。
- 自動判斷播放清單目前是新到舊或舊到新。
- 跨瀏覽器完整支援。
- 複雜的設定頁。

## 專案結構規劃

建議使用純 JavaScript、HTML、CSS 開始，降低專案複雜度。

```text
youtube-playlist-reverse/
├── manifest.json
├── src/
│   ├── content.js
│   ├── playlist.js
│   ├── navigation.js
│   └── storage.js
├── popup/
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── styles/
│   └── content.css
├── icons/
│   └── icon.svg
├── README.md
└── PLAN.md
```

各檔案職責：

- `manifest.json`：定義擴充功能名稱、權限、content script 與 popup。
- `src/content.js`：注入 YouTube 頁面，負責監聽頁面變化與插入按鈕。
- `src/playlist.js`：解析目前播放清單 DOM，取得影片 id、標題與順序。
- `src/navigation.js`：負責依照反轉順序導向下一支影片。
- `src/storage.js`：封裝 WebExtension storage 讀寫。
- `popup/*`：提供目前狀態與停止反轉播放按鈕。
- `styles/content.css`：YouTube 頁面中按鈕與提示樣式。

## 執行步驟

1. 建立擴充功能基本檔案
   - 建立 `manifest.json`。
   - 設定 `content_scripts` 只匹配 `https://www.youtube.com/*`。
   - 設定必要權限，例如 `storage`。

2. 建立播放清單偵測邏輯
   - 偵測目前網址是否包含 playlist，例如 `list=` 參數。
   - 針對 YouTube 播放頁右側播放清單面板讀取影片項目。
   - 針對播放清單列表頁讀取影片項目。

3. 加入反轉播放按鈕
   - 找到播放清單標題或操作列附近的位置。
   - 插入「反轉播放」按鈕。
   - 使用 MutationObserver 處理 YouTube 單頁應用程式切換頁面後 DOM 重新生成的情況。

4. 實作反轉佇列
   - 從目前畫面取得影片清單。
   - 反轉影片 id 順序。
   - 儲存 playlist id、影片 id 清單、目前索引與啟用狀態。
   - 導向反轉後第一支影片。

5. 實作自動下一支
   - 監聽目前網址或播放器狀態。
   - 若反轉播放啟用，確認目前影片在佇列中的位置。
   - 播放結束或 YouTube 嘗試切換下一支時，導向反轉佇列中的下一支。

6. 建立 popup 控制
   - 顯示目前是否啟用反轉播放。
   - 顯示目前播放清單影片數量。
   - 提供停止反轉播放按鈕。

7. 測試與調整
   - 使用 Zen 瀏覽器手動載入未封裝擴充功能。
   - 測試播放頁、播放清單頁、長播放清單、短播放清單。
   - 測試重新整理頁面後狀態是否合理。
   - 測試停止反轉播放是否會恢復一般 YouTube 行為。

## 完成條件

- Zen 瀏覽器可成功載入此擴充功能。
- YouTube 播放清單頁面可看到反轉播放按鈕。
- 點擊按鈕後，能從原本播放清單的最後一支影片開始播放。
- 播放結束後，能依照反轉順序自動前往下一支。
- 可以停止反轉播放。
- README 中包含安裝、使用方式與目前限制。

## 後續可擴充功能

- 自動判斷播放清單排序方向，提供「由新到舊」與「由舊到新」模式。
- 支援匯出反轉後播放清單連結。
- 支援建立暫時播放佇列，而不是只靠導頁。
- 使用 YouTube Data API 完整取得長播放清單內容。
- 上架 Mozilla Add-ons，讓 Zen / Firefox 使用者可直接安裝。

## 目前進度

- [x] 確認需求與使用情境。
- [x] 查證 Zen 瀏覽器擴充功能相容性。
- [x] 完成可行性評估。
- [x] 完成第一版開發規劃。
- [x] 建立擴充功能基本檔案。
- [x] 實作 YouTube 播放清單按鈕注入初版。
- [ ] 完整驗證 YouTube 播放清單偵測。
- [ ] 實作反轉播放流程。
- [x] 撰寫 README。
- [x] 確認 Zen 可載入擴充功能，且 YouTube 播放清單會出現「反轉播放」按鈕。
- [ ] 驗證點擊後的反轉播放流程。

## 測試紀錄

- 2026-07-01：Zen 1.21.4b 載入暫時附加元件時出現開發者工具版本比對警告：「連結的瀏覽器（版本 152.0.3、buildID 20260625）比您的 Zen（1.21.4b、buildID 20260625）還新」。目前已確認 YouTube 播放清單仍會出現「反轉播放」按鈕，因此此警告暫判為開發者工具相容性警告，不是擴充功能載入失敗。
- 2026-07-01：點擊「反轉播放」後頁面重新載入，但仍停在原本第一支影片。原因是初版邏輯若目前影片存在於反轉佇列中，會從目前影片開始播放；已改為點擊後固定導向反轉佇列第一支影片，也就是原清單最後一支。
- 2026-07-01：重新載入後已能跳到原清單最後一支影片，但播放結束後不會自動前往下一支。已將播放器監聽從單純 `ended` 事件改為同時監聽 `ended` 與影片剩餘時間，避免 YouTube 在播放清單最後一支時沒有穩定觸發下一步導向。
- 2026-07-01：修正切換到新播放清單時仍沿用上一個播放清單反轉狀態的問題。現在頁面目前 `list=` 與儲存的 playlist id 不同時，會自動清除反轉狀態；播放導向前也會再次檢查，避免使用舊佇列。
- 2026-07-01：切換播放清單後按鈕仍顯示「停止反轉播放」。原因是 YouTube 單頁切換時舊按鈕仍存在，初版 `injectButton()` 看到按鈕已存在就不刷新狀態；已改為按鈕存在時仍重新檢查目前 playlist id 並更新按鈕文字。
