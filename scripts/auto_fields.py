"""Valeurs par défaut (calculées) quand une fiche n'a pas encore nom_court / section / court rédigés."""
import re, unicodedata

def _n(s): return unicodedata.normalize("NFD", s or "").encode("ascii", "ignore").decode().lower()

RULES = {
 "epaule": [("Instabilité", r"instab|hill|bankart|labr|glenoid track|glene.*perte|perte osseuse|mc ?laughlin|butee|encoche|gamma|capsulaire ant|sous-labral|slap"),
            ("Omarthrose & glène", r"omarthr|walch|version|glen|pincement|subluxation|prothe"),
            ("Coiffe & conflit", r"coiffe|acrom|subscap|goutallier|patte|thomazeau|tangente|biceps|bourse|coraco-humer|sugaya|lafosse|csa|critique|rupture|spinoglen|supra")],
 "coude": [("Nerfs", r"nerf|ulnaire"), ("Tendons & ligaments", r".")],
 "poignet-main": [("Nerfs & canaux", r"nerf|median|guyon|canal carpien|retinaculum des flech|hamulus"),
                  ("Tendons & poulies", r"tendon|poulie|quervain|flechisseur|extenseur|maillet|dupuytren"),
                  ("Pouce & doigts", r"trapez|rhizarthr|dell|pouce|doigt"),
                  ("Carpe & instabilités", r"scapho|luna|lunat|carpe|carpien|gilula|diastasis|capit|mcmurtry|translation|kienb|lichtman|triquet|pisi"),
                  ("Radius & ulna", r".")],
 "rachis-cervical": [("Charnière crânio-cervicale", r"chamberlain|mcgregor|wackenheim|basal|clivus|atlanto|odonto|c1|basion|spinocran"),
                     ("Instabilité", r"instab|flexion"), ("Canal & moelle", r".")],
 "rachis-thoracolombaire": [("Scoliose & équilibre", r"cobb|scolio|nash|mehta|risser|equilibre|plumb|gite|lordose|cyphose|incidence|version pelv|pente sacr|roussouly|obliquite|fleche|renversement|pelvi"),
                            ("Lyse & spondylolisthésis", r"lyse|listh|meyerding|taillard|boxall|dysplasie de l5|indice de s1|dome|dubousset|encastrement|interlyse|glissement|pediculofacet"),
                            ("Canal & sténose", r"canal|stenose|sac dural|schizas|recessus|lipomatose|diametre|interarticul"),
                            ("Disque & dégénératif", r"disc|modic|pfirrmann|hernie|herniaire|resnick|dish|instabilit"),
                            ("Fractures & divers", r".")],
 "paroi-thoracique": [("Paroi thoracique", r".")],
 "bassin-sacro-iliaques": [("Sacro-iliaques", r"sacro-ili|sacroil|paraglen"), ("Symphyse & avulsions", r"symphys|avulsion|apophys|crete"), ("Nerfs & divers", r".")],
 "hanche": [("Ostéonécrose", r"necros|ficat|arco|kerboul|koo|lafforgue|effondrement|sous-chondral|fracture"),
            ("Conflit fémoro-acétabulaire", r"alpha|notzli|offset|cervicoceph|croisement|paroi post|epine|ischiat|retrovers|labrum|antevers"),
            ("Parties molles", r"ischiofem|carre femoral|trochanter|droit femoral|tendon|bourse|nerf|sciatique"),
            ("Arthrose", r"interligne|pincement|arthros|cartilag|cdr"),
            ("Dysplasie & couverture", r".")],
 "genou": [("Ménisques", r"menisc|anse|discoide|megacorne|menisco|extrusion"),
           ("Ligaments croisés", r"lca|lcp|croise|tiroir|blumensaat|tunnel|cyclope|echancrure|pente tibiale|segond|encoche condyl|rotatoire|decouverture"),
           ("Collatéraux & PAPL", r"lcl|papl|varus force|collateral|tractus|tibiofibulaire|postero-lat"),
           ("Arthrose & cartilage", r"arthros|kellgren|cartilag|outerbridge|interligne|hka|synovi|osteonecrose|koshino"),
           ("Fémoro-patellaire", r".")],
 "jambe": [("Jambe", r".")],
 "cheville-pied": [("Tendons", r"tendon|achille|calcaneen|ttp|tibial post|fibulaire|peroneum|sobel|gaine|chauveaux|haglund"),
                   ("Ligaments & syndesmose", r"ltfa|lcf|ligament|syndesm|tiroir|espace clair|chevauchement|tibiotalien|spring"),
                   ("Avant-pied & hallux", r"m1|m2|m4|m5|hallux|sesamo|dmaa|orteil|metatars|meschan|avant-pied|morton"),
                   ("Parties molles", r"aponevrose|tunnel tarsien|veine|nevrome|morton"),
                   ("Arrière-pied & arche", r".")],
 "membre-entier": [("Axes & longueurs", r".")],
}
CAT = {
 "prothese": [("Hanche", r"hanche|pth|cupule|cotyl|acetab|gruen|delee|charnley|tige femor|double mobil|brooker|lewinnek|resurfa"),
              ("Genou", r"genou|ptg|tibial|patella|knee|unicompart|puc"),
              ("Épaule", r"epaule|pte|pti|glen|scapul|sirveaux|acromi|lazarus|coiffe|lsa|dsa|butee"),
              ("Coude & poignet", r"coude|radiale|poignet|trapez|carp|rhizo|doigt"),
              ("Cheville", r"cheville|talus|talien"), ("Rachis", r"rachis|arthrodese|disc|vis pedic"), ("Généralités", r".")],
 "eos": [("Torsions", r"torsion|antevers|rotation fem"), ("Axes & longueurs", r"hka|longueur|axe|mldfa|mpta|hks|inegalite|genou|femor|tibia|pth"),
         ("Scoliose", r"cobb|scolio|rotation vert|gite|frontal"), ("Technique", r"dose|technique|avantage|acquisition"),
         ("Équilibre sagittal & bassin", r".")],
}

def short(s, n):
    s = (s or "").strip()
    if s in ("", "—", "-"): return ""
    if len(s) <= n: return s
    for sep in (" ; ", "; ", ". ", " — ", " ("):
        i = s.find(sep)
        if 8 < i <= n: return s[:i].rstrip(" .;")
    cut = s[:n].rsplit(" ", 1)[0]
    return cut.rstrip(" ,;:") + "…"

def nom_court(nom):
    m = re.search(r"\(([^()]{2,14})\)", nom)
    base = re.sub(r"\s*\([^()]*\)", "", nom).strip()
    if len(base) <= 42: return base
    if m and not re.search(r"[a-zé]{6,} [a-zé]{6,}", m.group(1)): return m.group(1).strip()
    return short(base, 42)

def fill(m, regions_with_child):
    m.setdefault("nom_court", nom_court(m["nom"]))
    if not m.get("section"):
        rules = CAT.get(m["categorie"]) or RULES.get(m["region"], [])
        if m["categorie"] == "mesure" and m["pediatrie"] and m["region"] in regions_with_child:
            m["section"] = "Enfant"
        else:
            hay = _n(" ".join([m["nom"], m.get("contexte", ""), " ".join(m.get("tags", []))]))
            m["section"] = next((s for s, rx in rules if re.search(rx, hay)), rules[-1][0] if rules else "")
    c = m.get("court") or {}
    m["court"] = {"trace": c.get("trace") or short(m["technique"], 110),
                  "normal": c.get("normal") if c.get("normal") is not None and "normal" in c else short(m["normes"], 48),
                  "patho": c.get("patho") or short(m["pathologique"], 120)}
