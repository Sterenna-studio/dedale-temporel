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

  /* --- RÉGLAGES DU SON (persistants) --- */

  const AUDIO_KEY = "dedale_audio_v1";
  // Par défaut : ambiance COUPÉE, effets actifs.
  const AUDIO_DEFAULTS = { ambient: false, sfx: true, ambientVol: 0.3, sfxVol: 0.7 };

  function loadAudioSettings() {
    try {
      const raw = localStorage.getItem(AUDIO_KEY);
      if (!raw) return Object.assign({}, AUDIO_DEFAULTS);
      const p = JSON.parse(raw);
      return {
        ambient: !!p.ambient,
        sfx: p.sfx !== false,
        ambientVol:
          typeof p.ambientVol === "number" ? p.ambientVol : AUDIO_DEFAULTS.ambientVol,
        sfxVol: typeof p.sfxVol === "number" ? p.sfxVol : AUDIO_DEFAULTS.sfxVol,
      };
    } catch (e) {
      return Object.assign({}, AUDIO_DEFAULTS);
    }
  }

  let audioSettings = loadAudioSettings();

  function saveAudioSettings() {
    try {
      localStorage.setItem(AUDIO_KEY, JSON.stringify(audioSettings));
    } catch (e) {}
  }

  function sfxElements() {
    return [
      sfxSuccess,
      sfxError,
      sfxDoorOpen,
      sfxDoorHover,
      sfxDoorLocked,
      sfxNote,
      sfxConsole,
    ];
  }

  function applyAudioSettings() {
    if (bgMusic) {
      bgMusic.volume = audioSettings.ambientVol;
      bgMusic.muted = !audioSettings.ambient;
      if (audioSettings.ambient && audioInitialized) {
        const p = bgMusic.play();
        if (p && typeof p.then === "function") p.catch(() => {});
      } else {
        try {
          bgMusic.pause();
        } catch (e) {}
      }
    }
    sfxElements().forEach((a) => {
      if (a) {
        a.muted = !audioSettings.sfx;
        a.volume = audioSettings.sfxVol;
      }
    });
  }

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
  // Σ et Δ ne sont plus décernés à l'entrée : ils se méritent en résolvant
  // les puzzles (SpectroCrypt → Σ, Imprimerie → Δ), qui appellent
  // DedaleState.grant() eux-mêmes. La map reste vide (extensible au besoin).
  const DOOR_FRAGMENT = {};
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

  /* --- INDICES À TROUVER + CARNET DE BORD --- */

  const CLUES = window.DEDALE_CLUES || [];
  const hallway = document.querySelector(".hallway");
  const invToggle = document.getElementById("invToggle");
  const invPanel = document.getElementById("invPanel");
  const invClose = document.getElementById("invClose");
  const invList = document.getElementById("invList");
  const invBadge = document.getElementById("invBadge");
  const itemOverlay = document.getElementById("itemOverlay");
  const itemTitle = document.getElementById("itemTitle");
  const itemText = document.getElementById("itemText");
  const itemReveal = document.getElementById("itemReveal");
  const itemClose = document.getElementById("itemClose");

  function getClue(id) {
    return CLUES.find((c) => c.id === id) || null;
  }

  function buildClues() {
    if (!hallway) return;
    CLUES.filter((clue) => clue.active !== false).forEach((clue) => {
      const el = document.createElement("button");
      el.className = "clue";
      el.dataset.clueId = clue.id;
      el.setAttribute("aria-label", clue.label);
      el.innerHTML =
        '<span class="clue-icon">✎</span>' +
        '<span class="clue-tip">' + (clue.hint || clue.label) + "</span>";
      const p = clue.pos || {};
      if (p.top) el.style.top = p.top;
      if (p.bottom) el.style.bottom = p.bottom;
      if (p.left) el.style.left = p.left;
      if (p.right) el.style.right = p.right;
      if (p.rotate) el.style.setProperty("--rot", p.rotate);
      if (State && State.hasItem(clue.id)) el.classList.add("found");
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        openItem(clue);
      });
      hallway.appendChild(el);
    });
  }

  function openItem(clue) {
    if (State) State.findItem(clue.id);
    const el =
      hallway && hallway.querySelector('.clue[data-clue-id="' + clue.id + '"]');
    if (el) el.classList.add("found");
    if (itemTitle) itemTitle.textContent = clue.label;
    if (itemText) itemText.textContent = (clue.text || "").trim();
    if (itemReveal) {
      itemReveal.innerHTML = clue.code
        ? "Code d'accès pour <strong>" + clue.reveals + "</strong> : <code>" + clue.code + "</code>"
        : "";
    }
    if (itemOverlay) itemOverlay.classList.remove("hidden");
    playNoteSound();
    renderInventory();
  }

  function renderInventory() {
    if (invBadge) invBadge.textContent = State ? State.inventoryCount() : 0;
    if (!invList) return;
    invList.innerHTML = "";
    const found = State ? State.foundItems() : [];
    if (found.length === 0) {
      invList.innerHTML =
        '<div class="inv-empty">Aucune note pour l\'instant. Fouillez le couloir : ' +
        "certaines sont posées au sol, oubliées de côté.</div>";
      return;
    }
    found.forEach((id) => {
      const clue = getClue(id);
      if (!clue) return;
      const row = document.createElement("button");
      row.className = "inv-item";
      row.innerHTML =
        '<span class="inv-item-label">' + clue.label + "</span>" +
        '<span class="inv-item-code">' + (clue.code || "") + "</span>";
      row.addEventListener("click", () => openItem(clue));
      invList.appendChild(row);
    });
  }

  function toggleInventory(force) {
    if (!invPanel) return;
    const show =
      force !== undefined ? force : invPanel.classList.contains("hidden");
    invPanel.classList.toggle("hidden", !show);
    if (show) renderInventory();
  }

  /* AUDIO INIT + SFX */

  function initAudio() {
    if (audioInitialized) return;
    audioInitialized = true;
    // Applique les réglages : l'ambiance ne démarre que si activée par l'utilisateur.
    applyAudioSettings();
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

  /* --- MENU DU SON --- */

  function updateSoundIcon() {
    const btn = document.getElementById("soundToggle");
    if (btn) btn.textContent = audioSettings.ambient ? "🔊" : "🔈";
  }

  function setupSoundMenu() {
    const toggle = document.getElementById("soundToggle");
    const panel = document.getElementById("soundPanel");
    const close = document.getElementById("soundClose");
    const ambient = document.getElementById("sndAmbient");
    const ambientVol = document.getElementById("sndAmbientVol");
    const sfx = document.getElementById("sndSfx");
    const sfxVol = document.getElementById("sndSfxVol");

    if (ambient) ambient.checked = audioSettings.ambient;
    if (sfx) sfx.checked = audioSettings.sfx;
    if (ambientVol) ambientVol.value = Math.round(audioSettings.ambientVol * 100);
    if (sfxVol) sfxVol.value = Math.round(audioSettings.sfxVol * 100);
    updateSoundIcon();
    applyAudioSettings(); // pose l'état muet dès le chargement (sans lecture forcée)

    if (toggle && panel) {
      toggle.addEventListener("click", () => panel.classList.toggle("hidden"));
    }
    if (close && panel) {
      close.addEventListener("click", () => panel.classList.add("hidden"));
    }
    if (ambient) {
      ambient.addEventListener("change", () => {
        audioSettings.ambient = ambient.checked;
        saveAudioSettings();
        applyAudioSettings();
        updateSoundIcon();
      });
    }
    if (sfx) {
      sfx.addEventListener("change", () => {
        audioSettings.sfx = sfx.checked;
        saveAudioSettings();
        applyAudioSettings();
      });
    }
    if (ambientVol) {
      ambientVol.addEventListener("input", () => {
        audioSettings.ambientVol = (parseInt(ambientVol.value, 10) || 0) / 100;
        saveAudioSettings();
        applyAudioSettings();
      });
    }
    if (sfxVol) {
      sfxVol.addEventListener("input", () => {
        audioSettings.sfxVol = (parseInt(sfxVol.value, 10) || 0) / 100;
        saveAudioSettings();
        applyAudioSettings();
      });
    }
  }

  // INIT
  buildDoors();
  setupDragScroll();
  renderFragHud();
  buildClues();
  renderInventory();
  setupSoundMenu();

  if (invToggle) invToggle.addEventListener("click", () => toggleInventory());
  if (invClose) invClose.addEventListener("click", () => toggleInventory(false));
  if (itemClose) {
    itemClose.addEventListener("click", () => {
      if (itemOverlay) itemOverlay.classList.add("hidden");
    });
  }
  if (itemOverlay) {
    itemOverlay.addEventListener("click", (e) => {
      if (e.target === itemOverlay) itemOverlay.classList.add("hidden");
    });
  }

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
