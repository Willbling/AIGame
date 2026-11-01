window.MS = window.MS || {};

MS.DIFFICULTY = {
  beginner: { rows: 9, cols: 9, mines: 10 },
  intermediate: { rows: 16, cols: 16, mines: 40 },
  expert: { rows: 16, cols: 30, mines: 99 },
  custom: { rows: 16, cols: 16, mines: 40 }
};

MS.LEVEL_NAME = {
  beginner: '初级',
  intermediate: '中级',
  expert: '高级',
  custom: '自定义'
};

MS.state = {
  rows: 9,
  cols: 9,
  totalMines: 10,
  board: [],
  gameOver: false,
  gameWon: false,
  firstClick: true,
  timerInterval: null,
  startedAt: 0,
  timeMs: 0,
  flagsPlaced: 0,
  difficulty: 'beginner',
  theme: 'ocean',
  cheat: false,
  cheatEver: false,
  heldButtons: 0,
  chordArmed: false,
  suppressPointerAction: false,
  clicks: 0
};

MS.game = {
  init() {
    const state = MS.state;
    const d = MS.DIFFICULTY[state.difficulty];
    state.rows = d.rows;
    state.cols = d.cols;
    state.totalMines = d.mines;
    state.board = [];
    state.gameOver = false;
    state.gameWon = false;
    state.firstClick = true;
    state.flagsPlaced = 0;
    state.timeMs = 0;
    state.startedAt = 0;
    state.heldButtons = 0;
    state.chordArmed = false;
    state.suppressPointerAction = false;
    state.clicks = 0;
    state.cheatEver = state.cheat;
    this.stopTimer();
    this.paintMines();
    MS.ui.paintTimer();
    MS.ui.hideResult();
    MS.ui.sync();

    for (let r = 0; r < state.rows; r++) {
      state.board[r] = [];
      for (let c = 0; c < state.cols; c++) {
        state.board[r][c] = { mine: false, adjacent: 0, revealed: false, flagged: false, question: false };
      }
    }
    MS.render.renderBoard();
  },

  newGame() {
    this.init();
  },

  pad3(n) {
    return String(Math.max(0, n)).padStart(3, '0');
  },

  paintMines() {
    const state = MS.state;
    const left = state.gameWon ? 0 : state.totalMines - state.flagsPlaced;
    document.getElementById('mineCounter').textContent = state.theme === 'ocean'
      ? String(left)
      : this.pad3(left);
  },

  forEachNeighbor(r, c, fn) {
    const state = MS.state;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < state.rows && nc >= 0 && nc < state.cols) fn(nr, nc);
      }
    }
  },

  placeMines(safeR, safeC) {
    const state = MS.state;
    let placed = 0;
    while (placed < state.totalMines) {
      const r = Math.floor(Math.random() * state.rows);
      const c = Math.floor(Math.random() * state.cols);
      if (Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1) continue;
      if (state.board[r][c].mine) continue;
      state.board[r][c].mine = true;
      placed++;
    }
    for (let r = 0; r < state.rows; r++) {
      for (let c = 0; c < state.cols; c++) {
        if (state.board[r][c].mine) continue;
        let count = 0;
        this.forEachNeighbor(r, c, (nr, nc) => {
          if (state.board[nr][nc].mine) count++;
        });
        state.board[r][c].adjacent = count;
      }
    }
  },

  startTimer() {
    const state = MS.state;
    if (state.cheat) return;
    this.stopTimer();
    state.timeMs = 0;
    this.runTimer();
  },

  runTimer() {
    const state = MS.state;
    if (state.timerInterval || state.cheat) return;
    state.startedAt = performance.now() - state.timeMs;
    state.timerInterval = setInterval(() => {
      state.timeMs = performance.now() - state.startedAt;
      MS.ui.paintTimer();
    }, 50);
  },

  pauseTimer() {
    const state = MS.state;
    if (state.timerInterval && state.startedAt) {
      state.timeMs = performance.now() - state.startedAt;
    }
    if (state.timerInterval) {
      clearInterval(state.timerInterval);
      state.timerInterval = null;
    }
    state.startedAt = 0;
    if (MS.ui) MS.ui.paintTimer();
  },

  stopTimer() {
    this.pauseTimer();
  },

  handleClick(r, c) {
    const state = MS.state;
    if (state.suppressPointerAction || state.chordArmed) return;
    if (state.gameOver || state.gameWon) return;
    const cell = state.board[r][c];
    if (cell.revealed || cell.flagged) return;

    if (state.firstClick) {
      state.firstClick = false;
      this.placeMines(r, c);
      if (!state.cheat) this.startTimer();
    }
    state.clicks++;
    const el = MS.render.cellElAt(r, c);
    this.reveal(r, c);
    if (cell._mineHit) {
      MS.effects.burst(el, 'explode');
      MS.sound.play('explode');
    } else if (!state.gameWon) {
      MS.effects.burst(el, 'splash');
      MS.sound.play(cell.adjacent === 0 ? 'open' : 'reveal');
    } else {
      MS.effects.burst(el, 'splash');
    }
  },

  reveal(r, c) {
    const state = MS.state;
    const cell = state.board[r][c];
    if (cell.revealed || cell.flagged) return;
    cell.question = false;
    cell.revealed = true;

    if (cell.mine) {
      cell._mineHit = true;
      if (state.cheatEver) {
        MS.render.refreshBoard();
        return;
      }
      this.triggerGameOver(r, c);
      return;
    }
    if (cell.adjacent === 0) {
      this.forEachNeighbor(r, c, (nr, nc) => this.reveal(nr, nc));
    }
    this.checkWin();
    MS.render.refreshBoard();
  },

  handleRightClick(r, c) {
    const state = MS.state;
    if (state.suppressPointerAction || state.chordArmed) return;
    if (state.gameOver || state.gameWon) return;
    const cell = state.board[r][c];
    if (cell.revealed) return;
    if (!cell.flagged && !cell.question) {
      cell.flagged = true;
      state.flagsPlaced++;
    } else if (cell.flagged) {
      cell.flagged = false;
      cell.question = true;
      state.flagsPlaced--;
    } else {
      cell.question = false;
      MS.sound.play('unmark');
    }
    if (cell.flagged) MS.sound.play('flag');
    else if (cell.question) MS.sound.play('question');
    this.paintMines();
    MS.render.refreshBoard();
  },

  handleMiddleClick(r, c) {
    const state = MS.state;
    if (state.gameOver || state.gameWon) return;
    const cell = state.board[r][c];
    if (!cell.revealed || cell.adjacent === 0) return;

    let neighborFlags = 0;
    this.forEachNeighbor(r, c, (nr, nc) => {
      if (state.board[nr][nc].flagged) neighborFlags++;
    });
    if (neighborFlags !== cell.adjacent) return;

    state.clicks++;
    const center = MS.render.cellElAt(r, c);
    MS.effects.burst(center, 'splash');
    let hitMine = false;
    this.forEachNeighbor(r, c, (nr, nc) => {
      const neighbor = state.board[nr][nc];
      if (neighbor.revealed || neighbor.flagged) return;
      if (neighbor.mine) {
        hitMine = true;
        neighbor.revealed = true;
        neighbor._mineHit = true;
        MS.effects.burst(MS.render.cellElAt(nr, nc), 'explode');
      } else {
        this.reveal(nr, nc);
      }
    });
    if (hitMine) {
      MS.sound.play('explode');
      if (state.cheatEver) {
        MS.render.refreshBoard();
        return;
      }
      this.triggerGameOver(r, c);
      return;
    }
    if (!state.gameWon) MS.sound.play('chord');
    MS.render.refreshBoard();
  },

  triggerGameOver() {
    const state = MS.state;
    if (state.gameOver) return;
    state.gameWon = false;
    state.gameOver = true;
    this.stopTimer();
    MS.ui.paintFace();
    const ocean = state.theme === 'ocean';
    for (let r = 0; r < state.rows; r++) {
      for (let c = 0; c < state.cols; c++) {
        const cell = state.board[r][c];
        if (!cell.mine) continue;
        if (!ocean || !cell.flagged) cell.revealed = true;
      }
    }
    MS.render.refreshBoard();
    MS.sound.play('lose');
    MS.ui.showResult('lose');
  },

  checkWin() {
    const state = MS.state;
    if (state.cheatEver || state.gameWon || state.gameOver) return;
    for (let r = 0; r < state.rows; r++) {
      for (let c = 0; c < state.cols; c++) {
        const cell = state.board[r][c];
        if (!cell.mine && !cell.revealed) return;
      }
    }
    state.gameWon = true;
    this.stopTimer();
    MS.ui.paintFace();
    this.paintMines();
    for (let r = 0; r < state.rows; r++) {
      for (let c = 0; c < state.cols; c++) {
        const cell = state.board[r][c];
        if (cell.mine && !cell.flagged) {
          cell.flagged = true;
          cell.question = false;
        }
      }
    }
    state.flagsPlaced = state.totalMines;
    MS.render.refreshBoard();
    MS.sound.play('win');
    MS.ui.showResult('win');
  },

  compute3BV() {
    const state = MS.state;
    const seen = Array.from({ length: state.rows }, () => Array(state.cols).fill(false));
    let bv = 0;
    for (let r = 0; r < state.rows; r++) {
      for (let c = 0; c < state.cols; c++) {
        const cell = state.board[r][c];
        if (cell.mine || cell.adjacent !== 0 || seen[r][c]) continue;
        bv++;
        const stack = [[r, c]];
        seen[r][c] = true;
        while (stack.length) {
          const [cr, cc] = stack.pop();
          this.forEachNeighbor(cr, cc, (nr, nc) => {
            if (seen[nr][nc] || state.board[nr][nc].mine) return;
            seen[nr][nc] = true;
            if (state.board[nr][nc].adjacent === 0) stack.push([nr, nc]);
          });
        }
      }
    }
    for (let r = 0; r < state.rows; r++) {
      for (let c = 0; c < state.cols; c++) {
        const cell = state.board[r][c];
        if (!cell.mine && cell.adjacent !== 0 && !seen[r][c]) bv++;
      }
    }
    return bv;
  },

  progressPercent() {
    const state = MS.state;
    const safe = state.rows * state.cols - state.totalMines;
    if (safe <= 0) return 100;
    let opened = 0;
    for (let r = 0; r < state.rows; r++) {
      for (let c = 0; c < state.cols; c++) {
        const cell = state.board[r][c];
        if (!cell.mine && cell.revealed) opened++;
      }
    }
    return (opened / safe) * 100;
  }
};
