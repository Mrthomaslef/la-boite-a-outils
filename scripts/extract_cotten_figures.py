#!/usr/bin/env python3
"""Extrait toutes les figures du Cotten (PDF par chapitre) en JPEG, annotations vectorielles comprises.
Usage : /tmp/venv-fitz/bin/python scripts/extract_cotten_figures.py <dossier_pdf> <dossier_sortie>
Sortie : <sortie>/chN/fig-N-M.jpg + <sortie>/catalog.json [{fig, ch, page_pdf, page_livre, caption, file, w, h}]"""
import pymupdf, sys, re, os, json, glob
src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
CAP = re.compile(r"^\s*Fig\.\s*(\d+)\.(\d+)")
cat = []
for pdf in sorted(glob.glob(os.path.join(src, "*.pdf"))):
    m = re.match(r"(\d+)", os.path.basename(pdf))
    if not m: continue
    ch = int(m.group(1)); doc = pymupdf.open(pdf); od = os.path.join(out, f"ch{ch}"); os.makedirs(od, exist_ok=True)
    for pno, pg in enumerate(doc):
        W, H = pg.rect.width, pg.rect.height
        blocks = pg.get_text("blocks")
        caps = sorted([b for b in blocks if CAP.match(b[4])], key=lambda b: b[1])
        if not caps: continue
        visuals = [pymupdf.Rect(i["bbox"]) for i in pg.get_image_info()]
        visuals += [d["rect"] for d in pg.get_drawings() if d["rect"].width < W * .95 and d["rect"].height > 1 and d["rect"].width > 1]
        visuals = [v for v in visuals if v.width > 3 and v.height > 3 and v.y0 > 30]
        # numéro de page imprimé (en-tête)
        head = " ".join(b[4] for b in blocks if b[1] < 50)
        pl = re.findall(r"\b(\d{1,4})\b", head); page_livre = int(pl[-1]) if pl else None
        for ci, c in enumerate(caps):
            cr = pymupdf.Rect(c[:4])
            # zone verticale : entre la légende précédente (même colonne) et cette légende
            top = 30
            for p in caps[:ci]:
                pr = pymupdf.Rect(p[:4])
                if pr.x0 < cr.x1 and pr.x1 > cr.x0: top = max(top, pr.y1)
            cand = [v for v in visuals if v.y1 <= cr.y0 + 4 and v.y0 >= top - 2 and v.x1 > cr.x0 - 40 and v.x0 < cr.x1 + 40]
            if not cand: continue
            r = pymupdf.Rect(cand[0])
            for v in cand[1:]: r |= v
            if r.width < 60 or r.height < 40: continue
            r = (r + (-3, -3, 3, 3)) & pg.rect
            r.y1 = min(r.y1, cr.y0 - 1)
            pix = pg.get_pixmap(clip=r, dpi=200)
            if pix.width > 1100:
                pix = pg.get_pixmap(clip=r, dpi=int(200 * 1100 / pix.width))
            fig = f"{CAP.match(c[4]).group(1)}.{CAP.match(c[4]).group(2)}"
            fn = f"ch{ch}/fig-{fig.replace('.', '-')}.jpg"
            if any(x["file"] == fn for x in cat): fn = fn.replace(".jpg", f"-p{pno}.jpg")
            pix.save(os.path.join(out, fn), jpg_quality=82)
            # panneaux : images bitmap distinctes de la figure, ordre de lecture (lignes puis gauche→droite) → a, b, c…
            ims = sorted([v for v in cand if any(abs(v.x0 - i["bbox"][0]) < .5 and abs(v.y0 - i["bbox"][1]) < .5 for i in pg.get_image_info())
                          and v.width > 40 and v.height > 40], key=lambda v: (v.y0, v.x0))
            rows = []
            for v in ims:
                if rows and abs(rows[-1][0].y0 - v.y0) < 25: rows[-1].append(v)
                else: rows.append([v])
            ordered = [v for row in rows for v in sorted(row, key=lambda v: v.x0)]
            if 2 <= len(ordered) <= 12:
                for k, v in enumerate(ordered):
                    pp = pg.get_pixmap(clip=v & pg.rect, dpi=220)
                    if pp.width > 1000: pp = pg.get_pixmap(clip=v & pg.rect, dpi=int(220 * 1000 / pp.width))
                    pp.save(os.path.join(out, fn.replace(".jpg", f"-{'abcdefghijkl'[k]}.jpg")), jpg_quality=82)
            cap = re.sub(r"\s+", " ", c[4]).strip()
            # légende parfois coupée en plusieurs blocs : prendre les blocs suivants collés
            for b in blocks:
                if b[1] > c[3] - 1 and b[1] < c[3] + 14 and abs(b[0] - c[0]) < 5 and not CAP.match(b[4]):
                    cap += " " + re.sub(r"\s+", " ", b[4]).strip()
            cat.append({"fig": fig, "ch": ch, "page_pdf": pno, "page_livre": page_livre, "caption": cap, "file": fn, "w": pix.width, "h": pix.height})
    print(os.path.basename(pdf), sum(1 for x in cat if x["ch"] == ch))
json.dump(cat, open(os.path.join(out, "catalog.json"), "w"), ensure_ascii=False, indent=1)
print("TOTAL", len(cat))
