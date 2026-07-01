(function () {
  const ENDING_THRESHOLD_SECONDS = 1.5;

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

  function getCurrentPlaybackKey() {
    return `${window.ytprPlaylist.getPlaylistId() || ""}:${window.ytprPlaylist.getCurrentVideoId() || ""}`;
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

  async function continueOnce(video) {
    const playbackKey = getCurrentPlaybackKey();

    if (!playbackKey || video.dataset.ytprHandledPlaybackKey === playbackKey) {
      return;
    }

    video.dataset.ytprHandledPlaybackKey = playbackKey;
    await continueReversePlayback();
  }

  function isNearEnd(video) {
    if (!Number.isFinite(video.duration) || video.duration <= 0) {
      return false;
    }

    return video.duration - video.currentTime <= ENDING_THRESHOLD_SECONDS;
  }

  function watchVideoProgress() {
    const video = document.querySelector("video");

    if (!video || video.dataset.ytprWatchingProgress === "true") {
      return;
    }

    video.dataset.ytprWatchingProgress = "true";
    video.addEventListener("ended", () => continueOnce(video));
    video.addEventListener("timeupdate", () => {
      if (isNearEnd(video)) {
        continueOnce(video);
      }
    });
  }

  window.ytprNavigation = {
    buildWatchUrl,
    continueReversePlayback,
    goToVideo,
    watchVideoProgress
  };
})();
