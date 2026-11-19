#!/usr/bin/env python3
"""Copie dans data/fig/ les figures Cotten (et panneaux) utilisées par data/figmatch/*.json, redimensionnées."""
import json, glob, os, shutil, subprocess
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.expanduser("~/.cache/cotten-figs")
cat = {x["fig"]: x for x in json.load(open(os.path.join(CACHE, "catalog.json")))}
os.makedirs(os.path.join(ROOT, "data/fig"), exist_ok=True)
n = 0
for f in glob.glob(os.path.join(ROOT, "data/figmatch/*.json")):
    for v in json.load(open(f)).values():
        for c in v.get("cotten") or []:
            x = cat.get(c["fig"])
            if not x: continue
            srcs = [(x["file"], f"fig-{c['fig'].replace('.', '-')}.jpg")]
            if c.get("panel"):
                pl = str(c["panel"]).strip().lower()[:1]
                srcs.append((x["file"].replace(".jpg", f"-{pl}.jpg"), f"fig-{c['fig'].replace('.', '-')}-{pl}.jpg"))
            for s, d in srcs:
                s, d = os.path.join(CACHE, s), os.path.join(ROOT, "data/fig", d)
                if os.path.exists(s) and not os.path.exists(d):
                    shutil.copy(s, d); subprocess.run(["sips", "-Z", "1000", "-s", "formatOptions", "72", d], capture_output=True); n += 1
print(n, "fichiers copiés")
