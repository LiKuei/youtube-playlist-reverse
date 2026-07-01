const extensionApi = typeof browser !== "undefined" ? browser : chrome;
const STORAGE_KEY = "youtubePlaylistReverseState";

const statusText = document.getElementById("statusText");
const playlistId = document.getElementById("playlistId");
const queueCount = document.getElementById("queueCount");
const stopButton = document.getElementById("stopButton");

async function getState() {
  const result = await extensionApi.storage.local.get(STORAGE_KEY);
  return result[STORAGE_KEY] || {
    enabled: false,
    playlistId: null,
    videoIds: []
  };
}

async function clearState() {
  await extensionApi.storage.local.set({
    [STORAGE_KEY]: {
      enabled: false,
      playlistId: null,
      videoIds: [],
      currentIndex: -1,
      updatedAt: new Date().toISOString()
    }
  });
}

async function render() {
  const state = await getState();

  statusText.textContent = state.enabled ? "反轉播放啟用中" : "目前未啟用";
  playlistId.textContent = state.playlistId || "-";
  queueCount.textContent = String(state.videoIds?.length || 0);
  stopButton.disabled = !state.enabled;
}

stopButton.addEventListener("click", async () => {
  await clearState();
  await render();
});

render();
