// Grand mécanisme orbital v7 — désormais dans la vue Sol.
// Le sélecteur orbital fonctionne indépendamment de la vue active.
// La centerplate est maintenant un <button> interactif : cliquer dessus
// active la porte sélectionnée (même comportement que cliquer sur la porte
// dans viewDevant).

(function () {
  "use strict";

  const scene = document.getElementById("gearScene");
  const zone = document.getElementById("doorZone");
  const doors = Array.from(document.querySelectorAll("#doorZone .time-door"));
  const configDoors = (window.DEDALE_CONFIG && window.DEDALE_CONFIG.doors) || [];

  if (!scene || !zone || doors.length === 0) return;

  const nameEl = document.getElementById("gearSelectedName");
  const metaEl = document.getElementById("gearSelectedMeta");
  const centerplate = document.getElementById("gearCenterplate");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  let activeIndex = Math.max(0, doors.findIndex((d) => d.classList.contains("selected")));
  let pointerStartX = 0;
  let pointerId = null;
  let wheelLocked = false;

  // ── Helpers ────────────────────────────────────────────────────
  function normalizeIndex(index) {
    return (index + doors.length) % doors.length;
  }

  function getDoorConfig(door) {
    return configDoors.find((item) => item.id === door.dataset.doorId) || null;
  }

  function typeLabel(config) {
    if (!config) return "Module temporel";
    if (config.type === "room")   return "Salle de l'agence";
    if (config.type === "exit")   return "Sortie de l'agence";
    if (config.type === "locked") return "Accès condamné";
    return "Porte temporelle";
  }

  // ── Rendu ──────────────────────────────────────────────────────
  function render() {
    doors.forEach((door, index) => {
      const active = index === activeIndex;
      door.classList.toggle("selected", active);
      door.setAttribute("aria-label",
        (getDoorConfig(door)?.name || "Porte") + (active ? ", sélectionnée" : "")
      );
    });

    const currentConfig = getDoorConfig(doors[activeIndex]);
    if (nameEl) nameEl.textContent = currentConfig?.name || "Module inconnu";
    if (metaEl) metaEl.textContent = typeLabel(currentConfig);

    const counterCurrent = controls.querySelector("[data-counter-current]");
    if (counterCurrent) counterCurrent.textContent = String(activeIndex + 1).padStart(2, "0");

    // Sync scroll du door-zone vers la porte active
    const activeDoor = doors[activeIndex];
    if (activeDoor && zone) {
      const doorLeft = activeDoor.offsetLeft;
      const doorWidth = activeDoor.offsetWidth;
      const zoneWidth = zone.offsetWidth;
      zone.scrollTo({ left: doorLeft - zoneWidth / 2 + doorWidth / 2, behavior: "smooth" });
    }
  }

  function activateCurrentDoor() {
    const current = doors[activeIndex];
    if (current) current.click();
  }

  function move(delta) {
    activeIndex = normalizeIndex(activeIndex + delta);
    render();
    activateCurrentDoor();
  }

  function focusDoor(index) {
    activeIndex = normalizeIndex(index);
    render();
    activateCurrentDoor();
  }

  // ── Contrôles ──────────────────────────────────────────────────
  const controls = document.createElement("div");
  controls.className = "gear-controls";
  controls.setAttribute("aria-label", "Navigation entre les portes");
  controls.innerHTML = `
    <button type="button" class="gear-control" data-gear-prev aria-label="Porte précédente">‹</button>
    <div class="gear-counter" aria-live="polite">
      <strong data-counter-current>01</strong> / ${String(doors.length).padStart(2, "0")}
    </div>
    <button type="button" class="gear-control" data-gear-next aria-label="Porte suivante">›</button>
  `;
  scene.appendChild(controls);

  controls.querySelector("[data-gear-prev]").addEventListener("click", (e) => {
    e.stopPropagation();
    move(-1);
  });
  controls.querySelector("[data-gear-next]").addEventListener("click", (e) => {
    e.stopPropagation();
    move(1);
  });

  // Clic sur la centerplate = activer la porte courante
  if (centerplate) {
    centerplate.addEventListener("click", (e) => {
      e.stopPropagation();
      activateCurrentDoor();
    });
    centerplate.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        activateCurrentDoor();
      }
    });
  }

  // Clic sur les portes dans door-zone : sync l'index
  doors.forEach((door, index) => {
    door.setAttribute("role", "button");
    door.addEventListener("click", () => {
      if (index !== activeIndex) { activeIndex = index; render(); }
    });
    door.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); door.click(); }
    });
  });

  // Clavier sur la gear-scene
  scene.tabIndex = 0;
  scene.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft")  { e.preventDefault(); move(-1); }
    if (e.key === "ArrowRight") { e.preventDefault(); move(1); }
    if (e.key === "Home") { e.preventDefault(); focusDoor(0); }
    if (e.key === "End")  { e.preventDefault(); focusDoor(doors.length - 1); }
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activateCurrentDoor(); }
  });

  // Molette
  scene.addEventListener("wheel", (e) => {
    if (wheelLocked || Math.abs(e.deltaY) < 8) return;
    e.preventDefault();
    wheelLocked = true;
    move(e.deltaY > 0 ? 1 : -1);
    window.setTimeout(() => { wheelLocked = false; }, reducedMotion.matches ? 40 : 420);
  }, { passive: false });

  // Drag / swipe
  scene.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || e.target.closest("button, input")) return;
    pointerId = e.pointerId;
    pointerStartX = e.clientX;
    scene.classList.add("is-dragging");
    scene.setPointerCapture(pointerId);
  });
  scene.addEventListener("pointerup", (e) => {
    if (pointerId !== e.pointerId) return;
    const deltaX = e.clientX - pointerStartX;
    scene.classList.remove("is-dragging");
    if (Math.abs(deltaX) > 42) move(deltaX < 0 ? 1 : -1);
    if (scene.hasPointerCapture(pointerId)) scene.releasePointerCapture(pointerId);
    pointerId = null;
  });
  scene.addEventListener("pointercancel", () => {
    scene.classList.remove("is-dragging");
    pointerId = null;
  });

  render();
  requestAnimationFrame(() => scene.classList.add("is-ready"));
})();
