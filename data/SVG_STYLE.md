# Charte des schémas (SVG inline, injectés dans la page)

- Fichier : `data/svg/<id>.svg` (id = id exact de la fiche). Un seul `<svg viewBox="0 0 320 220" xmlns="http://www.w3.org/2000/svg">`.
- AUCUNE couleur en dur, AUCUN `style=`, AUCUN `<style>`, pas de `fill=`/`stroke=` (sauf `fill="none"` autorisé), pas de font-size : uniquement les CLASSES ci-dessous (le CSS de l'app gère clair/sombre).
- Pas de `<defs>`, pas d'id, pas de gradient, pas d'image, pas de script. Formes simples : path, line, circle, ellipse, rect, polygon, polyline, text.
- Lisibilité sur iPhone : schéma simple, 1 à 3 éléments de mesure max, 2 à 5 étiquettes courtes (≤ 3 mots), texte ≥ 10 px de haut naturel (la classe gère), rien hors du cadre 0–320 × 0–220 (garder 8 px de marge), pas de texte qui se chevauche.
- Anatomie schématique mais RECONNAISSABLE (contours osseux corrects : orientation, proportions, incidence indiquée si utile ex. « face », « profil », « axial »).

| Classe | Usage |
|---|---|
| `os` | os (remplissage clair + contour) |
| `os2` | 2e os / os plus foncé (pour distinguer deux pièces) |
| `cart` | cartilage / labrum / ménisque (trait ou remplissage bleuté) |
| `mou` | tendon, ligament, muscle, nerf, parties molles |
| `imp` | implant métallique (tige, cupule, vis, plaque) |
| `pe` | polyéthylène / ciment / insert |
| `zone` | zone colorée translucide (zone de Gruen, aire, territoire) |
| `ref` | ligne de référence (pointillés gris) |
| `m` | ligne de mesure principale (couleur accent, épaisse) |
| `m2` | 2e ligne de mesure (orange) |
| `dim` | cote de distance avec flèches aux deux bouts (accent) |
| `arc` | arc d'angle (accent, sans remplissage) |
| `pt` / `pt2` | point repère (accent / orange) |
| `t` | étiquette (gris foncé, petite) |
| `tv` | étiquette de la mesure (accent, gras) |
| `tz` | numéro de zone / grade (petit, gras, centré : ajouter text-anchor="middle") |

Exemples : `data/svg/_exemple-vce.svg`, `data/svg/_exemple-tagt.svg`.
