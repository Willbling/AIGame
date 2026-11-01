window.MS = window.MS || {};

MS.render = {
  renderBoard() {
    const state = MS.state;
    const boardEl = document.getElementById('board');
    const size = getComputedStyle(document.body).getPropertyValue('--cell-size').trim() || '24px';
    boardEl.style.gridTemplateColumns = `repeat(${state.cols}, ${size})`;
    boardEl.style.gridTemplateRows = `repeat(${state.rows}, ${size})`;
    boardEl.innerHTML = '';

    for (let r = 0; r < state.rows; r++) {
      for (let c = 0; c < state.cols; c++) {
        const cellEl = document.createElement('div');
        cellEl.className = 'cell';
        cellEl.dataset.r = r;
        cellEl.dataset.c = c;
        cellEl.addEventListener('click', () => MS.game.handleClick(r, c));
        cellEl.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          MS.game.handleRightClick(r, c);
        });
        cellEl.addEventListener('mousedown', (e) => {
          if (e.button === 1) MS.game.handleMiddleClick(r, c);
        });
        this.updateCellEl(cellEl, r, c);
        boardEl.appendChild(cellEl);
      }
    }
    requestAnimationFrame(() => MS.effects.resize());
  },

  refreshBoard() {
    document.querySelectorAll('#board .cell').forEach((cellEl) => {
      this.updateCellEl(cellEl, parseInt(cellEl.dataset.r, 10), parseInt(cellEl.dataset.c, 10));
    });
  },

  cellElAt(r, c) {
    return document.querySelector(`#board .cell[data-r="${r}"][data-c="${c}"]`);
  },

  updateCellEl(cellEl, r, c) {
    const state = MS.state;
    const cell = state.board[r][c];
    const ocean = state.theme === 'ocean';
    const classes = ['cell'];
    if (cell.revealed) classes.push('revealed');
    if (ocean && cell.revealed && cell.mine) classes.push('ocean-flow');
    if (cell._mineHit) classes.push(ocean ? 'exploded' : 'mine-hit');
    if (state.gameOver && cell.flagged && !cell.mine) classes.push('wrong-flag');
    if (!cell.mine && cell.revealed && cell.adjacent > 0) classes.push('n' + cell.adjacent);
    cellEl.className = classes.join(' ');

    if (cell.revealed && cell.mine) {
      if (ocean && cell._mineHit) {
        cellEl.innerHTML = '<span class="ocean-burst" aria-hidden="true"><svg viewBox="0 0 32 32"><g fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M16 16 16 5M16 16 26 9M16 16 27 20M16 16 16 28M16 16 7 24M16 16 5 11" stroke="#3a100c" stroke-width="2.6"/><path d="M16 16 16 7M16 16 24 10M16 16 25 19M16 16 16 26M16 16 8 23M16 16 7 12" stroke="#ff5a32" stroke-width="1.15"/></g><circle cx="16" cy="16" r="2.1" fill="#ffd0c2"/></svg></span>';
      } else {
        cellEl.innerHTML = ocean ? '' : (cell._mineHit ? '💥' : '💣');
      }
      return;
    }
    if (cell.revealed && state.gameOver && cell.flagged && !cell.mine && !ocean) {
      cellEl.textContent = '❌';
      return;
    }
    if (cell.revealed && cell.adjacent > 0) {
      cellEl.innerHTML = `<span class="num">${cell.adjacent}</span>`;
      return;
    }
    if (!cell.revealed && cell.flagged) {
      const wrong = state.gameOver && !cell.mine;
      cellEl.innerHTML = ocean ? '<span class="ocean-heart"></span>' : (wrong ? '❌' : '🚩');
      return;
    }
    if (!cell.revealed && cell.question) {
      cellEl.innerHTML = ocean
        ? '<span class="ocean-heart yellow"></span>'
        : '<span class="qmark">?</span>';
      return;
    }
    if (!cell.revealed && cell.mine && state.cheat) {
      cellEl.innerHTML = ocean
        ? '<span class="ocean-heart cheat-green"></span>'
        : '<span class="cheat-mark">!</span>';
      return;
    }
    cellEl.innerHTML = '';
  }
};
