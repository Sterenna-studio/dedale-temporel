fetch('level.json')
  .then(r => r.json())
  .then(level => init(level));

function init(level) {
  const workspace = document.getElementById('workspace');
  const result = document.getElementById('result');
  const codeEl = document.getElementById('code');
  const resetBtn = document.getElementById('reset');

  let letters = level.rectangles.map(r => r.letter);

  function shuffle(arr) {
    return arr.sort(() => Math.random() - 0.5);
  }

  function render() {
    workspace.innerHTML = '';
    shuffle(letters).forEach(l => {
      const d = document.createElement('div');
      d.className = 'piece';
      d.textContent = l;
      d.draggable = true;
      d.addEventListener('dragstart', e => {
        e.dataTransfer.setData('text', l);
      });
      d.addEventListener('dragover', e => e.preventDefault());
      d.addEventListener('drop', e => {
        e.preventDefault();
        const from = e.dataTransfer.getData('text');
        const to = d.textContent;
        d.textContent = from;
        e.target.textContent = to;
        check();
      });
      workspace.appendChild(d);
    });
  }

  function check() {
    const current = [...document.querySelectorAll('.piece')].map(p => p.textContent).join('');
    if (current === level.finalCode) {
      result.classList.remove('hidden');
      codeEl.textContent = current;
      if (window.DedaleState) DedaleState.grant("Δ");
    }
  }

  resetBtn.onclick = () => {
    result.classList.add('hidden');
    render();
  };

  render();
}
