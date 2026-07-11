// Interactive Panini album script

// Preloaded missions JSON data. Embedding the missions.json content directly
// allows this page to function correctly when served via file:// or on a
// static host without CORS. The content comes from missions/missions.json.
const MISSIONS_DATA = 
  [
    {
      "id": "ATT",
      "name": "Att.E9Bjtxkdnpxwc6Nuocvhaqhakxiiwspxndxe2Zyqcf0",
      "description": "",
      "secret": "",
      "image": "missions/images/att.e9BjTxkDNPxwC6nuocVHaQhaKXIIwSpXNdxE2zyQcf0.jpg",
      "back": 1
    },
    {
      "id": "ORI",
      "name": "Orient Express 1536X1536",
      "description": "",
      "secret": "",
      "image": "missions/images/orient-express-1536x1536.jpg",
      "back": 1
    },
    {
      "id": "LPT",
      "name": "Lpt1Yxp6K3Y0Cwtknkpd",
      "description": "",
      "secret": "",
      "image": "missions/images/lpt1yxp6k3y0cwtknkpd.jpg",
      "back": 1
    },
    {
      "id": "VIS",
      "name": "Visuel Sherlock Mission 2 Sans Logo 1024X1024",
      "description": "",
      "secret": "",
      "image": "missions/images/visuel-sherlock-mission-2-sans-logo-1024x1024.jpg",
      "back": 1
    },
    {
      "id": "RIC",
      "name": "Richard Coeur De Lion",
      "description": "",
      "secret": "",
      "image": "missions/images/richard-coeur-de-lion.jpg",
      "back": 1
    },
    {
      "id": "CAR",
      "name": "Carte Pierre Philosophale",
      "description": "",
      "secret": "",
      "image": "missions/images/Carte-Pierre-Philosophale.jpg",
      "back": 1
    },
    {
      "id": "LEF",
      "name": "Le Fantome De Lopera",
      "description": "",
      "secret": "",
      "image": "missions/images/Le-Fantome-de-lOpera.jpg",
      "back": 1
    },
    {
      "id": "LUT",
      "name": "Lutin De Pekin",
      "description": "",
      "secret": "",
      "image": "missions/images/lutin-de-pekin.jpg",
      "back": 1
    },
    {
      "id": "VISP",
      "name": "Visuel Pyramide Rouge Grand Format",
      "description": "",
      "secret": "",
      "image": "missions/images/visuel-pyramide-rouge-grand-format.jpg",
      "back": 1
    },
    {
      "id": "VIST",
      "name": "Visuel Temple Maya 400X400 1",
      "description": "",
      "secret": "",
      "image": "missions/images/visuel-temple-maya-400x400-1.jpg",
      "back": 1
    },
    {
      "id": "SAM",
      "name": "Samourai Image Carree",
      "description": "",
      "secret": "",
      "image": "missions/images/Samourai-Image-Carree.jpg",
      "back": 1
    },
    {
      "id": "MER",
      "name": "Merlin 1536X1536",
      "description": "",
      "secret": "",
      "image": "missions/images/merlin-1536x1536.jpg",
      "back": 1
    },
    {
      "id": "LAR",
      "name": "La Relique De Salem Visuel",
      "description": "",
      "secret": "",
      "image": "missions/images/la-relique-de-salem-visuel.jpg",
      "back": 1
    },
    {
      "id": "VIS1",
      "name": "Visuel Sherlock Mission 1",
      "description": "",
      "secret": "",
      "image": "missions/images/visuel-sherlock-mission-1.jpg",
      "back": 1
    },
    {
      "id": "ATT2",
      "name": "Att.Edqut91Wx12H0Y86Zq1Av46Ufmv Xbrhb Ww5M42Wd8 2 (1)",
      "description": "",
      "secret": "",
      "image": "missions/images/att.EdQUt91wx12h0Y86Zq1aV46UfMV_XBRhb-ww5M42wd8-2 (1).jpg",
      "back": 1
    }
  ];

