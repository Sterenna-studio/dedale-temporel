// config/config.js

window.DEDALE_CONFIG = {
  // base du dédale sur ton site
  basePath: "/base/steam/dedale",

  // page de sortie globale (facultatif, pour info)
  exitUrl: "https://steamescape.fr/limoges",

  // liste des portes dans l'ordre d'affichage
  doors: [
    {
      id: "porte-machine",
      name: "Porte-Machine",
      type: "temporal",
      folder: "portemachine",
      redirectUrl: "https://nitro.sterenna.fr/dedale/portemachine/",
      requireCode: true,
      validCodes: ["portemachine", "porte machine"],
      placeholder: "Entrez le nom de la « porte-temporelle »...",
      riddleTitle: "Porte-Machine – Transmission spectrale",
      riddleText: `
Agents,

Vous avez intercepté un fragment sonore sans voix, sans mots,
seulement un chaos de fréquences. Pourtant, les archives
mentionnent un dispositif ancien : le Décrypteur Temporel Interlangage.

On raconte qu'une de ces machines a été verrouillée derrière une porte.
Tant que vous voyez une porte, vous ne voyez pas la machine.

Observez les rivets, la forme du battant, la manière dont
le métal semble prêt à vibrer. Demandez-vous si ce n'est pas
déjà un mécanisme de décodage caché à ciel ouvert.

Quand vous aurez trouvé comment la nommer, entrez ce nom
comme code d'accès dans la console.`,
      hasNote: true,
      noteText: `Plus tu regardes une porte comme une simple barrière,
Ô moins tu remarques les détails qui la rendent unique.
Regarde ses engrenages, ses rivets, ses cadrans :
Tout semble immobile, pourtant tout est prêt à s'animer.
Ecoute les vibrations dans le métal quand on l'effleure.

Méfie-toi : certaines portes ne ferment rien…
Au contraire, ce sont elles qui décodent le monde.
Ce que tu prends pour un battant est peut-être un écran,
Habillé de symboles, de chiffres, de stries étranges.
Il suffit parfois d'un bon réglage pour qu'elle "parle".
Ne demande pas « où est la machine ? »
Elle est sous tes yeux.`,
      notePosition: { bottom: "18px", left: "18px", rotate: "-6deg" },
      dialLabel: "2049",
      signText: "Section Décrypteur"
    },

    {
      id: "porte-salle-briefing",
      name: "Salle de Briefing",
      type: "room",
      folder: "briefing",
      redirectUrl: "https://nitro.sterenna.fr/dedale/briefing/",
      requireCode: true,
      validCodes: ["briefing", "sallebriefing"],
      placeholder: "Nom de la salle de l'agence...",
      riddleTitle: "Salle de Briefing – Mémoire des missions",
      riddleText: `
Au fil des époques, les agents S.T.E.A.M. ont toujours commencé ici :
une table, quelques dossiers, un tableau griffonné.

On raconte que si l'on écoute le bois de cette porte,
on entend encore les échos des anciennes missions.

Son code n'est pas un mot de passe,
c'est le nom que les agents lui ont donné.`,
      hasNote: true,
      noteText: `RAPPEL : Ne sortir d'ici qu'en ayant un plan.
Les missions improvisées finissent rarement bien.`,
      notePosition: { top: "32px", right: "18px", rotate: "3deg" },
      dialLabel: "1957",
      signText: "Salle de Briefing"
    },

    {
      id: "porte-cartographie",
      name: "Salle Cartographique",
      type: "room",
      folder: "cartographie",
      redirectUrl: "https://nitro.sterenna.fr/dedale/cartographie/",
      requireCode: true,
      validCodes: ["cartographie", "sallecartographique", "atlas"],
      placeholder: "Nom secret de la salle des cartes...",
      riddleTitle: "Salle Cartographique – Atlas des lignes temporelles",
      riddleText: `
Les couloirs ne sont que des illusions.
Les vraies frontières sont tracées ici, sur des cartes qui ne
représentent ni des pays ni des continents, mais des
bifurcations de l'Histoire.

Chaque fois qu'un agent ouvre un portail, une nouvelle ligne
s'ajoute à ces diagrammes lumineux.

Le mot de passe n'est pas lié à un lieu,
mais à la manière dont on nomme un ensemble de chemins.`,
      hasNote: true,
      noteText: `ATTENTION AGENTS :
Les cartes de cette salle ne sont jamais "à jour".
Elles se recalculent à chaque décision que vous prenez.`,
      notePosition: { top: "40px", left: "20px", rotate: "-4deg" },
      dialLabel: "∞",
      signText: "Salle Cartographique"
    },

    {
      id: "porte-reliques",
      name: "Atelier des Reliques",
      type: "room",
      folder: "reliques",
      redirectUrl: "https://nitro.sterenna.fr/dedale/reliques/",
      requireCode: true,
      validCodes: ["reliques", "atelierreliques", "atelier des reliques"],
      placeholder: "Nom de l'atelier…",
      riddleTitle: "Atelier des Reliques – Objets hors-temps",
      riddleText: `
Ici, chaque objet a survécu à sa propre époque.

Une montre qui n'avance plus mais qui vieillit,
un livre qui change de première page à chaque pleine lune,
une clé qui n'ouvre aucune serrure connue.

Pour entrer, il faut accepter que certains artefacts
soient plus têtus que le temps lui-même.`,
      hasNote: true,
      noteText: `Consigne :
Ne JAMAIS exposer plus de trois reliques en même temps.
Sinon, c'est le temps qui choisit laquelle garder.`,
      notePosition: { bottom: "26px", left: "24px", rotate: "5deg" },
      dialLabel: "Δt",
      signText: "Atelier des Reliques"
    },

    {
      id: "porte-archive",
      name: "Porte-Archive",
      type: "temporal",
      folder: "archive",
      redirectUrl: "https://nitro.sterenna.fr/dedale/archive/",
      requireCode: true,
      validCodes: ["archive", "archives"],
      placeholder: "Entrez le nom de la porte-archive…",
      riddleTitle: "Porte-Archive – Dossiers effacés",
      riddleText: `
Derrière cette porte, les dossiers ne sont jamais vraiment détruits.
Ils s'effacent en façade, mais laissent toujours une trace
quelque part dans les plis du temps.

Trouver son code, c'est admettre qu'aucun secret
ne disparaît complètement.`,
      hasNote: true,
      noteText: `Rien ne se perd.
Rien ne s'efface.
Tout se range juste ailleurs.`,
      notePosition: { bottom: "40px", right: "26px", rotate: "-10deg" },
      dialLabel: "1912",
      signText: "Archives Temporelles"
    },

    {
      id: "porte-observatoire",
      name: "Observatoire Synchronique",
      type: "temporal",
      folder: "observatoire",
      redirectUrl: "https://nitro.sterenna.fr/dedale/observatoire/",
      requireCode: true,
      validCodes: ["observatoire", "synchronique", "observatoire synchronique"],
      placeholder: "Un mot lié à l'observation du temps…",
      riddleTitle: "Observatoire Synchronique – Fenêtres sur les instants",
      riddleText: `
Les télescopes de cette salle ne regardent pas le ciel,
mais les moments.

À travers leurs lentilles, on ne voit pas des étoiles,
on voit des scènes, figées ou rejouées à l'infini.

Pour accéder à l'observatoire, il faut deviner
comment les agents nomment l'art de regarder
un instant sans le déranger.`,
      hasNote: true,
      noteText: `Note du service sécurité :
Regarder trop longtemps la même scène finit
par vous convaincre que vous auriez pu la changer.`,
      notePosition: { top: "30px", right: "20px", rotate: "-2deg" },
      dialLabel: "00:00",
      signText: "Observatoire"
    },

    {
      id: "porte-steam-clicker",
      name: "Salle des Engrenages",
      type: "temporal",
      folder: "steam-clicker",
      redirectUrl: "https://nitro.sterenna.fr/dedale/steam-clicker/",
      requireCode: true,
      validCodes: ["engrenages", "salle des engrenages", "steam clicker"],
      placeholder: "Nommez la salle des mécanismes actifs…",
      riddleTitle: "Salle des Engrenages – Mécanique perpétuelle",
      riddleText: `
Derrière cette porte, les engrenages ne s'arrêtent jamais.

Des apprentis vapeur aux condenseurs d'éther,
chaque mécanisme s'imbrique dans le suivant,
formant une chaîne de production qui défie le temps.

On dit que les agents qui y pénètrent oublient
combien d'heures s'écoulent à actionner la manivelle.

Pour y accéder, nommez simplement ce que vous entendez
derrière le battant : le bruit incessant des rouages.`,
      hasNote: true,
      noteText: `NOTE DE L'INGÉNIEUR EN CHEF :

Ne tentez pas d'arrêter la machine principale.
Les anneaux orbitaux sont synchronisés depuis 1887.
Toute interruption provoque une cascade de paradoxes
dont personne n'est encore revenu intact.`,
      notePosition: { bottom: "22px", right: "20px", rotate: "4deg" },
      dialLabel: "⚙",
      signText: "Salle des Engrenages"
    },

    // ── NOUVELLE PORTE : Atelier de Calibration (WORKPLATE) ──────────────────
    {
      id: "porte-workplate",
      name: "Atelier de Calibration",
      type: "room",
      folder: "workplate",
      redirectUrl: "https://nitro.sterenna.fr/dedale/workplate/",
      requireCode: true,
      validCodes: ["workplate", "calibration", "atelier calibration", "carnet"],
      placeholder: "Nom de l'atelier de calibration…",
      riddleTitle: "Atelier de Calibration – Carnets d'agent",
      riddleText: `
Chaque agent S.T.E.A.M. reçoit un carnet de bord à son entrée dans l'agence.

Ce n'est pas un simple journal : c'est un outil de calibration.
Ses pages permettent de consigner les mesures, de corriger les dérives
temporelles et d'imprimer les fiches de mission sous format agence.

On dit que l'agent qui perd son carnet perd aussi ses repères dans le temps.

Pour accéder à l'atelier, nommez l'outil que tous les agents portent sur eux.`,
      hasNote: true,
      noteText: `NOTE DE L'ARCHIVISTE :

Les carnets de calibration ne se remplissent pas seuls.
Chaque mesure consignée ici a été validée par au moins deux agents.
Ne modifiez jamais une entrée sans en informer le bureau central.`,
      notePosition: { top: "28px", left: "20px", rotate: "-3deg" },
      dialLabel: "📋",
      signText: "Atelier de Calibration"
    },

    // ── NOUVELLE PORTE : Chambre de Dispersion (DISPERSION) ──────────────────
    {
      id: "porte-dispersion",
      name: "Chambre de Dispersion",
      type: "temporal",
      folder: "dispersion",
      redirectUrl: "https://nitro.sterenna.fr/dedale/dispersion/",
      requireCode: true,
      validCodes: ["dispersion", "tuyaux", "chambre dispersion"],
      placeholder: "Nommez la chambre de dispersion temporelle…",
      riddleTitle: "Chambre de Dispersion – Réseau de tuyaux",
      riddleText: `
Derrière cette porte, la vapeur ne voyage pas en ligne droite.

Un réseau complexe de tuyaux interconnectés redistribue
chaque flux d'énergie temporelle vers les salles qui en ont besoin.

Les agents qui ont conçu ce système ont laissé un outil de configuration
permettant de reconfigurer les connexions à la volée.

Pour entrer, trouvez le mot qui désigne la fragmentation
d'un flux en de multiples directions.`,
      hasNote: true,
      noteText: `AVERTISSEMENT TECHNIQUE :

Ne jamais créer de boucle fermée dans le réseau.
Une boucle de vapeur sans sortie génère une pression
suffisante pour déstabiliser le couloir entier.`,
      notePosition: { bottom: "30px", right: "18px", rotate: "6deg" },
      dialLabel: "≋",
      signText: "Chambre de Dispersion"
    },

    // Porte verrouillée / grisée, purement décorative
    {
      id: "porte-condamnee-01",
      name: "Porte Condamnée",
      type: "locked",
      folder: null,
      redirectUrl: "#",
      requireCode: false,
      validCodes: [],
      placeholder: "Cette porte est condamnée...",
      riddleTitle: "Porte Condamnée – Accès interdit",
      riddleText: `
Aucun dossier. Aucune autorisation.
Juste un verrou trop récent pour être historique,
trop ancien pour être encore officiel.

Mieux vaut ne pas insister.`,
      hasNote: false,
      noteText: "",
      notePosition: {},
      dialLabel: "",
      signText: "Accès Interdit"
    },

    {
      id: "porte-condamnee-02",
      name: "Ancien Couloir Bêta",
      type: "locked",
      folder: "condamnee",
      redirectUrl: "https://nitro.sterenna.fr/dedale/condamnee/",
      requireCode: false,
      validCodes: [],
      placeholder: "Scellé — descellé par le Sceau Temporel…",
      riddleTitle: "Ancien Couloir Bêta – Branche abandonnée",
      riddleText: `
Ce couloir menait autrefois vers une série de missions
dont on a préféré effacer le rapport.

Officiellement : instabilité chronique des portails.
Officieusement : trop d'agents y revenaient différents.

Les rivets ont été soudés à chaud.
Le verrou n'est pas là pour faire joli.`,
      hasNote: true,
      noteText: `AVERTISSEMENT :
Toute tentative de forcer ce passage
sera consignée dans le journal des paradoxes.`,
      notePosition: { top: "60px", left: "22px", rotate: "-7deg" },
      dialLabel: "X",
      signText: "Couloir Bêta"
    },

    {
      id: "porte-admin",
      name: "Couloir d'administration",
      type: "room",
      folder: "admin",
      redirectUrl: "admin/admin.html",
      requireCode: false,
      validCodes: [],
      placeholder: "Accès réservé aux superusers Supabase — utilisez le bouton d'entrée…",
      riddleTitle: "Couloir d'administration – Accès restreint",
      riddleText: `
Ce couloir n'apparaît pas sur les plans officiels de l'agence.

Il relie directement les zones de mission aux panneaux de configuration
des dédales, des portes et des machines d'analyse.

Pour les visiteurs, ce n'est qu'une porte parmi d'autres.
Pour les agents, c'est l'épaisseur la plus fine entre le terrain et
les coulisses de S.T.E.A.M.

Seuls ceux qui connaissent le bon code – transmis de bouche d'agent à
oreille d'agent – peuvent l'emprunter.`,
      hasNote: true,
      noteText: `NOTE INTERNE :

– Ne jamais afficher le code en clair sur un support physique.
– Changer le code dès qu'un agent le prononce trop fort dans un couloir.
– Rappeler que l'administration du dédale influence TOUTES les portes liées.

En cas de doute : verrouiller l'accès et prévenir la direction.`,
      notePosition: { top: "28px", right: "18px", rotate: "-4deg" },
      dialLabel: "ADM",
      signText: "Couloir d'administration"
    },

    // Porte de sortie
    {
      id: "porte-sortie",
      name: "Sortie de l'Agence",
      type: "exit",
      folder: null,
      redirectUrl: "https://steamescape.fr/limoges",
      requireCode: false,
      validCodes: [],
      placeholder: "Cliquez sur valider pour quitter le dédale…",
      riddleTitle: "Porte de Sortie – Retour à la surface",
      riddleText: `
Cette porte ne mène à aucune machine secrète.

Elle ramène simplement les agents à l'entrée
de l'agence S.T.E.A.M. de Limoges.

Quand vous en aurez assez de vous perdre dans les couloirs,
empruntez-la pour revenir à la réalité.`,
      hasNote: true,
      noteText: `SORTIE DE SECOURS
Pour les agents ayant trop voyagé
dans les dédales temporels.`,
      notePosition: { top: "24px", right: "22px", rotate: "4deg" },
      dialLabel: "",
      signText: "Sortie"
    }
  ]
};
