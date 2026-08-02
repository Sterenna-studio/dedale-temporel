// Grand mécanisme orbital — couche de présentation du couloir.
// La logique d'accès reste dans main.js ; ce module ne gère que la navigation visuelle.

(function () {
  "use strict";

  const scene = document.getElementById("gearScene");
  const zone = document.getElementById("doorZone");
  const doors = Array.from(document.querySelectorAll("#doorZone .time-door"));
  const configDoors = (window.DEDALE_CONFIG && window.DEDALE_CONFIG.doors) || [];

  if (!scene || !zone || doors.length === 0) return;

  const nameEl = document.getElementById("gearSelectedName");
  const metaEl = document.getElementById("gearSelectedMeta");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const mobileQuery = window.matchMedia("(max-width: 620px)");

  let activeIndex = Math.max(0, doors.findIndex((door) => door.classList.contains("selected")));
  let pointerStartX = 0;
  let pointerStartY = 0;
  let pointerId = null;
  let wheelLocked = false;

  const desktopSlots = {
    0:  { x: 50, y: 61, scale: 0.78, opacity: 1,    blur: 0,   rotate: 0,   z: 24, light: 1.08 },
    1:  { x: 76, y: 57, scale: 0.57, opacity: 0.88, blur: 0,   rotate: 2.5, z: 18, light: 0.88 },
    2:  { x: 91, y: 40, scale: 0.38, opacity: 0.58, blur: 0.5, rotate: 5,   z: 11, light: 0.7 },
    3:  { x: 77, y: 19, scale: 0.27, opacity: 0.28, blur: 1.2, rotate: 7,   z: 6,  light: 0.58 },
    "-1": { x: 24, y: 57, scale: 0.57, opacity: 0.88, blur: 0,   rotate: -2.5, z: 18, light: 0.88 },
    "-2": { x: 9,  y: 40, scale: 0.38, opacity: 0.58, blur: 0.5, rotate: -5,   z: 11, light: 0.7 },
    "-3": { x: 23, y: 19, scale: 0.27, opacity: 0.28, blur: 1.2, rotate: -7,   z: 6,  light: 0.58 },
  };

  const mobileSlots = {
    0:  { x: 50, y: 62, scale: 0.64, opacity: 1,    blur: 0,   rotate: 0, z: 24, light: 1.05 },
    1:  { x: 86, y: 43, scale: 0.35, opacity: 0.48, blur: 0.7, rotate: 4, z: 11, light: 0.72 },
    "-1": { x: 14, y: 43, scale: 0.35, opacity: 0.48, blur: 0.7, rotate: -4, z: 11, light: 0.72 },
  };

  function normalizeIndex(index) {
    return (index + doors.length) % doors.length;
  }

  function relativeOffset(index) {
    let offset = index - activeIndex;
    const half = doors.length / 2;
    if (offset > half) offset -= doors.length;
    if (offset < -half) offset += doors.length;
    return offset;
  }

  function getDoorConfig(door) {
    return configDoors.find((item) => item.id === door.dataset.doorId) || null;
  }

  function typeLabel(config) {
    if (!config) return "Module temporel";
    if (config.type === "room") return "Salle de l'agence";
    if (config.type === "exit") return "Sortie de l'agence";
    if (config.type === "locked") return "Accès condamné";
    return "Porte temporelle";
  }

  function setDoorSlot(door, slot, hidden) {
    door.classList.toggle("is-orbit-hidden", hidden);
    door.setAttribute("aria-hidden", hidden ? "true" : "false");
    door.tabIndex = hidden ? -1 : 0;

    if (hidden) return;

    door.style.setProperty("--door-x", slot.x + "%");
    door.style.setProperty("--door-y", slot.y + "%");
    door.style.setProperty("--door-scale", slot.scale);
    door.style.setProperty("--door-opacity", slot.opacity);
    door.style.setProperty("--door-blur", slot.blur + "px");
    door.style.setProperty("--door-rotate", slot.rotate + "deg");
    door.style.setProperty("--door-z", slot.z);
    door.style.setProperty("--door-light", slot.light);
  }

  function render() {
    const slots = mobileQuery.matches ? mobileSlots : desktopSlots;

    doors.forEach((door, index) => {
      const offset = relativeOffset(index);
      const slot = slots[offset];
      const active = offset === 0;

      door.classList.toggle("is-orbit-active", active);
      setDoorSlot(door, slot || slots[0], !slot);
      door.setAttribute("aria-label", (getDoorConfig(door)?.name || "Porte") + (active ? ", sélectionnée" : ""));
    });

    const currentDoor = doors[activeIndex];
    const currentConfig = getDoorConfig(currentDoor);

    if (nameEl) nameEl.textContent = currentConfig?.name || "Module inconnu";
    if (metaEl) metaEl.textContent = typeLabel(currentConfig);

    const counterCurrent = controls.querySelector("[data-counter-current]");
    if (counterCurrent) counterCurrent.textContent = String(activeIndex + 1).padStart(2, "0");

    scene.style.setProperty("--orbit-progress", activeIndex / Math.max(1, doors.length - 1));
  }

  function selectActiveDoor(options) {
    const opts = options || {};
    const current = doors[activeIndex];
    if (!current) return;

    if (opts.dispatch !== false) current.click();
    if (opts.focus) current.focus({ preventScroll: true });
  }

  function move(delta, options) {
    const opts = options || {};
    activeIndex = normalizeIndex(activeIndex + delta);
    render();
    selectActiveDoor({ dispatch: opts.dispatch !== false, focus: !!opts.focus });
  }

  function focusDoor(index, options) {
    const opts = options || {};
    activeIndex = normalizeIndex(index);
    render();
    selectActiveDoor({ dispatch: opts.dispatch !== false, focus: !!opts.focus });
  }

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

  controls.querySelector("[data-gear-prev]").addEventListener("click", (event) => {
    event.stopPropagation();
    move(-1, { focus: true });
  });

  controls.querySelector("[data-gear-next]").addEventListener("click", (event) => {
    event.stopPropagation();
    move(1, { focus: true });
  });

  doors.forEach((door, index) => {
    door.setAttribute("role", "button");
    door.addEventListener("click", () => {
      if (index !== activeIndex) focusDoor(index, { dispatch: false });
    });
    door.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        door.click();
      }
    });
  });

  scene.tabIndex = 0;
  scene.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      move(-1, { focus: true });
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      move(1, { focus: true });
    } else if (event.key === "Home") {
      event.preventDefault();
      focusDoor(0, { focus: true });
    } else if (event.key === "End") {
      event.preventDefault();
      focusDoor(doors.length - 1, { focus: true });
    }
  });

  scene.addEventListener("wheel", (event) => {
    if (wheelLocked || Math.abs(event.deltaY) < 8) return;
    event.preventDefault();
    wheelLocked = true;
    move(event.deltaY > 0 ? 1 : -1);
    window.setTimeout(() => { wheelLocked = false; }, reducedMotion.matches ? 40 : 420);
  }, { passive: false });

  scene.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || event.target.closest("button, input, .door-note")) return;
    pointerId = event.pointerId;
    pointerStartX = event.clientX;
    pointerStartY = event.clientY;
    scene.classList.add("is-dragging");
    scene.setPointerCapture(pointerId);
  });

  scene.addEventListener("pointerup", (event) => {
    if (pointerId !== event.pointerId) return;
    const deltaX = event.clientX - pointerStartX;
    const deltaY = event.clientY - pointerStartY;
    scene.classList.remove("is-dragging");

    if (Math.abs(deltaX) > 42 && Math.abs(deltaX) > Math.abs(deltaY)) {
      move(deltaX < 0 ? 1 : -1);
    }

    if (scene.hasPointerCapture(pointerId)) scene.releasePointerCapture(pointerId);
    pointerId = null;
  });

  scene.addEventListener("pointercancel", () => {
    scene.classList.remove("is-dragging");
    pointerId = null;
  });

  function handleMediaChange() {
    render();
  }

  if (typeof mobileQuery.addEventListener === "function") {
    mobileQuery.addEventListener("change", handleMediaChange);
  } else {
    mobileQuery.addListener(handleMediaChange);
  }

  render();
  requestAnimationFrame(() => scene.classList.add("is-ready"));
})();
