// corridor-guard.js
// Empêche l'accès direct par URL aux salles du dédale : seule une entrée
// via la porte dédiée du couloir (code validé / bouton d'entrée) pose le
// jeton de session correspondant.
//
// Usage : chaque page de salle déclare `window.DEDALE_ROOM_ID` AVANT de
// charger ce script, puis l'inclut en tout premier dans <head> pour que
// la redirection se produise avant tout rendu.
//
// ⚠️ Verrou côté client uniquement (site 100% statique, sans backend) :
// il bloque la navigation directe en usage normal, mais un utilisateur
// qui pose lui-même la clé sessionStorage via les devtools le contourne.
// Il n'existe pas de moyen d'imposer une vraie vérification serveur ici.

(function () {
  var roomId = window.DEDALE_ROOM_ID;
  if (!roomId) return; // pas de garde déclarée sur cette page

  var CORRIDOR_URL = "/dedale/";

  function hasAccess() {
    try {
      return sessionStorage.getItem("dedale_access_" + roomId) === "1";
    } catch (e) {
      // sessionStorage indisponible (mode privé strict, etc.) -> on refuse.
      return false;
    }
  }

  if (!hasAccess()) {
    window.location.replace(CORRIDOR_URL);
  }
})();
