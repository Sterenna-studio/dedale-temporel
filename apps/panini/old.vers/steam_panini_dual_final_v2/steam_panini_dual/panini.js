// Panini page JavaScript
// This script powers the carnets panini (SVG style) page. It shares
// much of the logic from poster.js but uses a CSS grid for the 3×4
// sticker layout instead of absolute positioning. State is kept
// separately in localStorage under panini‑prefixed keys to avoid
// interfering with the poster page.

document.addEventListener('DOMContentLoaded', () => {
  // Shortcuts for element selection
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

  // State variables
  let missions = [];
  let unlocked = [];
  let assignments = new Array(12).fill(null);
  let playerName = 'Agent';

  // Compute base path for assets and missions.json. Same logic as
  // poster.js.
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

  function restoreState() {
    try {
      const u = JSON.parse(localStorage.getItem('paniniUnlocked') || '[]');
      if (Array.isArray(u)) unlocked = u;
    } catch {}
    try {
      const a = JSON.parse(localStorage.getItem('paniniAssignments') || '[]');
      if (Array.isArray(a) && a.length === 12) assignments = a;
    } catch {}
    const savedName = localStorage.getItem('paniniPlayerName');
    if (savedName) playerName = savedName;
    nameInput.value = playerName;
    nameDisplay.textContent = playerName;
  }

  function saveState() {
    localStorage.setItem('paniniUnlocked', JSON.stringify(unlocked));
    localStorage.setItem('paniniAssignments', JSON.stringify(assignments));
    localStorage.setItem('paniniPlayerName', playerName);
  }

  // Build the grid with 12 slot elements. In this style, CSS grid
  // handles layout, so slots simply need to be appended in order with
  // their index stored in a data attribute. Each slot listens for
  // dragover, drop and click events.
  function createGrid() {
    grid.innerHTML = '';
    for (let i = 0; i < 12; i++) {
      const slot = document.createElement('div');
      slot.className = 'slot';
      slot.dataset.index = i;
      slot.addEventListener('dragover', (e) => {
        e.preventDefault();
      });
      slot.addEventListener('drop', (e) => {
        e.preventDefault();
        const missionId = e.dataTransfer.getData('text/plain');
        if (missionId) assignMissionToSlot(missionId, i);
      });
      slot.addEventListener('click', () => {
        const missionId = assignments[i];
        if (missionId) {
          const mission = missions.find((m) => m.id === missionId);
          if (mission) showModal(mission);
        }
      });
      grid.appendChild(slot);
    }
    updateSlots();
  }

  function updateSlots() {
    const slots = grid.querySelectorAll('.slot');
    slots.forEach((slot) => {
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

  function renderInventory() {
    inventoryEl.innerHTML = '';
    missions.forEach((m) => {
      const item = document.createElement('div');
      item.className = 'inventory-item';
      item.style.backgroundImage = `url(${m.image})`;
      item.textContent = m.id;
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

  function assignMissionToSlot(missionId, slotIndex) {
    const prevIndex = assignments.findIndex((id) => id === missionId);
    if (prevIndex !== -1) {
      assignments[prevIndex] = null;
    }
    assignments[slotIndex] = missionId;
    unlocked = unlocked.filter((id) => id !== missionId);
    saveState();
    updateSlots();
    renderInventory();
  }

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

  function showModal(mission) {
    modalTitle.textContent = mission.name;
    modalImage.src = mission.image;
    modalDesc.innerHTML = mission.description;
    modalSecret.innerHTML = mission.secret;
    modal.classList.remove('hidden');
  }

  function hideModal() {
    modal.classList.add('hidden');
  }

  async function exportPDF() {
    const controls = document.querySelector('.controls');
    const inventory = document.querySelector('.inventory');
    const originalControlsDisplay = controls.style.display;
    const originalInventoryDisplay = inventory.style.display;
    controls.style.display = 'none';
    inventory.style.display = 'none';
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
    const filename = 'carnet_' + playerName.replace(/[^A-Za-z0-9]/g, '_') + '.pdf';
    pdf.save(filename);
  }

  // Bind events
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

  // Initialize
  (async function init() {
    await loadMissions();
    restoreState();
    createGrid();
    renderInventory();
  })();
});