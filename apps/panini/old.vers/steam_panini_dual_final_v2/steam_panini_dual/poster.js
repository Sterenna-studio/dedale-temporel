// Poster page JavaScript
// This script powers the interactive STEAM poster page. It handles
// loading mission definitions from missions.json, managing unlocked
// stickers, drag‑and‑drop assignment to slots, persisting state in
// localStorage, displaying mission details, and exporting the
// completed poster to a PDF. The poster style uses an image
// background with a custom 3×4 grid overlaid using absolute
// positioning. Inventory appears below the poster.

document.addEventListener('DOMContentLoaded', () => {
  // Helper for selecting elements
  const $ = (sel) => document.querySelector(sel);

  // DOM references
  const nameInput = $('#player-name');
  const codeInput = $('#unlock-code');
  const unlockBtn = $('#unlock-button');
  const exportBtn = $('#export-pdf');
  const sheet = $('#sheet');
  const grid = $('#grid');
  const inventoryEl = $('#inventory-items');
  const nameDisplay = $('#player-name-display');
  // Modal elements
  const modal = $('#modal');
  const modalClose = $('#modal-close');
  const modalTitle = $('#modal-title');
  const modalImage = $('#modal-image');
  const modalDesc = $('#modal-description');
  const modalSecret = $('#modal-secret');

  // Relative positioning constants for the 3×4 grid. Values are
  // expressed as fractions of the poster sheet dimensions. These
  // values were provided by the user to align the slots over the
  // decorative poster background: left 12%, top 12.2%, width 75%,
  // height 68%, horizontal gap 3.75%, vertical gap 3.1%.
  const GRID_LEFT = 12 / 100;
  const GRID_TOP = 12.2 / 100;
  const GRID_WIDTH = 75 / 100;
  const GRID_HEIGHT = 68 / 100;
  const GAP_X = 3.75 / 100;
  const GAP_Y = 3.1 / 100;

  // State variables
  let missions = [];
  let unlocked = [];
  let assignments = new Array(12).fill(null);
  let playerName = 'Agent';

  // Compute the base path to the /base/panini/ folder. When the
  // application is deployed on a server, the path will contain
  // '/base/panini/'. When opened via file:// for testing, the regex
  // falls back to this convention. The base is used to construct
  // absolute URLs for mission images and the missions.json file.
  const BASE = (() => {
    const m = location.pathname.match(/^(.*\/base\/panini\/)/);
    return m ? m[1] : '/base/panini/';
  })();

  // Build an absolute URL for a relative asset path defined in
  // missions.json. The function encodes each segment of the path
  // separately so that special characters (spaces, parentheses, etc.)
  // are preserved correctly in the resulting URL.
  function assetUrl(rel) {
    const cleaned = rel.replace(/^\//, '');
    const encoded = cleaned.split('/').map(encodeURIComponent).join('/');
    return BASE + encoded;
  }

  // Load missions from missions.json. If the fetch fails (for example
  // when running from a local file:// URL), attempt to parse an
  // inline script element with id="missions-data" as a fallback. In
  // production, missions.json should be served from the same origin as
  // this page. After loading, the missions array will contain
  // objects with id, name, description, secret, image (absolute URL)
  // and back properties. The description and secret fields may
  // include HTML hyperlinks which will be rendered as innerHTML.
  async function loadMissions() {
    const url = BASE + 'missions/missions.json';
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const data = await res.json();
      missions = data.map((m) => {
        return {
          id: m.id,
          name: m.name,
          description: m.description || '',
          secret: m.secret || '',
          image: assetUrl(m.image),
          back: m.back,
        };
      });
    } catch (err) {
      console.warn('Failed to fetch missions.json', err);
      // Fallback: look for inline JSON in a script tag
      const dataEl = document.getElementById('missions-data');
      if (dataEl && dataEl.textContent) {
        try {
          const parsed = JSON.parse(dataEl.textContent);
          missions = parsed.map((m) => ({
            id: m.id,
            name: m.name,
            description: m.description || '',
            secret: m.secret || '',
            image: m.image,
            back: m.back,
          }));
        } catch (e) {
          console.error('Failed to parse inline missions-data JSON', e);
        }
      }
    }
  }

  // Restore previous state (unlocked missions, slot assignments and player
  // name) from localStorage. This allows the poster to persist
  // between sessions. LocalStorage keys are unique to the poster
  // version to avoid interference with other pages.
  function restoreState() {
    try {
      const u = JSON.parse(localStorage.getItem('posterUnlocked') || '[]');
      if (Array.isArray(u)) unlocked = u;
    } catch {}
    try {
      const a = JSON.parse(localStorage.getItem('posterAssignments') || '[]');
      if (Array.isArray(a) && a.length === 12) assignments = a;
    } catch {}
    const savedName = localStorage.getItem('posterPlayerName');
    if (savedName) playerName = savedName;
    nameInput.value = playerName;
    nameDisplay.textContent = playerName;
  }

  // Persist the current state to localStorage. Called whenever the
  // unlocked array, assignments or playerName changes. Keys mirror
  // those used in restoreState().
  function saveState() {
    localStorage.setItem('posterUnlocked', JSON.stringify(unlocked));
    localStorage.setItem('posterAssignments', JSON.stringify(assignments));
    localStorage.setItem('posterPlayerName', playerName);
  }

  // Build the 12 slots overlay on the poster. Each slot is absolutely
  // positioned relative to the poster sheet using the constants
  // defined above. The slot elements respond to drag events to
  // receive mission cards and click events to show mission details.
  function createGrid() {
    grid.innerHTML = '';
    // Calculate slot dimensions as fractions of the overall sheet
    const slotWidth = (GRID_WIDTH - 2 * GAP_X) / 3;
    const slotHeight = (GRID_HEIGHT - 3 * GAP_Y) / 4;
    for (let i = 0; i < 12; i++) {
      const row = Math.floor(i / 3);
      const col = i % 3;
      const x = GRID_LEFT + col * (slotWidth + GAP_X);
      const y = GRID_TOP + row * (slotHeight + GAP_Y);
      const slot = document.createElement('div');
      slot.className = 'slot';
      slot.style.left = (x * 100) + '%';
      slot.style.top = (y * 100) + '%';
      slot.style.width = (slotWidth * 100) + '%';
      slot.style.height = (slotHeight * 100) + '%';
      slot.dataset.index = i;
      // Drag over and drop handlers
      slot.addEventListener('dragover', (e) => {
        e.preventDefault();
      });
      slot.addEventListener('drop', (e) => {
        e.preventDefault();
        const missionId = e.dataTransfer.getData('text/plain');
        if (missionId) assignMissionToSlot(missionId, i);
      });
      // Click to show details if a mission is assigned
      slot.addEventListener('click', () => {
        const missionId = assignments[i];
        if (missionId) {
          const mission = missions.find((m) => m.id === missionId);
          if (mission) showModal(mission);
        }
      });
      grid.appendChild(slot);
    }
    // After creating slots, update their appearance based on current assignments
    updateSlots();
  }

  // Update each slot's background image to reflect current assignments. A
  // slot with an assigned mission uses the mission's image as its
  // background and receives the `assigned` class to change border
  // styling. Empty slots revert to default appearance.
  function updateSlots() {
    const slotElems = grid.querySelectorAll('.slot');
    slotElems.forEach((slot) => {
      const idx = parseInt(slot.dataset.index);
      const missionId = assignments[idx];
      if (missionId) {
        const mission = missions.find((m) => m.id === missionId);
        if (mission) {
          slot.classList.add('assigned');
          slot.style.backgroundImage = `url(${mission.image})`;
        }
      } else {
        slot.classList.remove('assigned');
        slot.style.backgroundImage = '';
      }
    });
  }

  // Render the inventory items. All missions are displayed, but only
  // those in the `unlocked` array (and not currently assigned to a
  // slot) are draggable. Locked missions are shown with reduced
  // opacity. Clicking on an inventory item has no effect; drag to
  // assign instead.
  function renderInventory() {
    inventoryEl.innerHTML = '';
    missions.forEach((m) => {
      const item = document.createElement('div');
      item.className = 'inventory-item';
      item.style.backgroundImage = `url(${m.image})`;
      item.textContent = m.id;
      // Only make draggable if the mission is unlocked and not assigned
      const assigned = assignments.includes(m.id);
      const isUnlocked = unlocked.includes(m.id);
      if (isUnlocked && !assigned) {
        item.classList.add('unlocked');
        item.setAttribute('draggable', 'true');
        item.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/plain', m.id);
          e.dataTransfer.effectAllowed = 'move';
        });
      }
      inventoryEl.appendChild(item);
    });
  }

  // Assign a mission to a specific slot by its index. If the mission
  // is currently assigned elsewhere, remove it from the previous
  // location. Assigned missions are removed from the `unlocked` array.
  function assignMissionToSlot(missionId, slotIndex) {
    // If mission is already placed somewhere else, clear it
    const prevIndex = assignments.findIndex((id) => id === missionId);
    if (prevIndex !== -1) {
      assignments[prevIndex] = null;
    }
    assignments[slotIndex] = missionId;
    // Remove from unlocked list
    unlocked = unlocked.filter((id) => id !== missionId);
    saveState();
    updateSlots();
    renderInventory();
  }

  // Unlock a mission via the code input. Codes are case‑insensitive
  // three‑letter identifiers stored in the `id` property of each
  // mission. If the mission exists and isn't already unlocked or
  // placed, it is added to the unlocked array.
  function unlockMission() {
    const code = codeInput.value.trim().toUpperCase().slice(0, 3);
    if (!code) return;
    const mission = missions.find((m) => m.id.toUpperCase() === code);
    if (!mission) {
      alert('Aucune mission avec cet ID.');
      return;
    }
    if (unlocked.includes(mission.id) || assignments.includes(mission.id)) {
      alert('Cette mission est déjà débloquée ou placée.');
      return;
    }
    unlocked.push(mission.id);
    codeInput.value = '';
    saveState();
    renderInventory();
    alert(`Mission ${mission.id} débloquée !`);
  }

  // Show modal dialog with mission details. The description and secret
  // fields may contain HTML (for hyperlinks). A user can dismiss the
  // modal by clicking the close button or outside the content. The
  // mission image is displayed in the modal. A photo toggle (team
  // photo) is omitted here but could be added similar to the panini
  // version if desired.
  function showModal(mission) {
    modalTitle.textContent = mission.name;
    modalImage.src = mission.image;
    modalDesc.innerHTML = mission.description;
    modalSecret.innerHTML = mission.secret;
    modal.classList.remove('hidden');
  }

  // Hide modal when close button or backdrop is clicked
  function hideModal() {
    modal.classList.add('hidden');
  }

  // Export the poster as a PDF. The inventory and controls are
  // temporarily hidden during capture so that only the sheet is
  // rendered into the PDF. html2canvas renders the sheet to a
  // high‑resolution canvas, and jsPDF embeds it into an A4 page.
  async function exportPDF() {
    const controls = document.querySelector('.controls');
    const inventory = document.querySelector('.inventory');
    const originalControlsDisplay = controls.style.display;
    const originalInventoryDisplay = inventory.style.display;
    controls.style.display = 'none';
    inventory.style.display = 'none';
    // Wait a tick for reflow
    await new Promise((resolve) => setTimeout(resolve, 50));
    const canvas = await html2canvas(sheet, { useCORS: true, scale: 2 });
    controls.style.display = originalControlsDisplay;
    inventory.style.display = originalInventoryDisplay;
    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('portrait', 'mm', 'a4');
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 10;
    const imgWidth = pageWidth - 2 * margin;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
    const filename = 'poster_' + playerName.replace(/[^A-Za-z0-9]/g, '_') + '.pdf';
    pdf.save(filename);
  }

  // Event bindings
  nameInput.addEventListener('input', () => {
    playerName = nameInput.value.trim() || 'Agent';
    nameDisplay.textContent = playerName;
    saveState();
  });
  unlockBtn.addEventListener('click', unlockMission);
  exportBtn.addEventListener('click', exportPDF);
  modalClose.addEventListener('click', hideModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) hideModal();
  });

  // Initialize: load missions, restore state, build grid, render inventory
  (async function init() {
    await loadMissions();
    restoreState();
    createGrid();
    renderInventory();
  })();
});