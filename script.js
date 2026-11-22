(() => {
  const D = window.PORTFOLIO;
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- video helpers ---------- */
  function parseVideo(url) {
    if (!url) return null;
    let m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/))([\w-]{11})/);
    if (m) return { kind: "yt", id: m[1],
      embed: `https://www.youtube-nocookie.com/embed/${m[1]}?autoplay=1&rel=0&playsinline=1`,
      loop: `https://www.youtube-nocookie.com/embed/${m[1]}?autoplay=1&mute=1&loop=1&playlist=${m[1]}&controls=0&playsinline=1&rel=0&modestbranding=1&disablekb=1`,
      thumb: `https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg` };
    m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (m) return { kind: "vimeo", id: m[1], embed: `https://player.vimeo.com/video/${m[1]}?autoplay=1`,
      loop: `https://player.vimeo.com/video/${m[1]}?background=1`, thumb: null };
    if (/\.(mp4|webm|mov)(\?|#|$)/i.test(url)) return { kind: "file", src: url };
    return null;
  }
  // muted, looping preview that plays inside the frame
  function loopMedia(v, title) {
    if (v.kind === "file") return `<video class="thumb" src="${esc(v.src)}" autoplay muted loop playsinline preload="metadata" aria-hidden="true"></video>`;
    return `<iframe class="loop" data-src="${v.loop}" title="${esc(title)} (preview)" tabindex="-1" allow="autoplay; encrypted-media" loading="lazy"></iframe>`;
  }
  const frameHTML = (format, inner) =>
    `<div class="frame ${format === "vertical" ? "frame-vert" : "frame-wide"}">
       <span class="p p1"></span><span class="p p2"></span><span class="p p3"></span>
       <div class="win">${inner}</div>
     </div>`;
  const placeholder = (format, title) =>
    `<div class="placeholder"><div>VIDEO ${format === "vertical" ? "9:16" : "16:9"}<small>${esc(title)} — coming soon</small></div></div>`;

  /* ---------- hero sticker (inline so its two lines can animate) ---------- */
  const sticker = $("#sticker");
  fetch("assets/sticker.svg").then((r) => r.text()).then((svg) => {
    sticker.innerHTML = svg.replace(/<\?xml[^>]*>/, "");
    const s = sticker.querySelector("svg");
    s.setAttribute("aria-hidden", "true");
    s.removeAttribute("width"); s.removeAttribute("height");
    // wrap each line in an inner <g> so CSS animation does not override the SVG's own translate
    [["dong-1-video", "anim-1"], ["dong-2-editor", "anim-2"], ["con-tro", "anim-3"]].forEach(([id, cls]) => {
      const g = s.getElementById ? s.getElementById(id) : s.querySelector("#" + id);
      if (!g) return;
      const w = document.createElementNS("http://www.w3.org/2000/svg", "g");
      w.setAttribute("class", cls);
      while (g.firstChild) w.appendChild(g.firstChild);
      g.appendChild(w);
    });
    requestAnimationFrame(() => sticker.classList.add("in"));
  }).catch(() => { sticker.innerHTML = '<img src="assets/sticker.svg" alt="">'; });

  /* ---------- showreel ---------- */
  const sr = parseVideo(D.showreel);
  $("#showreel-frame").outerHTML = `<div class="frame-lg reveal">${frameHTML("wide",
    sr ? `<button class="open" type="button" data-video="${esc(D.showreel)}" data-title="Showreel" data-format="wide" aria-label="Play showreel" style="all:unset;cursor:pointer;position:absolute;inset:0">
            ${sr.thumb ? `<img class="thumb" src="${sr.thumb}" alt="">` : placeholder("wide", "Showreel")}<span class="play"></span></button>`
       : placeholder("wide", "Showreel"))}</div>`;

  /* ---------- tabs + panels ---------- */
  const PAGE = 6;                 // cards shown per grid before "LOAD MORE"
  const PLAYLISTS = {};
  const tabs = $("#tabs"), panels = $("#panels");
  D.sections.forEach((sec, i) => {
    tabs.insertAdjacentHTML("beforeend",
      `<button class="tab" role="tab" id="tab-${sec.id}" aria-controls="panel-${sec.id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">
         <span class="num">${sec.num}</span><img src="${sec.icon}" alt="">${esc(sec.title.join(" "))}
       </button>`);
    const card = (it, k) => {
      const v = parseVideo(it.video);
      if (!v) return `<article class="item reveal" aria-label="${esc(it.title)}">${frameHTML(it.format, placeholder(it.format, it.title))}</article>`;
      const still = v.kind === "file"
        ? `<video class="thumb" src="${esc(v.src)}#t=0.5" muted loop playsinline preload="metadata" aria-hidden="true"></video>`
        : v.thumb ? `<img class="thumb" src="${v.thumb}" alt="" loading="lazy">` : `<div class="placeholder"><div>▶</div></div>`;
      const media = `<div class="pv" data-video="${esc(it.video)}">${still}</div>` +
        `<button class="open cover" type="button" data-video="${esc(it.video)}" data-title="${esc(it.title)}" data-format="${it.format}" data-sec="${sec.id}" data-idx="${k}" aria-label="Play ${esc(it.title)} with sound"><span class="sound">▶ PLAY WITH SOUND</span></button>`;
      return `<article class="item reveal" aria-label="${esc(it.title)}">${frameHTML(it.format, media)}</article>`;
    };
    // index inside the section's playlist (items that have a video), used by the viewer's ◀ ▶
    let n = 0;
    const indexed = sec.items.map((it) => ({ it, k: parseVideo(it.video) ? n++ : -1 }));
    PLAYLISTS[sec.id] = sec.items.filter((it) => parseVideo(it.video));
    const grid = (list, cls) => {
      if (!list.length) return "";
      const html = list.map(({ it, k }, m) => card(it, k).replace('<article class="item', `<article ${m >= PAGE ? "hidden " : ""}class="item`)).join("");
      const more = list.length > PAGE ? `<button class="btn btn-white more" type="button" data-more>LOAD MORE <span>(${list.length - PAGE})</span></button>` : "";
      return `<div class="grid ${cls}">${html}</div>${more}`;
    };
    const vert = indexed.filter((x) => x.it.format === "vertical"), wide = indexed.filter((x) => x.it.format !== "vertical");
    panels.insertAdjacentHTML("beforeend",
      `<div class="panel" role="tabpanel" id="panel-${sec.id}" aria-labelledby="tab-${sec.id}" ${i ? "hidden" : ""}>
         <div class="panel-head">
           <h3 class="panel-title name-block"><span class="nb nb-1">${esc(sec.title[0])}</span><span class="nb nb-2">${esc(sec.title[1])}</span></h3>
           <div class="panel-side"><p>${esc(sec.blurb)}</p>${sec.stat ? `<span class="stat"><b>${esc(sec.stat.value)}</b>${esc(sec.stat.label)}</span>` : ""}</div>
         </div>
         ${grid(vert, "grid-vert")}
         ${grid(wide, "grid-wide")}
       </div>`);
  });
  // "LOAD MORE": reveal the next PAGE cards of that grid
  panels.addEventListener("click", (e) => {
    const b = e.target.closest("[data-more]"); if (!b) return;
    const hiddenCards = [...b.previousElementSibling.querySelectorAll(".item[hidden]")];
    hiddenCards.slice(0, PAGE).forEach((c) => (c.hidden = false));
    const left = hiddenCards.length - PAGE;
    if (left > 0) b.querySelector("span").textContent = `(${left})`; else b.remove();
    observeReveals(); watchPreviews();
  });
  const tabBtns = [...tabs.querySelectorAll(".tab")];
  function select(btn, focus) {
    tabBtns.forEach((b) => { const on = b === btn; b.setAttribute("aria-selected", on); b.tabIndex = on ? 0 : -1;
      $("#" + b.getAttribute("aria-controls")).hidden = !on; });
    if (focus) btn.focus();
    observeReveals(); watchPreviews();
  }
  tabBtns.forEach((b, i) => {
    b.addEventListener("click", () => select(b));
    b.addEventListener("keydown", (e) => {
      const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (d) { e.preventDefault(); select(tabBtns[(i + d + tabBtns.length) % tabBtns.length], true); }
    });
  });

  /* ---------- about ---------- */
  $("#exp").innerHTML = D.experience.map((x) => `<li><b>${esc(x.company)}</b><span>${esc(x.years)}</span><em>${esc(x.role)}</em></li>`).join("");
  $("#soft").innerHTML = D.software.map((s) => `<li>${esc(s)}</li>`).join("");
  $("#ai").textContent = D.ai.join(" • ");
  $("#stats").innerHTML = D.sections.filter((s) => s.stat).map((s) => `<span class="stat"><b>${esc(s.stat.value)}</b>${esc(s.stat.label)}</span>`).join("");

  /* ---------- contact ---------- */
  const c = D.contact;
  $("#mail-text").textContent = c.email;
  $("#phone-text").textContent = c.phone;
  $("#phone").href = "tel:" + c.phone.replace(/\s/g, "");
  $("#loc-text").textContent = c.location;
  $("#yr").textContent = new Date().getFullYear();
  $("#copy-mail").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(c.email); $("#copied").textContent = "Email copied!"; }
    catch { location.href = "mailto:" + c.email; }
    setTimeout(() => ($("#copied").textContent = ""), 2200);
  });

  /* ---------- lightbox (◀ ▶ through the section) ---------- */
  const lb = $("#lightbox"), player = $("#lb-player"), dialog = $(".lb-dialog");
  let lastFocus = null, list = [], pos = 0;
  function show(p) {
    pos = (p + list.length) % list.length;
    const it = list[pos], v = parseVideo(it.video || it.src);
    player.innerHTML = v.kind === "file"
      ? `<video src="${esc(v.src)}" controls autoplay playsinline></video>`
      : `<iframe src="${v.embed}" title="${esc(it.title)}" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowfullscreen></iframe>`;
    $("#lb-title").textContent = it.title;
    $("#lb-count").textContent = list.length > 1 ? `${pos + 1} / ${list.length}` : "";
    dialog.classList.toggle("vert", it.format === "vertical");
    dialog.classList.toggle("single", list.length < 2);
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("button.open[data-video]");
    if (b) {
      lastFocus = b;
      list = b.dataset.sec ? PLAYLISTS[b.dataset.sec] : [{ video: b.dataset.video, title: b.dataset.title, format: b.dataset.format }];
      show(b.dataset.sec ? +b.dataset.idx : 0);
      lb.hidden = false; document.body.style.overflow = "hidden";
      $(".lb-close").focus();
    }
    if (e.target.closest("[data-close]")) close();
    if (e.target.closest("[data-prev]")) show(pos - 1);
    if (e.target.closest("[data-next]")) show(pos + 1);
  });
  function close() {
    if (lb.hidden) return;
    lb.hidden = true; player.innerHTML = ""; document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }
  document.addEventListener("keydown", (e) => {
    if (lb.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowRight" && list.length > 1) show(pos + 1);
    if (e.key === "ArrowLeft" && list.length > 1) show(pos - 1);
    if (e.key === "Tab") {           // keep focus inside the viewer
      const f = [...dialog.querySelectorAll("button:not([hidden])")].filter((x) => x.offsetParent);
      const i = f.indexOf(document.activeElement);
      e.preventDefault(); f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  });
  let sx = null;                     // swipe on phones
  dialog.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; }, { passive: true });
  dialog.addEventListener("touchend", (e) => {
    if (sx === null || list.length < 2) return;
    const dx = e.changedTouches[0].clientX - sx; sx = null;
    if (Math.abs(dx) > 50) show(pos + (dx < 0 ? 1 : -1));
  });

  /* ---------- reveal on scroll ---------- */
  const io = "IntersectionObserver" in window
    ? new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("on"); io.unobserve(en.target); } }), { threshold: .12 })
    : null;
  function observeReveals() {
    document.querySelectorAll(".reveal:not(.on)").forEach((el) => io ? io.observe(el) : el.classList.add("on"));
  }
  observeReveals();

  /* ---------- looping previews ---------- */
  const hoverable = matchMedia("(hover: hover)").matches;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function startPreview(pv) {
    if (reduce || pv.dataset.on) return;
    const v = parseVideo(pv.dataset.video); if (!v) return;
    pv.dataset.on = "1";
    if (v.kind === "file") { const vid = pv.querySelector("video"); vid && vid.play().catch(() => {}); return; }
    pv.insertAdjacentHTML("beforeend", loopMedia(v, "").replace("data-src=", "src="));
  }
  function stopPreview(pv) {
    if (!pv.dataset.on) return;
    delete pv.dataset.on;
    const vid = pv.querySelector("video"); if (vid) vid.pause();
    pv.querySelectorAll("iframe").forEach((f) => f.remove());
  }
  const centreIO = !hoverable && "IntersectionObserver" in window
    ? new IntersectionObserver((es) => es.forEach((en) => en.isIntersecting ? startPreview(en.target) : stopPreview(en.target)),
        { rootMargin: "-35% 0px -35% 0px" })          // only the card in the middle band of the screen plays
    : null;
  function watchPreviews() {
    document.querySelectorAll(".item:not([hidden]) .pv:not([data-w])").forEach((pv) => {
      pv.dataset.w = "1";
      if (hoverable) {
        const item = pv.closest(".item");
        item.addEventListener("pointerenter", () => startPreview(pv));
        item.addEventListener("pointerleave", () => stopPreview(pv));
        item.addEventListener("focusin", () => startPreview(pv));
        item.addEventListener("focusout", () => stopPreview(pv));
      } else if (centreIO) centreIO.observe(pv);
    });
  }
  watchPreviews();

  /* ---------- page-long lightning bolt ---------- */
  const mb = $("#megabolt");
  function drawBolt() {
    const W = document.documentElement.clientWidth, H = document.body.scrollHeight;
    const phone = W < 700;
    // one block of the bolt, traced from Trang's sketch (x as share of the width, y as share of the block height):
    // long diagonal down-left -> sharp point -> almost flat stroke across to the right -> point ->
    // diagonal down-left -> point -> shallow stroke down-right -> point -> back to the start column
    const P = [[0.65, 0], [0.2, 0.34], [0.93, 0.25], [0.36, 0.62], [0.9, 0.77], [0.65, 1]];
    const HW = [0.028, 0.036, 0.048, 0.052, 0.04];               // half width of each stroke (share of width)
    const SHIFT = 0.1;                                          // whole bolt moved left by 10% of the width
    const blockH = Math.max(W * 1.05, 1000);
    const pts = [], hw = [];
    for (let k = 0, y0 = -blockH * 0.05; y0 < H + blockH; k++, y0 += blockH) {
      P.forEach(([px, py], i) => { if (k && i === 0) return; pts.push([W * (px - SHIFT), y0 + blockH * py]); });
      HW.forEach((w) => hw.push(Math.max(phone ? 16 : 24, W * w)));
    }
    // offset each stroke by its own width, then meet the neighbouring stroke's offset line -> razor-sharp points
    const seg = (i, side) => {
      const [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
      const dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy) || 1, nx = dy / l * side, ny = -dx / l * side, w = hw[i];
      return [[x1 + nx * w, y1 + ny * w], [x2 + nx * w, y2 + ny * w]];
    };
    const meet = (a, b, fallback, cap) => {
      const [[x1, y1], [x2, y2]] = a, [[x3, y3], [x4, y4]] = b;
      const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
      if (Math.abs(den) < 1e-6) return fallback;
      const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
      const p = [x1 + t * (x2 - x1), y1 + t * (y2 - y1)];
      const d = Math.hypot(p[0] - fallback[0], p[1] - fallback[1]);
      return d > cap ? [fallback[0] + (p[0] - fallback[0]) * cap / d, fallback[1] + (p[1] - fallback[1]) * cap / d] : p;
    };
    const edge = (side) => {
      const out = [seg(0, side)[0]];
      for (let i = 1; i < pts.length - 1; i++) out.push(meet(seg(i - 1, side), seg(i, side), pts[i], hw[i] * 7));
      out.push(seg(pts.length - 2, side)[1]);
      return out;
    };
    const L = edge(1), R = edge(-1).reverse();
    const d = "M" + [...L, ...R].map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L") + " Z";
    mb.setAttribute("viewBox", `0 0 ${W} ${H}`);
    mb.setAttribute("height", H);
    mb.innerHTML = `<path class="core" d="${d}"/>`;   // flat colour: no outline, no shadow
  }
  drawBolt();
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) mb.classList.add("draw");
  let bt; new ResizeObserver(() => { clearTimeout(bt); bt = setTimeout(drawBolt, 120); }).observe(document.body);

  /* ---------- custom cursor ---------- */
  const cur = $("#cursor");
  if (matchMedia("(pointer: fine)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.documentElement.classList.add("has-cursor");   // hides the system pointer (see style.css)
    addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      cur.style.translate = `${e.clientX}px ${e.clientY}px`; cur.style.opacity = lb.hidden ? 1 : 0;
      cur.classList.toggle("big", !!e.target.closest("a, button"));
    }, { passive: true });
    // leaving the window, or entering a video player (an iframe gets the real pointer): hide ours
    document.addEventListener("pointerleave", () => (cur.style.opacity = 0));
    document.addEventListener("pointerover", (e) => { if (e.target.closest("iframe")) cur.style.opacity = 0; });
  } else cur.remove();
})();
