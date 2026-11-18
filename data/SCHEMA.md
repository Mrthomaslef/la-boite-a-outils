# Schéma d'une mesure (data/raw/*.json = tableau JSON de mesures)

{
  "id": "epaule-distance-acromio-humerale",          // slug unique, préfixé par la région
  "nom": "Distance acromio-humérale (DAH)",
  "region": "epaule",            // epaule | coude | poignet-main | rachis-cervical | rachis-thoracolombaire | bassin-sacro-iliaques | hanche | genou | jambe | cheville-pied | paroi-thoracique | membre-entier
  "categorie": "mesure",         // mesure | prothese | eos
  "modalites": ["Radio"],        // parmi : Radio, TDM, IRM, Écho, EOS, Arthro-TDM, Arthro-IRM
  "contexte": "Rupture transfixiante / massive de la coiffe",   // pathologie / indication
  "technique": "Incidence de face ... repères, coupe, ligne tracée",
  "normes": "7–14 mm",           // valeurs normales (texte court, unités)
  "pathologique": "< 7 mm : rupture massive probable ; < 5 mm ...",  // seuils & interprétation
  "pieges": "Rotation, incidence ...",   // optionnel ("" sinon)
  "pediatrie": false,            // true si mesure de l'enfant
  "source": "Cotten ch.1 p.23",  // ou "Référence complémentaire (hors Cotten)"
  "tags": ["coiffe", "ascension"]
}
