/* TRANGSPACE — scrapbook edition. Same content as the main site: data.js + the Google Sheet. */
(async () => {
  const D = window.PORTFOLIO, $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fold = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").toLowerCase().trim();
  const abs = (p) => /^(https?:)?\//.test(p) ? p : "/" + p;      // data.js paths are written for the root page

  /* ---------- VHS tape: running timecode (25 fps) ---------- */
  const tc = $("#tc"), t0 = performance.now(), p2 = (n) => String(n).padStart(2, "0");
  (function tick() {
    const f = Math.floor((performance.now() - t0) / 40);
    tc.textContent = `${p2(Math.floor(f / 90000))}:${p2(Math.floor(f / 1500) % 60)}:${p2(Math.floor(f / 25) % 60)}:${p2(f % 25)}`;
    requestAnimationFrame(tick);
  })();

  /* ---------- trang.pod keychain: click to open, shows the photo (zine/img/face.jpg) or a pixel face ---------- */
  const charm = $("#charm"), face = $("#face");
  face.onload = () => { face.hidden = false; $("#pix-face").hidden = true; };
  face.src = "/zine/img/face.jpg";
  /* it stays on its hook: grab it and swing it round the hook (a full spin works too); let go and it swings back like a pendulum */
  let drag = null, dragged = false, ang = 0, angV = 0, raf = 0;
  const deg = (r) => r * 180 / Math.PI;
  const pointerAng = (e) => deg(-Math.atan2(e.clientX - drag.cx, e.clientY - drag.cy));
  function swing() {
    if (!drag) { angV += -Math.sin(ang * Math.PI / 180) * 0.9; angV *= 0.985; ang += angV; }   // gravity + air
    charm.style.rotate = `${ang.toFixed(2)}deg`;
    if (drag || Math.abs(angV) > 0.03 || Math.abs(((ang % 360) + 540) % 360 - 180) > 0.3) raf = requestAnimationFrame(swing);
    else { raf = 0; ang = 0; charm.style.rotate = ""; charm.style.animation = ""; }           // back to the idle sway
  }
  charm.addEventListener("pointerdown", (e) => {
    if (e.button) return;
    const r = charm.querySelector(".charm-ring").getBoundingClientRect();
    drag = { cx: r.left + r.width / 2, cy: r.top + r.height / 2, x: e.clientX, y: e.clientY };
    drag.last = pointerAng(e); dragged = false;
    if (!raf) { const m = getComputedStyle(charm).rotate; ang = m && m !== "none" ? parseFloat(m) : 0; }
    charm.setPointerCapture(e.pointerId);
  });
  charm.addEventListener("pointermove", (e) => {
    if (!drag) return;
    if (!dragged && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 6) return;
    if (!dragged) { dragged = true; charm.classList.add("dragging"); charm.style.animation = "none"; if (!raf) raf = requestAnimationFrame(swing); }
    const a = pointerAng(e); let d = a - drag.last; d -= Math.round(d / 360) * 360;   // no jump when passing the top
    ang += d; angV = d; drag.last = a;
  });
  const end = () => { if (!drag) return; drag = null; charm.classList.remove("dragging"); if (!raf) raf = requestAnimationFrame(swing); };
  charm.addEventListener("pointerup", end); charm.addEventListener("pointercancel", end);
  charm.addEventListener("click", (e) => {
    if (dragged) { dragged = false; e.preventDefault(); return; }
    const open = charm.classList.toggle("open");
    charm.setAttribute("aria-pressed", open); charm.setAttribute("aria-label", open ? "Close the keychain" : "Open the keychain");
  });

  /* ---------- THU TRANG keycaps: mechanical keyboard click (made in Web Audio, no sound file) ---------- */
  let ac;
  function clack(i) {
    try { ac ||= new (window.AudioContext || window.webkitAudioContext)(); ac.resume(); } catch (e) { return; }
    const t = ac.currentTime, out = ac.createGain(); out.gain.value = 0.55; out.connect(ac.destination);
    // the click: a very short burst of filtered noise
    const len = Math.floor(ac.sampleRate * 0.035), buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
    for (let k = 0; k < len; k++) d[k] = (Math.random() * 2 - 1) * Math.pow(1 - k / len, 3);
    const n = ac.createBufferSource(), bp = ac.createBiquadFilter();
    n.buffer = buf; bp.type = "bandpass"; bp.frequency.value = 2600 + (i % 5) * 260 + Math.random() * 300; bp.Q.value = 1.4;
    n.connect(bp).connect(out); n.start(t);
    // the thock: a quick low tone as the key bottoms out
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = "triangle"; o.frequency.setValueAtTime(190 + Math.random() * 40, t); o.frequency.exponentialRampToValueAtTime(90, t + 0.05);
    g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
    o.connect(g).connect(out); o.start(t); o.stop(t + 0.08);
  }
  document.querySelectorAll(".keys i").forEach((k, i) => {
    k.addEventListener("pointerdown", () => { clack(i); k.classList.add("down"); });
    ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => k.addEventListener(ev, () => k.classList.remove("down")));
  });

  /* ---------- small text bits ---------- */
  const d = new Date(), M = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
  $("#updated").textContent = `${d.getDate()} ${M[d.getMonth()]} ${d.getFullYear()}`;
  $("#yr").textContent = d.getFullYear();
  // software as little app tiles (abbreviation + full name)
  const ICON = { "after effects": ["Ae", "#3b2a6b", "#c9a7ff"], "premiere pro": ["Pr", "#2a1f5c", "#a7a2ff"], "photoshop": ["Ps", "#0f2a44", "#6fc4ff"],
    "illustrator": ["Ai", "#3a2008", "#ffad3b"], "blender": ["Bl", "#2b2b2b", "#ff9a2e"], "google veo": ["Veo", "#13233f", "#8ab4ff"],
    "kling ai": ["Kl", "#10261d", "#62e0a1"], "dreamania": ["Dm", "#3a1230", "#ff8bd1"] };
  const tile = (n) => { const [ab, bg, fg] = ICON[fold(n)] || [n.slice(0, 2), "#222", "#c3d84a"];
    return `<li><span class="app" style="background:${bg};color:${fg};border-color:${fg}">${esc(ab)}</span><span>${esc(n)}</span></li>`; };
  $("#soft").innerHTML = D.software.map(tile).join("");
  $("#ai").innerHTML = D.ai.map(tile).join("");
  $("#exp").innerHTML = D.experience.map((e) => `<div class="exp-item"><b>${esc(e.company)} · ${esc(e.years)}</b><span>${esc(e.role)}</span></div>`).join("");
  const C = D.contact;
  $("#mail").textContent = `✉ ${C.email}`;
  $("#tel").textContent = `☏ ${C.phone}`; $("#tel").href = `tel:${C.phone.replace(/\s/g, "")}`;
  $("#loc").textContent = `⌖ ${C.location}`;
  $("#mail").addEventListener("click", async (e) => {
    try { await navigator.clipboard.writeText(C.email); e.currentTarget.textContent = "✓ copied!"; } catch (er) { location.href = `mailto:${C.email}`; }
    setTimeout(() => ($("#mail").textContent = `✉ ${C.email}`), 1600);
  });
  // the message is delivered to Trang's inbox by FormSubmit (no mail app needed on the visitor's side);
  // if that service can't be reached, Gmail opens with the message already filled in
  $("#ask").addEventListener("submit", async (e) => {
    e.preventDefault();
    const from = $("#q-from").value.trim(), msg = $("#q").value.trim(), st = $("#ask-status"), btn = e.target.querySelector("button");
    if (!msg) return;
    btn.disabled = true; st.textContent = "sending…";
    try {
      const r = await fetch(`https://formsubmit.co/ajax/${C.email}`, { method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email: from, message: msg, _subject: "New message from TRANGSPACE", _template: "box", _captcha: "false" }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || String(j.success) === "false") throw 0;
      st.textContent = "✓ sent! i'll get back to you soon <3"; e.target.reset();
    } catch (er) {
      st.innerHTML = `couldn't send from here — <a href="https://mail.google.com/mail/?view=cm&to=${C.email}&su=${encodeURIComponent("Hello from your portfolio")}&body=${encodeURIComponent(msg)}" target="_blank" rel="noopener">open it in Gmail</a> or write to ${C.email}`;
    }
    btn.disabled = false;
  });

  /* ---------- videos: the sheet, with data.js as fallback ---------- */
  function parseVideo(url) {
    if (!url) return null; let m;
    if ((m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/))([\w-]{11})/)))
      return { kind: "yt", loop: `https://www.youtube-nocookie.com/embed/${m[1]}?autoplay=1&mute=1&loop=1&playlist=${m[1]}&controls=0&playsinline=1&rel=0&modestbranding=1&disablekb=1`, embed: `https://www.youtube-nocookie.com/embed/${m[1]}?autoplay=1&rel=0&modestbranding=1&playsinline=1`, thumb: `https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg` };
    if ((m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)))
      return { kind: "vimeo", loop: `https://player.vimeo.com/video/${m[1]}?autoplay=1&muted=1&loop=1&autopause=0&controls=0&title=0&byline=0&portrait=0&dnt=1`, embed: `https://player.vimeo.com/video/${m[1]}?autoplay=1&title=0&byline=0&portrait=0&dnt=1`, thumb: `https://vumbnail.com/${m[1]}.jpg` };
    if ((m = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([\w-]+)/)))
      return { kind: "drive", embed: `https://drive.google.com/file/d/${m[1]}/preview`, thumb: `https://drive.google.com/thumbnail?id=${m[1]}&sz=w600` };
    if (/\.(mp4|webm|mov)(\?|$)/i.test(url)) return { kind: "file", src: url };
    return null;
  }
  function parseCSV(t) {
    const rows = []; let row = [], cur = "", q = false;
    for (let i = 0; i < t.length; i++) {
      const c = t[i];
      if (q) { if (c === '"' && t[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
      else if (c === '"') q = true; else if (c === ",") { row.push(cur); cur = ""; }
      else if (c === "\n") { row.push(cur); rows.push(row); row = []; cur = ""; } else if (c !== "\r") cur += c;
    }
    if (cur || row.length) { row.push(cur); rows.push(row); }
    return rows;
  }
  const groupOf = (g) => { const f = fold(g); return /game/.test(f) ? "game-ads" : /led/.test(f) ? "led-visual" : /brand|product/.test(f) ? "brand-product" : null; };
  const isVert = (k) => { const f = fold(k); if (/doc|vert|9:16/.test(f)) return true; const m = f.match(/(\d+)\s*[x:]\s*(\d+)/); return m ? +m[2] > +m[1] : false; };
  const SECTIONS = D.sections.map((s) => ({ ...s, list: s.items.map((it) => ({ ...it, vert: it.format === "vertical" })) }));
  try {
    const r = await fetch(`https://docs.google.com/spreadsheets/d/${D.sheetId}/gviz/tq?tqx=out:csv`);
    if (!r.ok) throw 0;
    const rows = parseCSV(await r.text()), head = rows.shift().map(fold);
    const col = (re) => head.findIndex((h) => re.test(h));
    const ci = { link: col(/link/), group: col(/nhom|group/), frame: col(/khung|frame/), name: col(/ten|name|title/), show: col(/hien|show/), proj: col(/du an|project/) };
    const got = {};
    rows.forEach((rw) => {
      const g = groupOf(rw[ci.group]); if (!g) return;
      if (ci.show >= 0 && /^(khong|no|an)$/.test(fold(rw[ci.show]))) return;
      (got[g] ||= []).push({ video: (rw[ci.link] || "").trim(), title: (rw[ci.name] || "").trim(), project: ci.proj >= 0 ? (rw[ci.proj] || "").trim() : "", vert: isVert(rw[ci.frame]) });
    });
    SECTIONS.forEach((s) => { if (got[s.id]?.length) s.list = got[s.id]; });
  } catch (e) { /* keep data.js lists */ }

  // site-hosted highlight loops (e.g. the A80 LED wall) play instead of a squeezed Drive/YouTube copy
  const preview = (it) => { const k = Object.keys(D.previews || {}).find((x) => fold(x) === fold(it.title)); return k ? D.previews[k] : null; };
  // Game Ads: landscape clips first, then vertical; files named Game_creative_01, 02… in that order
  SECTIONS.filter((s) => s.id === "game-ads").forEach((s) => {
    s.list = [...s.list.filter((it) => !it.vert), ...s.list.filter((it) => it.vert)];
    s.list.forEach((it, i) => { it.fileName = `Game_creative_${String(i + 1).padStart(2, "0")}`; it.project = it.project || it.fileName; });
  });
  // same name (or same "Dự án") several times = one sub-folder
  SECTIONS.forEach((s) => {
    const n = {}; s.list.forEach((it) => { const k = fold(it.project || it.title); n[k] = (n[k] || 0) + 1; });
    const out = [], seen = {};
    s.list.forEach((it) => {
      const name = it.project || it.title, k = fold(name);
      if (n[k] > 1) { if (!seen[k]) out.push(seen[k] = { folder: true, title: name, list: [] }); seen[k].list.push(it); it.n = seen[k].list.length; }
      else out.push(it);
    });
    s.tree = out;
  });

  /* ---------- the explorer ---------- */
  const files = $("#xp-files"), path = $("#xp-path"), back = $("#xp-back"), count = $("#xp-count"), foot = $("#xp-foot");
  let stack = [], query = "";
  const fname = (it, n) => it.fileName ? it.fileName + ".mp4" : (it.title || "untitled").replace(/\s*[–—-]\s*/g, "_").replace(/\s+/g, "_") + (n ? `_${String(n).padStart(2, "0")}` : "") + ".mp4";
  function fileTile(it, list, i) {
    const v = parseVideo(it.video), pre = preview(it);
    if (!v && !pre) return `<div class="file ph" title="coming soon"><span class="thumb ${it.vert ? "v" : "w"}">coming soon</span><span class="name">${esc(fname(it))}</span></div>`;
    const bg = pre?.poster ? abs(pre.poster) : v?.thumb;
    return `<button class="file" type="button" data-i="${i}"><span class="thumb ${it.vert ? "v" : "w"}"${bg ? ` style="background-image:url('${bg}')"` : ""}></span><span class="name">${esc(fname(it, it.n))}</span></button>`;
  }
  let shown = [];
  function render() {
    if (typeof stopPv === "function") stopPv();
    const here = stack[stack.length - 1];
    back.disabled = !stack.length;
    path.textContent = "C:/trang/work/" + stack.map((x) => fold(x.title).replace(/[^a-z0-9]+/g, "_")).join("/") + (stack.length ? "/" : "");
    foot.innerHTML = here?.archive ? `↗ more where that came from: <a href="${esc(here.archive.url)}" target="_blank" rel="noopener">open the full archive</a>` : "› double-click is so 2005. one click opens it :)";
    if (query) {                                   // search: every clip whose name matches, from every folder
      shown = SECTIONS.flatMap((s) => s.list).filter((it) => fold(it.title).includes(query));
      count.textContent = `${shown.length} found`;
      files.innerHTML = shown.length ? shown.map((it, i) => fileTile(it, shown, i)).join("") : `<p class="xp-empty">no files called "${esc(query)}" :(</p>`;
      return;
    }
    if (!here) {
      shown = [];
      count.textContent = `${SECTIONS.length} folders`;
      files.innerHTML = SECTIONS.map((s, i) => `<button class="file folder c${i + 1}" type="button" data-s="${i}">
        <span class="thumb"><span class="fold"><i>${esc(s.num)}</i></span></span><span class="name">${esc(s.title.join(" "))}</span></button>`).join("");
      return;
    }
    const items = here.tree || here.list;
    shown = items.filter((x) => !x.folder);
    count.textContent = `${items.length} items`;
    let k = 0;
    files.innerHTML = items.map((x, j) => x.folder
      ? `<button class="file folder c2" type="button" data-f="${j}"><span class="thumb"><span class="fold"><i>${x.list.length}</i></span></span><span class="name">${esc(x.title)}</span></button>`
      : fileTile(x, shown, k++)).join("");
  }
  // hover a clip = it plays inside its thumbnail (muted); Drive can't autoplay, so those keep their picture
  const canHover = matchMedia("(hover: hover) and (pointer: fine)").matches;
  let pvTimer, pvOn = null;
  function stopPv() { clearTimeout(pvTimer); if (pvOn) { pvOn.querySelector(".pv")?.remove(); pvOn.classList.remove("playing", "loading"); pvOn = null; } }
  files.addEventListener("mouseover", (e) => {
    if (!canHover) return;
    const b = e.target.closest("button.file[data-i]"); if (!b || b === pvOn) return;
    stopPv();
    pvTimer = setTimeout(() => {
      const it = shown[+b.dataset.i], v = parseVideo(it.video), pre = preview(it), th = b.querySelector(".thumb");
      const html = pre ? `<video class="pv" src="${abs(pre.src)}" autoplay muted loop playsinline></video>`
        : v?.kind === "file" ? `<video class="pv" src="${esc(v.src)}" autoplay muted loop playsinline></video>`
        : v?.loop ? `<iframe class="pv" src="${v.loop}" allow="autoplay" tabindex="-1" aria-hidden="true"></iframe>` : "";
      if (!html) return;
      th.insertAdjacentHTML("beforeend", html); b.classList.add("playing", "loading"); pvOn = b;
      const el = th.querySelector(".pv"); el.addEventListener(el.tagName === "IFRAME" ? "load" : "playing", () => b.classList.remove("loading"), { once: true });
    }, 80);
  });
  files.addEventListener("mouseout", (e) => { const b = e.target.closest("button.file"); if (b && !b.contains(e.relatedTarget)) stopPv(); });
  files.addEventListener("click", (e) => {
    const b = e.target.closest("button.file"); if (!b) return;
    const here = stack[stack.length - 1];
    if (b.dataset.s) { stack.push(SECTIONS[+b.dataset.s]); render(); }
    else if (b.dataset.f) { stack.push((here.tree || here.list)[+b.dataset.f]); render(); }
    else { stopPv(); open(shown, +b.dataset.i); }
  });
  back.addEventListener("click", () => { stack.pop(); render(); });
  $("#search").addEventListener("input", (e) => { query = fold(e.target.value); render(); });
  $("#search").addEventListener("keydown", (e) => { if (e.key === "Enter") $("#work").scrollIntoView(); });
  render();

  /* ---------- player window ---------- */
  const player = $("#player"), screen = $("#pl-screen"), win = player.querySelector(".pl-win");
  let list = [], pos = 0;
  function show() {
    const it = list[pos], v = parseVideo(it.video), pre = preview(it);
    const useFile = pre && (!v || v.kind === "drive" || pre.viewer);
    win.classList.toggle("vert", !!it.vert);
    screen.style.aspectRatio = useFile && pre.frame ? pre.frame.replace(/x/i, " / ") : it.vert ? "9 / 16" : "16 / 9";
    screen.innerHTML = useFile ? `<video src="${abs(pre.src)}" controls autoplay loop muted playsinline></video>`
      : v.kind === "file" ? `<video src="${esc(v.src)}" controls autoplay playsinline></video>`
      : `<iframe src="${v.embed}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="${esc(it.title)}"></iframe>`;
    $("#pl-title").textContent = fname(it, it.n);
    $("#pl-count").textContent = `${pos + 1} / ${list.length}`;
    if (!bgm.paused) { bgm.pause(); resumeMusic = true; paint(); }
  }
  let resumeMusic = false;
  function open(l, i) {
    list = l.filter((it) => parseVideo(it.video) || preview(it)); pos = Math.max(0, list.indexOf(l[i]));
    if (!list.length) return;
    player.hidden = false; document.body.style.overflow = "hidden"; show(); win.querySelector(".pl-x").focus();
  }
  function close() {
    player.hidden = true; screen.innerHTML = ""; document.body.style.overflow = "";
    if (resumeMusic) { resumeMusic = false; bgm.play().catch(() => {}); paint(); }
  }
  player.addEventListener("click", (e) => {
    if (e.target === player || e.target.closest("[data-close]")) close();
    const s = e.target.closest("[data-step]"); if (s) { pos = (pos + +s.dataset.step + list.length) % list.length; show(); }
  });
  document.addEventListener("keydown", (e) => {
    if (player.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") { pos = (pos + (e.key === "ArrowRight" ? 1 : -1) + list.length) % list.length; show(); }
  });
  $("#daily").addEventListener("click", () => {     // a random clip, every time
    const all = SECTIONS.flatMap((s) => s.list).filter((it) => parseVideo(it.video) || preview(it));
    if (all.length) open(all, Math.floor(Math.random() * all.length));
  });

  /* ---------- mini music player (corner) ---------- */
  const bgm = $("#bgm"), TR = D.music.tracks, mini = $("#mini"), mlist = $("#mini-list");
  bgm.volume = D.music.volume ?? 0.35;
  let cur = 0;
  $("#tracks").innerHTML = TR.map((t, i) => `<li><button type="button" data-t="${i}"><b>${esc(t.title)}</b> <span>${esc(t.artist)}</span></button></li>`).join("");
  function load(i) { cur = (i + TR.length) % TR.length; bgm.src = abs(TR[cur].src); }
  function paint() {
    const on = !bgm.paused;
    mini.classList.toggle("on", on);
    $("#now").textContent = bgm.src ? `${TR[cur].title} — ${TR[cur].artist}` : "play some music ♪";
    const p = mini.querySelector(".mini-play"); p.textContent = on ? "❚❚" : "▶"; p.setAttribute("aria-label", on ? "Pause" : "Play");
    mlist.querySelectorAll("li").forEach((li, k) => li.classList.toggle("on", k === cur && !!bgm.src));
  }
  mini.addEventListener("click", (e) => {
    const t = e.target.closest("[data-t]"), m = e.target.closest("[data-m]")?.dataset.m;
    if (t) { load(+t.dataset.t); bgm.play().catch(() => {}); }
    if (m === "play") { if (!bgm.src) load(0); bgm.paused ? bgm.play().catch(() => {}) : bgm.pause(); }
    if (m === "next" || m === "prev") { load(cur + (m === "next" ? 1 : -1)); bgm.play().catch(() => {}); }
    if (m === "list") { mlist.hidden = !mlist.hidden; e.target.closest("button").setAttribute("aria-expanded", !mlist.hidden); }
    paint();
  });
  document.addEventListener("click", (e) => { if (!mlist.hidden && !e.target.closest("#mini")) { mlist.hidden = true; } });
  bgm.addEventListener("ended", () => { load(cur + 1); bgm.play().catch(() => {}); });
  // first visit only: a note with an arrow pointing at the player
  const tip = $("#mini-tip"); let tipSeen = false;
  try { tipSeen = localStorage.getItem("zine-music-tip") === "1"; } catch (e) {}
  const hideTip = () => { tip.classList.remove("show"); setTimeout(() => (tip.hidden = true), 300); try { localStorage.setItem("zine-music-tip", "1"); } catch (e) {} };
  if (!tipSeen) { try { localStorage.setItem("zine-music-tip", "1"); } catch (e) {} setTimeout(() => { tip.hidden = false; requestAnimationFrame(() => tip.classList.add("show")); }, 1500); setTimeout(hideTip, 14000); }
  mini.addEventListener("click", (e) => { if (!tip.hidden) hideTip(); });
  bgm.addEventListener("play", paint); bgm.addEventListener("pause", paint);

  /* ---------- people ---------- */
  const PEOPLE = [
    { n: "VTC INTERCOM", c: "#2340ff", ini: "VTC", note: "game ads, trailers and the LED walls for GameVerse 2025 & 2026, the A80 booth and ITC 20. our game Arcane Hunter won Vietnamese Game of the Year!!" },
    { n: "HG MEDIA", c: "#e44438", ini: "HG", note: "where i learned to cut fast — YouTube channels with ~1M views every month. thumbnails, hooks, retention, the whole thing." },
    { n: "KAMI", c: "#7a3fe0", ini: "K", note: "a mother & baby care brand. made their brand film and a product video (2026) — soft, warm, very different from game ads!" },
    { n: "SAIGONCHILL", c: "#111208", ini: "SC", note: "freelance LED visuals for the Halloween 2025 show. spooky, loud, super fun to make." }
  ];
  let pp = 0;
  const per = () => (innerWidth < 760 ? 2 : 2);
  function people() {
    $("#ppl").innerHTML = PEOPLE.slice(pp, pp + per()).map((p) => `<div class="person"><span class="av" style="background:${p.c}">${p.ini}</span>
      <div><h3 style="background:${p.c}">${p.n}&lt;3</h3><p tabindex="0"><b>› NOTES:</b> ${esc(p.note)}</p></div></div>`).join("");
  }
  $("#ppl-more").addEventListener("click", () => { pp = pp + per() >= PEOPLE.length ? 0 : pp + per(); people(); });
  people();
})();
