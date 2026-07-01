(function () {
  const ENDING_THRESHOLD_SECONDS = 1.5;
  const UNAVAILABLE_CHECK_DELAY_MS = 1200;
  const UNAVAILABLE_KEYWORDS = [
    "會員限定",
    "加入這個頻道",
    "等待直播",
    "即將開始",
    "無法播放",
    "影片無法使用",
    "私人影片",
    "已刪除",
    "members only",
    "member-only",
    "join this channel",
    "waiting",
    "premieres",
    "this live event will begin",
    "this video is unavailable",
    "private video",
    "deleted video"
  ];
  const UNPLAYABLE_STATUSES = [
    "ERROR",
    "LOGIN_REQUIRED",
    "LIVE_STREAM_OFFLINE",
    "UNPLAYABLE"
  ];
  let unavailableCheckTimer = null;

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

  function getPlayerStatusText() {
    const statusNodes = [
      document.querySelector("ytd-player-error-message-renderer"),
      document.querySelector("#player-error-message-container"),
      document.querySelector("#movie_player .ytp-error"),
      document.querySelector("#movie_player .ytp-live-badge"),
      document.querySelector("#movie_player .ytp-offline-slate"),
      document.querySelector("#player")
    ].filter(Boolean);

    return statusNodes
      .map((node) => node.textContent || "")
      .join(" ")
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();
  }

  function extractJsonObjectAfter(text, marker) {
    const markerIndex = text.indexOf(marker);

    if (markerIndex < 0) {
      return null;
    }

    const startIndex = text.indexOf("{", markerIndex);

    if (startIndex < 0) {
      return null;
    }

    let depth = 0;
    let isEscaped = false;
    let isInString = false;

    for (let index = startIndex; index < text.length; index += 1) {
      const character = text[index];

      if (isInString) {
        if (isEscaped) {
          isEscaped = false;
        } else if (character === "\\") {
          isEscaped = true;
        } else if (character === "\"") {
          isInString = false;
        }
        continue;
      }

      if (character === "\"") {
        isInString = true;
      } else if (character === "{") {
        depth += 1;
      } else if (character === "}") {
        depth -= 1;

        if (depth === 0) {
          return text.slice(startIndex, index + 1);
        }
      }
    }

    return null;
  }

  function parseJsonObject(jsonText) {
    try {
      return JSON.parse(jsonText);
    } catch (error) {
      return null;
    }
  }

  function getPlayerResponseFromScripts() {
    const scripts = Array.from(document.querySelectorAll("script"));

    for (const script of scripts) {
      const text = script.textContent || "";

      if (!text.includes("ytInitialPlayerResponse")) {
        continue;
      }

      const jsonText = extractJsonObjectAfter(text, "ytInitialPlayerResponse");
      const playerResponse = jsonText ? parseJsonObject(jsonText) : null;

      if (playerResponse) {
        return playerResponse;
      }
    }

    return null;
  }

  function getPlayerResponseFromElements() {
    const watchFlexy = document.querySelector("ytd-watch-flexy");
    const moviePlayer = document.querySelector("#movie_player");

    try {
      return (
        watchFlexy?.playerResponse ||
        watchFlexy?.data?.playerResponse ||
        moviePlayer?.getPlayerResponse?.() ||
        null
      );
    } catch (error) {
      return null;
    }
  }

  function getCurrentPlayerResponse() {
    const currentVideoId = window.ytprPlaylist.getCurrentVideoId();
    const candidates = [
      getPlayerResponseFromElements(),
      getPlayerResponseFromScripts()
    ].filter(Boolean);

    return (
      candidates.find((candidate) => candidate?.videoDetails?.videoId === currentVideoId) ||
      null
    );
  }

  function getPlayerResponseStatusText(playerResponse) {
    const status = playerResponse?.playabilityStatus;
    const reason = status?.reason || "";
    const subreason = status?.errorScreen?.playerErrorMessageRenderer?.subreason?.runs
      ?.map((run) => run.text || "")
      .join(" ") || "";

    return `${status?.status || ""} ${reason} ${subreason}`.trim().toLowerCase();
  }

  function isScheduledLive(playerResponse) {
    const liveDetails =
      playerResponse?.microformat?.playerMicroformatRenderer?.liveBroadcastDetails;

    if (!liveDetails?.startTimestamp || liveDetails.isLiveNow) {
      return false;
    }

    const startTime = new Date(liveDetails.startTimestamp).getTime();

    return Number.isFinite(startTime) && startTime > Date.now();
  }

  function playerResponseIndicatesUnavailable() {
    const playerResponse = getCurrentPlayerResponse();

    if (!playerResponse) {
      return false;
    }

    const status = playerResponse?.playabilityStatus?.status;
    const statusText = getPlayerResponseStatusText(playerResponse);

    return (
      UNPLAYABLE_STATUSES.includes(status) ||
      isScheduledLive(playerResponse) ||
      UNAVAILABLE_KEYWORDS.some((keyword) => statusText.includes(keyword))
    );
  }

  function isUnavailableVideo() {
    const statusText = getPlayerStatusText();

    return (
      UNAVAILABLE_KEYWORDS.some((keyword) => statusText.includes(keyword)) ||
      playerResponseIndicatesUnavailable()
    );
  }

  async function continueReversePlayback() {
    const state = await window.ytprStorage.getState();
    const playlistId = window.ytprPlaylist.getPlaylistId();

    if (!state.enabled || !state.videoIds.length) {
      return;
    }

    if (!playlistId || state.playlistId !== playlistId) {
      await window.ytprStorage.clearState();
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

  async function skipUnavailableVideo() {
    const state = await window.ytprStorage.getState();

    if (!state.enabled) {
      return;
    }

    const playbackKey = getCurrentPlaybackKey();

    if (!playbackKey || document.documentElement.dataset.ytprSkippedUnavailableKey === playbackKey) {
      return;
    }

    if (!isUnavailableVideo()) {
      return;
    }

    document.documentElement.dataset.ytprSkippedUnavailableKey = playbackKey;
    await continueReversePlayback();
  }

  function watchUnavailableVideo() {
    if (unavailableCheckTimer) {
      return;
    }

    unavailableCheckTimer = window.setTimeout(() => {
      unavailableCheckTimer = null;
      skipUnavailableVideo();
    }, UNAVAILABLE_CHECK_DELAY_MS);
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
    watchUnavailableVideo,
    watchVideoProgress
  };
})();
