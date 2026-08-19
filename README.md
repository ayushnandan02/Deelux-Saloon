# डीलक्स सैलून — Deelux Saloon Radio

एक illustrated barbershop-theme music player website, screenshot वाले reference जैसा — floating player bar, live clock, "online" badge, Spotify/YT Music links, और आपके मांगे गए **volume increase/decrease control** के साथ।

## File structure

```
deelux-saloon/
├── index.html        → पूरा page structure (scene, header, hero, player bar)
├── css/
│   └── style.css      → सारा styling (illustrated background, hero type, player UI)
├── js/
│   └── player.js       → YouTube playlist engine + सारे controls (play/pause/next/prev/volume/seek)
└── README.md
```

## कैसे चलाएँ

बस `index.html` को double‑click करके किसी भी browser (Chrome/Edge/Firefox) में खोल दें — internet connection होना ज़रूरी है क्योंकि गाने असल में आपकी दी गई YouTube playlist से stream होते हैं।

पहली बार खुलने पर एक **"संगीत शुरू करें"** बटन दिखेगा — यह इसलिए है क्योंकि browsers बिना user click के sound-on autoplay को block करते हैं। एक क्लिक के बाद playback शुरू हो जाता है।

## आपकी playlist

`js/player.js` की सबसे ऊपर की लाइन में playlist ID सेट है:

```js
const PLAYLIST_ID = "PLq-bT4s33RYADNkcClDkLPovaKJx0HTDM";
```

आपने जो लिंक भेजा था, यह उसी की ID है। कभी भी दूसरी playlist लगानी हो तो बस यहाँ नई ID डाल दें (किसी भी YouTube playlist URL में `list=` के बाद वाला हिस्सा)।

> ⚠️ ध्यान दें: अगर playlist के किसी video पर owner ने "embedding" disable कर रखी है (कुछ official Bollywood labels ऐसा करते हैं), तो player उस गाने को skip करके अपने-आप अगले गाने पर चला जाएगा — इसे already `js/player.js` में handle किया गया है (`onPlayerError`), console में error नहीं आएगा और पेज नहीं टूटेगा।

## Features

- ▶️ Play / ⏸ Pause / ⏮ Previous / ⏭ Next — पूरी playlist के साथ
- 🔊 **Volume + / −** buttons, drag करने वाला slider, और mute/unmute — यही वह extra feature था जो आपने माँगा था
- Draggable / clickable progress (seek) bar with live time
- असली clock (top-left) और simulated "online" counter (कोई backend नहीं है, बस demo के लिए हल्का-फुल्का random movement देता है — असली presence चाहिए तो इसे किसी websocket/Firebase से जोड़ना होगा)
- Album art व track title/artist अपने-आप YouTube playlist से load होते हैं
- सारे player calls `try/catch` में हैं, ताकि कोई भी video error पूरे page को न तोड़े
- Mobile पर responsive layout

## Customize करना

- रंग/फॉन्ट: `css/style.css` के ऊपर `:root { ... }` में सारे design tokens हैं (red/gold palette, Yatra One हिंदी font, आदि)
- Hero title text: `index.html` में `<h1 class="hero-title">` के अंदर
- Spotify / YT Music links: `index.html` में `.topbar__links` के अंदर असली URLs डाल दें
