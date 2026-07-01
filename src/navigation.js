(function () {
  function buildWatchUrl(videoId, playlistId) {
    const url = new URL("https://www.youtube.com/watch");
    url.searchParams.set("v", videoId);

    if (playlistId) {
      url.searchParams.set("list", playlistId);
    }

    return url.toString();
  }

  function goToVideo(videoId, playlistId) {
    window.location.assign(buildWatchUrl(videoId, playlistId));
  }

  function getNextIndex(state, currentVideoId) {
    const currentIndex = state.videoIds.indexOf(currentVideoId);

    if (currentIndex >= 0) {
      return currentIndex + 1;
    }

    return state.currentIndex + 1;
  }

  async function continueReversePlayback() {
    const state = await window.ytprStorage.getState();

    if (!state.enabled || !state.videoIds.length) {
      return;
    }

    const currentVideoId = window.ytprPlaylist.getCurrentVideoId();
    const nextIndex = getNextIndex(state, currentVideoId);
    const nextVideoId = state.videoIds[nextIndex];

    if (!nextVideoId) {
      await window.ytprStorage.setState({
        enabled: false,
        currentIndex: state.videoIds.length - 1
      });
      return;
    }

    await window.ytprStorage.setState({
      currentIndex: nextIndex
    });
    goToVideo(nextVideoId, state.playlistId);
  }

  function watchVideoEnd() {
    const video = document.querySelector("video");

    if (!video || video.dataset.ytprWatchingEnd === "true") {
      return;
    }

    video.dataset.ytprWatchingEnd = "true";
    video.addEventListener("ended", continueReversePlayback);
  }

  window.ytprNavigation = {
    buildWatchUrl,
    continueReversePlayback,
    goToVideo,
    watchVideoEnd
  };
})();
