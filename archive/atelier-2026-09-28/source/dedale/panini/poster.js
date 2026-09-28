// Script for the poster (Affiche) page

// Grid layout constants (percentages). These values align the 3x4 sticker
// grid over the poster background. Adjust them if your poster image
// changes. They correspond to the left and top offsets, overall width
// and height, and the horizontal/vertical gaps between stickers.
const GRID = {
  left: 12,
  top: 12.2,
  width: 75,
  height: 68,
  gapX: 3.75,
  gapY: 3.1
};

let missions = [];
let state;
let selectedMission = null;

document.addEventListener('DOMContentLoaded', async () => {
  missions = await loadMissions();
  state = loadState();
  // Set name
  const nameInput = document.getElementById('nameInput');
  nameInput.value = state.name || '';
  const agentDisplay = document.getElementById('agentName');
  function updateAgentName() {
    agentDisplay.textContent = state.name || '';
  }
  nameInput.addEventListener('input', () => {
    state.name = nameInput.value.trim();
    saveState(state);
    updateAgentName();
  });
  updateAgentName();
  // Unlock mission via code
  document.getElementById('unlockBtn').addEventListener('click', () => {
    const code = document.getElementById('codeInput').value.trim().toUpperCase();
    if (!code) return;
    const mission = unlockMission(code, missions, state);
    if (mission) {
      alert('Mission ' + mission.name + ' débloquée !');
      renderInventory();
    } else {
      alert('Code invalide ou mission déjà débloquée.');
    }
    document.getElementById('codeInput').value = '';
  });
  // Navigation back to hub
  document.getElementById('hubBtn').addEventListener('click', () => {
    window.location.href = assetUrl('index.html');
  });
  // PDF export
  document.getElementById('exportPdfBtn').addEventListener('click', exportPdf);
  // Close modal
  document.getElementById('modalClose').addEventListener('click', closeModal);
  // Render grid and inventory
  createGrid();
  renderInventory();
});

function createGrid() {
  const gridEl = document.getElementById('grid');
  gridEl.innerHTML = '';
  const cellW = (GRID.width - GRID.gapX * 2) / 3;
  const cellH = (GRID.height - GRID.gapY * 3) / 4;
  let idx = 0;
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 3; col++) {
      const slot = document.createElement('div');
      slot.classList.add('slot');
      // Capture the current index for event handlers; without this,
      // closures would all reference the final value of idx.
      const index = idx;
      // Position and sizing
      slot.style.left = (GRID.left + col * (cellW + GRID.gapX)) + '%';
      slot.style.top = (GRID.top + row * (cellH + GRID.gapY)) + '%';
      slot.style.width = cellW + '%';
      slot.style.height = cellH + '%';
      slot.dataset.index = index;
      // If there is a mission assigned to this slot, populate it
      const code = state.posterAssignments[index];
      if (code) {
        slot.classList.add('filled');
        const mission = missions.find(m => m.id.toUpperCase() === code);
        if (mission) {
          const img = document.createElement('img');
          tryImageWithFallbacks(img, mission.image);
          slot.appendChild(img);
        }
      }
      // Clicking a slot places a selected mission or opens modal
      slot.addEventListener('click', () => {
        handleSlotClick(index);
      });
      // Allow drag-and-drop placement of stickers. Prevent default on
      // dragover so drop can occur and explicitly set the dropEffect.
      slot.addEventListener('dragover', (ev) => {
        ev.preventDefault();
        ev.dataTransfer.dropEffect = 'move';
      });
      slot.addEventListener('drop', (ev) => {
        ev.preventDefault();
        const droppedCode = ev.dataTransfer.getData('text/plain');
        if (!droppedCode) return;
        state.posterAssignments[index] = droppedCode.toUpperCase();
        saveState(state);
        selectedMission = null;
        createGrid();
        renderInventory();
      });
      gridEl.appendChild(slot);
      idx++;
    }
  }
}

function renderInventory() {
  const inv = document.getElementById('inventory');
  inv.innerHTML = '';
  // Create inventory items for unlocked missions
  state = loadState();
  const unlocked = state.unlocked;
  unlocked.forEach(code => {
    const mission = missions.find(m => m.id.toUpperCase() === code);
    if (mission) {
      const item = document.createElement('div');
      item.classList.add('inv-item');
      if (selectedMission && selectedMission.id.toUpperCase() === code) {
        item.classList.add('selected');
      }
      // Image
      const img = document.createElement('img');
      tryImageWithFallbacks(img, mission.image);
      item.appendChild(img);
      // ID label
      const label = document.createElement('div');
      label.classList.add('id-label');
      label.textContent = code;
      item.appendChild(label);
      // Click to select
      item.addEventListener('click', () => {
        if (selectedMission && selectedMission.id.toUpperCase() === code) {
          // Deselect if clicked again
          selectedMission = null;
        } else {
          selectedMission = mission;
        }
        renderInventory();
      });

      // Enable drag-and-drop from inventory
      item.draggable = true;
      item.addEventListener('dragstart', (ev) => {
        // Allow move operations
        ev.dataTransfer.effectAllowed = 'move';
        // Transfer the mission code in uppercase
        ev.dataTransfer.setData('text/plain', code);
        // Indicate dragging visually by adding a class
        item.classList.add('dragging');
      });
      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
      });
      inv.appendChild(item);
    }
  });
}

function handleSlotClick(index) {
  state = loadState();
  // If a mission is selected from inventory, assign it to this slot
  if (selectedMission) {
    state.posterAssignments[index] = selectedMission.id.toUpperCase();
    saveState(state);
    // Optionally deselect after placing
    selectedMission = null;
    createGrid();
    renderInventory();
    return;
  }
  // If no mission selected and slot filled, open modal
  const code = state.posterAssignments[index];
  if (code) {
    openModal(index);
  }
}

function openModal(index) {
  const code = state.posterAssignments[index];
  const mission = missions.find(m => m.id.toUpperCase() === code);
  if (!mission) return;
  const modal = document.getElementById('modal');
  modal.classList.remove('hidden');
  document.getElementById('modalTitle').textContent = mission.name;
  const img = document.getElementById('modalImage');
  tryImageWithFallbacks(img, mission.image);
  document.getElementById('modalDescription').innerHTML = mission.description || '';
  document.getElementById('modalSecret').innerHTML = mission.secret || '';
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
}

async function exportPdf() {
  // Hide UI elements during capture
  const sheet = document.getElementById('posterSheet');
  // Use html2canvas to capture poster
  const canvas = await html2canvas(sheet, { scale: 2 });
  const imgData = canvas.toDataURL('image/png');
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF('portrait', 'mm', [210, 297]);
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const imgProps = {
    width: canvas.width,
    height: canvas.height
  };
  // Compute aspect ratio
  let imgW = pdfWidth;
  let imgH = (imgProps.height * pdfWidth) / imgProps.width;
  if (imgH > pdfHeight) {
    imgH = pdfHeight;
    imgW = (imgProps.width * pdfHeight) / imgProps.height;
  }
  const x = (pdfWidth - imgW) / 2;
  const y = (pdfHeight - imgH) / 2;
  pdf.addImage(imgData, 'PNG', x, y, imgW, imgH);
  const filename = (state.name || 'poster') + '.pdf';
  pdf.save(filename);
}