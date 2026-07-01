# YouTube Playlist Reverse

一個給 Zen / Firefox 使用的 YouTube 播放清單反轉擴充功能。目標是在播放清單頁面加入「反轉播放」按鈕，讓使用者可以從目前畫面清單的最後一部影片開始播放，並依照反轉後順序自動前往下一部。

## 目前狀態

此專案目前是早期 MVP 骨架，已包含：

- Firefox WebExtension `manifest.json`
- YouTube 頁面 content script
- 播放清單影片項目解析
- 反轉播放狀態儲存
- popup 狀態顯示與停止按鈕
- 基本樣式與圖示

## 在 Zen 瀏覽器載入

1. 開啟 Zen Browser。
2. 前往 `about:debugging#/runtime/this-firefox`。
3. 點選「Load Temporary Add-on」或「載入暫時附加元件」。
4. 選擇本專案的 `manifest.json`。
5. 開啟 YouTube 播放清單頁面測試。

## 使用方式

1. 開啟含有 `list=` 參數的 YouTube 播放清單頁面。
2. 等待播放清單載入完成。
3. 點擊頁面中的「反轉播放」按鈕。
4. 擴充功能會讀取目前畫面中可見的影片項目，建立反轉後佇列，並跳到反轉後第一支影片。
5. 若要停止，可再次點擊頁面按鈕，或從擴充功能 popup 點擊「停止反轉播放」。

## 已知限制

- 第一版只讀取目前畫面已載入的播放清單項目，超長播放清單可能需要先捲動載入更多影片。
- YouTube DOM 結構可能變動，未來可能需要調整選擇器。
- 私人影片、已刪除影片、地區限制影片可能影響播放流程。
- 尚未上架 Mozilla Add-ons，目前以本機暫時載入方式測試。

## 參考資料

- [Zen Browser Extensions documentation](https://docs.zen-browser.app/user-manual/extensions)
- [MDN WebExtensions content_scripts](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/content_scripts)
- [MDN Content scripts overview](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts)
