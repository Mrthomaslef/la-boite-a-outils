#!/usr/bin/env python3
"""Découpe en panneaux (a, b, c…) les figures composites d'un seul bloc, via les bandes blanches séparatrices.
Ne traite que les figures référencées avec un panneau dans data/figmatch et sans fichier panneau existant.
Usage : /tmp/venv-fitz/bin/python scripts/split_panels.py"""
import json, glob, os
import numpy as np
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.expanduser("~/.cache/cotten-figs")
cat = {x["fig"]: x for x in json.load(open(os.path.join(CACHE, "catalog.json")))}

def bands(white, min_gap):
    """segments non blancs séparés par des bandes blanches d'au moins min_gap px"""
    segs, start, gap = [], None, 0
    for i, w in enumerate(list(white) + [True] * (min_gap + 1)):
        if not w:
            if start is None: start = i
            gap = 0
        else:
            gap += 1
            if start is not None and gap >= min_gap:
                segs.append((start, i - gap + 1)); start = None
    return [s for s in segs if s[1] - s[0] > 60]

def split(path):
    im = Image.open(path).convert("L"); a = np.asarray(im) > 235
    panels = []
    for r0, r1 in bands(a.all(axis=1), 6):
        for c0, c1 in bands(a[r0:r1].all(axis=0), 6):
            panels.append((c0, r0, c1, r1))
    return im, panels

done = 0
for f in glob.glob(os.path.join(ROOT, "data/figmatch/*.json")):
    for v in json.load(open(f)).values():
        for c in v.get("cotten") or []:
            pl = str(c.get("panel") or "").strip().lower()[:1]
            x = cat.get(c["fig"])
            if not pl or not x: continue
            src = os.path.join(CACHE, x["file"])
            if os.path.exists(src.replace(".jpg", f"-{pl}.jpg")): continue
            im, panels = split(src)
            if not 2 <= len(panels) <= 12: continue
            for k, box in enumerate(panels):
                Image.open(src).crop(box).save(src.replace(".jpg", f"-{'abcdefghijkl'[k]}.jpg"), quality=85)
            done += 1
print(done, "figures découpées")
