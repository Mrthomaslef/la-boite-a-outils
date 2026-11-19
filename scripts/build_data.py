#!/usr/bin/env python3
"""Fusionne data/raw/*.json -> data/measures.json + data/embedded_data.js (hors-ligne / file://)."""
import json, glob, os, re, collections, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from auto_fields import fill
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REGIONS = ["epaule","coude","poignet-main","rachis-cervical","rachis-thoracolombaire","paroi-thoracique",
           "bassin-sacro-iliaques","hanche","genou","jambe","cheville-pied","membre-entier"]
MODS = ["Radio","TDM","IRM","Écho","EOS","Arthro-TDM","Arthro-IRM"]
CAT = {}
_catp = os.path.expanduser("~/.cache/cotten-figs/catalog.json")
_local = os.path.join(ROOT, "data/fig/catalog.json")
if os.path.exists(_catp):
    CAT = {x["fig"]: {"caption": x["caption"], "page": x["page_livre"]} for x in json.load(open(_catp))}
    json.dump(CAT, open(_local, "w"), ensure_ascii=False)
elif os.path.exists(_local):
    CAT = json.load(open(_local))
MATCH = {}
for f in glob.glob(os.path.join(ROOT, "data/figmatch/*.json")):
    MATCH.update(json.load(open(f, encoding="utf-8")))
items, seen = [], set()
for f in sorted(glob.glob(os.path.join(ROOT, "data/raw/*.json"))):
    for m in json.load(open(f, encoding="utf-8")):
        if m["id"] in seen:
            m["id"] += "-" + os.path.basename(f)[:-5]
        seen.add(m["id"])
        assert m["region"] in REGIONS, (m["id"], m["region"])
        m["modalites"] = [x for x in m.get("modalites", []) if x in MODS]
        m["categorie"] = m.get("categorie", "mesure")
        m["hors_cotten"] = not m.get("source", "").startswith("Cotten")
        m["complement"] = "complément" in m.get("source", "")
        for k in ("contexte","technique","normes","pathologique","pieges","source"):
            m[k] = (m.get(k) or "").strip()
        m["tags"] = m.get("tags") or []
        m["pediatrie"] = bool(m.get("pediatrie"))
        imgs = []
        mt = MATCH.get(m["id"].split("-raw")[0]) or {}
        for c in mt.get("cotten") or []:
            src = f"data/fig/fig-{c['fig'].replace('.', '-')}.jpg"
            pl = str(c.get("panel") or "").strip().lower()[:1]
            psrc = f"data/fig/fig-{c['fig'].replace('.', '-')}-{pl}.jpg" if pl else ""
            cap = CAT.get(c["fig"], {})
            if psrc and os.path.exists(os.path.join(ROOT, psrc)):
                imgs.append({"src": psrc, "type": "cotten", "panel": pl, "caption": "",
                             "credit": f"Cotten, fig. {c['fig']} ({pl})" + (f" — p. {cap['page']}" if cap.get("page") else "")})
            if os.path.exists(os.path.join(ROOT, src)):
                imgs.append({"src": src, "type": "cotten", "panel": c.get("panel"),
                             "caption": re.sub(r"^Fig\.\s*[\d.]+\s*", "", cap.get("caption", "")),
                             "credit": f"Cotten, fig. {c['fig']}" + (f" ({c['panel']})" if c.get("panel") else "") + (f" — p. {cap['page']}" if cap.get("page") else "")})
        w = mt.get("web")
        if w and w.get("file") and os.path.exists(os.path.join(ROOT, w["file"])):
            imgs.append({"src": w["file"], "type": "web", "panel": None, "caption": w.get("legende", ""),
                         "credit": f"{w.get('auteur', '')} · {w.get('licence', '')}", "page": w.get("page", "")})
        _seen = set(); imgs = [i for i in imgs if not (i["src"] in _seen or _seen.add(i["src"]))]
        m["images"] = imgs
        fill(m, {"epaule", "coude", "hanche", "genou", "cheville-pied", "membre-entier"})
        sp = os.path.join(ROOT, "data/svg", m["id"] + ".svg")
        m["svg"] = ""
        if os.path.exists(sp):
            svg = re.sub(r"<!--.*?-->", "", open(sp, encoding="utf-8").read(), flags=re.S)
            svg = re.sub(r"<\?xml[^>]*>", "", svg)
            assert "<script" not in svg.lower() and "style=" not in svg, sp
            m["svg"] = re.sub(r">\s+<", "><", svg.strip())
        items.append(m)
ordre = {r: i for i, r in enumerate(REGIONS)}
items.sort(key=lambda m: (ordre[m["region"]], m["nom"].lower()))
json.dump(items, open(os.path.join(ROOT, "data/measures.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
open(os.path.join(ROOT, "data/embedded_data.js"), "w", encoding="utf-8").write(
    "window.MEASURES_DATA = " + json.dumps(items, ensure_ascii=False) + ";\n")
c = collections.Counter(m["region"] for m in items); k = collections.Counter(m["categorie"] for m in items)
print(len(items), "fiches |", dict(k), "|", dict(c))
print("figures:", sum(1 for m in items if any(i["type"]=="cotten" for i in m["images"])), "web:", sum(1 for m in items if any(i["type"]=="web" for i in m["images"])), "rien:", sum(1 for m in items if not m["images"] and not m["svg"]))
print("illustrées:", sum(1 for m in items if m["svg"]), "/", len(items))
print("modalités:", dict(collections.Counter(x for m in items for x in m["modalites"])))
