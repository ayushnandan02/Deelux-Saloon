# डीलक्स सैलून — Deelux Saloon Radio

An illustrated barbershop-themed music player website inspired by the provided reference, featuring a floating player bar, live clock, online badge, Spotify/YT Music links, and **volume increase/decrease controls**.

## File Structure

```text
deelux-saloon/
├── index.html        → Main page structure
├── css/
│   └── style.css     → Website styling and responsive design
├── js/
│   └── player.js     → YouTube playlist and player controls
└── README.md
```

## How to Run

Simply open `index.html` in any modern browser such as Chrome, Edge, or Firefox.

An internet connection is required because the music is streamed from your YouTube playlist.

When the website opens for the first time, a **"संगीत शुरू करें"** button will appear. This is required because browsers block sound-on autoplay without user interaction. Click the button to start playback.

## YouTube Playlist

The playlist ID is set at the top of `js/player.js`:

```js
const PLAYLIST_ID = "PLq-bT4s33RYADNkcClDkLPovaKJx0HTDM";
```

To use another playlist, simply replace the ID with the playlist ID from any YouTube playlist URL.

For example:

```text
https://youtube.com/playlist?list=YOUR_PLAYLIST_ID
```

Use the part after `list=` as the playlist ID.

> **Note:** If a video has embedding disabled by its owner, the player handles the error and moves to the next available track.

## Features

* ▶️ Play / Pause / Previous / Next
* 🔊 **Volume + / − controls**
* 🎚️ Volume slider
* 🔇 Mute / Unmute
* ⏩ Clickable and draggable progress bar
* 🕐 Live clock
* 🟢 Simulated online counter
* 🎵 YouTube playlist integration
* 🖼️ Automatic album artwork
* 🎶 Automatic track title and artist information
* 🛡️ Error handling for unavailable videos
* 📱 Responsive design for mobile devices

## Customization

* **Colors & Fonts:** Edit `:root` variables in `css/style.css`
* **Hero Title:** Edit the `<h1 class="hero-title">` section in `index.html`
* **Spotify / YT Music Links:** Update the URLs inside `.topbar__links` in `index.html`
* **Playlist:** Change `PLAYLIST_ID` in `js/player.js`

## Technologies

* HTML5
* CSS3
* JavaScript
* YouTube IFrame Player API
* Google Fonts
