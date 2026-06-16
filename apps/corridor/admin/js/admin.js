// js/admin.js (identique v3)

(function () {
  const config = window.DEDALE_CONFIG || { doors: [] };

  let doors = JSON.parse(JSON.stringify(config.doors || []));
  let activeIndex = 0;

  const doorListEl = document.getElementById("doorList");
  const logEl = document.getElementById("adminLog");

  const fieldId = document.getElementById("fieldId");
  const fieldName = document.getElementById("fieldName");
  const fieldType = document.getElementById("fieldType");
  const fieldFolder = document.getElementById("fieldFolder");
  const fieldRedirect = document.getElementById("fieldRedirect");
  const fieldRequireCode = document.getElementById("fieldRequireCode");
  const fieldCodes = document.getElementById("fieldCodes");
  const fieldPlaceholder = document.getElementById("fieldPlaceholder");
  const fieldRiddleTitle = document.getElementById("fieldRiddleTitle");
  const fieldRiddleText = document.getElementById("fieldRiddleText");

  const fieldHasNote = document.getElementById("fieldHasNote");
  const fieldNoteText = document.getElementById("fieldNoteText");
  const fieldNotePos = document.getElementById("fieldNotePos");

  const fieldDialLabel = document.getElementById("fieldDialLabel");
  const fieldSignText = document.getElementById("fieldSignText");

  const btnAddDoor = document.getElementById("btnAddDoor");
  const btnAddLockedDoor = document.getElementById("btnAddLockedDoor");
  const btnRemoveDoor = document.getElementById("btnRemoveDoor");
  const btnMoveUp = document.getElementById("btnMoveUp");
  const btnMoveDown = document.getElementById("btnMoveDown");
  const btnSaveDoor = document.getElementById("btnSaveDoor");
  const btnExportConfig = document.getElementById("btnExportConfig");

  function renderDoorList() {
    if (!doorListEl) return;
    doorListEl.innerHTML = "";
    doors.forEach((door, index) => {
      const item = document.createElement("div");
      item.className = "door-item" + (index === activeIndex ? " active" : "");
      item.textContent = `${index + 1}. ${door.name} (${door.id}) [${door.type || "temporal"}]`;
      item.addEventListener("click", () => {
        activeIndex = index;
        renderDoorList();
        loadDoorToForm();
      });
      doorListEl.appendChild(item);
    });
  }

  function loadDoorToForm() {
    const d = doors[activeIndex];
    if (!d) return;
    fieldId.value = d.id || "";
    fieldName.value = d.name || "";
    fieldType.value = d.type || "temporal";
    fieldFolder.value = d.folder || "";
    fieldRedirect.value = d.redirectUrl || "";
    fieldRequireCode.value = d.requireCode ? "true" : "false";
    fieldCodes.value = (d.validCodes || []).join(", ");
    fieldPlaceholder.value = d.placeholder || "";
    fieldRiddleTitle.value = d.riddleTitle || "";
    fieldRiddleText.value = (d.riddleText || "").trim();

    fieldHasNote.value = d.hasNote === false ? "false" : "true";
    fieldNoteText.value = (d.noteText || "").trim();
    fieldNotePos.value = d.notePosition ? JSON.stringify(d.notePosition) : "";

    fieldDialLabel.value = d.dialLabel || "";
    fieldSignText.value = d.signText || "";
  }

  function saveFormToDoor() {
    let d = doors[activeIndex];
    if (!d) return;
    d.id = fieldId.value.trim() || d.id;
    d.name = fieldName.value.trim() || d.name;
    d.type = fieldType.value || "temporal";
    d.folder = fieldFolder.value.trim() || "";
    d.redirectUrl = fieldRedirect.value.trim() || "";
    d.requireCode = fieldRequireCode.value === "true";

    d.validCodes =
      fieldCodes.value
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean) || [];

    d.placeholder = fieldPlaceholder.value.trim() || "";
    d.riddleTitle = fieldRiddleTitle.value.trim() || "";
    d.riddleText = fieldRiddleText.value || "";

    d.hasNote = fieldHasNote.value === "true";
    d.noteText = fieldNoteText.value || "";

    if (fieldNotePos.value.trim()) {
      try {
        d.notePosition = JSON.parse(fieldNotePos.value);
      } catch (e) {
        appendLog("⚠ Position note invalide (JSON).");
      }
    } else {
      d.notePosition = {};
    }

    d.dialLabel = fieldDialLabel.value.trim();
    d.signText = fieldSignText.value.trim();

    appendLog("✔ Porte mise à jour.");
    renderDoorList();
  }

  function appendLog(msg) {
    if (!logEl) return;
    const ts = new Date().toLocaleTimeString();
    logEl.textContent = `[${ts}] ${msg}\n` + logEl.textContent;
  }

  function addDoor() {
    const newDoor = {
      id: "porte-nouvelle-" + (doors.length + 1),
      name: "Nouvelle porte",
      type: "temporal",
      folder: "",
      redirectUrl: "#",
      requireCode: true,
      validCodes: [],
      placeholder: "Configurer cette porte…",
      riddleTitle: "Nouvelle porte",
      riddleText: "Texte d’énigme à définir.",
      hasNote: true,
      noteText: "Note à définir.",
      notePosition: { bottom: "18px", left: "18px", rotate: "-5deg" },
      dialLabel: "",
      signText: ""
    };
    doors.push(newDoor);
    activeIndex = doors.length - 1;
    renderDoorList();
    loadDoorToForm();
    appendLog("➕ Nouvelle porte ajoutée.");
  }

  function addLockedDoor() {
    const newDoor = {
      id: "porte-condamnee-" + (doors.length + 1),
      name: "Porte Condamnée",
      type: "locked",
      folder: null,
      redirectUrl: "#",
      requireCode: false,
      validCodes: [],
      placeholder: "Cette porte est condamnée...",
      riddleTitle: "Porte Condamnée – Accès interdit",
      riddleText: "Aucun dossier. Accès refusé.",
      hasNote: false,
      noteText: "",
      notePosition: {},
      dialLabel: "",
      signText: "Accès Interdit"
    };
    doors.push(newDoor);
    activeIndex = doors.length - 1;
    renderDoorList();
    loadDoorToForm();
    appendLog("➕ Porte verrouillée ajoutée.");
  }

  function removeDoor() {
    if (!doors[activeIndex]) return;
    const removed = doors.splice(activeIndex, 1);
    if (activeIndex >= doors.length) activeIndex = doors.length - 1;
    renderDoorList();
    if (doors.length > 0) {
      loadDoorToForm();
    }
    appendLog("🗑 Porte supprimée : " + (removed[0]?.name || ""));
  }

  function moveDoor(delta) {
    const newIndex = activeIndex + delta;
    if (newIndex < 0 || newIndex >= doors.length) return;
    const tmp = doors[activeIndex];
    doors[activeIndex] = doors[newIndex];
    doors[newIndex] = tmp;
    activeIndex = newIndex;
    renderDoorList();
    loadDoorToForm();
    appendLog("↕ Porte réordonnée.");
  }

  function exportConfig() {
    const exported = {
      basePath: config.basePath || "/base/steam/dedale",
      exitUrl: config.exitUrl || "https://steamescape.fr/limoges",
      doors
    };

    const jsString =
      "// config/config.js\n\nwindow.DEDALE_CONFIG = " +
      JSON.stringify(exported, null, 2) +
      ";\n";

    appendLog("📤 Config exportée. (Copie dans ton fichier config/config.js)");

    const blob = new Blob([jsString], { type: "application/javascript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "config.js";
    a.click();
    URL.revokeObjectURL(url);
  }

  // INIT
  renderDoorList();
  if (doors.length > 0) loadDoorToForm();

  if (btnAddDoor) btnAddDoor.addEventListener("click", addDoor);
  if (btnAddLockedDoor) btnAddLockedDoor.addEventListener("click", addLockedDoor);
  if (btnRemoveDoor) btnRemoveDoor.addEventListener("click", removeDoor);
  if (btnMoveUp) btnMoveUp.addEventListener("click", () => moveDoor(-1));
  if (btnMoveDown) btnMoveDown.addEventListener("click", () => moveDoor(1));
  if (btnSaveDoor) btnSaveDoor.addEventListener("click", saveFormToDoor);
  if (btnExportConfig) btnExportConfig.addEventListener("click", exportConfig);
})();
