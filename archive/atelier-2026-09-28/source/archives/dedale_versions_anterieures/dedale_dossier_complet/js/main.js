// js/main.js

(function () {
  const config = window.DEDALE_CONFIG || { doors: [] };

  const doorZone = document.getElementById("doorZone");
  const codeInput = document.getElementById("codeInput");
  const submitCodeBtn = document.getElementById("submitCode");
  const terminalOutput = document.getElementById("terminalOutput");
  const riddleTitleEl = document.getElementById("riddleTitle");
  const riddleTextEl = document.getElementById("riddleText");

  const noteOverlay = document.getElementById("noteOverlay");
  const noteTitle = document.getElementById("noteTitle");
  const noteText = document.getElementById("noteText");
  const noteClose = document.getElementById("noteClose");

  let activeDoorId = null;

  function normalize(str) {
    return (str || "").toLowerCase().replace(/\s+/g, "");
  }

  function getDoorConfig(id) {
    return (config.doors || []).find((d) => d.id === id) || null;
  }

  function buildDoors() {
    if (!doorZone) return;

    (config.doors || []).forEach((doorCfg) => {
      const doorEl = document.createElement("div");
      doorEl.className = "time-door";
      doorEl.dataset.doorId = doorCfg.id;

      doorEl.innerHTML = `
        <div class="door-inner">
          <div class="door-arch"></div>
          <div class="door-center-core">
            <div class="door-core-display">
              <div class="door-core-lines"></div>
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

      doorEl.addEventListener("click", (e) => {
        if (e.target.classList.contains("door-note")) return;
        selectDoor(doorCfg.id);
        if (codeInput) codeInput.focus();
      });

      noteEl.addEventListener("click", (e) => {
        e.stopPropagation();
        openNoteOverlay(doorCfg);
      });

      doorZone.appendChild(doorEl);
    });
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
    const raw = (codeInput && codeInput.value) || "";
    const trimmed = raw.trim();

    if (!trimmed) {
      if (terminalOutput) {
        terminalOutput.textContent = "Aucun code reçu. Le couloir attend.";
        terminalOutput.className = "terminal-output err";
      }
      return;
    }

    if (!activeDoorId) {
      if (terminalOutput) {
        terminalOutput.textContent =
          "Aucune porte sélectionnée. Choisissez d'abord une porte.";
        terminalOutput.className = "terminal-output err";
      }
      return;
    }

    const doorCfg = getDoorConfig(activeDoorId);
    if (!doorCfg) return;

    if (doorCfg.type === "exit" && doorCfg.redirectUrl) {
      if (terminalOutput) {
        terminalOutput.textContent =
          "Porte de sortie activée. Retour vers la surface...";
        terminalOutput.className = "terminal-output ok";
      }
      setTimeout(() => {
        window.location.href = doorCfg.redirectUrl;
      }, 900);
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

      setTimeout(() => {
        window.location.href = doorCfg.redirectUrl;
      }, 1000);
    } else if (valid) {
      if (terminalOutput) {
        terminalOutput.textContent =
          "Code accepté, mais aucune destination n'a encore été configurée pour cette porte.";
        terminalOutput.className = "terminal-output ok";
      }
    } else {
      if (terminalOutput) {
        terminalOutput.textContent =
          "Code refusé. La serrure temporelle reste muette.";
        terminalOutput.className = "terminal-output err";
      }
      triggerDoorShake();
    }
  }

  function openNoteOverlay(doorCfg) {
    if (!noteOverlay || !noteTitle || !noteText) return;
    noteTitle.textContent = `Note – ${doorCfg.name}`;
    noteText.textContent = (doorCfg.noteText || "").trim();
    noteOverlay.classList.remove("hidden");
  }

  function closeNoteOverlay() {
    if (!noteOverlay) return;
    noteOverlay.classList.add("hidden");
  }

  buildDoors();
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

  if (noteClose) {
    noteClose.addEventListener("click", closeNoteOverlay);
  }
  if (noteOverlay) {
    noteOverlay.addEventListener("click", (e) => {
      if (e.target === noteOverlay) closeNoteOverlay();
    });
  }
})();
