#!/usr/bin/env python3
"""Planche-contact des schémas : python3 scripts/preview_svgs.py <motif_glob> [sortie.png] [--dark]
ex. python3 scripts/preview_svgs.py 'genou-*' /tmp/genou.png  → lire le PNG pour vérifier visuellement."""
import glob, os, sys, subprocess, tempfile, math, html
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
pat = sys.argv[1] if len(sys.argv) > 1 else "*"
out = sys.argv[2] if len(sys.argv) > 2 and not sys.argv[2].startswith("--") else f"/tmp/svg-{pat.strip('*-')}.png"
dark = "--dark" in sys.argv
files = sorted(glob.glob(os.path.join(ROOT, "data/svg", pat + ".svg")))
css = open(os.path.join(ROOT, "svg.css")).read()
cells = "".join(f'<div class="c"><div class="fig">{open(f).read()}</div><p>{html.escape(os.path.basename(f)[:-4])}</p></div>' for f in files)
doc = f"""<!doctype html><meta charset=utf-8><style>{css}
body{{margin:0;padding:10px;background:{'#131c2e' if dark else '#fff'};color:{'#ddd' if dark else '#333'};font:11px system-ui;color-scheme:{'dark' if dark else 'light'}}}
.g{{display:grid;grid-template-columns:repeat(4,320px);gap:10px}}.c{{border:1px solid #ccc;border-radius:8px;padding:4px}}p{{margin:2px 4px}}</style>
<div class=g>{cells}</div>"""
tmp = tempfile.NamedTemporaryFile("w", suffix=".html", delete=False); tmp.write(doc); tmp.close()
rows = math.ceil(len(files) / 4) or 1
B = os.path.expanduser("~/Library/Caches/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-mac-arm64/chrome-headless-shell")
args = [B, "--disable-gpu", "--hide-scrollbars", f"--window-size={4*330+20},{rows*262+20}", f"--screenshot={out}", "file://" + tmp.name]
if dark: args.insert(1, "--force-dark-mode")
subprocess.run(args, capture_output=True)
print(f"{len(files)} schémas → {out}")
