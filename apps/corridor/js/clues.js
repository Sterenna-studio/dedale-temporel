// clues.js
// Indices diégétiques disséminés dans le couloir : notes d'agents oubliées,
// posées au sol ou de côté. Chacune révèle le code (nom) d'une salle.
// Les positions sont relatives à la scène du couloir (.hallway).
//
// `active: false` = indice préparé mais pas encore mis en jeu (masqué du
// couloir). Pour le moment, seule la note du Briefing est active.

window.DEDALE_CLUES = [
  {
    id: "note-briefing",
    label: "Note de service",
    hint: "Papier froissé, tombé au sol près de l'entrée.",
    reveals: "Salle de Briefing",
    code: "briefing",
    text: `Mémo interne — agent Vasseur :

« Rappel : le débriefing se tient TOUJOURS en salle de
briefing. Ne pas confondre avec la salle des cartes.
Le mot d'accès, c'est simplement le nom de la salle. »`,
    pos: { bottom: "8px", left: "16px", rotate: "-7deg" },
    active: true,
    view: "devant", // "devant" | "sol" | "plafond" | "derriere"
  },
  {
    id: "note-cartographie",
    label: "Carte annotée",
    hint: "Feuille pliée, coincée sur le côté du couloir.",
    reveals: "Salle Cartographique",
    code: "atlas",
    text: `Annotation au crayon gras :

« L'atlas temporel est reclassé en salle cartographique.
Pour entrer, prononce « atlas » — ou le nom de la salle. »`,
    pos: { top: "14px", right: "18px", rotate: "5deg" },
    active: false,
    view: "devant",
  },
  {
    id: "note-portemachine",
    label: "Fiche technicien",
    hint: "Fiche tachée d'huile, glissée sous une plinthe.",
    reveals: "Porte-Machine",
    code: "portemachine",
    text: `Consigne atelier :

« Ils croient voir une porte. C'est la machine.
On la nomme porte-machine. Tant que tu la vois comme
une porte, tu ne vois pas le décrypteur. »`,
    pos: { bottom: "10px", right: "22px", rotate: "8deg" },
    active: false,
    view: "devant",
  },
  {
    id: "note-observatoire",
    label: "Feuillet d'observation",
    hint: "Feuillet oublié, retourné au sol.",
    reveals: "Observatoire Synchronique",
    code: "observatoire",
    text: `Journal de veille :

« Instant consigné depuis l'observatoire synchronique.
L'accès se déverrouille en nommant le lieu :
observatoire. »`,
    pos: { top: "18px", left: "20px", rotate: "-4deg" },
    active: false,
    view: "devant",
  },
  {
    id: "note-reliques",
    label: "Étiquette d'inventaire",
    hint: "Étiquette décollée, posée de travers.",
    reveals: "Atelier des Reliques",
    code: "reliques",
    text: `Étiquette de caisse :

« Retour atelier des reliques — objets hors-temps.
Code d'atelier : reliques. Ne pas exposer plus de
trois pièces à la fois. »`,
    pos: { bottom: "40px", left: "44%", rotate: "3deg" },
    active: false,
    view: "devant",
  },
  {
    id: "note-archive",
    label: "Bordereau déchiré",
    hint: "Moitié de bordereau, tombée derrière un rivet.",
    reveals: "Porte-Archive",
    code: "archive",
    text: `Bordereau de classement :

« Dossier versé aux archives temporelles.
Rien ne s'efface : il suffit de nommer le lieu —
archive — pour que la trace ressurgisse. »`,
    pos: { top: "20px", right: "44%", rotate: "-6deg" },
    active: false,
    view: "devant",
  },
];
