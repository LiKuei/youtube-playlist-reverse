(function () {
  const STORAGE_KEY = "youtubePlaylistReverseState";

  const fallbackState = {
    enabled: false,
    playlistId: null,
    videoIds: [],
    currentIndex: -1,
    updatedAt: null
  };

  const extensionApi = typeof browser !== "undefined" ? browser : chrome;

  async function getState() {
    const result = await extensionApi.storage.local.get(STORAGE_KEY);
    return {
      ...fallbackState,
      ...(result[STORAGE_KEY] || {})
    };
  }

  async function setState(nextState) {
    const currentState = await getState();
    const mergedState = {
      ...currentState,
      ...nextState,
      updatedAt: new Date().toISOString()
    };

    await extensionApi.storage.local.set({
      [STORAGE_KEY]: mergedState
    });

    return mergedState;
  }

  async function clearState() {
    await extensionApi.storage.local.set({
      [STORAGE_KEY]: {
        ...fallbackState,
        updatedAt: new Date().toISOString()
      }
    });
  }

  window.ytprStorage = {
    getState,
    setState,
    clearState
  };
})();
