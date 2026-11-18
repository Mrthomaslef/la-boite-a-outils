/* La Boîte à Outils MSK — mesures ostéo-articulaires (d'après le Cotten) */
(() => {
  const DATA = window.MEASURES_DATA || [];
  const REGIONS = [
    ["epaule", "🦴 Épaule"], ["coude", "💪 Coude"], ["poignet-main", "✋ Poignet & main"],
    ["rachis-cervical", "🧠 Rachis cervical & CCC"], ["rachis-thoracolombaire", "🔗 Rachis thoraco-lombaire"],
    ["paroi-thoracique", "🫁 Paroi thoracique"], ["bassin-sacro-iliaques", "🦋 Bassin & sacro-iliaques"],
    ["hanche", "🍑 Hanche"], ["genou", "🦵 Genou"], ["jambe", "🦿 Jambe"], ["cheville-pied", "🦶 Cheville & pied"],
    ["membre-entier", "📐 Membre inférieur entier"],
  ];
  const RLABEL = Object.fromEntries(REGIONS);
  const MODS = ["Radio", "TDM", "IRM", "Écho", "EOS", "Arthro"];
  const FAV_KEY = "bao_msk_favs_v1";

  const st = { tab: "tout", region: null, mods: new Set(), ped: false, q: "" };
  let favs = new Set(JSON.parse(localStorage.getItem(FAV_KEY) || "[]"));

  const $ = (s) => document.querySelector(s);
  const norm = (s) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const esc = (s) => (s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  DATA.forEach((m) => {
    m._hay = norm([m.nom, m.contexte, m.technique, m.normes, m.pathologique, m.pieges, m.tags.join(" "), RLABEL[m.region], m.modalites.join(" ")].join(" "));
  });

  function hl(text) {
    const t = esc(text);
    const words = norm(st.q).split(/\s+/).filter((w) => w.length > 1);
    if (!words.length) return t;
    // surlignage insensible aux accents : on travaille caractère par caractère sur la version normalisée
    const n = norm(t);
    const marks = new Array(t.length).fill(false);
    words.forEach((w) => { let i = n.indexOf(w); while (i >= 0) { for (let k = i; k < i + w.length; k++) marks[k] = true; i = n.indexOf(w, i + 1); } });
    if (n.length !== t.length) return t;
    let out = "", open = false;
    for (let i = 0; i < t.length; i++) {
      if (marks[i] && !open) { out += "<mark>"; open = true; }
      if (!marks[i] && open) { out += "</mark>"; open = false; }
      out += t[i];
    }
    return out + (open ? "</mark>" : "");
  }

  function base() {
    return DATA.filter((m) => {
      if (st.tab === "fav") return favs.has(m.id);
      if (st.tab === "eos") return m.categorie === "eos" || m.modalites.includes("EOS");
      if (st.tab !== "tout") return m.categorie === st.tab;
      return true;
    });
  }
  function filtered() {
    const words = norm(st.q).split(/\s+/).filter(Boolean);
    return base().filter((m) =>
      (!st.region || m.region === st.region) &&
      (!st.ped || m.pediatrie) &&
      (!st.mods.size || [...st.mods].some((x) => m.modalites.some((mm) => mm.startsWith(x)))) &&
      words.every((w) => m._hay.includes(w)));
  }

  function renderChips() {
    const b = base();
    const counts = {};
    b.forEach((m) => (counts[m.region] = (counts[m.region] || 0) + 1));
    $("#regions").innerHTML =
      `<button data-r="" class="${st.region ? "" : "on"}">Toutes<span class="n">${b.length}</span></button>` +
      REGIONS.filter(([r]) => counts[r]).map(([r, l]) =>
        `<button data-r="${r}" class="${st.region === r ? "on" : ""}">${l}<span class="n">${counts[r]}</span></button>`).join("");
    $("#mods").innerHTML = MODS.map((x) => `<button data-m="${x}" class="${st.mods.has(x) ? "on" : ""}">${x}</button>`).join("") +
      `<button data-ped="1" class="${st.ped ? "on" : ""}">👶 Enfant</button>`;
  }

  function card(m) {
    const ext = m.hors_cotten ? `<span class="src ext">hors Cotten</span>` : m.complement ? `<span class="src ext">${esc(m.source)}</span>` : `<span class="src">📘 ${esc(m.source)}</span>`;
    const badges = m.modalites.map((x) => `<span class="b">${x}</span>`).join("") +
      (m.pediatrie ? `<span class="b ped">Enfant</span>` : "") +
      (m.categorie === "prothese" ? `<span class="b pro">Prothèse</span>` : "") +
      (m.categorie === "eos" ? `<span class="b eos">EOS</span>` : "");
    const sec = (cls, title, txt) => txt && txt !== "—" ? `<div class="sec ${cls}"><h4>${title}</h4><p>${hl(txt)}</p></div>` : "";
    return `<details class="card" id="${m.id}">
      <summary>
        <div class="row1"><span class="name">${hl(m.nom)}</span>
          <button class="star ${favs.has(m.id) ? "on" : ""}" data-fav="${m.id}" aria-label="Favori">${favs.has(m.id) ? "★" : "☆"}</button></div>
        ${m.contexte ? `<div class="ctx">${hl(m.contexte)}</div>` : ""}
        ${m.normes && m.normes !== "—" ? `<div class="norm"><b>Normes :</b> ${hl(m.normes.length > 140 ? m.normes.slice(0, 140) + "…" : m.normes)}</div>` : ""}
        <div class="badges">${badges}</div>
      </summary>
      <div class="body">
        ${sec("tech", "📐 Technique / tracé", m.technique)}
        ${sec("normes", "✅ Valeurs normales", m.normes)}
        ${sec("patho", "⚠️ Seuils pathologiques & interprétation", m.pathologique)}
        ${sec("pieges", "🪤 Pièges", m.pieges)}
        <div class="actions"><button data-copy="${m.id}">📋 Copier pour le CR</button><button data-link="${m.id}">🔗 Lien</button>${ext}</div>
      </div></details>`;
  }

  function render() {
    renderChips();
    const items = filtered();
    $("#subtitle").textContent = `${DATA.length} mesures · ${items.length} affichées · d'après le Cotten`;
    if (!items.length) {
      $("#list").innerHTML = `<div class="empty">${st.tab === "fav" ? "Aucun favori : touchez ☆ sur une fiche." : "Aucune mesure ne correspond."}</div>`;
      return;
    }
    let html = "", cur = null;
    items.forEach((m) => {
      if (m.region !== cur) { cur = m.region; html += `<div class="group-h">${RLABEL[cur]}</div>`; }
      html += card(m);
    });
    $("#list").innerHTML = html;
    if (items.length <= 3 && st.q) $("#list").querySelectorAll("details").forEach((d) => (d.open = true));
  }

  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 1600);
  }
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); }
    catch { const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove(); }
    toast("Copié ✓");
  }

  // ——— événements
  let qt;
  $("#q").addEventListener("input", (e) => { clearTimeout(qt); qt = setTimeout(() => { st.q = e.target.value; render(); }, 120); });
  $("#tabs").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    st.tab = b.dataset.tab; st.region = null;
    $("#tabs").querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
    render(); window.scrollTo({ top: 0 });
  });
  $("#regions").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    st.region = b.dataset.r || null; render(); window.scrollTo({ top: 0 });
  });
  $("#mods").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.ped) st.ped = !st.ped;
    else st.mods.has(b.dataset.m) ? st.mods.delete(b.dataset.m) : st.mods.add(b.dataset.m);
    render();
  });
  $("#list").addEventListener("click", (e) => {
    const f = e.target.closest("[data-fav]");
    if (f) {
      e.preventDefault(); e.stopPropagation();
      const id = f.dataset.fav; favs.has(id) ? favs.delete(id) : favs.add(id);
      localStorage.setItem(FAV_KEY, JSON.stringify([...favs]));
      f.classList.toggle("on", favs.has(id)); f.textContent = favs.has(id) ? "★" : "☆";
      navigator.vibrate?.(10);
      if (st.tab === "fav") render();
      return;
    }
    const c = e.target.closest("[data-copy]");
    if (c) {
      const m = DATA.find((x) => x.id === c.dataset.copy);
      copy(`${m.nom} : ___ (N : ${m.normes || "—"})${m.pathologique ? `\nInterprétation : ${m.pathologique}` : ""}`);
      return;
    }
    const l = e.target.closest("[data-link]");
    if (l) copy(location.href.split("#")[0] + "#" + l.dataset.link);
  });

  // ——— lien direct #id
  function openHash() {
    const id = decodeURIComponent(location.hash.slice(1)); if (!id) return;
    const m = DATA.find((x) => x.id === id); if (!m) return;
    st.tab = "tout"; st.region = m.region; st.q = ""; $("#q").value = ""; st.mods.clear(); st.ped = false;
    $("#tabs").querySelectorAll("button").forEach((x) => x.classList.toggle("on", x.dataset.tab === "tout"));
    render();
    const el = document.getElementById(id);
    if (el) { el.open = true; setTimeout(() => el.scrollIntoView({ block: "center" }), 50); }
  }
  window.addEventListener("hashchange", openHash);

  // ——— pull-to-refresh (tactile + souris)
  (() => {
    const p = $("#ptr"); let y0 = null, dy = 0;
    const start = (y) => { if (window.scrollY <= 0) { y0 = y; dy = 0; } };
    const move = (y) => { if (y0 === null) return; dy = Math.max(0, Math.min(110, y - y0)); p.style.transform = `translate(-50%, ${dy - 50}px) rotate(${dy * 3}deg)`; };
    const end = () => {
      if (y0 === null) return; y0 = null;
      if (dy > 80) { p.classList.add("spin"); navigator.vibrate?.(15); setTimeout(() => location.reload(), 350); }
      else p.style.transform = "translate(-50%, -50px)";
    };
    addEventListener("touchstart", (e) => start(e.touches[0].clientY), { passive: true });
    addEventListener("touchmove", (e) => move(e.touches[0].clientY), { passive: true });
    addEventListener("touchend", end);
    addEventListener("mousedown", (e) => { if (!e.target.closest("button,input,summary,details")) start(e.clientY); });
    addEventListener("mousemove", (e) => { if (e.buttons === 1) move(e.clientY); });
    addEventListener("mouseup", end);
  })();

  // ——— service worker (hors-ligne)
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js");

  render();
  openHash();
})();
