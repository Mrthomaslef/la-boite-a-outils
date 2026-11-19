#!/usr/bin/env python3
"""Fusionne data/raw/*.json -> data/measures.json + data/embedded_data.js (hors-ligne / file://)."""
import json, glob, os, re, collections, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from auto_fields import fill
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REGIONS = ["epaule","coude","poignet-main","rachis-cervical","rachis-thoracolombaire","paroi-thoracique",
           "bassin-sacro-iliaques","hanche","genou","jambe","cheville-pied","membre-entier"]
MODS = ["Radio","TDM","IRM","Écho","EOS","Arthro-TDM","Arthro-IRM"]
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
print("illustrées:", sum(1 for m in items if m["svg"]), "/", len(items))
print("modalités:", dict(collections.Counter(x for m in items for x in m["modalites"])))
