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
      type: "temporal", // 'temporal' | 'room' | 'locked' | 'exit'
      folder: "portemachine", // sous-dossier
      redirectUrl: "https://sterenna.fr/base/steam/decrytpeur/portemachine",
      requireCode: true,
      validCodes: ["portemachine", "porte machine"],
      placeholder: "Entrez le nom de la « porte-temporelle »...",
      riddleTitle: "Porte-Machine – Transmission spectrale",
      riddleText: `
Agents,

Vous avez intercepté un fragment sonore sans voix, sans mots,
seulement un chaos de fréquences. Pourtant, les archives
mentionnent un dispositif ancien : le Décrypteur Temporel Interlangage.

On raconte qu’une de ces machines a été verrouillée derrière une porte.
Tant que vous voyez une porte, vous ne voyez pas la machine.

Observez les rivets, la forme du battant, la manière dont
le métal semble prêt à vibrer. Demandez-vous si ce n’est pas
déjà un mécanisme de décodage caché à ciel ouvert.

Quand vous aurez trouvé comment la nommer, entrez ce nom
comme code d’accès dans la console.`,
      hasNote: true,
      noteText: `Plus tu regardes une porte comme une simple barrière,
Ô moins tu remarques les détails qui la rendent unique.
Regarde ses engrenages, ses rivets, ses cadrans :
Tout semble immobile, pourtant tout est prêt à s’animer.
Ecoute les vibrations dans le métal quand on l’effleure.

Méfie-toi : certaines portes ne ferment rien…
Au contraire, ce sont elles qui décodent le monde.
Ce que tu prends pour un battant est peut-être un écran,
Habillé de symboles, de chiffres, de stries étranges.
Il suffit parfois d’un bon réglage pour qu’elle “parle”.
Ne demande pas « où est la machine ? »
Elle est sous tes yeux.`,
      notePosition: {
        bottom: "18px",
        left: "18px",
        rotate: "-6deg"
      },
      dialLabel: "2049",
      signText: "Section Décrypteur"
    },

    {
      id: "porte-salle-briefing",
      name: "Salle de Briefing",
      type: "room",
      folder: "briefing",
      redirectUrl: "#",
      requireCode: true,
      validCodes: ["briefing", "sallebriefing"],
      placeholder: "Nom de la salle de l'agence...",
      riddleTitle: "Salle de Briefing – Mémoire des missions",
      riddleText: `
Au fil des époques, les agents S.T.E.A.M. ont toujours commencé ici :
une table, quelques dossiers, un tableau griffonné.

On raconte que si l’on écoute le bois de cette porte,
on entend encore les échos des anciennes missions.

Son code n’est pas un mot de passe,
c’est le nom que les agents lui ont donné.`,
      hasNote: true,
      noteText: `RAPPEL : Ne sortir d'ici qu'en ayant un plan.
Les missions improvisées finissent rarement bien.`,
      notePosition: {
        top: "32px",
        right: "18px",
        rotate: "3deg"
      },
      dialLabel: "1957",
      signText: "Salle de Briefing"
    },

    {
      id: "porte-archive",
      name: "Porte-Archive",
      type: "temporal",
      folder: "archive",
      redirectUrl: "#",
      requireCode: true,
      validCodes: ["archive", "archives"],
      placeholder: "Entrez le nom de la porte-archive…",
      riddleTitle: "Porte-Archive – Dossiers effacés",
      riddleText: `
Derrière cette porte, les dossiers ne sont jamais vraiment détruits.
Ils s’effacent en façade, mais laissent toujours une trace
quelque part dans les plis du temps.

Trouver son code, c’est admettre qu’aucun secret
ne disparaît complètement.`,
      hasNote: true,
      noteText: `Rien ne se perd.
Rien ne s'efface.
Tout se range juste ailleurs.`,
      notePosition: {
        bottom: "40px",
        right: "26px",
        rotate: "-10deg"
      },
      dialLabel: "1912",
      signText: "Archives Temporelles"
    },

    // Porte verrouillée / grisée, purement décorative pour le moment
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
Juste un verrou trop récents pour être historique,
trop ancien pour être encore officiel.

Mieux vaut ne pas insister.`,
      hasNote: false,
      noteText: "",
      notePosition: {},
      dialLabel: "",
      signText: "Accès Interdit"
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
      notePosition: {
        top: "24px",
        right: "22px",
        rotate: "4deg"
      },
      dialLabel: "",
      signText: "Sortie"
    }
  ]
};
