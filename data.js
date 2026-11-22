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
     Columns: Link video | Nhóm (Game Ads / LED Visual / Brand & Product) | Khung (Dọc / Ngang / Vuông, or any size: 32:9, 3840x1080…) | Tên | Hiện trên web (Có / Không).
     Rows show on the site in the sheet's order. The sheet must stay shared as "Anyone with the link – Viewer".
     If the sheet can't be read, the "items" lists below are used instead. */
  sheetId: "1xePo5ngCP-7prVJO9N1QnKw_-yvN5igSTMdkp8gvgfs",

  showreel: "", // main showreel link (16:9)

  /* Background music: an .mp3 in assets/ (or a full link). Visitors switch it on with the MUSIC button
     (browsers never let a page start sound by itself). It pauses while a video is open. */
  music: { src: "", title: "", credit: "", volume: 0.35 },

  sections: [
    {
      id: "game-ads",
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
      stat: { value: "2", label: "brand & product films" },
      items: [
        { title: "Kami – Brand Film", tags: ["Brand", "Freelance"], year: "2026", format: "wide", video: "" },
        { title: "Kami – Product Video", tags: ["Product", "Freelance"], year: "2026", format: "wide", video: "" }
      ]
    }
  ],

  experience: [
    { company: "VTC Intercom", years: "2025 – 2026", role: "Video Editor · Game Ads · LED Visual & Event" },
    { company: "Freelance", years: "2025 – 2026", role: "Video Editor · LED Visual · Brand & Product" },
    { company: "HG Media", years: "2024 – 2025", role: "Video Editor · YouTube (~1M monthly views)" }
  ],
  software: ["After Effects", "Premiere Pro", "Photoshop", "Illustrator", "Blender"],
  ai: ["Google Veo", "Kling AI", "Dreamania"],
  contact: { email: "luongthutrang159@gmail.com", phone: "0914 902 917", location: "Hanoi, Vietnam" }
};
