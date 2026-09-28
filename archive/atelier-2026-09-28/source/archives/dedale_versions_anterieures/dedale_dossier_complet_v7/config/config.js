// config/config.js

window.DEDALE_CONFIG = {
  "basePath": "/base/steam/dedale",
  "exitUrl": "https://steamescape.fr/limoges",
  "doors": [
    {
      "id": "porte-machine",
      "name": "Porte-Machine",
      "type": "temporal",
      "folder": "portemachine",
      "redirectUrl": "https://sterenna.fr/base/steam/dedale/portemachine",
      "requireCode": true,
      "validCodes": [
        "portemachine",
        "porte machine"
      ],
      "placeholder": "Entrez le nom de la « porte-temporelle »...",
      "riddleTitle": "Porte-Machine – Transmission spectrale",
      "riddleText": "Agents,\n\nVous avez intercepté un fragment sonore sans voix, sans mots,\nseulement un chaos de fréquences. Pourtant, les archives\nmentionnent un dispositif ancien : le Décrypteur Temporel Interlangage.\n\nOn raconte qu’une de ces machines a été verrouillée derrière une porte.\nTant que vous voyez une porte, vous ne voyez pas la machine.\n\nObservez les rivets, la forme du battant, la manière dont\nle métal semble prêt à vibrer. Demandez-vous si ce n’est pas\ndéjà un mécanisme de décodage caché à ciel ouvert.\n\nQuand vous aurez trouvé comment la nommer, entrez ce nom\ncomme code d’accès dans la console.",
      "hasNote": true,
      "noteText": "Plus tu regardes une porte comme une simple barrière,\nÔ moins tu remarques les détails qui la rendent unique.\nRegarde ses engrenages, ses rivets, ses cadrans :\nTout semble immobile, pourtant tout est prêt à s’animer.\nEcoute les vibrations dans le métal quand on l’effleure.\n\nMéfie-toi : certaines portes ne ferment rien…\nAu contraire, ce sont elles qui décodent le monde.\nCe que tu prends pour un battant est peut-être un écran,\nHabillé de symboles, de chiffres, de stries étranges.\nIl suffit parfois d’un bon réglage pour qu’elle “parle”.\nNe demande pas « où est la machine ? »\nElle est sous tes yeux.",
      "notePosition": {
        "bottom": "18px",
        "left": "18px",
        "rotate": "-6deg"
      },
      "dialLabel": "2049",
      "signText": "Section Décrypteur"
    },
    {
      "id": "impremerie",
      "name": "Impremerie",
      "type": "temporal",
      "folder": "imprimerie",
      "redirectUrl": "https://sterenna.fr/base/steam/dedale/imprimerie/",
      "requireCode": true,
      "validCodes": [
        "imprimerie"
      ],
      "placeholder": "Porte temporel pour Munich",
      "riddleTitle": "Enigme 2 - Noel",
      "riddleText": "Le lieu visé par Hades Corp",
      "hasNote": false,
      "noteText": "Note à définir.",
      "notePosition": {
        "bottom": "18px",
        "left": "18px",
        "rotate": "-5deg"
      },
      "dialLabel": "1908",
      "signText": "URGENCE NOEL"
    },
    {
      "id": "porte-salle-briefing",
      "name": "Salle de Briefing",
      "type": "room",
      "folder": "briefing",
      "redirectUrl": "#",
      "requireCode": true,
      "validCodes": [
        "briefing",
        "sallebriefing"
      ],
      "placeholder": "Nom de la salle de l'agence...",
      "riddleTitle": "Salle de Briefing – Mémoire des missions",
      "riddleText": "\nAu fil des époques, les agents S.T.E.A.M. ont toujours commencé ici :\nune table, quelques dossiers, un tableau griffonné.\n\nOn raconte que si l’on écoute le bois de cette porte,\non entend encore les échos des anciennes missions.\n\nSon code n’est pas un mot de passe,\nc’est le nom que les agents lui ont donné.",
      "hasNote": true,
      "noteText": "RAPPEL : Ne sortir d'ici qu'en ayant un plan.\nLes missions improvisées finissent rarement bien.",
      "notePosition": {
        "top": "32px",
        "right": "18px",
        "rotate": "3deg"
      },
      "dialLabel": "1957",
      "signText": "Salle de Briefing"
    },
    {
      "id": "porte-cartographie",
      "name": "Salle Cartographique",
      "type": "room",
      "folder": "cartographie",
      "redirectUrl": "#",
      "requireCode": true,
      "validCodes": [
        "cartographie",
        "sallecartographique",
        "atlas"
      ],
      "placeholder": "Nom secret de la salle des cartes...",
      "riddleTitle": "Salle Cartographique – Atlas des lignes temporelles",
      "riddleText": "\nLes couloirs ne sont que des illusions.\nLes vraies frontières sont tracées ici, sur des cartes qui ne\nreprésentent ni des pays ni des continents, mais des\nbifurcations de l'Histoire.\n\nChaque fois qu'un agent ouvre un portail, une nouvelle ligne\ns’ajoute à ces diagrammes lumineux.\n\nLe mot de passe n'est pas lié à un lieu,\nmais à la manière dont on nomme un ensemble de chemins.",
      "hasNote": true,
      "noteText": "ATTENTION AGENTS :\nLes cartes de cette salle ne sont jamais \"à jour\".\nElles se recalculent à chaque décision que vous prenez.",
      "notePosition": {
        "top": "40px",
        "left": "20px",
        "rotate": "-4deg"
      },
      "dialLabel": "∞",
      "signText": "Salle Cartographique"
    },
    {
      "id": "porte-admin",
      "name": "Couloir d'administration",
      "type": "room",
      "folder": "admin",
      "redirectUrl": "admin/admin.html",
      "requireCode": true,
      "validCodes": [
        "56380"
      ],
      "placeholder": "Entrez le code de contrôle d'accès (agents autorisés uniquement)…",
      "riddleTitle": "Couloir d'administration – Accès restreint",
      "riddleText": "\nCe couloir n'apparaît pas sur les plans officiels de l'agence.\n\nIl relie directement les zones de mission aux panneaux de configuration\ndes dédales, des portes et des machines d'analyse.\n\nPour les visiteurs, ce n'est qu'une porte parmi d'autres.\nPour les agents, c'est l'épaisseur la plus fine entre le terrain et\nles coulisses de S.T.E.A.M.\n\nSeuls ceux qui connaissent le bon code – transmis de bouche d'agent à\noreille d'agent – peuvent l'emprunter.",
      "hasNote": true,
      "noteText": "NOTE INTERNE :\n\n– Ne jamais afficher le code en clair sur un support physique.\n– Changer le code dès qu'un agent le prononce trop fort dans un couloir.\n– Rappeler que l'administration du dédale influence TOUTES les portes liées.\n\nEn cas de doute : verrouiller l'accès et prévenir la direction.",
      "notePosition": {
        "top": "28px",
        "right": "18px",
        "rotate": "-4deg"
      },
      "dialLabel": "ADM",
      "signText": "Couloir d'administration"
    },
    {
      "id": "porte-reliques",
      "name": "Atelier des Reliques",
      "type": "room",
      "folder": "reliques",
      "redirectUrl": "#",
      "requireCode": true,
      "validCodes": [
        "reliques",
        "atelierreliques",
        "atelier des reliques"
      ],
      "placeholder": "Nom de l'atelier…",
      "riddleTitle": "Atelier des Reliques – Objets hors-temps",
      "riddleText": "\nIci, chaque objet a survécu à sa propre époque.\n\nUne montre qui n'avance plus mais qui vieillit,\nun livre qui change de première page à chaque pleine lune,\nune clé qui n'ouvre aucune serrure connue.\n\nPour entrer, il faut accepter que certains artefacts\nsoient plus têtus que le temps lui-même.",
      "hasNote": true,
      "noteText": "Consigne :\nNe JAMAIS exposer plus de trois reliques en même temps.\nSinon, c'est le temps qui choisit laquelle garder.",
      "notePosition": {
        "bottom": "26px",
        "left": "24px",
        "rotate": "5deg"
      },
      "dialLabel": "Δt",
      "signText": "Atelier des Reliques"
    },
    {
      "id": "porte-archive",
      "name": "Porte-Archive",
      "type": "temporal",
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
      "hasNote": true,
      "noteText": "Rien ne se perd.\nRien ne s'efface.\nTout se range juste ailleurs.",
      "notePosition": {
        "bottom": "40px",
        "right": "26px",
        "rotate": "-10deg"
      },
      "dialLabel": "1912",
      "signText": "Archives Temporelles"
    },
    {
      "id": "porte-observatoire",
      "name": "Observatoire Synchronique",
      "type": "temporal",
      "folder": "observatoire",
      "redirectUrl": "#",
      "requireCode": true,
      "validCodes": [
        "observatoire",
        "synchronique",
        "observatoire synchronique"
      ],
      "placeholder": "Un mot lié à l'observation du temps…",
      "riddleTitle": "Observatoire Synchronique – Fenêtres sur les instants",
      "riddleText": "\nLes télescopes de cette salle ne regardent pas le ciel,\nmais les moments.\n\nÀ travers leurs lentilles, on ne voit pas des étoiles,\non voit des scènes, figées ou rejouées à l'infini.\n\nPour accéder à l'observatoire, il faut deviner\ncomment les agents nomment l'art de regarder\nun instant sans le déranger.",
      "hasNote": true,
      "noteText": "Note du service sécurité :\nRegarder trop longtemps la même scène finit\npar vous convaincre que vous auriez pu la changer.",
      "notePosition": {
        "top": "30px",
        "right": "20px",
        "rotate": "-2deg"
      },
      "dialLabel": "00:00",
      "signText": "Observatoire"
    },
    {
      "id": "porte-condamnee-01",
      "name": "Porte Condamnée",
      "type": "locked",
      "folder": null,
      "redirectUrl": "#",
      "requireCode": false,
      "validCodes": [],
      "placeholder": "Cette porte est condamnée...",
      "riddleTitle": "Porte Condamnée – Accès interdit",
      "riddleText": "\nAucun dossier. Aucune autorisation.\nJuste un verrou trop récent pour être historique,\ntrop ancien pour être encore officiel.\n\nMieux vaut ne pas insister.",
      "hasNote": false,
      "noteText": "",
      "notePosition": {},
      "dialLabel": "",
      "signText": "Accès Interdit"
    },
    {
      "id": "porte-condamnee-02",
      "name": "Ancien Couloir Bêta",
      "type": "locked",
      "folder": null,
      "redirectUrl": "#",
      "requireCode": false,
      "validCodes": [],
      "placeholder": "Portail définitivement scellé…",
      "riddleTitle": "Ancien Couloir Bêta – Branche abandonnée",
      "riddleText": "\nCe couloir menait autrefois vers une série de missions\ndont on a préféré effacer le rapport.\n\nOfficiellement : instabilité chronique des portails.\nOfficieusement : trop d'agents y revenaient différents.\n\nLes rivets ont été soudés à chaud.\nLe verrou n'est pas là pour faire joli.",
      "hasNote": true,
      "noteText": "AVERTISSEMENT :\nToute tentative de forcer ce passage\nsera consignée dans le journal des paradoxes.",
      "notePosition": {
        "top": "60px",
        "left": "22px",
        "rotate": "-7deg"
      },
      "dialLabel": "X",
      "signText": "Couloir Bêta"
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
      "hasNote": true,
      "noteText": "SORTIE DE SECOURS\nPour les agents ayant trop voyagé\ndans les dédales temporels.",
      "notePosition": {
        "top": "24px",
        "right": "22px",
        "rotate": "4deg"
      },
      "dialLabel": "",
      "signText": "Sortie"
    }
  ]
};
