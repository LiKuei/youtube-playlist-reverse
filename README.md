# YouTube Playlist Reverse

一個給 Zen / Firefox 使用的 YouTube 播放清單反轉擴充功能。目標是在播放清單頁面加入「反轉播放」按鈕，讓使用者可以從目前畫面清單的最後一部影片開始播放，並依照反轉後順序自動前往下一部。

## 目前狀態

此專案目前是早期 MVP，已包含：

- Firefox WebExtension `manifest.json`
- YouTube 頁面 content script
- 播放清單影片項目解析
- 反轉播放狀態儲存
- 播放結束後依照反轉順序自動前往下一支
- 自動跳過不可播放與尚未開始直播的影片
- popup 狀態顯示與停止按鈕
- 基本樣式與圖示

## 在 Zen 瀏覽器載入

1. 開啟 Zen Browser。
2. 前往 `about:debugging#/runtime/this-firefox`。
3. 點選「Load Temporary Add-on」或「載入暫時附加元件」。
4. 選擇本專案的 `manifest.json`。
5. 開啟 YouTube 播放清單頁面測試。

### Zen 開發者工具警告

載入暫時附加元件時，Zen 可能會顯示類似「連結的瀏覽器比您的 Zen 還新，這是不支援的設定，可能會造成開發者工具發生錯誤」的警告。若 YouTube 播放清單頁面已經出現「反轉播放」按鈕，代表擴充功能本身已成功載入；此警告較可能影響開發者工具偵錯體驗，不代表 content script 失效。

## 使用方式

1. 開啟含有 `list=` 參數的 YouTube 播放清單頁面。
2. 等待播放清單載入完成。
3. 點擊頁面中的「反轉播放」按鈕。
4. 擴充功能會讀取目前畫面中可見的影片項目，建立反轉後佇列，並跳到反轉後第一支影片。
5. 影片播放結束後，會自動依照反轉順序前往下一支。
6. 若遇到會員限定、無法播放、私人影片、已刪除影片，或尚未開始的直播，會自動跳過並前往下一支。
7. 若要停止，可再次點擊頁面按鈕，或從擴充功能 popup 點擊「停止反轉播放」。

## 自動跳過影片

反轉播放啟用時，擴充功能會偵測目前影片是否無法正常播放。若符合下列狀態，會自動前往反轉佇列中的下一支影片：

- 會員限定
- 無法播放或影片無法使用
- 私人影片
- 已刪除影片
- 即將開始直播或等待直播

偵測方式包含 YouTube 頁面文字與 player response 狀態資料，因此即使 YouTube 沒有明顯顯示「即將開始直播」文字，也有機會正確跳過。

## 已知限制

- 第一版只讀取目前畫面已載入的播放清單項目，超長播放清單可能需要先捲動載入更多影片。
- YouTube DOM 結構可能變動，未來可能需要調整選擇器。
- 地區限制、版權限制或 YouTube 新增的特殊狀態仍可能影響播放流程，若未被偵測到，需再補上對應判斷。
- Zen 的 `about:debugging` 可能出現版本比對警告，但目前已確認不會阻止頁面按鈕注入。
- 尚未上架 Mozilla Add-ons，目前以本機暫時載入方式測試。

## 參考資料

- [Zen Browser Extensions documentation](https://docs.zen-browser.app/user-manual/extensions)
- [MDN WebExtensions content_scripts](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/content_scripts)
- [MDN Content scripts overview](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts)
