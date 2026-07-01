(function () {
  function getUrlParams(url = window.location.href) {
    return new URL(url).searchParams;
  }

  function getPlaylistId() {
    return getUrlParams().get("list");
  }

  function getCurrentVideoId() {
    return getUrlParams().get("v");
  }

  function normalizeVideoId(videoId) {
    return typeof videoId === "string" && /^[a-zA-Z0-9_-]{6,}$/.test(videoId)
      ? videoId
      : null;
  }

  function parseWatchAnchor(anchor) {
    if (!anchor.href) {
      return null;
    }

    try {
      const url = new URL(anchor.href);
      const videoId = normalizeVideoId(url.searchParams.get("v"));

      if (!videoId) {
        return null;
      }

      return {
        anchor,
        playlistId: url.searchParams.get("list"),
        videoId
      };
    } catch (error) {
      return null;
    }
  }

  function findPlaylistContainers() {
    return [
      document.querySelector("ytd-playlist-panel-renderer"),
      document.querySelector("ytd-playlist-video-list-renderer"),
      document.querySelector("ytd-section-list-renderer")
    ].filter(Boolean);
  }

  function findPlaylistActionTarget() {
    return (
      document.querySelector("ytd-playlist-panel-renderer #header-description") ||
      document.querySelector("ytd-playlist-sidebar-primary-info-renderer #stats") ||
      document.querySelector("ytd-playlist-header-renderer #actions") ||
      document.querySelector("ytd-playlist-panel-renderer")
    );
  }

  function getTitleFromAnchor(anchor) {
    const title =
      anchor.getAttribute("title") ||
      anchor.textContent ||
      anchor.closest("ytd-playlist-panel-video-renderer, ytd-playlist-video-renderer")?.textContent ||
      "";

    return title.trim().replace(/\s+/g, " ");
  }

  function getVisiblePlaylistItems() {
    const currentPlaylistId = getPlaylistId();
    const containers = findPlaylistContainers();
    const parsedAnchors = containers
      .flatMap((container) => Array.from(container.querySelectorAll('a[href*="watch"][href*="v="]')))
      .map(parseWatchAnchor)
      .filter(Boolean);

    const matchingPlaylistAnchors = currentPlaylistId
      ? parsedAnchors.filter((item) => item.playlistId === currentPlaylistId)
      : [];
    const anchorsForCurrentPlaylist = matchingPlaylistAnchors.length
      ? matchingPlaylistAnchors
      : parsedAnchors.filter((item) => !item.playlistId);

    const seenVideoIds = new Set();

    return anchorsForCurrentPlaylist.reduce((items, item) => {
      if (seenVideoIds.has(item.videoId)) {
        return items;
      }

      seenVideoIds.add(item.videoId);
      items.push({
        videoId: item.videoId,
        title: getTitleFromAnchor(item.anchor)
      });

      return items;
    }, []);
  }

  function isPlaylistPage() {
    return Boolean(getPlaylistId());
  }

  window.ytprPlaylist = {
    findPlaylistActionTarget,
    getCurrentVideoId,
    getPlaylistId,
    getVisiblePlaylistItems,
    isPlaylistPage
  };
})();
