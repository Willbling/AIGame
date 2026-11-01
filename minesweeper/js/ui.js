window.MS = window.MS || {};

MS.ui = {
  bind() {
    document.getElementById('faceBtn').addEventListener('click', () => MS.game.newGame());
    document.querySelectorAll('.menu').forEach((menu) => {
      const btn = menu.querySelector('.menu-btn');
      const list = menu.querySelector('.menu-list');
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const willOpen = list.hidden;
        this.closeMenus();
        if (willOpen) {
          list.hidden = false;
          btn.setAttribute('aria-expanded', 'true');
        }
      });
      list.addEventListener('click', (e) => {
        const item = e.target.closest('[data-difficulty], [data-theme-option]');
        if (!item) return;
        this.closeMenus();
        if (item.dataset.difficulty) this.selectDifficulty(item.dataset.difficulty);
        else this.setTheme(item.dataset.themeOption);
      });
    });
    document.addEventListener('click', () => this.closeMenus());
    document.getElementById('customForm').addEventListener('submit', (e) => this.applyCustom(e));
    document.getElementById('customCancel').addEventListener('click', () => this.closeCustom());
    document.getElementById('customModal').addEventListener('click', (e) => {
      if (e.target.id === 'customModal') this.closeCustom();
    });
    document.getElementById('resultClose').addEventListener('click', () => this.hideResult());
    document.getElementById('resultStay').addEventListener('click', () => this.hideResult());
    document.getElementById('resultRestart').addEventListener('click', () => MS.game.newGame());
    document.getElementById('resultReset').addEventListener('click', () => this.resetRecord());
    document.getElementById('resetRecordBtn').addEventListener('click', () => this.resetRecord());
    document.getElementById('cheatBtn').addEventListener('click', () => this.toggleCheat());
    document.getElementById('soundBtn').addEventListener('click', () => this.toggleSound());
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (!document.getElementById('customModal').hidden) this.closeCustom();
      else if (!document.getElementById('resultModal').hidden) this.hideResult();
      else this.closeMenus();
    });
  },

  sync() {
    const state = MS.state;
    document.body.dataset.theme = state.theme;
    const customItem = document.getElementById('customMenuItem');
    if (state.difficulty === 'custom') {
      const d = MS.DIFFICULTY.custom;
      customItem.textContent = `自定义 (${d.cols}×${d.rows}, ${d.mines}雷)`;
    } else {
      customItem.textContent = '自定义';
    }
    document.querySelectorAll('[data-difficulty]').forEach((btn) => {
      btn.setAttribute('aria-current', btn.dataset.difficulty === state.difficulty ? 'true' : 'false');
    });
    document.querySelectorAll('[data-theme-option]').forEach((btn) => {
      btn.setAttribute('aria-current', btn.dataset.themeOption === state.theme ? 'true' : 'false');
    });
    this.paintTimer();
    this.paintBest();
    this.paintCheat();
    this.paintFace();
    this.paintSound();
    MS.game.paintMines();
  },

  paintSound() {
    const btn = document.getElementById('soundBtn');
    const on = MS.sound.enabled;
    btn.classList.toggle('is-on', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.textContent = on ? '声音开' : '声音关';
  },

  toggleSound() {
    MS.sound.toggle();
    this.paintSound();
  },

  paintCheat() {
    const btn = document.getElementById('cheatBtn');
    const on = MS.state.cheat;
    btn.classList.toggle('is-on', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    document.getElementById('cheatNote').hidden = !MS.state.cheatEver;
    this.paintFace();
  },

  cheatFaceSvg: '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="40" r="18" fill="#ffe14a"/><path d="M14 33c1-14 8-20 18-20s17 6 18 20" fill="#55643a"/><path d="M8 33h48c-1 6-10 9-24 9S9 39 8 33z" fill="#3d4a2b"/><rect x="28" y="16" width="8" height="3.5" rx="1" fill="#d4b46a"/><rect x="17" y="35" width="12" height="7" rx="1.5" fill="#1c1c1c"/><rect x="35" y="35" width="12" height="7" rx="1.5" fill="#1c1c1c"/><rect x="28" y="37" width="8" height="2.5" fill="#1c1c1c"/><path d="M24 48c2.6 3.4 13.4 3.4 16 0" fill="none" stroke="#6a4a10" stroke-width="2" stroke-linecap="round"/><g transform="rotate(18 46 49)"><rect x="40" y="47" width="14" height="3" rx="1" fill="#f6f1e6"/><rect x="53" y="47" width="3.2" height="3" rx="0.6" fill="#ff6428"/></g></svg>',

  paintFace() {
    const btn = document.getElementById('faceBtn');
    const state = MS.state;
    if (state.cheat) {
      btn.classList.add('cheat-face');
      btn.innerHTML = this.cheatFaceSvg;
      return;
    }
    btn.classList.remove('cheat-face');
    btn.textContent = state.gameWon ? '😎' : state.gameOver ? '😵' : '🙂';
  },

  toggleCheat() {
    const state = MS.state;
    state.cheat = !state.cheat;
    if (state.cheat) {
      state.cheatEver = true;
      MS.game.pauseTimer();
    } else if (!state.firstClick && !state.gameOver && !state.gameWon) {
      MS.game.runTimer();
    }
    this.paintCheat();
    MS.render.refreshBoard();
  },

  paintTimer() {
    const el = document.getElementById('timer');
    const ms = MS.state.timeMs;
    if (MS.state.theme === 'ocean') {
      const total = Math.floor(ms / 1000);
      const h = Math.floor(total / 3600);
      const m = Math.floor(total / 60) % 60;
      const s = total % 60;
      el.textContent = `${this.pad2(h)}:${this.pad2(m)}:${this.pad2(s)}`;
      return;
    }
    el.textContent = String(Math.min(999, Math.floor(ms / 1000))).padStart(3, '0');
  },

  paintBest() {
    const best = MS.records.get(MS.state.difficulty);
    document.getElementById('bestLabel').textContent = best === null ? '最快 —' : `最快 ${this.formatPrecise(best)}`;
  },

  pad2(n) {
    return String(n).padStart(2, '0');
  },

  formatPrecise(ms) {
    const total = Math.max(0, Math.round(ms));
    const m = Math.floor(total / 60000);
    const s = Math.floor(total / 1000) % 60;
    const milli = total % 1000;
    return `${this.pad2(m)}:${this.pad2(s)}.${String(milli).padStart(3, '0')}`;
  },

  closeMenus() {
    document.querySelectorAll('.menu-list').forEach((list) => { list.hidden = true; });
    document.querySelectorAll('.menu-btn').forEach((btn) => btn.setAttribute('aria-expanded', 'false'));
  },

  selectDifficulty(name) {
    if (name === 'custom') {
      this.openCustom();
      return;
    }
    if (name === MS.state.difficulty) return;
    MS.state.difficulty = name;
    MS.game.newGame();
  },

  setTheme(name) {
    MS.state.theme = name;
    this.sync();
    MS.render.renderBoard();
  },

  openCustom() {
    const current = MS.DIFFICULTY[MS.state.difficulty];
    document.getElementById('customCols').value = current.cols;
    document.getElementById('customRows').value = current.rows;
    document.getElementById('customMines').value = current.mines;
    document.getElementById('customError').textContent = '';
    document.getElementById('customModal').hidden = false;
    document.getElementById('customCols').focus();
  },

  closeCustom() {
    document.getElementById('customModal').hidden = true;
    this.sync();
  },

  applyCustom(e) {
    e.preventDefault();
    const cols = parseInt(document.getElementById('customCols').value, 10);
    const customRows = parseInt(document.getElementById('customRows').value, 10);
    const mines = parseInt(document.getElementById('customMines').value, 10);
    const error = document.getElementById('customError');
    if (!Number.isInteger(cols) || cols < 9 || cols > 30) {
      error.textContent = '宽度需要在 9 到 30 之间。';
      return;
    }
    if (!Number.isInteger(customRows) || customRows < 9 || customRows > 24) {
      error.textContent = '高度需要在 9 到 24 之间。';
      return;
    }
    const maxMines = customRows * cols - 9;
    if (!Number.isInteger(mines) || mines < 10 || mines > maxMines) {
      error.textContent = `雷数需要在 10 到 ${maxMines} 之间。`;
      return;
    }
    MS.DIFFICULTY.custom = { rows: customRows, cols, mines };
    MS.state.difficulty = 'custom';
    document.getElementById('customModal').hidden = true;
    MS.game.newGame();
  },

  showResult(kind) {
    const state = MS.state;
    const win = kind === 'win';
    let record = MS.records.get(state.difficulty);
    let isNew = false;
    if (win) {
      const saved = MS.records.consider(state.difficulty, state.timeMs);
      record = saved.best;
      isNew = saved.isNew;
    }
    document.querySelector('.result-face').classList.toggle('is-win', win);
    document.getElementById('resultMouth').setAttribute('d', win ? 'M28 46 Q40 58 52 46' : 'M28 54 Q40 44 52 54');
    document.getElementById('resultLevel').textContent = MS.LEVEL_NAME[state.difficulty];
    document.getElementById('resultTime').textContent = this.formatPrecise(state.timeMs);
    document.getElementById('resultProgress').textContent = `游戏进度：${MS.game.progressPercent().toFixed(2)}%`;
    const recordEl = document.getElementById('resultRecord');
    recordEl.textContent = record === null ? '历史记录 —' : `历史记录 ${this.formatPrecise(record)}`;
    recordEl.classList.toggle('is-new', isNew);
    if (isNew) recordEl.textContent += '  新纪录';

    const bv = state.firstClick ? 0 : MS.game.compute3BV();
    const seconds = Math.max(state.timeMs / 1000, 0.001);
    const rate = state.timeMs > 0 && bv > 0 ? (bv / seconds).toFixed(2) : '0.00';
    document.getElementById('resultStats').innerHTML = `
      <div>3BV<b>${bv}</b></div>
      <div>点击<b>${state.clicks}</b></div>
      <div>3BV/s<b>${rate}</b></div>
    `;
    const modal = document.getElementById('resultModal');
    modal.classList.remove('is-open');
    modal.hidden = true;
    clearTimeout(this._resultTimer);
    this._resultTimer = setTimeout(() => {
      modal.hidden = false;
      void modal.offsetWidth;
      modal.classList.add('is-open');
    }, 460);
    this.paintBest();
  },

  hideResult() {
    clearTimeout(this._resultTimer);
    const modal = document.getElementById('resultModal');
    modal.classList.remove('is-open');
    modal.hidden = true;
  },

  resetRecord() {
    const name = MS.LEVEL_NAME[MS.state.difficulty];
    if (!window.confirm(`重置${name}的最快纪录？`)) return;
    MS.records.reset(MS.state.difficulty);
    this.paintBest();
    const recordEl = document.getElementById('resultRecord');
    if (!document.getElementById('resultModal').hidden) {
      recordEl.textContent = '历史记录 —';
      recordEl.classList.remove('is-new');
    }
  }
};
