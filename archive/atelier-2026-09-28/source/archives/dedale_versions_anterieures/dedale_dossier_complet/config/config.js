// config/config.js

window.DEDALE_CONFIG = {
  "basePath": "/base/steam/dedale",
  "exitUrl": "https://steamescape.fr/limoges",
  "doors": [
    {
      "id": "porte-machine",
      "name": "Porte-Machine",
      "type": "tool",
      "folder": "portemachine",
      "redirectUrl": "https://sterenna.fr/base/steam/decrytpeur/portemachine",
      "requireCode": true,
      "validCodes": [
        "portemachine",
        "porte machine"
      ],
      "placeholder": "Entrez le nom de la « porte-temporelle »...",
      "riddleTitle": "Porte-Machine – Transmission spectrale",
      "riddleText": "\nAgents,\n\nVous avez intercepté un fragment sonore sans voix, sans mots,\nseulement un chaos de fréquences. Pourtant, les archives\nmentionnent un dispositif ancien : le Décrypteur Temporel Interlangage.\n\nOn raconte qu’une de ces machines a été verrouillée derrière une porte.\nTant que vous voyez une porte, vous ne voyez pas la machine.\n\nObservez les rivets, la forme du battant, la manière dont\nle métal semble prêt à vibrer. Demandez-vous si ce n’est pas\ndéjà un mécanisme de décodage caché à ciel ouvert.\n\nQuand vous aurez trouvé comment la nommer, entrez ce nom\ncomme code d’accès dans la console.",
      "noteText": "Plus tu regardes une porte comme une simple barrière,\nÔ moins tu remarques les détails qui la rendent unique.\nRegarde ses engrenages, ses rivets, ses cadrans :\nTout semble immobile, pourtant tout est prêt à s’animer.\nEcoute les vibrations dans le métal quand on l’effleure.\n\nMéfie-toi : certaines portes ne ferment rien…\nAu contraire, ce sont elles qui décodent le monde.\nCe que tu prends pour un battant est peut-être un écran,\nHabillé de symboles, de chiffres, de stries étranges.\nIl suffit parfois d’un bon réglage pour qu’elle “parle”.\nNe demande pas « où est la machine ? »\nElle est sous tes yeux.",
      "notePosition": {
        "bottom": "18px",
        "left": "18px",
        "rotate": "-6deg"
      }
    },
    {
      "id": "porte-archive",
      "name": "Porte-Archive",
      "type": "tool",
      "folder": "archive",
      "redirectUrl": "#",
      "requireCode": true,
      "validCodes": [
        "archive",
        "archives"
      ],
      "placeholder": "Entrez le nom de la porte-archive…",
      "riddleTitle": "Porte-Archive – Dossiers effacés",
      "riddleText": "\nDerrière cette porte, les dossiers ne sont jamais vraiment détruits.\nIls s’effacent en façade, mais laissent toujours une trace\nquelque part dans les plis du temps.\n\nTrouver son code, c’est admettre qu’aucun secret\nne disparaît complètement.",
      "noteText": "Rien ne se perd.\nRien ne s'efface.\nTout se range juste ailleurs.",
      "notePosition": {
        "bottom": "40px",
        "right": "26px",
        "rotate": "-10deg"
      }
    },
    {
      "id": "porte-sortie",
      "name": "Sortie de l'Agence",
      "type": "exit",
      "folder": null,
      "redirectUrl": "https://steamescape.fr/limoges",
      "requireCode": false,
      "validCodes": [],
      "placeholder": "Cliquez sur valider pour quitter le dédale…",
      "riddleTitle": "Porte de Sortie – Retour à la surface",
      "riddleText": "\nCette porte ne mène à aucune machine secrète.\n\nElle ramène simplement les agents à l'entrée\nde l'agence S.T.E.A.M. de Limoges.\n\nQuand vous en aurez assez de vous perdre dans les couloirs,\nempruntez-la pour revenir à la réalité.",
      "noteText": "SORTIE DE SECOURS\nPour les agents ayant trop voyagé\ndans les dédales temporels.",
      "notePosition": {
        "top": "24px",
        "right": "22px",
        "rotate": "4deg"
      }
    },
    {
      "id": "imprimerie",
      "name": "Imprimerie Médicale 1908",
      "type": "tool",
      "folder": "",
      "redirectUrl": "#",
      "requireCode": true,
      "validCodes": [
        "imprimerie"
      ],
      "placeholder": "Configurer cette porte…",
      "riddleTitle": "Nouvelle porte",
      "riddleText": "https://www.instagram.com/p/DSX2jxFDTdl/?utm_source=ig_web_button_share_sheet&igsh=MzRlODBiNWFlZA==",
      "noteText": "Note à définir.",
      "notePosition": {
        "bottom": "18px",
        "left": "18px",
        "rotate": "-5deg"
      }
    }
  ]
};
