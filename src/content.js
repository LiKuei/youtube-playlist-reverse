(function () {
  const BUTTON_ID = "ytpr-reverse-button";
  const STATUS_ID = "ytpr-status";
  let lastUrl = window.location.href;

  function getButtonLabel(state) {
    return state.enabled ? "停止反轉播放" : "反轉播放";
  }

  function showStatus(message, type = "info") {
    let status = document.getElementById(STATUS_ID);

    if (!status) {
      status = document.createElement("div");
      status.id = STATUS_ID;
      document.body.appendChild(status);
    }

    status.textContent = message;
    status.dataset.type = type;

    window.setTimeout(() => {
      if (status.textContent === message) {
        status.remove();
      }
    }, 3200);
  }

  async function getCurrentPlaylistState() {
    const state = await window.ytprStorage.getState();
    const playlistId = window.ytprPlaylist.getPlaylistId();

    if (state.enabled && playlistId && state.playlistId !== playlistId) {
      await window.ytprStorage.clearState();
      return window.ytprStorage.getState();
    }

    return state;
  }

  async function refreshButtonState() {
    const button = document.getElementById(BUTTON_ID);

    if (!button) {
      return;
    }

    const state = await getCurrentPlaylistState();
    button.textContent = getButtonLabel(state);
    button.setAttribute("aria-pressed", String(state.enabled));
  }

  async function startReversePlayback() {
    const playlistId = window.ytprPlaylist.getPlaylistId();
    const items = window.ytprPlaylist.getVisiblePlaylistItems();

    if (!playlistId) {
      showStatus("目前頁面不是播放清單。", "error");
      return;
    }

    if (items.length < 2) {
      showStatus("找不到足夠的播放清單影片，請先確認清單已載入。", "error");
      return;
    }

    const videoIds = items.map((item) => item.videoId).reverse();
    const firstVideoId = videoIds[0];

    await window.ytprStorage.setState({
      enabled: true,
      playlistId,
      videoIds,
      currentIndex: 0
    });

    showStatus(`已建立反轉播放佇列，共 ${videoIds.length} 部影片。`, "success");
    window.ytprNavigation.goToVideo(firstVideoId, playlistId);
  }

  async function stopReversePlayback() {
    await window.ytprStorage.clearState();
    await refreshButtonState();
    showStatus("已停止反轉播放。", "success");
  }

  async function handleButtonClick() {
    const state = await getCurrentPlaylistState();

    if (state.enabled) {
      await stopReversePlayback();
      return;
    }

    await startReversePlayback();
  }

  async function injectButton() {
    if (!window.ytprPlaylist.isPlaylistPage()) {
      return;
    }

    if (document.getElementById(BUTTON_ID)) {
      await refreshButtonState();
      return;
    }

    const target = window.ytprPlaylist.findPlaylistActionTarget();

    if (!target) {
      return;
    }

    const button = document.createElement("button");
    button.id = BUTTON_ID;
    button.type = "button";
    button.addEventListener("click", handleButtonClick);

    target.appendChild(button);
    await refreshButtonState();
  }

  function handleUrlChange() {
    if (lastUrl === window.location.href) {
      return;
    }

    lastUrl = window.location.href;
    window.setTimeout(() => {
      injectButton();
      refreshButtonState();
      window.ytprNavigation.watchVideoProgress();
    }, 800);
  }

  function startObservers() {
    const observer = new MutationObserver(() => {
      injectButton();
      window.ytprNavigation.watchVideoProgress();
      handleUrlChange();
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  injectButton();
  window.ytprNavigation.watchVideoProgress();
  startObservers();
})();