document.addEventListener('DOMContentLoaded', async () => {
  // Helper to get elements
  const el = (sel) => document.querySelector(sel);
  // References to DOM elements
  const nameInput = el('#player-name');
  const codeInput = el('#unlock-code');
  const unlockBtn = el('#unlock-button');
  const styleBtn = el('#style-toggle');
  const exportBtn = el('#export-pdf');
  const sheet = el('#sheet');
  const grid = el('#grid');
  const inventoryEl = el('#inventory-items');
  const nameDisplay = el('#player-name-display');
  // Modal elements
  const modal = el('#modal');
  const modalClose = el('#modal-close');
  const modalTitle = el('#modal-title');
  const modalImage = el('#modal-image');
  const modalDesc = el('#modal-description');
  const modalSecret = el('#modal-secret');
  const modalToggle = el('#toggle-photo');

  // State
  let missions = [];
  let unlocked = [];
  let assignments = new Array(12).fill(null);
  let currentStyle = 'poster';
  let playerName = 'Agent';
  // When viewing a mission in modal, track whether photo mode is on
  let photoMode = false;
  // Placeholder image for team photo (use the steam logo or gear)
  const teamPhotoPlaceholder = 'assets/steam-logo.png';

  // Compute base path for assets and missions.json
  const BASE = (() => {
    const m = location.pathname.match(/^(.*\/base\/panini\/)/);
    return m ? m[1] : '/base/panini/';
  })();
  function assetUrl(rel) {
    const cleaned = rel.replace(/^\//, '');
    const encoded = cleaned.split('/').map(encodeURIComponent).join('/');
    return BASE + encoded;
  }

  async function loadMissions() {
    // Populate missions from the embedded JSON constant. We transform each entry
    // to attach the correct asset URL for its image. This avoids CORS issues
    // when running via file:// and ensures offline functionality.
    missions = MISSIONS_DATA.map((m) => {
      return {
        id: m.id,
        name: m.name,
        description: m.description || '',
        secret: m.secret || '',
        image: assetUrl(m.image),
        back: m.back,
      };
    });
  }

  // Restore saved state from localStorage
  function restoreState() {
    try {
      const u = JSON.parse(localStorage.getItem('paniniUnlocked') || '[]');
      if (Array.isArray(u)) unlocked = u;
    } catch {}
    try {
      const a = JSON.parse(localStorage.getItem('paniniAssignments') || '[]');
      if (Array.isArray(a) && a.length === 12) assignments = a;
    } catch {}
    currentStyle = localStorage.getItem('paniniStyle') || 'poster';
    playerName = localStorage.getItem('paniniPlayerName') || 'Agent';
    nameInput.value = playerName;
    nameDisplay.textContent = playerName;
  }

  function saveState() {
    localStorage.setItem('paniniUnlocked', JSON.stringify(unlocked));
    localStorage.setItem('paniniAssignments', JSON.stringify(assignments));
    localStorage.setItem('paniniStyle', currentStyle);
    localStorage.setItem('paniniPlayerName', playerName);
  }

  // Render inventory items
  function renderInventory() {
    inventoryEl.innerHTML = '';
    missions.forEach((m) => {
      const item = document.createElement('div');
      item.className = 'inventory-item';
      item.style.backgroundImage = `url(${m.image})`;
      item.textContent = m.id;
      // If unlocked, make draggable
      if (unlocked.includes(m.id)) {
        item.classList.add('unlocked');
        item.setAttribute('draggable', 'true');
        item.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/plain', m.id);
          // Provide some visual hint
          e.dataTransfer.effectAllowed = 'move';
        });
      } else {
        item.classList.remove('unlocked');
      }
      inventoryEl.appendChild(item);
    });
  }

  // Render grid slots based on assignments
  function renderGrid() {
    grid.innerHTML = '';
    for (let i = 0; i < 12; i++) {
      const slot = document.createElement('div');
      slot.className = 'slot';
      // Add drop handlers
      slot.addEventListener('dragover', (e) => {
        e.preventDefault();
      });
      slot.addEventListener('drop', (e) => {
        e.preventDefault();
        const missionId = e.dataTransfer.getData('text/plain');
        if (!missionId) return;
        assignMissionToSlot(missionId, i);
      });
      // Click to show modal if assigned
      slot.addEventListener('click', () => {
        const missionId = assignments[i];
        if (missionId) {
          const mission = missions.find((m) => m.id === missionId);
          if (mission) showModal(mission);
        }
      });
      // If a mission is assigned here, set background
      const missionId = assignments[i];
      if (missionId) {
        const mission = missions.find((m) => m.id === missionId);
        if (mission) {
          slot.classList.add('assigned');
          slot.style.backgroundImage = `url(${mission.image})`;
        }
      }
      grid.appendChild(slot);
    }
  }

  // Assign mission to slot and update state
  function assignMissionToSlot(missionId, slotIndex) {
    // Do not allow assigning the same mission multiple times
    const alreadyAssignedIndex = assignments.findIndex((id) => id === missionId);
    if (alreadyAssignedIndex !== -1) {
      // If assigning to another slot, remove from previous
      assignments[alreadyAssignedIndex] = null;
    }
    assignments[slotIndex] = missionId;
    // Remove from unlocked list so it can't be dragged again
    unlocked = unlocked.filter((id) => id !== missionId);
    saveState();
    renderGrid();
    renderInventory();
  }

  // Show modal with mission details
  function showModal(mission) {
    modalTitle.textContent = mission.name;
    modalDesc.innerHTML = mission.description || '';
    modalSecret.innerHTML = mission.secret || '';
    photoMode = false;
    modalImage.src = mission.image;
    modalToggle.textContent = 'Voir photo équipe';
    modal.classList.remove('hidden');
  }

  // Toggle between mission image and team photo placeholder
  function togglePhoto() {
    if (!modalImage.dataset.missionImage) {
      // Save original mission image in data attribute
      modalImage.dataset.missionImage = modalImage.src;
    }
    photoMode = !photoMode;
    if (photoMode) {
      modalImage.src = teamPhotoPlaceholder;
      modalToggle.textContent = 'Voir illustration mission';
    } else {
      modalImage.src = modalImage.dataset.missionImage;
      modalToggle.textContent = 'Voir photo équipe';
    }
  }

  // Unlock mission by ID
  function unlockMission() {
    const code = codeInput.value.trim().toUpperCase().slice(0, 3);
    if (!code) return;
    const mission = missions.find((m) => m.id.toUpperCase() === code);
    if (!mission) {
      alert('Aucune mission avec cet ID.');
      return;
    }
    if (unlocked.includes(code) || assignments.includes(code)) {
      alert('Cette mission est déjà débloquée ou placée.');
      return;
    }
    unlocked.push(code);
    codeInput.value = '';
    saveState();
    renderInventory();
    alert(`Mission ${code} débloquée !`);
  }

  // Toggle style between poster and panini
  function toggleStyle() {
    currentStyle = currentStyle === 'poster' ? 'panini' : 'poster';
    applyStyle();
    saveState();
  }

  function applyStyle() {
    if (currentStyle === 'poster') {
      sheet.classList.remove('panini-style');
      sheet.classList.add('poster-style');
    } else {
      sheet.classList.remove('poster-style');
      sheet.classList.add('panini-style');
    }
  }

  // PDF export using html2canvas and jsPDF
  async function exportPDF() {
    // Use html2canvas to capture the sheet. hide inventory for export
    const inv = el('#inventory');
    const controls = el('.controls');
    const originalInventoryDisplay = inv.style.display;
    const originalControlsDisplay = controls.style.display;
    // Hide inventory and controls during capture
    inv.style.display = 'none';
    controls.style.display = 'none';
    // Wait a tick for layout to update
    await new Promise((resolve) => setTimeout(resolve, 100));
    const canvas = await html2canvas(sheet, { useCORS: true, scale: 2 });
    inv.style.display = originalInventoryDisplay;
    controls.style.display = originalControlsDisplay;
    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    // A4 dimensions in mm
    const pdf = new jsPDF('portrait', 'mm', 'a4');
    const pageWidth = 210;
    const pageHeight = 297;
    // Calculate image dimensions to fit A4 with margin
    const margin = 10;
    const imgWidth = pageWidth - 2 * margin;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
    const filename = 'panini_' + playerName.replace(/[^A-Za-z0-9]/g, '_') + '.pdf';
    pdf.save(filename);
  }

  // Event bindings
  nameInput.addEventListener('input', () => {
    playerName = nameInput.value.trim() || 'Agent';
    nameDisplay.textContent = playerName;
    saveState();
  });
  unlockBtn.addEventListener('click', unlockMission);
  styleBtn.addEventListener('click', toggleStyle);
  exportBtn.addEventListener('click', exportPDF);
  modalClose.addEventListener('click', () => {
    modal.classList.add('hidden');
  });
  modalToggle.addEventListener('click', togglePhoto);
  // Close modal when clicking outside content
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.add('hidden');
    }
  });

  // Load missions and initialize
  await loadMissions();
  restoreState();
  applyStyle();
  renderInventory();
  renderGrid();
});