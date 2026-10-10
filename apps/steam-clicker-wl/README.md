# S.T.E.A.M. Clicker

Jeu de production steampunk. La page `index.html` charge le module `main.js`,
les styles complémentaires `runtime.css` et les images du dossier `assets`.

## Lancement local

Depuis ce dossier : `python -m http.server 8080`, puis ouvrir
`http://localhost:8080`. Un serveur HTTP est nécessaire pour le module JavaScript.

## Jeu et sauvegarde

Cliquer sur la manivelle produit de la vapeur et augmente le boost. La boutique
permet d’acheter des engrenages et des artisans, de convertir les structures et
d’échanger de la vapeur contre de l’or. L’atelier se débloque à 10 millions de
vapeur totale. Les succès et les quêtes donnent aussi des récompenses.

La sauvegarde locale utilise toujours `steamClickerSave`, automatiquement toutes
les cinq secondes. Les actions rapides permettent de sauvegarder, exporter et
importer un fichier JSON. L’or de cette version est local au jeu.

Raccourcis : `A` pour les succès, `Q` pour les quêtes, `M` + molette pour le boost.

## Vérification

Depuis la racine du dépôt : `node scripts/check-steam-clicker.mjs` (Node 22+
et Chrome installé, ou `CHROME_PATH`). Le test utilise un profil temporaire dans
`.artifacts`, sans toucher à la sauvegarde du navigateur habituel. Il vérifie le
démarrage, le clic, un achat, une récompense, les fenêtres, le verrouillage de
l’atelier, la sauvegarde et le mode après rechargement, ainsi que le favicon.
Les captures bureau/mobile sont enregistrées dans `.artifacts`.

La correction de septembre 2026 aligne les identifiants HTML sur le moteur,
remplace les anciens appels inline à des fonctions absentes et rétablit les
interactions des quêtes et de l’atelier, sans changer la clé de sauvegarde.
