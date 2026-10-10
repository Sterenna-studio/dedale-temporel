Vapeur Clicker – Version Minimaliste (Étendue)

Cette version minimaliste du jeu S.T.E.A.M. Clicker a été étendue afin de reprendre les données et mécaniques du clicker complet tout en conservant une interface légère. On y retrouve désormais un engrenage central cliquable, un affichage du boost et de la manivelle, une boutique d’or et une navigation multi‑onglets. Chaque valeur (quantité possédée, production unitaire et totale) est affichée à côté de son icône. La navigation permet de basculer entre les pages Engrenages, Artisans, Structures et Or.

Fonctionnalités principales

Compatibilité totale avec la sauvegarde de la version complète : le jeu lit et écrit dans la même clé steamClickerSave du localStorage. Les champs inconnus sont préservés. Cela permet de passer du clicker complet à la version vapeur (et inversement) sans perdre de progression.

Achat et production d’engrenages : sept types d’engrenages issus du jeu original (Bronze → Quantique) peuvent être achetés. Le coût en vapeur est affiché et multiplié par un facteur d’achat cyclique (×1 / ×5 / ×10 / ×50 / ×100). La liste indique pour chaque engrenage le nombre possédé et trois valeurs : la production unitaire après application des anneaux, la production unitaire après application du boost actuel, et la production totale. Les compteurs utilisent une notation à suffixes étendue (K, M, B, T, Qa, Qi, …) pour que les très grands nombres restent lisibles.

Artisans et regroupements non destructifs : acheter des artisans par tier permet de produire automatiquement des engrenages de ce tier. Les confréries (9 artisans), quartiers (3 confréries) et conglomérats (3 quartiers) multiplient désormais la production respectivement par 3, par 5 et par 10 (multiplicatif). La page Artisans affiche pour chaque tier le nombre d’artisans, le multiplicateur cumulé et la production totale d’engrenages. Une info‑bulle détaille le calcul (base, multiplicateurs, production finale).

Conversion en anneaux par paquets : les engrenages sont convertis en anneaux par paquets de 9 (configurable via EVOLUTION_COST). Il est possible de désactiver l’auto‑conversion pour un type d’engrenage et de déclencher manuellement la conversion de tous les engrenages.

Manivelle et boost dynamiques : en plus du clic, maintenez la touche M enfoncée et tournez la molette de votre souris pour activer la manivelle : chaque cran de molette augmente (vers le haut) ou diminue (vers le bas) la puissance de la manivelle. La valeur de puissance se transforme directement en pourcentage de boost appliqué à la production de vapeur. Pendant l’utilisation de la manivelle, le défilement de la page est bloqué afin de ne pas perturber la navigation.

Boutique d’or : échangez votre vapeur contre de l’or via plusieurs offres (basées sur les GOLD_EXCHANGE_RATES du fichier de données). Le montant d’or est affiché dans la barre des ressources.

Structure et statistiques : la page Structures récapitule le nombre d’artisans, de confréries, de quartiers et de conglomérats pour chaque tier.

Actions rapides : export/import de sauvegarde, remboursement total (récupération de la valeur en vapeur de tous les objets et remise des engrenages consommés), réinitialisation avec compteur de resets, et conversion manuelle de tous les engrenages.

Structure de l’interface

Une zone centrale affiche la gear principale cliquable ainsi que des indicateurs pour la manivelle et le boost.

Une barre de statistiques indique la vapeur, la production par seconde et l’or possédé.

Une barre de navigation permet de basculer entre quatre onglets : Engrenages, Artisans, Structures et Or. Un bouton en fin de barre permet de changer le facteur d’achat (×1 → ×5 → ×10 → ×50 → ×100).

Dans chaque page, une liste présente les items disponibles :

Engrenages : icône, nom, quantité possédée, production unitaire et totale, bouton d’achat, bouton Auto ON/OFF pour la conversion et bouton « Convertir » global.

Artisans : icône, nom, nombre d’artisans, et production d’engrenages par tier.

Structures : pour chaque tier présent, nombre d’artisans, confréries, quartiers et conglomérats.

Or : liste des offres d’échange vapeur → or avec un bouton d’achat.

Un bloc Actions regroupe les fonctions d’exportation, d’importation, de remboursement total, de réinitialisation et de conversion manuelle.

Fichiers

index.html : structure HTML de l’interface. Elle charge le fichier de styles style.css et le script vapeur.js.

style.css : styles de base (mode sombre, listes sans animations, boutons discrets).

vapeur.js : logique du jeu : chargement/sauvegarde, calculs de production, achat d’objets, conversions en anneaux, mise à jour de l’affichage, et loop principale.

Placez l’ensemble du dossier vapeur dans le répertoire lab/ de votre projet. Ouvrez index.html dans un navigateur pour jouer.