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
      thumb: `https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg` };
    m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (m) return { kind: "vimeo", id: m[1], embed: `https://player.vimeo.com/video/${m[1]}?autoplay=1`, thumb: null };
    return null;
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
  const tabs = $("#tabs"), panels = $("#panels");
  D.sections.forEach((sec, i) => {
    tabs.insertAdjacentHTML("beforeend",
      `<button class="tab" role="tab" id="tab-${sec.id}" aria-controls="panel-${sec.id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">
         <span class="num">${sec.num}</span><img src="${sec.icon}" alt="">${esc(sec.title.join(" "))}
       </button>`);
    const card = (it) => {
      const v = parseVideo(it.video);
      const media = v ? `${v.thumb ? `<img class="thumb" src="${v.thumb}" alt="" loading="lazy">` : placeholder(it.format, it.title)}<span class="play"></span>`
                      : placeholder(it.format, it.title);
      const body = frameHTML(it.format, media);
      const tags = [...(it.tags || []), it.year].filter(Boolean)
        .map((t, k) => `<li class="${k === 0 ? "y" : ""}">${esc(t)}</li>`).join("");
      const meta = `<div class="meta"><h4>${esc(it.title)}</h4>${it.note ? `<p class="note">★ ${esc(it.note)}</p>` : ""}<ul class="pills">${tags}</ul></div>`;
      return `<article class="item reveal">${v
        ? `<button class="open" type="button" data-video="${esc(it.video)}" data-title="${esc(it.title)}" data-format="${it.format}" aria-label="Play ${esc(it.title)}">${body}</button>`
        : body}${meta}</article>`;
    };
    const vert = sec.items.filter((x) => x.format === "vertical"), wide = sec.items.filter((x) => x.format !== "vertical");
    panels.insertAdjacentHTML("beforeend",
      `<div class="panel" role="tabpanel" id="panel-${sec.id}" aria-labelledby="tab-${sec.id}" ${i ? "hidden" : ""}>
         <div class="panel-head">
           <h3 class="panel-title name-block"><span class="nb nb-1">${esc(sec.title[0])}</span><span class="nb nb-2">${esc(sec.title[1])}</span></h3>
           <div class="panel-side"><p>${esc(sec.blurb)}</p>${sec.stat ? `<span class="stat"><b>${esc(sec.stat.value)}</b>${esc(sec.stat.label)}</span>` : ""}</div>
         </div>
         ${vert.length ? `<div class="grid grid-vert">${vert.map(card).join("")}</div>` : ""}
         ${wide.length ? `<div class="grid grid-wide">${wide.map(card).join("")}</div>` : ""}
       </div>`);
  });
  const tabBtns = [...tabs.querySelectorAll(".tab")];
  function select(btn, focus) {
    tabBtns.forEach((b) => { const on = b === btn; b.setAttribute("aria-selected", on); b.tabIndex = on ? 0 : -1;
      $("#" + b.getAttribute("aria-controls")).hidden = !on; });
    if (focus) btn.focus();
    observeReveals();
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

  /* ---------- lightbox ---------- */
  const lb = $("#lightbox"), player = $("#lb-player"), dialog = $(".lb-dialog");
  let lastFocus = null;
  document.addEventListener("click", (e) => {
    const b = e.target.closest("button.open[data-video]");
    if (b) {
      const v = parseVideo(b.dataset.video); if (!v) return;
      lastFocus = b;
      player.innerHTML = `<iframe src="${v.embed}" title="${esc(b.dataset.title)}" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowfullscreen></iframe>`;
      $("#lb-title").textContent = b.dataset.title;
      dialog.classList.toggle("vert", b.dataset.format === "vertical");
      lb.hidden = false; document.body.style.overflow = "hidden";
      $(".lb-close").focus();
    }
    if (e.target.closest("[data-close]")) close();
  });
  function close() {
    if (lb.hidden) return;
    lb.hidden = true; player.innerHTML = ""; document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
    if (e.key === "Tab" && !lb.hidden) { e.preventDefault(); $(".lb-close").focus(); }
  });

  /* ---------- reveal on scroll ---------- */
  const io = "IntersectionObserver" in window
    ? new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("on"); io.unobserve(en.target); } }), { threshold: .12 })
    : null;
  function observeReveals() {
    document.querySelectorAll(".reveal:not(.on)").forEach((el) => io ? io.observe(el) : el.classList.add("on"));
  }
  observeReveals();

  /* ---------- custom cursor ---------- */
  const cur = $("#cursor");
  if (matchMedia("(pointer: fine)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    addEventListener("pointermove", (e) => {
      cur.style.translate = `${e.clientX}px ${e.clientY}px`; cur.style.opacity = 1;
      cur.classList.toggle("big", !!e.target.closest("a, button"));
    }, { passive: true });
  } else cur.remove();
})();
