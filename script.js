(async () => {
  const D = window.PORTFOLIO;

  /* ---------- video list from the Google Sheet (falls back to data.js) ---------- */
  function parseCSV(t) {
    const rows = []; let row = [], cell = "", q = false;
    for (let i = 0; i < t.length; i++) {
      const c = t[i];
      if (q) { if (c === '"') { if (t[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
      else if (c === '"') q = true;
      else if (c === ",") { row.push(cell); cell = ""; }
      else if (c === "\n" || c === "\r") { if (c === "\r" && t[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; }
      else cell += c;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows;
  }
  const fold = (s) => (s || "").toString().trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
  const groupOf = (g) => { g = fold(g); return g.includes("game") ? "game-ads" : g.includes("led") ? "led-visual" : (g.includes("brand") || g.includes("product") || g.includes("san pham")) ? "brand-product" : null; };
  // "Khung": Dọc / Ngang, or any ratio such as 32:9, 3840x1080, 1080×3840, 5:1
  function frameOf(raw) {
    const f = fold(raw);
    const m = f.match(/(\d+(?:[.,]\d+)?)\s*[:x×*\/]\s*(\d+(?:[.,]\d+)?)/);
    if (m) {
      const r = parseFloat(m[1].replace(",", ".")) / parseFloat(m[2].replace(",", "."));
      if (r > 0 && isFinite(r)) return { format: r < 0.8 ? "vertical" : "wide", ratio: r, label: m[1] + ":" + m[2] };
    }
    if (/doc|vertical|dung/.test(f)) return { format: "vertical", ratio: 9 / 16 };
    if (/vuong|square/.test(f)) return { format: "wide", ratio: 1, label: "1:1" };
    return { format: "wide", ratio: 16 / 9 };
  }
  // "Tiếng" column: Có / Không. Empty = guess from the group (LED clips are usually silent)
  const soundOf = (raw) => { const v = fold(raw || ""); return !v ? null : /^(co|yes|true|1|x)$/.test(v) ? true : /^(khong|no|false|0)$/.test(v) ? false : null; };
  async function mergeSheet() {
    if (!D.sheetId) return;
    try {
      const r = await fetch(`https://docs.google.com/spreadsheets/d/${D.sheetId}/gviz/tq?tqx=out:csv`, { cache: "no-store" });
      if (!r.ok) throw new Error(r.status);
      const all = parseCSV(await r.text());
      const head = (all[0] || []).map(fold);
      // find each column by its header, so columns can be moved or added in the sheet
      const col = (re, dflt) => { const i = head.findIndex((h) => re.test(h)); return i < 0 ? dflt : i; };
      const C = { link: col(/link|url/, 0), grp: col(/nhom|group/, 1), frame: col(/khung|frame|size|ti le/, 2),
                  title: col(/^ten|title|name/, 3), show: col(/hien|show/, 4), proj: col(/du an|project/, -1),
                  sound: col(/tieng|am thanh|sound|audio/, -1) };
      const bySec = {};
      all.slice(1).forEach((row) => {
        const get = (k) => (C[k] >= 0 ? (row[C[k]] || "").trim() : "");
        const id = groupOf(get("grp")); if (!id) return;
        const s = fold(get("show")); if (s && /^(khong|no|false|0|an)$/.test(s)) return;
        (bySec[id] = bySec[id] || []).push({ video: get("link"), title: get("title") || "Video", project: get("proj"), sound: soundOf(get("sound")), ...frameOf(get("frame")) });
      });
      D.sections.forEach((sec) => { if (bySec[sec.id]) sec.items = bySec[sec.id]; });
    } catch (e) { console.warn("Sheet not loaded, using data.js", e); }
  }
  await mergeSheet();
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- video helpers ---------- */
  function parseVideo(url) {
    if (!url) return null;
    let m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/))([\w-]{11})/);
    if (m) return { kind: "yt", id: m[1],
      embed: `https://www.youtube-nocookie.com/embed/${m[1]}?autoplay=1&rel=0&playsinline=1`,
      loop: `https://www.youtube-nocookie.com/embed/${m[1]}?autoplay=1&mute=1&loop=1&playlist=${m[1]}&controls=0&playsinline=1&rel=0&modestbranding=1&disablekb=1&enablejsapi=1`,
      thumb: `https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg` };
    m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (m) return { kind: "vimeo", id: m[1], embed: `https://player.vimeo.com/video/${m[1]}?autoplay=1`,
      loop: `https://player.vimeo.com/video/${m[1]}?background=1`, thumb: null };
    m = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]{20,})/);
    if (m) return { kind: "drive", id: m[1], embed: `https://drive.google.com/file/d/${m[1]}/preview`,
      loop: null, thumb: `https://drive.google.com/thumbnail?id=${m[1]}&sz=w1000` };   // Drive can't autoplay: thumbnail only, plays on click
    if (/\.(mp4|webm|mov)(\?|#|$)/i.test(url)) return { kind: "file", src: url };
    return null;
  }
  // muted, looping preview that plays inside the frame
  function loopMedia(v, title) {
    if (v.kind === "file") return `<video class="thumb" src="${esc(v.src)}" autoplay muted loop playsinline preload="metadata" aria-hidden="true"></video>`;
    return `<iframe class="loop" data-src="${v.loop}" title="${esc(title)} (preview)" tabindex="-1" allow="autoplay; encrypted-media" loading="lazy"></iframe>`;
  }
  const ratioOf = (it) => it.ratio || (it.format === "vertical" ? 9 / 16 : 16 / 9);
  const frameHTML = (format, inner, ratio, extra = "") =>
    `<div class="frame ${format === "vertical" ? "frame-vert" : "frame-wide"}"${ratio ? ` style="--ar:${ratio.toFixed(4)}"` : ""}>
       <span class="p p1"></span><span class="p p2"></span><span class="p p3"></span>
       <div class="win">${inner}</div>${extra}
     </div>`;
  const placeholder = (format, title, label) =>
    `<div class="placeholder"><div>VIDEO ${label || (format === "vertical" ? "9:16" : "16:9")}<small>${esc(title)} — coming soon</small></div></div>`;

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

  /* ---------- tabs + panels ---------- */
  const PAGE = 6;                 // cards shown per grid before "LOAD MORE"
  const PLAYLISTS = {};
  const tabs = $("#tabs"), panels = $("#panels");
  D.sections.forEach((sec, i) => {
    tabs.insertAdjacentHTML("beforeend",
      `<button class="tab" role="tab" id="tab-${sec.id}" aria-controls="panel-${sec.id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">
         <span class="num">${sec.num}</span><img src="${sec.icon}" alt="">${esc(sec.title.join(" "))}
       </button>`);
    const card = (it, k, proj) => {
      const v = parseVideo(it.video);
      const ar = ratioOf(it), cls = ar >= 4 ? " item-ultra item-pano" : ar >= 2.2 ? " item-ultra" : "";   // pano: LED walls like 6400×768
      if (!v) return `<article class="item reveal${cls}" aria-label="${esc(it.title)}">${frameHTML(it.format, placeholder(it.format, it.title, it.label), ar)}${caption(it.title)}</article>`;
      const pre = (D.previews || {})[Object.keys(D.previews || {}).find((k) => fold(k) === fold(it.title || "")) || ""];
      const still = pre
        ? `<video class="thumb" data-src="${esc(pre.src)}"${pre.poster ? ` poster="${esc(pre.poster)}"` : ""} muted loop playsinline preload="none" aria-hidden="true"></video>`
        : v.kind === "file"
        ? `<video class="thumb" src="${esc(v.src)}#t=0.5" muted loop playsinline preload="metadata" aria-hidden="true"></video>`
        : v.thumb ? `<img class="thumb" src="${v.thumb}" alt="" loading="lazy">` : `<div class="placeholder"><div>▶</div></div>`;
      const media = `<div class="pv" data-video="${esc(it.video)}">${still}</div>` +
        `<button class="open cover" type="button" data-video="${esc(it.video)}" data-title="${esc(it.title)}" data-format="${it.format}" data-ratio="${ar}" data-list="${proj ? proj.key : sec.id}" data-idx="${k}" aria-label="${proj ? `Open ${esc(proj.name)}: ${proj.count} clips` : `Play ${esc(it.title)}${it.sound ? " with sound" : ""}`}"><span class="sound">${proj ? `▶ VIEW ALL ${proj.count} CLIPS` : feed ? "⤢ EXPAND" : it.sound ? "▶ PLAY WITH SOUND" : "▶ PLAY"}</span></button>` +
        (feed && it.sound && v.kind !== "drive" ? `<button class="mute-btn" type="button" aria-pressed="false" aria-label="Turn sound on for ${esc(it.title)}">🔇</button>` : "");
      return `<article class="item reveal${cls}${proj ? " item-project" : ""}" aria-label="${esc(proj ? proj.name : it.title)}">${frameHTML(it.format, media, ar)}${caption(proj ? proj.name : it.title, proj)}${proj ? strip(proj) : ""}</article>`;
    };
    // event / video name, always visible under the frame
    const feed = sec.id === "game-ads";       // big volume: no names, clips play by themselves while scrolling
    const caption = (name, proj) => feed ? "" : `<p class="item-cap"><span>${esc(name)}</span>${proj ? `<b>${proj.count} CLIPS</b>` : ""}</p>`;
    sec.items.forEach((it) => {
      if (it.sound == null) it.sound = sec.id !== "led-visual";
      const k = Object.keys(D.previews || {}).find((x) => fold(x) === fold(it.title || ""));
      if (k && D.previews[k].frame) Object.assign(it, frameOf(D.previews[k].frame));
      if (k) { it.previewSrc = D.previews[k].src; it.ytPad = D.previews[k].ytPad || 0; it.viewPreview = !!D.previews[k].viewer; }
    });
    // project card: a row of small thumbnails for the other clips, the last tile shows "+N"
    const strip = (proj) => {
      const clips = PLAYLISTS[proj.key], rest = clips.length - 1;
      const shown = rest <= 4 ? rest : 3;
      const tile = (c, i, more) => {
        const v = parseVideo(c.video);
        const img = v && v.thumb ? `<img src="${v.thumb}" alt="" loading="lazy">` : "";
        return `<button class="open strip-tile${more ? " strip-more" : ""}" type="button" data-video="${esc(c.video)}" data-list="${proj.key}" data-idx="${i}"
          aria-label="${more ? `See ${more} more clips of ${esc(proj.name)}` : `Play ${esc(proj.name)} clip ${i + 1}`}">${img}${more ? `<span>+${more}</span>` : ""}</button>`;
      };
      let html = "";
      for (let i = 1; i <= shown; i++) html += tile(clips[i], i);
      if (rest > shown) html += tile(clips[shown + 1], shown + 1, rest - shown);
      return `<div class="clip-strip" style="--n:${Math.max(4, html.split("strip-tile").length - 1)}">${html}</div>`;
    };
    // rows with the same "Dự án" collapse into one project card; its clips get their own ◀ ▶ playlist
    const groups = new Map(), loose = [];
    // no "Dự án" value? rows that share the same name (e.g. 7 × "VTC – ITC 20") are treated as one project
    const nameCount = {};
    sec.items.forEach((it) => { const k = fold(it.title || ""); nameCount[k] = (nameCount[k] || 0) + 1; });
    sec.items.forEach((it) => {
      if (!it.project && nameCount[fold(it.title || "")] > 1) it.project = it.title;
      if (!it.project) return loose.push(it);
      if (!groups.has(it.project)) { groups.set(it.project, []); loose.push({ __proj: it.project }); }
      groups.get(it.project).push(it);
    });
    const single = PLAYLISTS[sec.id] = [];        // every card that plays on its own, in page order
    const indexed = loose.map((it) => {
      if (it.__proj) {
        const all = groups.get(it.__proj), clips = all.filter((c) => parseVideo(c.video));
        if (clips.length > 1) {
          const key = `${sec.id}::${it.__proj}`;
          PLAYLISTS[key] = clips;
          return { it: clips[0], k: 0, proj: { key, name: it.__proj, count: clips.length } };
        }
        it = clips[0] || all[0];                    // 0–1 playable clips: an ordinary card
      }
      return { it, k: parseVideo(it.video) ? single.push(it) - 1 : -1 };
    });
    const grid = (list, cls) => {
      if (!list.length) return "";
      const html = list.map(({ it, k, proj }, m) => card(it, k, proj).replace('<article class="item', `<article ${m >= PAGE ? "hidden " : ""}class="item`)).join("");
      const more = list.length > PAGE ? `<button class="btn btn-white more" type="button" data-more>LOAD MORE <span>(${list.length - PAGE})</span></button>` : "";
      return `<div class="grid ${cls}">${html}</div>${more}`;
    };
    const vert = indexed.filter((x) => x.it.format === "vertical"),
          wide = indexed.filter((x) => x.it.format !== "vertical" && ratioOf(x.it) < 2.2),
          ultra = indexed.filter((x) => x.it.format !== "vertical" && ratioOf(x.it) >= 2.2);   // very wide LED walls get their own full-width row
    panels.insertAdjacentHTML("beforeend",
      `<div class="panel${sec.id === "game-ads" ? " feed" : ""}" role="tabpanel" id="panel-${sec.id}" aria-labelledby="tab-${sec.id}" ${i ? "hidden" : ""}>
         <div class="panel-head">
           <h3 class="panel-title name-block"><span class="nb nb-1">${esc(sec.title[0])}</span><span class="nb nb-2">${esc(sec.title[1])}</span></h3>
           <div class="panel-side"><p>${esc(sec.blurb)}</p>${sec.stat ? `<span class="stat"><b>${esc(sec.stat.value)}</b>${esc(sec.stat.label)}</span>` : ""}</div>
         </div>
         ${grid(vert, "grid-vert")}
         ${grid(wide, "grid-wide")}
         ${grid(ultra, "grid-ultra")}
         ${sec.archive ? `<a class="archive" href="${esc(sec.archive.url)}" target="_blank" rel="noopener">
           <span class="archive-k">${esc(sec.archive.kicker || "")}</span>
           <span class="archive-t">${esc(sec.archive.label)} <i aria-hidden="true">↗</i></span></a>` : ""}
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
  /* ---------- hand-drawn circle that goes round the tabs (2.5 s each) so visitors notice the other categories ---------- */
  (() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    tabs.style.position = "relative";
    tabs.insertAdjacentHTML("beforeend", `<svg class="tab-ring" aria-hidden="true"><path pathLength="1"/></svg>`);
    const ring = tabs.querySelector(".tab-ring");
    let k = 0, timer = null, stopped = false, visible = false;
    function place() {
      const b = tabBtns[k], r = b.getBoundingClientRect(), p = tabs.getBoundingClientRect();
      ring.style.left = `${r.left - p.left - 26}px`; ring.style.top = `${r.top - p.top - 22}px`;
      const w = r.width + 52, h = r.height + 44;
      ring.style.width = `${w}px`; ring.style.height = `${h}px`; ring.setAttribute("viewBox", `0 0 ${w} ${h}`);
      // a loose marker loop drawn in real pixels (so the stroke keeps one thickness), ending past its start
      const X = (v) => (v / 100 * w).toFixed(1), Y = (v) => (v / 40 * h).toFixed(1);
      ring.querySelector("path").setAttribute("d",
        `M${X(10)} ${Y(24)}C${X(7)} ${Y(9)} ${X(52)} ${Y(3)} ${X(86)} ${Y(7)}C${X(99)} ${Y(9)} ${X(100)} ${Y(22)} ${X(92)} ${Y(29)}` +
        `C${X(78)} ${Y(40)} ${X(26)} ${Y(40)} ${X(12)} ${Y(32)}C${X(3)} ${Y(27)} ${X(5)} ${Y(15)} ${X(22)} ${Y(10)}`);
      ring.style.rotate = `${(k % 2 ? 2 : -2.5)}deg`;
    }
    function draw() {
      if (stopped || !visible) return;
      place();
      ring.classList.remove("draw"); void ring.getBoundingClientRect();     // moved while invisible…
      ring.classList.add("on", "draw");                                      // …then the marker draws itself round the next tab
      timer = setTimeout(() => { ring.classList.remove("on"); timer = setTimeout(() => { k = (k + 1) % tabBtns.length; draw(); }, 450); }, 2500);
    }
    const stop = () => { stopped = true; clearTimeout(timer); ring.classList.remove("on"); };
    tabBtns.forEach((b) => b.addEventListener("click", stop));          // once someone uses the tabs, the hint has done its job
    new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
      if (visible && !stopped && !timer) draw();
      if (!visible) { clearTimeout(timer); timer = null; ring.classList.remove("on"); }
    }, { threshold: 0.6 }).observe(tabs);
    addEventListener("resize", () => { if (ring.classList.contains("on")) place(); });
  })();

  tabBtns.forEach((b, i) => {
    b.addEventListener("click", () => select(b));
    b.addEventListener("keydown", (e) => {
      const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (d) { e.preventDefault(); select(tabBtns[(i + d + tabBtns.length) % tabBtns.length], true); }
    });
  });

  /* ---------- "best on desktop" note: phones and tablets, once per visitor ---------- */
  (() => {
    const note = $("#view-note"); let seen = false;
    try { seen = localStorage.getItem("view-note") === "1"; } catch (e) {}
    if (seen || !matchMedia("(max-width: 1024px), (pointer: coarse)").matches || matchMedia("(pointer: fine)").matches && innerWidth > 1024) return;
    setTimeout(() => { note.hidden = false; }, 1200);
    const hide = () => { note.hidden = true; try { localStorage.setItem("view-note", "1"); } catch (e) {} };
    note.querySelector("button").addEventListener("click", hide);
    setTimeout(hide, 12000);
  })();

  /* ---------- about ---------- */
  $("#exp").innerHTML = D.experience.map((x) => `<li><b>${esc(x.company)}</b><span>${esc(x.years)}</span><em>${esc(x.role)}</em></li>`).join("");
  $("#soft").innerHTML = D.software.map((s) => `<li>${esc(s)}</li>`).join("");
  $("#ai").innerHTML = D.ai.map((s) => `<li>${esc(s)}</li>`).join("");
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

  /* ---------- background music (browsers only allow sound after a click) ---------- */
  const bgm = $("#bgm"), mBtn = $("#music"), player$ = $("#player");
  let musicOn = false, pausedForVideo = false;
  const M = D.music || {}, TR = M.tracks || (M.src ? [{ src: M.src, title: M.title || "", artist: M.credit || "" }] : []);
  let song = 0;
  const MODE_BTNS = `<button class="pl-btn pl-mode" type="button" data-pl="shuffle" aria-pressed="false" aria-label="Shuffle"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6.5h4.2l9 11H19M3 17.5h4.2l2.6-3.2M13.6 9.7l2.6-3.2H19" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M18 3.5l4 3-4 3zM18 14.5l4 3-4 3z"/></svg></button>` +
    `<button class="pl-btn pl-mode" type="button" data-pl="repeat" aria-pressed="true" aria-label="Repeat"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 11V8h12.5M19 13v3H6.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M16 4.5l4 3.5-4 3.5zM8 12.5l-4 3.5 4 3.5z"/></svg><i class="one">1</i></button>`;
  const plTitle = $("#pl-title"), plArtist = $("#pl-artist"), seek = $("#pl-seek"), vol = $("#pl-vol"), list$ = $("#pl-list");
  const fmt = (x) => isFinite(x) ? `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, "0")}` : "";
  function load(i) {
    song = (i + TR.length) % TR.length;
    bgm.src = TR[song].src;
    plTitle.textContent = TR[song].title; plArtist.textContent = TR[song].artist;
    mBtn.title = `${TR[song].title} — ${TR[song].artist}${M.credit ? " · " + M.credit : ""}`;
    list$.querySelectorAll("li[data-k]").forEach((li) => li.classList.toggle("on", +li.dataset.k === song));
    seek.value = 0;
  }
  if (TR.length) {
    player$.hidden = false;
    bgm.volume = M.volume ?? 0.35; vol.value = Math.round(bgm.volume * 100);
    list$.innerHTML = `<li class="pl-head"><span>PLAYLIST · ${TR.length}</span>${MODE_BTNS}</li>` + TR.map((t, k) => `<li data-k="${k}"><button type="button" data-track="${k}"><span class="n">${String(k + 1).padStart(2, "0")}</span><b>${esc(t.title)}</b><span>${esc(t.artist)}</span></button></li>`).join("") +
      (M.credit ? `<li class="pl-credit">Music: ${esc(M.credit)}</li>` : "");
    load(0);
    mBtn.insertAdjacentHTML("beforeend", '<span class="music-hint">♪ turn on music</span>');
    setTimeout(() => mBtn.querySelector(".music-hint")?.remove(), 7000);
  }
  // shuffle + repeat (all / one / off); remembered between visits
  let shuffle = false, repeat = "all", order = [];
  try { shuffle = localStorage.getItem("pl-shuffle") === "1"; repeat = localStorage.getItem("pl-repeat") || "all"; } catch (e) {}
  const save = () => { try { localStorage.setItem("pl-shuffle", shuffle ? "1" : "0"); localStorage.setItem("pl-repeat", repeat); } catch (e) {} };
  function makeOrder() {
    order = TR.map((_, k) => k);
    if (shuffle) {              // random order that starts with the song now playing
      for (let k = order.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [order[k], order[j]] = [order[j], order[k]]; }
      order.splice(order.indexOf(song), 1); order.unshift(song);
    }
  }
  function step(dir) {          // index of the next / previous song, or -1 at the end when repeat is off
    const at = order.indexOf(song) + dir;
    if (at >= order.length || at < 0) {
      if (repeat === "off" && dir > 0) return -1;
      if (shuffle && dir > 0) { makeOrder(); return order[1] ?? order[0]; }
      return order[(at + order.length) % order.length];
    }
    return order[at];
  }
  function paintModes() {
    player$.querySelectorAll('[data-pl="shuffle"]').forEach((b) => { b.setAttribute("aria-pressed", shuffle); b.title = shuffle ? "Shuffle: on" : "Shuffle: off"; });
    player$.querySelectorAll('[data-pl="repeat"]').forEach((b) => { b.dataset.mode = repeat; b.setAttribute("aria-pressed", repeat !== "off");
      b.title = b.ariaLabel = { all: "Repeat: all songs", one: "Repeat: this song", off: "Repeat: off" }[repeat]; });
    bgm.loop = repeat === "one";
  }
  $(".pl-modes").innerHTML = MODE_BTNS;
  makeOrder(); paintModes();
  bgm.addEventListener("ended", () => {
    const n = step(1);
    if (n < 0) { setMusic(false); load(order[0]); return; }      // end of the playlist with repeat off
    load(n); if (musicOn) bgm.play().catch(() => {});
  });
  bgm.addEventListener("timeupdate", () => { if (!seeking && bgm.duration) seek.value = Math.round(bgm.currentTime / bgm.duration * 1000);
    seek.title = `${fmt(bgm.currentTime)} / ${fmt(bgm.duration)}`; });
  let seeking = false;
  seek.addEventListener("input", () => { seeking = true; });
  seek.addEventListener("change", () => { if (bgm.duration) bgm.currentTime = seek.value / 1000 * bgm.duration; seeking = false; });
  vol.addEventListener("input", () => { bgm.volume = vol.value / 100; });
  player$.addEventListener("click", (e) => {
    const b = e.target.closest("[data-pl],[data-track]"); if (!b) return;
    const act = b.dataset.pl;
    if (b.dataset.track) { load(+b.dataset.track); if (shuffle) makeOrder(); setMusic(true); return; }
    if (act === "toggle") setMusic(!musicOn);
    if (act === "next" || act === "prev") {
      if (act === "prev" && bgm.currentTime > 3) bgm.currentTime = 0;     // like any player: first press restarts the song
      else { const n = step(act === "next" ? 1 : -1); load(n < 0 ? order[0] : n); }
      if (musicOn) { pausedForVideo = false; bgm.play().catch(() => {}); }
    }
    if (act === "shuffle") { shuffle = !shuffle; makeOrder(); paintModes(); save(); }
    if (act === "repeat") { repeat = { all: "one", one: "off", off: "all" }[repeat]; paintModes(); save(); }
    if (act === "list") { const open = list$.hidden; list$.hidden = !open; b.setAttribute("aria-expanded", open); }
  });
  document.addEventListener("click", (e) => { if (!list$.hidden && !e.target.closest("#player")) { list$.hidden = true; $('[data-pl="list"]').setAttribute("aria-expanded", false); } });
  /* ---------- the page moves with the music: lightning + sticker kick on the beat, pixel column = equalizer ---------- */
  let actx, analyser, freq, vizOn = false;
  const root = document.documentElement, eq = document.createElement("canvas");
  eq.className = "eq-wall"; eq.setAttribute("aria-hidden", "true"); document.body.appendChild(eq);
  const ectx = eq.getContext("2d");
  function startViz() {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    try {
      if (!actx) {
        actx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = actx.createAnalyser(); analyser.fftSize = 1024; analyser.smoothingTimeConstant = 0.5;
        actx.createMediaElementSource(bgm).connect(analyser); analyser.connect(actx.destination);
        freq = new Uint8Array(analyser.frequencyBinCount);
      }
      actx.resume();
    } catch (e) { return; }
    if (!vizOn) { vizOn = true; requestAnimationFrame(tick); }
  }
  let kick = 0, avgBass = 0, prevBass = 0, lastBeat = 0;
  const levels = [];
  function tick(t) {
    const playing = !bgm.paused && !document.hidden;
    if (playing) analyser.getByteFrequencyData(freq); else freq.fill(0);
    // beat: bass energy jumps clearly above its running average
    let bass = 0; for (let i = 1; i < 8; i++) bass += freq[i]; bass /= 7 * 255;
    avgBass = avgBass * 0.94 + bass * 0.06;
    if (playing && bass > 0.22 && bass - prevBass > 0.03 && bass > avgBass * 1.06 && t - lastBeat > 220) { kick = 1; lastBeat = t; }
    prevBass = bass;
    kick *= 0.88; if (kick < 0.01) kick = 0;
    root.style.setProperty("--kick", kick.toFixed(3));
    drawEq(playing);
    if (playing || kick || levels.some((l) => l > 0.01)) requestAnimationFrame(tick);
    else { vizOn = false; root.style.setProperty("--kick", 0); ectx.clearRect(0, 0, eq.width, eq.height); }
  }
  function drawEq(playing) {
    const w = eq.clientWidth, h = eq.clientHeight; if (!w) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    if (eq.width !== Math.round(w * dpr) || eq.height !== Math.round(h * dpr)) { eq.width = Math.round(w * dpr); eq.height = Math.round(h * dpr); }
    ectx.setTransform(dpr, 0, 0, dpr, 0, 0); ectx.clearRect(0, 0, w, h);
    const cols = 4, cell = w / cols, rows = Math.ceil(h / cell), n = freq.length * 0.7;
    for (let r = 0; r < rows; r++) {
      // bottom row = deep bass, top = treble (log scale)
      const f = (rows - 1 - r) / Math.max(rows - 1, 1), a = Math.floor(2 + Math.pow(n, f * 0.98)), b = Math.max(a + 1, Math.floor(2 + Math.pow(n, (f + 1 / rows) * 0.98)));
      let v = 0; for (let i = a; i < b && i < freq.length; i++) v = Math.max(v, freq[i]);
      v = playing ? Math.pow(v / 255, 1.6) * (1 + f * 0.8) : 0;
      levels[r] = Math.max(v, (levels[r] || 0) * 0.86);           // fall slowly, like a real meter
      const lit = Math.min(cols, Math.round(levels[r] * cols));
      for (let c = 0; c < lit; c++) {
        ectx.fillStyle = c === lit - 1 && lit === cols ? "#ff3b3b" : (r + c) % 2 ? "#f9f000" : "#fff36b";
        ectx.fillRect(w - (c + 1) * cell + 1, r * cell + 1, cell - 2, cell - 2);
      }
    }
  }
  function setMusic(on) {
    musicOn = on;
    mBtn.setAttribute("aria-pressed", on);
    mBtn.setAttribute("aria-label", on ? "Pause background music" : "Play background music");
    mBtn.querySelector(".music-hint")?.remove();
    if (on) { startViz(); bgm.play().catch(() => setMusic(false)); } else bgm.pause();
    player$.classList.toggle("on", on);
    const mainBtn = $('[data-pl="toggle"]'); mainBtn.setAttribute("aria-label", on ? "Pause" : "Play");
  }
  mBtn.addEventListener("click", () => setMusic(!musicOn));

  /* ---------- lightbox (◀ ▶ through the section) ---------- */
  const lb = $("#lightbox"), player = $("#lb-player"), dialog = $(".lb-dialog");
  let lastFocus = null, list = [], pos = 0;
  function show(p) {
    pos = (p + list.length) % list.length;
    const it = list[pos];
    let v = parseVideo(it.video || it.src);
    // Drive squeezes very wide LED clips in its player: use the site's own copy (right shape) when there is one
    if (it.previewSrc && (!v || v.kind === "drive" || it.viewPreview)) v = { kind: "file", src: it.previewSrc };
    player.innerHTML = v.kind === "file"
      ? `<video src="${esc(v.src)}" controls autoplay playsinline${v.src === it.previewSrc ? " muted loop" : ""}></video>`
      : `<iframe src="${v.embed}" title="${esc(it.title)}" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowfullscreen></iframe>`;
    $("#lb-title").textContent = it.title + (v.src && v.src === it.previewSrc ? " · Highlight" : "");
    $("#lb-title").dataset.silent = it.sound === false ? "1" : "";
    syncMusic(it);
    hqTip(v);
    $("#lb-count").textContent = list.length > 1 ? `${pos + 1} / ${list.length}` : "";
    const ar = ratioOf(it);
    dialog.classList.remove("vert");
    dialog.style.width = `min(1400px, 92vw, calc(76vh * ${ar.toFixed(4)}))`;
    player.style.aspectRatio = ar.toFixed(4);
    player.classList.toggle("yt-crop", v.kind === "yt");
    cropPlayer();
    dialog.classList.toggle("single", list.length < 2);
  }
  // YouTube always shows the video title + channel along the top. The iframe is made taller than the
  // video so that bar lands in a black strip above the picture, and that strip is cut off.
  // Controls stay visible in a strip under the picture.
  function cropPlayer() {
    const f = player.querySelector("iframe");
    if (!player.classList.contains("yt-crop") || !f) {
      // Drive's player needs room for its play button and controls: a very wide LED clip gets a taller box
      // and Drive letterboxes the picture inside it instead of cutting its own player off
      const tall = f && /drive\.google/.test(f.src) && player.clientWidth / ratioOf(list[pos]) < 360;
      player.style.aspectRatio = tall ? "auto" : ratioOf(list[pos]).toFixed(4);
      player.style.height = tall ? `${Math.round(Math.min(440, innerHeight * 0.6))}px` : "";
      return;
    }
    const w = player.clientWidth, vh = w / ratioOf(list[pos]), pad = list[pos].ytPad;
    // ytPad: the clip was uploaded inside a taller black frame (YouTube squeezes anything wider than 4:1);
    // the iframe shows that whole frame, the box keeps only the real picture + the black strip with the controls
    const h = pad ? Math.round((w / pad - vh) / 2) : Math.round(Math.max(56, w * 0.055));
    player.style.aspectRatio = "auto";
    player.style.height = `${vh + h + (player.offsetHeight - player.clientHeight)}px`;   // + borders
    f.style.top = `${-h}px`; f.style.height = `${pad ? w / pad : vh + 2 * h}px`;
  }
  addEventListener("resize", () => { if (!lb.hidden) cropPlayer(); });
  document.addEventListener("click", (e) => {
    const b = e.target.closest("button.open[data-video]");
    if (b) {
      lastFocus = b;
      list = b.dataset.list ? PLAYLISTS[b.dataset.list] : [{ video: b.dataset.video, title: b.dataset.title, format: b.dataset.format, ratio: +b.dataset.ratio || 0 }];
      show(b.dataset.list ? +b.dataset.idx : 0);
      document.querySelectorAll('.mute-btn[aria-pressed="true"]').forEach((m) => setMute(m, true));
      lb.hidden = false; document.body.style.overflow = "hidden"; cropPlayer();
      $(".lb-close").focus();
    }
    if (e.target.closest("[data-close]")) close();
    if (e.target.closest("[data-prev]")) show(pos - 1);
    if (e.target.closest("[data-next]")) show(pos + 1);
  });
  // reminder to switch YouTube / Drive to their highest quality (they often start low); shown until "Got it"
  const tip = $("#hq-tip"); let tipT;
  function hqTip(v) {
    let off = false; try { off = localStorage.getItem("hq-tip") === "1"; } catch (e) {}
    clearTimeout(tipT); tip.classList.remove("show");
    if (off || !v || (v.kind !== "yt" && v.kind !== "drive")) { tip.hidden = true; return; }
    tip.hidden = false; void tip.offsetWidth; tip.classList.add("show");
    tipT = setTimeout(() => tip.classList.remove("show"), 7000);
  }
  tip.querySelector("[data-hq-off]").addEventListener("click", () => {
    tip.classList.remove("show"); try { localStorage.setItem("hq-tip", "1"); } catch (e) {}
  });
  // silent clips (most LED visuals) keep the site music going; clips with sound pause it
  function syncMusic(it) {
    if (!musicOn) return;
    if (it.sound === false) { if (pausedForVideo) { bgm.play().catch(() => {}); pausedForVideo = false; } }
    else if (!pausedForVideo) { bgm.pause(); pausedForVideo = true; }
  }
  function close() {
    if (lb.hidden) return;
    lb.hidden = true; player.innerHTML = ""; document.body.style.overflow = "";
    if (pausedForVideo && musicOn) bgm.play().catch(() => {});
    pausedForVideo = false;
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
    const vid = pv.querySelector("video.thumb");
    if (vid) { if (vid.dataset.src && !vid.src) vid.src = vid.dataset.src; vid.play().catch(() => {}); return; }   // own loop: loads only now
    if (!v.loop) return;
    pv.insertAdjacentHTML("beforeend", loopMedia(v, "").replace("data-src=", "src="));
  }
  function stopPreview(pv) {
    if (!pv.dataset.on) return;
    delete pv.dataset.on;
    const mbtn = pv.closest(".win").querySelector(".mute-btn");
    if (mbtn) setMute(mbtn, true);
    const vid = pv.querySelector("video"); if (vid) vid.pause();
    pv.querySelectorAll("iframe").forEach((f) => f.remove());
  }
  const centreIO = !hoverable && "IntersectionObserver" in window
    ? new IntersectionObserver((es) => es.forEach((en) => en.isIntersecting ? startPreview(en.target) : stopPreview(en.target)),
        { rootMargin: "-35% 0px -35% 0px" })          // only the card in the middle band of the screen plays
    : null;
  // Game Ads feed: every clip that is mostly on screen plays (muted), and stops once it scrolls away
  const feedIO = "IntersectionObserver" in window
    ? new IntersectionObserver((es) => es.forEach((en) => en.isIntersecting ? startPreview(en.target) : stopPreview(en.target)), { threshold: 0.55 })
    : null;
  function watchPreviews() {
    document.querySelectorAll(".item:not([hidden]) .pv:not([data-w])").forEach((pv) => {
      pv.dataset.w = "1";
      if (feedIO && pv.closest(".feed")) feedIO.observe(pv);
      else if (hoverable) {
        const item = pv.closest(".item");
        item.addEventListener("pointerenter", () => startPreview(pv));
        item.addEventListener("pointerleave", () => stopPreview(pv));
        item.addEventListener("focusin", () => startPreview(pv));
        item.addEventListener("focusout", () => stopPreview(pv));
      } else if (centreIO) centreIO.observe(pv);
    });
  }
  watchPreviews();

  // sound on/off right inside a feed card (one clip with sound at a time)
  function setMute(btn, mute) {
    const win = btn.closest(".win"), f = win.querySelector(".pv iframe"), vid = win.querySelector(".pv video");
    if (f) f.contentWindow?.postMessage(JSON.stringify({ event: "command", func: mute ? "mute" : "unMute", args: [] }), "*");
    if (!mute && f) f.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "setVolume", args: [100] }), "*");
    if (vid) vid.muted = mute;
    btn.setAttribute("aria-pressed", String(!mute)); btn.textContent = mute ? "🔇" : "🔊";
    btn.closest(".item").classList.toggle("loud", !mute);
  }
  panels.addEventListener("click", (e) => {
    const btn = e.target.closest(".mute-btn"); if (!btn) return;
    const turnOn = btn.getAttribute("aria-pressed") !== "true";
    document.querySelectorAll('.mute-btn[aria-pressed="true"]').forEach((b) => b !== btn && setMute(b, true));
    startPreview(btn.closest(".win").querySelector(".pv"));
    setTimeout(() => setMute(btn, !turnOn), 0);
    if (turnOn && musicOn && !pausedForVideo) { bgm.pause(); pausedForVideo = true; }
    if (!turnOn && pausedForVideo && lb.hidden) { bgm.play().catch(() => {}); pausedForVideo = false; }
  });

  // feed: the next batch loads by itself when the visitor nears the end of the grid
  if ("IntersectionObserver" in window) {
    const moreIO = new IntersectionObserver((es) => es.forEach((en) => en.isIntersecting && en.target.isConnected && en.target.click()), { rootMargin: "0px 0px 700px 0px" });
    document.querySelectorAll(".feed [data-more]").forEach((b) => moreIO.observe(b));
  }

  /* ---------- page-long lightning bolt ---------- */
  const mb = $("#megabolt");
  function drawBolt() {
    // measure the page without the bolt itself, or the bolt keeps making the page longer
    mb.setAttribute("height", 0); mb.style.height = "0px";
    const W = document.documentElement.clientWidth, H = document.body.scrollHeight;
    mb.style.height = "";
    const phone = W < 700;
    // one block of the bolt, traced from Trang's sketch (x as share of the width, y as share of the block height):
    // long diagonal down-left -> sharp point -> almost flat stroke across to the right -> point ->
    // diagonal down-left -> point -> shallow stroke down-right -> point -> back to the start column
    const P = [[0.65, 0], [0.2, 0.34], [0.93, 0.25], [0.36, 0.62], [0.9, 0.77], [0.65, 1]];
    const HW = [0.028, 0.018, 0.048, 0.052, 0.04];               // half width of each stroke (share of width); the flat one is thin
    const SHIFT = 0.1;                                          // whole bolt moved left by 10% of the width
    const blockH = Math.max(W * 1.05, 1000);
    const pts = [], hw = [];
    for (let k = 0, y0 = -blockH * 0.05; y0 < H + blockH; k++, y0 += blockH) {
      P.forEach(([px, py], i) => { if (k && i === 0) return; pts.push([W * (px - SHIFT), y0 + blockH * py]); });
      HW.forEach((w) => hw.push(Math.max(phone ? 13 : 19, W * w * 0.8)));   // whole bolt 20% thinner
    }
    // keep the first flat stroke clear of the VIDEO EDITOR sticker: push its two points down until it passes below
    const st = document.querySelector(".sticker-wrap");
    if (st && pts.length > 3) {
      const r = st.getBoundingClientRect(), top = scrollY;
      const right = r.right + 140, bottom = r.bottom + top + 40;             // +140 for the arrows beside EDITOR
      const [a, b] = [pts[1], pts[2]];
      const yAt = (x) => a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]);
      const need = bottom + hw[1] - Math.min(yAt(r.left), yAt(Math.min(right, b[0])));
      if (need > 0) for (let i = 1; i < pts.length; i++) pts[i][1] += need;   // move the rest of the bolt down too, so its angles stay the same and strokes never overlap
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
