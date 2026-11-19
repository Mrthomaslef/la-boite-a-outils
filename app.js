/* La Boîte à Outils MSK — mesures ostéo-articulaires illustrées (d'après le Cotten) */
(() => {
  const DATA = window.MEASURES_DATA || [];
  const BY_ID = Object.fromEntries(DATA.map((m) => [m.id, m]));

  // Articulations (ordre de l'accueil) + sous-sections dans l'ordre de lecture
  const REGIONS = {
    "epaule": ["Épaule", ["Coiffe & conflit", "Instabilité", "Omarthrose & glène", "AC & divers", "Enfant"]],
    "coude": ["Coude", ["Tendons & ligaments", "Nerfs", "Enfant"]],
    "poignet-main": ["Poignet & main", ["Radius & ulna", "Carpe & instabilités", "Tendons & poulies", "Nerfs & canaux", "Pouce & doigts"]],
    "rachis-cervical": ["Rachis cervical", ["Charnière crânio-cervicale", "Canal & moelle", "Instabilité"]],
    "rachis-thoracolombaire": ["Rachis dorso-lombaire", ["Disque & dégénératif", "Canal & sténose", "Lyse & spondylolisthésis", "Scoliose & équilibre", "Fractures & divers"]],
    "bassin-sacro-iliaques": ["Bassin & sacro-iliaques", ["Sacro-iliaques", "Symphyse & avulsions", "Nerfs & divers"]],
    "hanche": ["Hanche", ["Dysplasie & couverture", "Conflit fémoro-acétabulaire", "Arthrose", "Ostéonécrose", "Enfant", "Parties molles"]],
    "genou": ["Genou", ["Fémoro-patellaire", "Ménisques", "Ligaments croisés", "Collatéraux & PAPL", "Arthrose & cartilage", "Enfant"]],
    "jambe": ["Jambe", ["Jambe"]],
    "cheville-pied": ["Cheville & pied", ["Tendons", "Ligaments & syndesmose", "Arrière-pied & arche", "Avant-pied & hallux", "Parties molles", "Enfant"]],
    "membre-entier": ["Membre inférieur entier", ["Axes & longueurs", "Enfant"]],
    "paroi-thoracique": ["Paroi thoracique", ["Paroi thoracique"]],
  };
  const CATS = {
    "prothese": ["Prothèses", ["Hanche", "Genou", "Épaule", "Coude & poignet", "Cheville", "Rachis", "Généralités"]],
    "eos": ["EOS", ["Équilibre sagittal & bassin", "Scoliose", "Axes & longueurs", "Torsions", "Technique"]],
  };
  // vignette de chaque tuile : 1re fiche illustrée trouvée dans cette liste, sinon la 1re illustrée de la région
  const COVER = {
    "epaule": ["epaule-angle-critique"], "hanche": ["hanche-angle-vce-wiberg"], "genou": ["genou-ta-gt"], "coude": ["coude-nerf-ulnaire-surface-section"],
    "cheville-pied": ["cheville-pied-tendon-calcaneen-epaisseur"], "eos": ["eos-incidence-pelvienne"], "prothese": ["prothese-hanche-gruen"], "poignet-main": ["poignet-variance-ulnaire"], "rachis-cervical": ["rachis-cervical-ligne-chamberlain"],
  };
  const FAV_KEY = "bao_msk_favs_v1";
  let favs = new Set(JSON.parse(localStorage.getItem(FAV_KEY) || "[]"));

  const $ = (s) => document.querySelector(s);
  const norm = (s) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const esc = (s) => String(s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  DATA.forEach((m) => { m._hay = norm([m.nom, m.nom_court, m.contexte, m.tags.join(" "), m.section, m.modalites.join(" "), m.court.normal, m.court.patho].join(" ")); });

  const inRegion = (r) => DATA.filter((m) => m.categorie === "mesure" && m.region === r);
  const inCat = (c) => DATA.filter((m) => m.categorie === c);
  const cover = (key, list) => {
    const prefP = (COVER[key] || []).map((id) => BY_ID[id]).find((m) => m && m.images.length);
    const withP = prefP || list.find((m) => m.images.some((i) => i.type === "cotten"));
    if (withP) return `<img class="ph" loading="lazy" src="${withP.images[0].src}" alt="">`;
    const pref = (COVER[key] || []).map((id) => BY_ID[id]).find((m) => m && m.svg);
    const EMO = { "rachis-thoracolombaire": "🦴", "bassin-sacro-iliaques": "🦋", "jambe": "🦵", "membre-entier": "📐", "paroi-thoracique": "🫁", "prothese": "🦿" };
    return (pref || list.find((m) => m.svg) || {}).svg || `<span class="emo">${EMO[key] || "📏"}</span>`;
  };
  const mods = (m) => m.modalites.map((x) => x.replace("Arthro-", "Arthro ")).join(" · ");
  const short = (s, n) => (s && s.length > n ? s.slice(0, n - 1) + "…" : s || "");

  // ——— état / routeur (#/  #/r/genou  #/c/prothese  #/fav  + ?m=id pour la fiche)
  let st = { view: "home", key: null, section: null, q: "", list: [] };

  function route() {
    const h = location.hash.replace(/^#/, "") || "/";
    const [path, qs] = h.split("?");
    const parts = path.split("/").filter(Boolean);
    const prevKey = st.view + st.key;
    if (parts[0] === "r" && REGIONS[parts[1]]) Object.assign(st, { view: "region", key: parts[1] });
    else if (parts[0] === "c" && CATS[parts[1]]) Object.assign(st, { view: "cat", key: parts[1] });
    else if (parts[0] === "fav") Object.assign(st, { view: "fav", key: null });
    else Object.assign(st, { view: "home", key: null });
    if (prevKey !== st.view + st.key) { st.section = null; window.scrollTo(0, 0); }
    render();
    const mid = new URLSearchParams(qs || "").get("m");
    mid && BY_ID[mid] ? openSheet(mid) : closeSheet(true);
  }
  const go = (hash) => { if (location.hash !== hash) location.hash = hash; else route(); };

  // ——— rendu
  function mcard(m) {
    return `<button class="mc" data-open="${m.id}">
      <div class="fig${m.images.length ? " has-ph" : ""}">${m.images.length ? `<img class="ph" loading="lazy" src="${m.images[0].src}" alt="">${m.images[0].type === "cotten" ? `<span class="tagc">Cotten</span>` : ""}` : m.svg || `<span class="nofig">📏<small>illustration à venir</small></span>`}</div>
      <div class="txt"><span class="nm">${esc(m.nom_court)}</span>
      ${m.court.normal ? `<span class="nv">${esc(m.court.normal)}</span>` : ""}
      <span class="mods">${esc(mods(m))}${m.pediatrie ? " · 👶" : ""}</span></div></button>`;
  }
  function gallery(list, sections) {
    if (!list.length) return `<div class="empty">Rien ici pour l'instant.</div>`;
    if (!sections) return `<div class="grid">${list.map(mcard).join("")}</div>`;
    const order = (s) => { const i = sections.indexOf(s); return i < 0 ? 99 : i; };
    const groups = {};
    list.forEach((m) => (groups[m.section] = groups[m.section] || []).push(m));
    return Object.keys(groups).sort((a, b) => order(a) - order(b))
      .map((s) => `${sections.length > 1 && !st.section ? `<h2 class="h">${esc(s || "Autres")}</h2>` : ""}<div class="grid">${groups[s].map(mcard).join("")}</div>`).join("");
  }
  function sectionChips(list, sections) {
    const present = sections.filter((s) => list.some((m) => m.section === s));
    const el = $("#sections");
    if (present.length < 2 || st.q) { el.hidden = true; return; }
    el.hidden = false;
    el.innerHTML = `<button data-sec="" class="${st.section ? "" : "on"}">Tout</button>` +
      present.map((s) => `<button data-sec="${esc(s)}" class="${st.section === s ? "on" : ""}">${esc(s)}</button>`).join("");
  }

  function render() {
    const v = $("#view");
    $("#back").hidden = st.view === "home" && !st.q;
    $("#sections").hidden = true;
    if (st.q) {
      const words = norm(st.q).split(/\s+/).filter(Boolean);
      const res = DATA.filter((m) => words.every((w) => m._hay.includes(w)));
      res.sort((a, b) => (norm(b.nom_court).startsWith(words[0]) ? 1 : 0) - (norm(a.nom_court).startsWith(words[0]) ? 1 : 0));
      st.list = res;
      $("#title").textContent = `${res.length} résultat${res.length > 1 ? "s" : ""}`;
      v.innerHTML = res.length ? gallery(res) : `<div class="empty">Aucune mesure ne correspond à « ${esc(st.q)} ».</div>`;
      return;
    }
    if (st.view === "home") {
      $("#title").textContent = "Boîte à Outils MSK";
      st.list = [];
      const tile = (href, name, list, key, wide) =>
        `<a class="tile${wide ? " wide" : ""}" href="${href}"><div class="fig">${cover(key, list)}</div>
         <div class="lbl"><b>${name}</b><small>${list.length} mesures</small></div></a>`;
      const regs = Object.entries(REGIONS).map(([k, [n]]) => [k, n, inRegion(k)]).filter(([, , l]) => l.length);
      v.innerHTML = `<h2 class="h">Articulations</h2><div class="tiles">${regs.map(([k, n, l]) => tile(`#/r/${k}`, n, l, k)).join("")}</div>
        <h2 class="h">Prothèses & EOS</h2><div class="tiles">
          ${tile("#/c/prothese", "🦿 Prothèses", inCat("prothese"), "prothese", true)}
          ${tile("#/c/eos", "🧍 EOS", inCat("eos"), "eos", true)}</div>
        <p class="foot">${DATA.length} mesures · d'après le Cotten — Imagerie musculosquelettique.<br>Outil d'aide, ne remplace pas le jugement clinique.</p>`;
      return;
    }
    let name, list, sections;
    if (st.view === "region") { [name, sections] = REGIONS[st.key]; list = inRegion(st.key); }
    else if (st.view === "cat") { [name, sections] = CATS[st.key]; list = inCat(st.key); }
    else { name = "★ Favoris"; list = DATA.filter((m) => favs.has(m.id)); sections = null; }
    $("#title").textContent = name;
    if (sections) sectionChips(list, sections);
    const shown = st.section ? list.filter((m) => m.section === st.section) : list;
    const order = (s) => (sections ? (sections.indexOf(s) + 100) % 100 : 0);
    st.list = [...shown].sort((a, b) => order(a.section) - order(b.section));
    v.innerHTML = st.view === "fav" && !list.length
      ? `<div class="empty">Aucun favori.<br>Ouvrez une mesure et touchez ☆.</div>` : gallery(shown, sections);
  }

  // ——— carrousel d'illustrations : figures Cotten → image web → schéma
  function media(m) {
    const slides = m.images.map((im, k) => `<figure class="slide">
        <button class="ph-btn" data-zoom="${m.id}|${k}"><img src="${im.src}" alt="" loading="lazy"></button>
        <figcaption><b>${esc(im.credit)}</b>${im.caption ? ` — ${esc(short(im.caption, 150))}` : ""}
        ${im.page ? ` <a href="${esc(im.page)}" target="_blank" rel="noopener">source</a>` : ""}</figcaption></figure>`);
    if (m.svg) slides.push(`<figure class="slide"><div class="fig s-fig">${m.svg}</div><figcaption><b>Schéma</b> — tracé de la mesure</figcaption></figure>`);
    if (!slides.length) return "";
    const dots = slides.length > 1 ? `<div class="dots">${slides.map((_, k) => `<i class="${k ? "" : "on"}"></i>`).join("")}</div>` : "";
    return `<div class="car">${slides.join("")}</div>${dots}`;
  }

  // ——— fiche
  function openSheet(id) {
    const m = BY_ID[id];
    const i = st.list.findIndex((x) => x.id === id);
    const prev = st.list[i - 1], next = st.list[i + 1];
    const c = m.court;
    const ext = m.hors_cotten || m.complement;
    const row = (cls, ico, k, val) => val ? `<div class="r ${cls}"><span class="i">${ico}</span><div><div class="k">${k}</div><div class="v">${esc(val)}</div></div></div>` : "";
    const long = (t, txt, cls = "") => txt && txt !== "—" ? `<h4>${t}</h4><p class="${cls}">${esc(txt)}</p>` : "";
    $("#sheet-card").innerHTML = `<div class="grab"></div>
      <div class="s-head"><div style="flex:1;min-width:0"><h3>${esc(m.nom_court)}</h3>
        ${m.nom_court !== m.nom ? `<div class="sub">${esc(m.nom)}</div>` : ""}</div>
        <button class="star ${favs.has(id) ? "on" : ""}" data-fav="${id}" aria-label="Favori">${favs.has(id) ? "★" : "☆"}</button></div>
      ${media(m)}
      <div class="badges">${m.modalites.map((x) => `<span class="b">${x}</span>`).join("")}${m.pediatrie ? `<span class="b ped">Enfant</span>` : ""}${ext ? `<span class="b ext">${m.hors_cotten ? "Hors Cotten" : "Complément"}</span>` : ""}</div>
      <div class="kv">
        ${row("", "📐", "Tracé", c.trace || short(m.technique, 160))}
        ${row("n", "✅", "Normal", c.normal || (m.normes !== "—" ? short(m.normes, 120) : ""))}
        ${row("p", "⚠️", "Pathologique", c.patho || short(m.pathologique, 160))}
      </div>
      <details class="more"><summary>En savoir plus ▾</summary>
        ${long("Contexte", m.contexte)}${long("Technique", m.technique)}${long("Valeurs normales", m.normes)}
        ${long("Interprétation", m.pathologique)}${long("Pièges", m.pieges, "pg")}
        <div class="src">📘 ${esc(m.source)}</div></details>
      <div class="s-actions"><button data-copy="${id}">📋 Copier pour le CR</button><button data-close>Fermer</button></div>
      <div class="s-nav"><button data-open="${prev ? prev.id : ""}" ${prev ? "" : "disabled"}>‹ ${prev ? esc(short(prev.nom_court, 22)) : ""}</button>
        <button data-open="${next ? next.id : ""}" ${next ? "" : "disabled"}>${next ? esc(short(next.nom_court, 22)) : ""} ›</button></div>`;
    const sh = $("#sheet");
    if (sh.hidden) { sh.hidden = false; document.body.style.overflow = "hidden"; }
    $("#sheet-card").scrollTop = 0;
    const car = $("#sheet-card .car");
    if (car) car.addEventListener("scroll", () => {
      const k = Math.round(car.scrollLeft / car.clientWidth);
      $("#sheet-card").querySelectorAll(".dots i").forEach((d, j) => d.classList.toggle("on", j === k));
    }, { passive: true });
  }
  function closeSheet(silent) {
    const sh = $("#sheet"); if (sh.hidden) return;
    sh.hidden = true; document.body.style.overflow = "";
    if (!silent) history.replaceState(null, "", location.hash.split("?")[0] || "#/");
  }
  const openId = (id) => { const base = location.hash.split("?")[0] || "#/"; location.hash = `${base}?m=${id}`; };

  function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 1500); }
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); }
    catch { const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove(); }
    toast("Copié ✓");
  }

  // ——— événements
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-open],[data-fav],[data-copy],[data-close],[data-sec],[data-zoom],[data-lb]");
    if (!t) return;
    if (t.dataset.zoom) { const [id, k] = t.dataset.zoom.split("|"); const im = BY_ID[id].images[+k];
      $("#lb-img").src = im.src; $("#lb-cap").textContent = im.credit; $("#lb").hidden = false; $("#lb-wrap").classList.remove("z"); return; }
    if (t.dataset.lb !== undefined) { if (t.id === "lb-wrap") { t.classList.toggle("z"); return; } $("#lb").hidden = true; return; }
    if (t.dataset.open !== undefined) { if (t.dataset.open) openId(t.dataset.open); return; }
    if (t.dataset.fav) {
      const id = t.dataset.fav; favs.has(id) ? favs.delete(id) : favs.add(id);
      localStorage.setItem(FAV_KEY, JSON.stringify([...favs]));
      t.classList.toggle("on", favs.has(id)); t.textContent = favs.has(id) ? "★" : "☆"; navigator.vibrate?.(10);
      if (st.view === "fav") render();
      return;
    }
    if (t.dataset.copy) {
      const m = BY_ID[t.dataset.copy];
      copy(`${m.nom_court} : ___ (N : ${m.court.normal || m.normes || "—"})`);
      return;
    }
    if (t.dataset.close !== undefined) { closeSheet(); return; }
    if (t.dataset.sec !== undefined) { st.section = t.dataset.sec || null; render(); window.scrollTo(0, 0); }
  });
  $("#back").addEventListener("click", () => {
    if (st.q) { st.q = ""; $("#q").value = ""; render(); return; }
    go("#/");
  });
  $("#favbtn").addEventListener("click", () => go("#/fav"));
  let qt;
  $("#q").addEventListener("input", (e) => { clearTimeout(qt); qt = setTimeout(() => { st.q = e.target.value.trim(); render(); window.scrollTo(0, 0); }, 120); });
  document.addEventListener("keydown", (e) => {
    if ($("#sheet").hidden) return;
    if (e.key === "Escape") { if (!$("#lb").hidden) { $("#lb").hidden = true; return; } closeSheet(); }
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") $(`.s-nav button:${e.key === "ArrowRight" ? "last" : "first"}-child`)?.click();
  });
  // balayage gauche/droite dans la fiche
  (() => { let x0 = null, y0 = 0; const c = $("#sheet-card");
    c.addEventListener("touchstart", (e) => { if (e.target.closest(".car")) { x0 = null; return; } x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    c.addEventListener("touchend", (e) => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null;
      if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) $(`.s-nav button:${dx < 0 ? "last" : "first"}-child`)?.click(); }); })();
  window.addEventListener("hashchange", route);

  // ——— pull-to-refresh (tactile + souris), désactivé quand une fiche est ouverte
  (() => {
    const p = $("#ptr"); let y0 = null, dy = 0;
    const start = (y) => { if (window.scrollY <= 0 && $("#sheet").hidden) { y0 = y; dy = 0; } };
    const move = (y) => { if (y0 === null) return; dy = Math.max(0, Math.min(110, y - y0)); p.style.transform = `translate(-50%, ${dy - 50}px) rotate(${dy * 3}deg)`; p.classList.toggle("vis", dy > 8); };
    const end = () => { if (y0 === null) return; y0 = null;
      if (dy > 80) { p.classList.add("spin"); navigator.vibrate?.(15); setTimeout(() => location.reload(), 350); }
      else { p.style.transform = "translate(-50%, -50px)"; p.classList.remove("vis"); } };
    addEventListener("touchstart", (e) => start(e.touches[0].clientY), { passive: true });
    addEventListener("touchmove", (e) => move(e.touches[0].clientY), { passive: true });
    addEventListener("touchend", end);
    addEventListener("mousedown", (e) => { if (!e.target.closest("button,input,a,.sheet")) start(e.clientY); });
    addEventListener("mousemove", (e) => { if (e.buttons === 1) move(e.clientY); });
    addEventListener("mouseup", end);
  })();

  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js");
  route();
})();
