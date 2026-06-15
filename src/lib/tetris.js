// Pure tetris-layout helpers for the React side. These mirror the formulas in
// solver/shared.js (initTetrisLayout, updateTetrisLayoutProperties) but operate
// on plain cell objects instead of the module-global puzzle, so React state stays
// immutable and testable. shared.js keeps its own copies untouched.

export function makeDefaultTetris() {
  const t = [];
  for (let xx = 0; xx < 4; xx++) {
    t[xx] = [];
    for (let yy = 0; yy < 4; yy++) {
      t[xx][yy] = xx < 2 && yy < 2;
    }
  }
  return t;
}

// Mutates `cell` to set tetrisArea and tetrisBounds from cell.tetris.
// Formula is identical to shared.js updateTetrisLayoutProperties.
export function recomputeTetris(cell) {
  cell.tetrisArea = 0;
  cell.tetrisBounds = [Number.MAX_VALUE, Number.MAX_VALUE, 0, 0];
  for (let xx = 0; xx < 4; xx++) {
    for (let yy = 0; yy < 4; yy++) {
      cell.tetrisArea += +cell.tetris[xx][yy];
      if (cell.tetris[xx][yy]) {
        cell.tetrisBounds[0] = Math.min(cell.tetrisBounds[0], xx);
        cell.tetrisBounds[1] = Math.min(cell.tetrisBounds[1], yy);
        cell.tetrisBounds[2] = Math.max(cell.tetrisBounds[2], xx);
        cell.tetrisBounds[3] = Math.max(cell.tetrisBounds[3], yy);
      }
    }
  }
  return cell;
}

export function isLayoutEmpty(tetris) {
  for (let xx = 0; xx < 4; xx++) {
    for (let yy = 0; yy < 4; yy++) {
      if (tetris[xx][yy]) return false;
    }
  }
  return true;
}
