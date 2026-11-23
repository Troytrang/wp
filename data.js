/* =========================================================
   PORTFOLIO CONTENT — edit this file to add / change videos.
   video: a YouTube link (watch?v=…, youtu.be/…, /shorts/…), a Vimeo link,
          or a direct .mp4 / .webm file link. Leave "" while the video is not up yet.
          Videos play muted and loop inside their frame; a click opens them with sound.
   title / tags / year are not shown on the page (kept for screen readers and your notes).
   format: "vertical" (9:16) or "wide" (16:9)
   ========================================================= */
window.PORTFOLIO = {
  /* The video lists come from this Google Sheet ("Portfolio – Danh sách video").
     Columns: Link video | Nhóm (Game Ads / LED Visual / Brand & Product) | Khung (Dọc / Ngang / Vuông, or any size: 32:9, 3840x1080…) | Tên | Hiện trên web (Có / Không) | Dự án (optional: rows with the same project become ONE card holding all its clips).
     Links can be YouTube, Vimeo, Google Drive (shared: anyone with the link) or .mp4.
     Rows show on the site in the sheet's order. The sheet must stay shared as "Anyone with the link – Viewer".
     If the sheet can't be read, the "items" lists below are used instead. */
  sheetId: "1xePo5ngCP-7prVJO9N1QnKw_-yvN5igSTMdkp8gvgfs",

  /* Background music: the playlist of the music player (bottom-left). Add a song = put the .mp3 in assets/music/
     and add a line here. Visitors start it themselves (browsers block sound until a click). All tracks: Epidemic Sound. */
  music: {
    volume: 0.35,
    credit: "Epidemic Sound",
    tracks: [
      { src: "assets/music/01-time-after-time.mp3", title: "Time After Time", artist: "Janset" },
      { src: "assets/music/02-take-2.mp3", title: "Take 2", artist: "Mushkilla" },
      { src: "assets/music/03-where-you-been-instrumental-version.mp3", title: "Where You Been (Instrumental)", artist: "Katori Walker" },
      { src: "assets/music/04-coal.mp3", title: "Coal", artist: "Taelimb" },
      { src: "assets/music/05-cuando-estes-conmigo.mp3", title: "Cuando Estés Conmigo", artist: "Loreana" },
      { src: "assets/music/06-g-town.mp3", title: "G Town", artist: "Onoe Caponoe" },
      { src: "assets/music/07-greatness-on-me-instrumental-version.mp3", title: "Greatness on Me (Instrumental)", artist: "Witchitaw Slim" },
      { src: "assets/music/08-mine.mp3", title: "Mine", artist: "Duckmaw" },
      { src: "assets/music/09-paperclips.mp3", title: "Paperclips", artist: "Another Notion" },
      { src: "assets/music/10-snakes-instrumental-version.mp3", title: "Snakes (Instrumental)", artist: "Onoe Caponoe" },
      { src: "assets/music/11-payday.mp3", title: "PAYDAY", artist: "BLUE STEEL" },
      { src: "assets/music/12-in-vain.mp3", title: "In Vain", artist: "Kouba" },
      { src: "assets/music/13-divine.mp3", title: "Divine", artist: "Janset" }
    ]
  },

  /* Short silent highlight loops kept on this site, matched by video name (the "Tên" in the sheet).
     "frame" sets the real size, so the card gets the right shape even if the sheet still says "Ngang".
     The card plays the loop; a click still opens the full video from the sheet link (Drive / YouTube). */
  previews: {
    "VTC Booth at A80 2025": { src: "assets/led/a80-preview.mp4", poster: "assets/led/a80-preview.jpg", frame: "3200x384",
      viewer: "preview" }   // the YouTube copy is squeezed: show the highlight until the 3200×800 version is up, then use ytPad: 4
  },

  sections: [
    {
      id: "game-ads",
      // button after the last clip: the whole library on Drive (no need to put every ad in the sheet)
      archive: { url: "https://drive.google.com/drive/folders/1Kt6w9lhKeUs54yXJ58rXe0qulOYhrSqu", kicker: "Want to see more?", label: "See the full archive" },
      num: "01",
      title: ["GAME", "ADS"],
      icon: "assets/ic-game.svg",
      blurb: "Game ads, gameplay videos and trailers for mobile titles — Hybrid-Casual and Action RPG.",
      stat: { value: "~200", label: "game ad creatives produced" },
      items: [
        { title: "Game Ad #1", tags: ["Hybrid-Casual", "Game Ad"], year: "2025", format: "vertical", video: "" },
        { title: "Game Ad #2", tags: ["Action RPG", "Gameplay"], year: "2025", format: "vertical", video: "" },
        { title: "Game Ad #3", tags: ["Hybrid-Casual", "Game Ad"], year: "2026", format: "vertical", video: "" },
        { title: "Game Trailer", tags: ["Action RPG", "Trailer"], year: "2026", format: "wide", video: "" }
      ]
    },
    {
      id: "led-visual",
      num: "02",
      title: ["LED", "VISUAL"],
      icon: "assets/ic-led.svg",
      blurb: "Large-format LED and stage visuals for VTC's flagship events and freelance shows.",
      stat: { value: "5", label: "major events" },
      items: [
        { title: "GameVerse 2026", tags: ["Stage LED", "VTC"], year: "2026", format: "wide", video: "",
          note: "Arcane Hunter — Vietnamese Game of the Year" },
        { title: "GameVerse 2025", tags: ["Stage LED", "VTC"], year: "2025", format: "wide", video: "" },
        { title: "VTC Booth at A80", tags: ["Booth LED", "VTC"], year: "2025", format: "wide", video: "" },
        { title: "VTC – ITC 20", tags: ["Event Visual", "VTC"], year: "", format: "wide", video: "" },
        { title: "Saigonchill Halloween", tags: ["Stage LED", "Freelance"], year: "2025", format: "wide", video: "" }
      ]
    },
    {
      id: "brand-product",
      num: "03",
      title: ["BRAND &", "PRODUCT"],
      icon: "assets/ic-brand.svg",
      blurb: "Brand and product videos for consumer brands.",
      stat: { value: "2", label: "brand & product videos" },
      items: [
        { title: "Kami – Brand Film", tags: ["Brand", "Freelance"], year: "2026", format: "wide", video: "" },
        { title: "Kami – Product Video", tags: ["Product", "Freelance"], year: "2026", format: "wide", video: "" }
      ]
    }
  ],

  experience: [
    { company: "VTC Intercom", years: "2025 – 2026", role: "Video Editor · Game Ads · LED Visual & Event" },
    { company: "Freelance", years: "2024 – 2026", role: "Video Editor · LED Visual · Brand & Product" },
    { company: "HG Media", years: "2024 – 2025", role: "Video Editor · YouTube (~1M monthly views)" }
  ],
  software: ["After Effects", "Premiere Pro", "Photoshop", "Illustrator", "Blender"],
  ai: ["Google Veo", "Kling AI", "Dreamania"],
  contact: { email: "luongthutrang159@gmail.com", phone: "0914 902 917", location: "Hanoi, Vietnam" }
};
