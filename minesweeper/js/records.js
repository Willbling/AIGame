window.MS = window.MS || {};

MS.records = {
  storageKey: 'minesweeper-best-times-v1',

  idFor(difficulty) {
    if (difficulty !== 'custom') return difficulty;
    const d = MS.DIFFICULTY.custom;
    return `custom-${d.cols}x${d.rows}x${d.mines}`;
  },

  readAll() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) : {};
    } catch (err) {
      return {};
    }
  },

  writeAll(data) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (err) {
      /* 隐私模式或存储被禁用时，纪录只留在当前这一局 */
    }
  },

  get(difficulty) {
    const value = this.readAll()[this.idFor(difficulty)];
    return typeof value === 'number' ? value : null;
  },

  consider(difficulty, timeMs) {
    const id = this.idFor(difficulty);
    const all = this.readAll();
    const prev = typeof all[id] === 'number' ? all[id] : null;
    if (prev !== null && timeMs >= prev) return { best: prev, isNew: false };
    all[id] = timeMs;
    this.writeAll(all);
    return { best: timeMs, isNew: true };
  },

  reset(difficulty) {
    const all = this.readAll();
    delete all[this.idFor(difficulty)];
    this.writeAll(all);
  }
};
