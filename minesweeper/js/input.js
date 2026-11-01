window.MS = window.MS || {};

MS.input = {
  bind() {
    const boardEl = document.getElementById('board');
    boardEl.addEventListener('dblclick', (e) => {
      const cellEl = e.target.closest('.cell');
      if (!cellEl) return;
      MS.game.handleMiddleClick(parseInt(cellEl.dataset.r, 10), parseInt(cellEl.dataset.c, 10));
    });

    document.addEventListener('mousedown', (e) => {
      const state = MS.state;
      if (e.button === 0) state.heldButtons |= 1;
      else if (e.button === 2) state.heldButtons |= 2;
      else return;
      const target = e.target;
      const cellEl = target && target.closest ? target.closest('.cell') : null;
      const onCell = !!(cellEl && boardEl.contains(cellEl));
      if ((state.heldButtons & 3) === 3 && onCell) state.chordArmed = true;
      else state.chordArmed = false;
    });

    document.addEventListener('mouseup', (e) => {
      const state = MS.state;
      if (e.button === 0) state.heldButtons &= ~1;
      else if (e.button === 2) state.heldButtons &= ~2;
      if (!state.chordArmed || (state.heldButtons & 3) !== 0) return;
      state.chordArmed = false;
      const target = e.target;
      const cellEl = target && target.closest ? target.closest('.cell') : null;
      if (!cellEl || !boardEl.contains(cellEl)) return;
      state.suppressPointerAction = true;
      setTimeout(() => { state.suppressPointerAction = false; }, 0);
      MS.game.handleMiddleClick(parseInt(cellEl.dataset.r, 10), parseInt(cellEl.dataset.c, 10));
    });

    window.addEventListener('blur', () => {
      MS.state.heldButtons = 0;
      MS.state.chordArmed = false;
    });

    window.addEventListener('resize', () => MS.effects.resize());
  }
};
