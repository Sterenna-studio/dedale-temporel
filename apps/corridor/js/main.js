// js/main.js v4

(function () {
  const config = window.DEDALE_CONFIG || { doors: [] };

  const doorZone = document.getElementById("doorZone");
  const codeMode = document.getElementById("codeMode");
  const enterMode = document.getElementById("enterMode");
  const codeInput = document.getElementById("codeInput");
  const submitCodeBtn = document.getElementById("submitCode");
  const enterDoorBtn = document.getElementById("enterDoorBtn");
  const terminalOutput = document.getElementById("terminalOutput");
  const riddleTitleEl = document.getElementById("riddleTitle");
  const riddleTextEl = document.getElementById("riddleText");

  const noteOverlay = document.getElementById("noteOverlay");
  const noteTitle = document.getElementById("noteTitle");
  const noteText = document.getElementById("noteText");
  const noteClose = document.getElementById("noteClose");

  // Audio
  const bgMusic = document.getElementById("bgMusic");
  const sfxSuccess = document.getElementById("sfxSuccess");
  const sfxError = document.getElementById("sfxError");
  const sfxDoorOpen = document.getElementById("sfxDoorOpen");
  const sfxDoorHover = document.getElementById("sfxDoorHover");
  const sfxDoorLocked = document.getElementById("sfxDoorLocked");
  const sfxNote = document.getElementById("sfxNote");
  const sfxConsole = document.getElementById("sfxConsole");
  let audioInitialized = false;

  let activeDoorId = null;

  function normalize(str) {
    return (str || "").toLowerCase().replace(/\s+/g, "");
  }

  function getDoorConfig(id) {
    return (config.doors || []).find((d) => d.id === id) || null;
  }

  /* --- ÉTAT DU DÉDALE (fragments / sceau) --- */

  const State = window.DedaleState || null;
  // Portes grisées tant que le Briefing n'est pas reçu.
  const FRAGMENT_DOORS = [
    "porte-machine",
    "porte-cartographie",
    "porte-observatoire",
    "porte-reliques",
    "porte-archive",
  ];
  // Portes qui décernent un fragment à l'entrée (les autres le font dans la salle).
  const DOOR_FRAGMENT = { "porte-machine": "Σ", "porte-reliques": "Δ" };
  const CONDAMNEE_ID = "porte-condamnee-02";

  function blockIfNoBriefing(doorCfg) {
    if (!State || !doorCfg) return false;
    if (FRAGMENT_DOORS.indexOf(doorCfg.id) === -1) return false;
    if (State.briefingDone()) return false;
    if (terminalOutput) {
      terminalOutput.textContent =
        "Le couloir reste sourd : commencez par la Salle de Briefing.";
      terminalOutput.className = "terminal-output err";
    }
    triggerDoorShake();
    playError();
    return true;
  }

  function grantDoorFragment(doorCfg) {
    if (State && doorCfg && DOOR_FRAGMENT[doorCfg.id]) {
      State.grant(DOOR_FRAGMENT[doorCfg.id]);
    }
  }

  function renderFragHud() {
    const hud = document.getElementById("fragHud");
    if (!hud || !State) return;
    hud.innerHTML = "";
    State.SYMS.forEach((sym) => {
      const c = document.createElement("span");
      c.className = "chip" + (State.has(sym) ? " has" : "");
      c.textContent = sym;
      hud.appendChild(c);
    });
    if (State.sceauDone()) {
      const s = document.createElement("span");
      s.className = "chip sceau";
      s.textContent = "SCEAU";
      hud.appendChild(s);
    }
  }

  /* AUDIO INIT + SFX */

  function initAudio() {
    if (audioInitialized) return;
    audioInitialized = true;

    try {
      if (bgMusic) {
        bgMusic.volume = 0.3;
        const p = bgMusic.play();
        if (p && typeof p.then === "function") {
          p.catch(() => {
            // L'utilisateur devra déclencher plus tard
          });
        }
      }
      if (sfxSuccess) sfxSuccess.volume = 0.7;
      if (sfxError) sfxError.volume = 0.7;
      if (sfxDoorOpen) sfxDoorOpen.volume = 0.8;
      if (sfxDoorHover) sfxDoorHover.volume = 0.4;
      if (sfxDoorLocked) sfxDoorLocked.volume = 0.8;
      if (sfxNote) sfxNote.volume = 0.6;
      if (sfxConsole) sfxConsole.volume = 0.5;
    } catch (e) {
      console.warn("Audio init error", e);
    }
  }

  function playSuccess() {
    if (!sfxSuccess) return;
    try {
      sfxSuccess.currentTime = 0;
      sfxSuccess.play();
    } catch (e) {}
  }

  function playError() {
    if (!sfxError) return;
    try {
      sfxError.currentTime = 0;
      sfxError.play();
    } catch (e) {}
  }

  function playDoorOpen() {
    if (!sfxDoorOpen) return;
    try {
      sfxDoorOpen.currentTime = 0;
      sfxDoorOpen.play();
    } catch (e) {}
  }

  function playDoorHover() {
    if (!sfxDoorHover) return;
    try {
      sfxDoorHover.currentTime = 0;
      sfxDoorHover.play();
    } catch (e) {}
  }

  function playDoorLocked() {
    if (!sfxDoorLocked) return;
    try {
      sfxDoorLocked.currentTime = 0;
      sfxDoorLocked.play();
    } catch (e) {}
  }

  function playNoteSound() {
    if (!sfxNote) return;
    try {
      sfxNote.currentTime = 0;
      sfxNote.play();
    } catch (e) {}
  }

  function playConsoleBeep() {
    if (!sfxConsole) return;
    try {
      sfxConsole.currentTime = 0;
      sfxConsole.play();
    } catch (e) {}
  }

  // Première interaction = on essaie d'initialiser le son
  document.addEventListener(
    "click",
    () => {
      initAudio();
    },
    { once: true }
  );

  document.addEventListener(
    "keydown",
    () => {
      initAudio();
    },
    { once: true }
  );

  /* CONSTRUCTION DES PORTES */

  function buildDoors() {
    if (!doorZone) return;

    (config.doors || []).forEach((doorCfg) => {
      const type = doorCfg.type || "temporal";

      const doorEl = document.createElement("div");
      doorEl.className = "time-door";
      doorEl.classList.add("time-door--" + type);
      doorEl.dataset.doorId = doorCfg.id;

      const signHtml = doorCfg.signText
        ? `<div class="door-sign">${doorCfg.signText}</div>`
        : "";

      const dialHtml = doorCfg.dialLabel
        ? `<div class="door-dial">${doorCfg.dialLabel}</div>`
        : "";

      const lockHtml =
        type === "locked"
          ? `<div class="door-lock-icon" aria-hidden="true"></div>`
          : "";

      doorEl.innerHTML = `
        ${signHtml}
        <div class="door-inner">
          <div class="door-arch"></div>
          ${dialHtml}
          <div class="door-center-core">
            <div class="door-core-display">
              <div class="door-core-lines"></div>
              ${lockHtml}
            </div>
          </div>
          <div class="door-rivets">
            <div class="door-rivet-col">
              <div class="door-rivet"></div>
              <div class="door-rivet"></div>
              <div class="door-rivet"></div>
              <div class="door-rivet"></div>
            </div>
            <div class="door-rivet-col">
              <div class="door-rivet"></div>
              <div class="door-rivet"></div>
              <div class="door-rivet"></div>
              <div class="door-rivet"></div>
            </div>
          </div>
          <div class="door-handle"></div>
          <div class="door-label">
            Porte : <span>${doorCfg.name}</span>
          </div>
        </div>
      `;

      const hasNote = doorCfg.hasNote !== false; // par défaut true si non spécifié
      if (hasNote && doorCfg.noteText && doorCfg.noteText.trim()) {
        const noteEl = document.createElement("div");
        noteEl.className = "door-note";
        noteEl.textContent = "Cliquer pour lire";
        noteEl.dataset.doorId = doorCfg.id;

        const pos = doorCfg.notePosition || {};
        if (pos.top) noteEl.style.top = pos.top;
        if (pos.bottom) noteEl.style.bottom = pos.bottom;
        if (pos.left) noteEl.style.left = pos.left;
        if (pos.right) noteEl.style.right = pos.right;
        if (pos.rotate) noteEl.style.transform = `rotate(${pos.rotate})`;

        doorEl.querySelector(".door-inner").appendChild(noteEl);

        noteEl.addEventListener("click", (e) => {
          e.stopPropagation();
          openNoteOverlay(doorCfg);
        });
      }

      doorEl.addEventListener("mouseenter", () => {
        playDoorHover();
      });

      doorEl.addEventListener("click", (e) => {
        if (e.target.classList.contains("door-note")) return;
        selectDoor(doorCfg.id);
        if (codeInput && !isDoorCodeFree(getDoorConfig(doorCfg.id))) {
          codeInput.focus();
        }
        playConsoleBeep();
      });

      doorZone.appendChild(doorEl);
    });
  }

  function isDoorCodeFree(doorCfg) {
    if (!doorCfg) return false;
    const type = doorCfg.type || "temporal";
    if (type === "exit" || type === "locked") {
      return true;
    }
    return doorCfg.requireCode === false;
  }

  function selectDoor(id) {
    activeDoorId = id;
    const doorCfg = getDoorConfig(id);
    if (!doorCfg) return;

    document.querySelectorAll(".time-door").forEach((el) => {
      el.classList.toggle("selected", el.dataset.doorId === id);
    });

    if (riddleTitleEl) {
      riddleTitleEl.textContent = doorCfg.riddleTitle || doorCfg.name;
    }
    if (riddleTextEl) {
      riddleTextEl.textContent = (doorCfg.riddleText || "").trim();
    }

    const free = isDoorCodeFree(doorCfg);

    if (free) {
      if (codeMode) codeMode.classList.add("hidden");
      if (enterMode) enterMode.classList.remove("hidden");
    } else {
      if (codeMode) codeMode.classList.remove("hidden");
      if (enterMode) enterMode.classList.add("hidden");
    }

    if (codeInput) {
      codeInput.placeholder =
        doorCfg.placeholder ||
        "Entrez le code associé à cette porte temporelle…";
      codeInput.value = "";
    }

    if (terminalOutput) {
      terminalOutput.textContent = "";
      terminalOutput.className = "terminal-output";
    }
  }

  function triggerDoorShake() {
    if (!activeDoorId) return;
    const doorEl = document.querySelector(
      `.time-door[data-door-id="${activeDoorId}"]`
    );
    if (!doorEl) return;
    doorEl.classList.remove("door-shake");
    void doorEl.offsetWidth;
    doorEl.classList.add("door-shake");
  }

  function setAccessTokenForDoor(doorId) {
    try {
      const key = `dedale_access_${doorId}`;
      sessionStorage.setItem(key, "1");
    } catch (e) {
      console.warn("Impossible de stocker le token d'accès du dédale.", e);
    }
  }

  function checkCode() {
    playConsoleBeep();
    const raw = (codeInput && codeInput.value) || "";
    const trimmed = raw.trim();

    if (!trimmed) {
      if (terminalOutput) {
        terminalOutput.textContent = "Aucun code reçu. Le couloir attend.";
        terminalOutput.className = "terminal-output err";
      }
      playError();
      return;
    }

    if (!activeDoorId) {
      if (terminalOutput) {
        terminalOutput.textContent =
          "Aucune porte sélectionnée. Choisissez d'abord une porte.";
        terminalOutput.className = "terminal-output err";
      }
      playError();
      return;
    }

    const doorCfg = getDoorConfig(activeDoorId);
    if (!doorCfg) return;

    if (blockIfNoBriefing(doorCfg)) return;

    const type = doorCfg.type || "temporal";

    if (isDoorCodeFree(doorCfg)) {
      if (terminalOutput) {
        terminalOutput.textContent =
          "Cette porte ne nécessite pas de code. Utilisez le bouton d'entrée.";
        terminalOutput.className = "terminal-output err";
      }
      playError();
      return;
    }

    const norm = normalize(trimmed);
    const valid = (doorCfg.validCodes || []).some(
      (code) => normalize(code) === norm
    );

    if (valid && doorCfg.redirectUrl && doorCfg.redirectUrl !== "#") {
      if (terminalOutput) {
        terminalOutput.textContent =
          "Code accepté. La porte se déverrouille... Accès à la destination.";
        terminalOutput.className = "terminal-output ok";
      }

      setAccessTokenForDoor(doorCfg.id);
      grantDoorFragment(doorCfg);
      playDoorOpen();
      playSuccess();

      setTimeout(() => {
        window.location.href = doorCfg.redirectUrl;
      }, 1000);
    } else if (valid) {
      if (terminalOutput) {
        terminalOutput.textContent =
          "Code accepté, mais aucune destination n'a encore été configurée pour cette porte.";
        terminalOutput.className = "terminal-output ok";
      }
      playSuccess();
    } else {
      if (terminalOutput) {
        terminalOutput.textContent =
          "Code refusé. La serrure temporelle reste muette.";
        terminalOutput.className = "terminal-output err";
      }
      triggerDoorShake();
      playError();
    }
  }

  function enterDoor() {
    if (!activeDoorId) {
      if (terminalOutput) {
        terminalOutput.textContent =
          "Aucune porte sélectionnée. Choisissez d'abord une porte.";
        terminalOutput.className = "terminal-output err";
      }
      playError();
      return;
    }

    const doorCfg = getDoorConfig(activeDoorId);
    if (!doorCfg) return;
    const type = doorCfg.type || "temporal";

    // Porte verrouillée
    if (type === "locked") {
      // La Porte Condamnée se descelle si le Sceau Temporel est obtenu.
      if (
        doorCfg.id === CONDAMNEE_ID &&
        State &&
        State.sceauDone() &&
        doorCfg.redirectUrl &&
        doorCfg.redirectUrl !== "#"
      ) {
        if (terminalOutput) {
          terminalOutput.textContent =
            "Le Sceau Temporel descelle la porte. La branche oubliée s'ouvre...";
          terminalOutput.className = "terminal-output ok";
        }
        setAccessTokenForDoor(doorCfg.id);
        playDoorOpen();
        playSuccess();
        setTimeout(() => {
          window.location.href = doorCfg.redirectUrl;
        }, 1000);
        return;
      }
      if (terminalOutput) {
        terminalOutput.textContent =
          doorCfg.id === CONDAMNEE_ID
            ? "Porte scellée : il vous manque le Sceau Temporel."
            : "Cette porte est condamnée. Aucun mécanisme ne répond.";
        terminalOutput.className = "terminal-output err";
      }
      triggerDoorShake();
      playDoorLocked();
      playError();
      return;
    }

    // Sortie
    if (type === "exit" && doorCfg.redirectUrl) {
      if (terminalOutput) {
        terminalOutput.textContent =
          "Porte de sortie activée. Retour vers la surface...";
        terminalOutput.className = "terminal-output ok";
      }
      playDoorOpen();
      playSuccess();
      setTimeout(() => {
        window.location.href = doorCfg.redirectUrl;
      }, 900);
      return;
    }

    // Autres portes sans code
    if (doorCfg.redirectUrl && doorCfg.redirectUrl !== "#") {
      if (terminalOutput) {
        terminalOutput.textContent =
          "La porte s’ouvre, un souffle de poussière temporelle vous frôle.";
        terminalOutput.className = "terminal-output ok";
      }
      setAccessTokenForDoor(doorCfg.id);
      playDoorOpen();
      playSuccess();
      setTimeout(() => {
        window.location.href = doorCfg.redirectUrl;
      }, 900);
    } else {
      if (terminalOutput) {
        terminalOutput.textContent =
          "La porte semble active, mais aucune destination n'a encore été reliée.";
        terminalOutput.className = "terminal-output err";
      }
      playError();
    }
  }

  function openNoteOverlay(doorCfg) {
    if (!noteOverlay || !noteTitle || !noteText) return;
    noteTitle.textContent = `Note – ${doorCfg.name}`;
    noteText.textContent = (doorCfg.noteText || "").trim();
    noteOverlay.classList.remove("hidden");
    playNoteSound();
  }

  function closeNoteOverlay() {
    if (!noteOverlay) return;
    noteOverlay.classList.add("hidden");
  }

  // --- Scroll horizontal par drag souris / touch (désactivé sur mobile via CSS) ---

  function setupDragScroll() {
    if (!doorZone) return;
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    doorZone.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      isDown = true;
      doorZone.classList.add("dragging");
      startX = e.pageX - doorZone.offsetLeft;
      scrollLeft = doorZone.scrollLeft;
    });

    doorZone.addEventListener("mouseleave", () => {
      isDown = false;
      doorZone.classList.remove("dragging");
    });

    doorZone.addEventListener("mouseup", () => {
      isDown = false;
      doorZone.classList.remove("dragging");
    });

    doorZone.addEventListener("mousemove", (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - doorZone.offsetLeft;
      const walk = x - startX;
      doorZone.scrollLeft = scrollLeft - walk;
    });

    // Touch (mobile / trackpad tactile)
    doorZone.addEventListener(
      "touchstart",
      (e) => {
        const touch = e.touches[0];
        isDown = true;
        startX = touch.pageX - doorZone.offsetLeft;
        scrollLeft = doorZone.scrollLeft;
      },
      { passive: true }
    );

    doorZone.addEventListener(
      "touchend",
      () => {
        isDown = false;
        doorZone.classList.remove("dragging");
      },
      { passive: true }
    );

    doorZone.addEventListener(
      "touchmove",
      (e) => {
        if (!isDown) return;
        const touch = e.touches[0];
        const x = touch.pageX - doorZone.offsetLeft;
        const walk = x - startX;
        doorZone.scrollLeft = scrollLeft - walk;
      },
      { passive: true }
    );
  }

  // INIT
  buildDoors();
  setupDragScroll();
  renderFragHud();

  if (config.doors && config.doors.length > 0) {
    selectDoor(config.doors[0].id);
  }

  if (submitCodeBtn) {
    submitCodeBtn.addEventListener("click", checkCode);
  }
  if (codeInput) {
    codeInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        checkCode();
      }
    });
  }

  if (enterDoorBtn) {
    enterDoorBtn.addEventListener("click", enterDoor);
  }

  if (noteClose) {
    noteClose.addEventListener("click", closeNoteOverlay);
  }
  if (noteOverlay) {
    noteOverlay.addEventListener("click", (e) => {
      if (e.target === noteOverlay) closeNoteOverlay();
    });
  }
})();
