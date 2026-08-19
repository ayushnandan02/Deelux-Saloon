/* =========================================================
   Deelux Saloon Radio — player.js
   Plays a YouTube playlist through the (audio-only, hidden)
   IFrame Player API and drives a custom UI on top of it.
   ========================================================= */

// ---- CONFIG -------------------------------------------------
// Replace this with any playlist ID you like (the part after
// "list=" in a YouTube playlist URL).
const PLAYLIST_ID = "PLq-bT4s33RYADNkcClDkLPovaKJx0HTDM";
const DEFAULT_VOLUME = 70;

// ---- STATE ----------------------------------------------------
let player = null;
let isPlayerReady = false;
let isSeeking = false;
let progressTimer = null;
let lastVolume = DEFAULT_VOLUME;

// ---- DOM refs ---------------------------------------------------
const el = {
  clock: document.getElementById("clock"),
  onlineCount: document.getElementById("onlineCount"),
  startOverlay: document.getElementById("startOverlay"),
  startBtn: document.getElementById("startBtn"),
  playerBar: document.getElementById("playerBar"),

  albumArt: document.getElementById("albumArt"),
  trackTitle: document.getElementById("trackTitle"),
  trackArtist: document.getElementById("trackArtist"),

  prevBtn: document.getElementById("prevBtn"),
  playBtn: document.getElementById("playBtn"),
  playIcon: document.getElementById("playIcon"),
  nextBtn: document.getElementById("nextBtn"),

  volDownBtn: document.getElementById("volDownBtn"),
  volUpBtn: document.getElementById("volUpBtn"),
  muteBtn: document.getElementById("muteBtn"),
  volIcon: document.getElementById("volIcon"),
  volSlider: document.getElementById("volSlider"),

  curTime: document.getElementById("curTime"),
  durTime: document.getElementById("durTime"),
  progressBar: document.getElementById("progressBar"),
  progressFill: document.getElementById("progressFill"),
  progressHandle: document.getElementById("progressHandle"),
};

/* =========================================================
   Clock
   ========================================================= */
function updateClock() {
  const now = new Date();
  let h = now.getHours();
  const m = now.getMinutes();
  const ampm = h >= 12 ? "pm" : "am";
  h = h % 12;
  if (h === 0) h = 12;
  const mm = m.toString().padStart(2, "0");
  el.clock.textContent = `${h}:${mm} ${ampm}`;
}
updateClock();
setInterval(updateClock, 1000 * 15);

/* =========================================================
   Simulated "online" counter
   (There's no real backend here — this just gives the page
   the same lively feel as the reference screenshot. Wire it
   to a real presence/websocket service if you have one.)
   ========================================================= */
let onlineBase = 24 + Math.floor(Math.random() * 12);
function tickOnlineCount() {
  const drift = Math.floor(Math.random() * 5) - 2; // -2..+2
  onlineBase = Math.max(3, onlineBase + drift);
  el.onlineCount.textContent = onlineBase;
}
tickOnlineCount();
setInterval(tickOnlineCount, 4000);

/* =========================================================
   Time formatting helper
   ========================================================= */
