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

  function extractVideoIdFromAnchor(anchor) {
    if (!anchor.href) {
      return null;
    }

    try {
      return normalizeVideoId(new URL(anchor.href).searchParams.get("v"));
    } catch (error) {
      return null;
    }
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
    const containers = findPlaylistContainers();
    const anchors = containers.flatMap((container) =>
      Array.from(container.querySelectorAll('a[href*="watch"][href*="v="]'))
    );

    const seenVideoIds = new Set();

    return anchors.reduce((items, anchor) => {
      const videoId = extractVideoIdFromAnchor(anchor);

      if (!videoId || seenVideoIds.has(videoId)) {
        return items;
      }

      seenVideoIds.add(videoId);
      items.push({
        videoId,
        title: getTitleFromAnchor(anchor)
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
