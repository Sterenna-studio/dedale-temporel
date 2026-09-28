// Script for the panini (A4) page

let missions = [];
let state;
let selectedMission = null;

document.addEventListener('DOMContentLoaded', async () => {
  missions = await loadMissions();
  state = loadState();
  // Populate name
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
  // Unlock mission button
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
  // Navigation to hub
  document.getElementById('hubBtn').addEventListener('click', () => {
    window.location.href = assetUrl('index.html');
  });
  // Export PDF
  document.getElementById('exportPdfBtn').addEventListener('click', exportPdf);
  // Close modal
  document.getElementById('modalClose').addEventListener('click', closeModal);
  // Build grid and inventory
  createGrid();
  renderInventory();
});

function createGrid() {
  const sheet = document.getElementById('paniniSheet');
  sheet.innerHTML = '';
  for (let i = 0; i < 12; i++) {
    const slot = document.createElement('div');
    slot.classList.add('slot');
    slot.dataset.index = i;
    const code = state.paniniAssignments[i];
    if (code) {
      slot.classList.add('filled');
      const mission = missions.find(m => m.id.toUpperCase() === code);
      if (mission) {
        const img = document.createElement('img');
        tryImageWithFallbacks(img, mission.image);
        slot.appendChild(img);
      }
    }
    slot.addEventListener('click', () => {
      handleSlotClick(i);
    });

    // Allow drag-and-drop placement
    // Allow drag-and-drop placement.
    slot.addEventListener('dragover', (ev) => {
      ev.preventDefault();
      ev.dataTransfer.dropEffect = 'move';
    });
    slot.addEventListener('drop', (ev) => {
      ev.preventDefault();
      const codeDropped = ev.dataTransfer.getData('text/plain');
      if (!codeDropped) return;
      // Assign mission to this slot index
      state.paniniAssignments[i] = codeDropped.toUpperCase();
      saveState(state);
      selectedMission = null;
      createGrid();
      renderInventory();
    });
    sheet.appendChild(slot);
  }
}

function renderInventory() {
  const inv = document.getElementById('inventory');
  inv.innerHTML = '';
  state = loadState();
  state.unlocked.forEach(code => {
    const mission = missions.find(m => m.id.toUpperCase() === code);
    if (mission) {
      const item = document.createElement('div');
      item.classList.add('inv-item');
      if (selectedMission && selectedMission.id.toUpperCase() === code) {
        item.classList.add('selected');
      }
      const img = document.createElement('img');
      tryImageWithFallbacks(img, mission.image);
      item.appendChild(img);
      const label = document.createElement('div');
      label.classList.add('id-label');
      label.textContent = code;
      item.appendChild(label);
      item.addEventListener('click', () => {
        if (selectedMission && selectedMission.id.toUpperCase() === code) {
          selectedMission = null;
        } else {
          selectedMission = mission;
        }
        renderInventory();
      });

      // Enable drag-and-drop from inventory
      item.draggable = true;
      item.addEventListener('dragstart', (ev) => {
        ev.dataTransfer.effectAllowed = 'move';
        ev.dataTransfer.setData('text/plain', code);
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
  if (selectedMission) {
    state.paniniAssignments[index] = selectedMission.id.toUpperCase();
    saveState(state);
    selectedMission = null;
    createGrid();
    renderInventory();
    return;
  }
  const code = state.paniniAssignments[index];
  if (code) {
    openModal(index);
  }
}

function openModal(index) {
  const assignments = state.paniniAssignments;
  const code = assignments[index];
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
  const sheet = document.getElementById('paniniSheet');
  const canvas = await html2canvas(sheet, { scale: 2 });
  const imgData = canvas.toDataURL('image/png');
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF('portrait', 'mm', [210, 297]);
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const imgProps = { width: canvas.width, height: canvas.height };
  let imgW = pdfWidth;
  let imgH = (imgProps.height * pdfWidth) / imgProps.width;
  if (imgH > pdfHeight) {
    imgH = pdfHeight;
    imgW = (imgProps.width * pdfHeight) / imgProps.height;
  }
  const x = (pdfWidth - imgW) / 2;
  const y = (pdfHeight - imgH) / 2;
  pdf.addImage(imgData, 'PNG', x, y, imgW, imgH);
  const filename = (state.name || 'carnet') + '.pdf';
  pdf.save(filename);
}