function formatTime(sec) {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

/* =========================================================
   YouTube IFrame API bootstrap
   This global function name is required by the API —
   it is called automatically once youtube.com/iframe_api
   has finished loading.
   ========================================================= */
window.onYouTubeIframeAPIReady = function () {
  try {
    player = new YT.Player("yt-player", {
      height: "1",
      width: "1",
      playerVars: {
        listType: "playlist",
        list: PLAYLIST_ID,
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        modestbranding: 1,
        rel: 0,
        playsinline: 1,
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
        onError: onPlayerError,
      },
    });
  } catch (err) {
    console.error("Could not initialise the YouTube player:", err);
    el.trackTitle.textContent = "प्लेयर लोड नहीं हो सका";
    el.trackArtist.textContent = "पेज को रीलोड करें";
  }
};

function onPlayerReady() {
  isPlayerReady = true;
  try {
    player.setVolume(DEFAULT_VOLUME);
    player.mute(); // start muted so browsers allow the initial autoplay
  } catch (err) {
    console.warn("setVolume/mute failed on ready:", err);
  }
}

function onPlayerStateChange(event) {
  const State = window.YT.PlayerState;

  if (event.data === State.PLAYING) {
    consecutiveErrors = 0;
    el.playerBar.classList.add("is-playing");
    setPlayIcon(true);
    refreshTrackInfo();
    startProgressLoop();
  } else if (event.data === State.PAUSED || event.data === State.ENDED) {
    el.playerBar.classList.remove("is-playing");
    setPlayIcon(false);
    stopProgressLoop();
  } else if (event.data === State.CUED) {
    refreshTrackInfo();
  }
}

let consecutiveErrors = 0;
const MAX_CONSECUTIVE_ERRORS = 6;

function onPlayerError(event) {
  // 2 = invalid id, 5 = HTML5 error, 100 = not found,
  // 101/150 = embedding disabled by the video owner.
  console.warn("YouTube player error code:", event.data, "— see https://developers.google.com/youtube/iframe_api_reference#onError for what this code means");
  consecutiveErrors++;

  if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
    // Stop hammering nextVideo() forever — tell the person plainly
    // instead of looping silently.
    el.trackTitle.textContent = "कई ट्रैक इस साइट पर नहीं चल पा रहे";
    el.trackArtist.textContent = "playlist YouTube पर खोलें (ऊपर दिया लिंक इस्तेमाल करें)";
    console.error(
      `${consecutiveErrors} tracks in a row failed. Likely causes: ` +
      `1) the page is open as a local file:// URL — serve it over http:// (e.g. "python -m http.server") instead, or ` +
      `2) these videos have embedding disabled by their owner and can only play on youtube.com itself.`
    );
    return;
  }

  el.trackTitle.textContent = "यह ट्रैक चलाया नहीं जा सका";
  el.trackArtist.textContent = "अगले ट्रैक पर जा रहे हैं…";
  try {
    player.nextVideo();
  } catch (err) {
    console.error("nextVideo() failed after an error:", err);
  }
}

/* =========================================================
   Track metadata + artwork
   ========================================================= */
function refreshTrackInfo() {
  if (!isPlayerReady) return;
  try {
    const data = player.getVideoData();
    if (!data) return;

    const rawTitle = data.title || "Unknown track";
    // Many Bollywood uploads use "Song Name - Movie" or
    // "Artist - Song" formatting; split on the first dash.
    const parts = rawTitle.split(/\s[-–]\s/);
    el.trackTitle.textContent = parts[0] || rawTitle;
    el.trackArtist.textContent = parts.length > 1 ? parts.slice(1).join(" - ") : (data.author || "Deelux Saloon Radio");

    if (data.video_id) {
      el.albumArt.src = `https://img.youtube.com/vi/${data.video_id}/hqdefault.jpg`;
      el.albumArt.alt = rawTitle;
    }
  } catch (err) {
    console.warn("Could not read track metadata:", err);
  }
}

/* =========================================================
   Progress bar loop
   ========================================================= */
function startProgressLoop() {
  stopProgressLoop();
  progressTimer = setInterval(updateProgressUI, 500);
  updateProgressUI();
}
function stopProgressLoop() {
  if (progressTimer) {
    clearInterval(progressTimer);
    progressTimer = null;
  }
}
function updateProgressUI() {
  if (!isPlayerReady || isSeeking) return;
  try {
    const cur = player.getCurrentTime() || 0;
    const dur = player.getDuration() || 0;
    const pct = dur > 0 ? (cur / dur) * 100 : 0;

    el.progressFill.style.width = `${pct}%`;
    el.progressHandle.style.left = `${pct}%`;
    el.curTime.textContent = formatTime(cur);
    el.durTime.textContent = formatTime(dur);
  } catch (err) {
    console.warn("Progress update failed:", err);
  }
}

/* =========================================================
   Play / pause / prev / next
   ========================================================= */
function setPlayIcon(isPlaying) {
  el.playIcon.innerHTML = isPlaying
    ? '<path fill="currentColor" d="M6 5h4v14H6zm8 0h4v14h-4z"/>' // pause
    : '<path fill="currentColor" d="M8 5v14l11-7z"/>'; // play
}

function togglePlay() {
  if (!isPlayerReady) return;
  try {
    const state = player.getPlayerState();
    if (state === YT.PlayerState.PLAYING) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  } catch (err) {
    console.error("togglePlay failed:", err);
  }
}

