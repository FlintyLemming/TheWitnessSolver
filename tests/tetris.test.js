import { describe, it, expect } from 'vitest';
import { makeDefaultTetris, recomputeTetris, isLayoutEmpty } from '../src/lib/tetris.js';

describe('tetris helpers', () => {
  it('makeDefaultTetris is a 4x4 with the top-left 2x2 filled', () => {
    const t = makeDefaultTetris();
    expect(t.length).toBe(4);
    expect(t[0].length).toBe(4);
    expect(t[0][0]).toBe(true);
    expect(t[1][1]).toBe(true);
    expect(t[2][2]).toBe(false);
  });

  it('recomputeTetris sets area and bounds matching shared.js formula', () => {
    const cell = { tetris: makeDefaultTetris() };
    recomputeTetris(cell);
    // top-left 2x2 filled => area 4, bounds [0,0,1,1]
    expect(cell.tetrisArea).toBe(4);
    expect(cell.tetrisBounds).toEqual([0, 0, 1, 1]);
  });

  it('recomputeTetris handles a horizontal bar (row 0 all filled)', () => {
    const cell = { tetris: makeDefaultTetris() };
    for (let xx = 0; xx < 4; xx++) {
      for (let yy = 0; yy < 4; yy++) cell.tetris[xx][yy] = false;
    }
    for (let xx = 0; xx < 4; xx++) cell.tetris[xx][0] = true;
    recomputeTetris(cell);
    expect(cell.tetrisArea).toBe(4);
    expect(cell.tetrisBounds).toEqual([0, 0, 3, 0]);
  });

  it('isLayoutEmpty detects all-off layout', () => {
    const cell = { tetris: makeDefaultTetris() };
    expect(isLayoutEmpty(cell.tetris)).toBe(false);
    for (let xx = 0; xx < 4; xx++) {
      for (let yy = 0; yy < 4; yy++) cell.tetris[xx][yy] = false;
    }
    expect(isLayoutEmpty(cell.tetris)).toBe(true);
  });
});