el.playBtn.addEventListener("click", togglePlay);

el.prevBtn.addEventListener("click", () => {
  if (!isPlayerReady) return;
  try {
    player.previousVideo();
  } catch (err) {
    console.error("previousVideo failed:", err);
  }
});

el.nextBtn.addEventListener("click", () => {
  if (!isPlayerReady) return;
  try {
    player.nextVideo();
  } catch (err) {
    console.error("nextVideo failed:", err);
  }
});

/* =========================================================
   Volume controls (the extra feature that was requested):
   +/- buttons, a slider, and a mute toggle — all clamped
   to the valid 0-100 range and defensively try/caught so a
   player hiccup never throws an unhandled error.
   ========================================================= */
function applyVolume(vol) {
  vol = Math.max(0, Math.min(100, Math.round(vol)));
  if (!isPlayerReady) return vol;
  try {
    player.unMute();
    player.setVolume(vol);
  } catch (err) {
    console.warn("applyVolume failed:", err);
  }
  el.volSlider.value = vol;
  updateVolumeIcon(vol);
  if (vol > 0) lastVolume = vol;
  return vol;
}

function updateVolumeIcon(vol) {
  if (vol === 0) {
    el.volIcon.innerHTML =
      '<path fill="currentColor" d="M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.42.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>';
  } else if (vol < 50) {
    el.volIcon.innerHTML =
      '<path fill="currentColor" d="M3 10v4h4l5 5V5L7 10H3zm13.5 2A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>';
  } else {
    el.volIcon.innerHTML =
      '<path fill="currentColor" d="M3 10v4h4l5 5V5L7 10H3zm13.5 2A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>';
  }
}

el.volUpBtn.addEventListener("click", () => {
  const current = isPlayerReady ? player.getVolume() : Number(el.volSlider.value);
  applyVolume(current + 10);
});

el.volDownBtn.addEventListener("click", () => {
  const current = isPlayerReady ? player.getVolume() : Number(el.volSlider.value);
  applyVolume(current - 10);
});

el.volSlider.addEventListener("input", (e) => {
  applyVolume(Number(e.target.value));
});

el.muteBtn.addEventListener("click", () => {
  if (!isPlayerReady) return;
  try {
    const muted = player.isMuted();
    if (muted) {
      applyVolume(lastVolume || DEFAULT_VOLUME);
    } else {
      lastVolume = player.getVolume() || lastVolume;
      player.mute();
      el.volSlider.value = 0;
      updateVolumeIcon(0);
    }
  } catch (err) {
    console.warn("mute toggle failed:", err);
  }
});

/* =========================================================
   Seekable progress bar
   ========================================================= */
function seekFromClientX(clientX) {
  if (!isPlayerReady) return;
  try {
    const rect = el.progressBar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const dur = player.getDuration() || 0;
    const target = ratio * dur;

    el.progressFill.style.width = `${ratio * 100}%`;
    el.progressHandle.style.left = `${ratio * 100}%`;
    el.curTime.textContent = formatTime(target);

    player.seekTo(target, true);
  } catch (err) {
    console.warn("seek failed:", err);
  }
}

el.progressBar.addEventListener("mousedown", (e) => {
  isSeeking = true;
  seekFromClientX(e.clientX);
});
window.addEventListener("mousemove", (e) => {
  if (isSeeking) seekFromClientX(e.clientX);
});
window.addEventListener("mouseup", () => {
  isSeeking = false;
});

// Touch support
el.progressBar.addEventListener("touchstart", (e) => {
  isSeeking = true;
  seekFromClientX(e.touches[0].clientX);
});
el.progressBar.addEventListener("touchmove", (e) => {
  if (isSeeking) seekFromClientX(e.touches[0].clientX);
});
el.progressBar.addEventListener("touchend", () => {
  isSeeking = false;
});

/* =========================================================
   Start overlay — browsers block unmuted autoplay, so
   playback (with sound) only begins after this real click.
   ========================================================= */
el.startBtn.addEventListener("click", () => {
  el.startOverlay.classList.add("is-hidden");
  if (!isPlayerReady) return;
  try {
    applyVolume(DEFAULT_VOLUME);
    player.playVideo();
  } catch (err) {
    console.error("Could not start playback:", err);
  }
});

updateVolumeIcon(DEFAULT_VOLUME);
