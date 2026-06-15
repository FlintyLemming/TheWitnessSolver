import { describe, it, expect } from 'vitest';
import { createBlankPuzzle, createSwampPuzzle } from '../src/lib/puzzleFactory.js';
import { NODE_TYPE, EDGE_TYPE, CELL_TYPE } from '../src/solver/shared.js';

describe('puzzleFactory', () => {
  it('createBlankPuzzle builds nodes/edges/cells with default values', () => {
    const p = createBlankPuzzle(3, 3);
    expect(p.width).toBe(3);
    expect(p.height).toBe(3);
    expect(p.nodes.length).toBe(3);
    expect(p.nodes[0][0].type).toBe(NODE_TYPE.NORMAL);
    expect(p.horEdges.length).toBe(2); // width-1
    expect(p.horEdges[0][0]).toBe(EDGE_TYPE.NORMAL);
    expect(p.verEdges[0].length).toBe(2); // height-1
    expect(p.cells.length).toBe(2);
    expect(p.cells[0][0].type).toBe(CELL_TYPE.NONE);
    expect(p.cells[0][0].tetris.length).toBe(4);
  });

  it('createSwampPuzzle matches the original sample puzzle', () => {
    const p = createSwampPuzzle();
    expect(p.width).toBe(5);
    expect(p.height).toBe(5);
    expect(p.verEdges[2][1]).toBe(EDGE_TYPE.OBSTACLE);
    expect(p.nodes[0][4].type).toBe(NODE_TYPE.START);
    expect(p.nodes[4][0].type).toBe(NODE_TYPE.EXIT);
    expect(p.cells[0][1].type).toBe(CELL_TYPE.TETRIS);
    expect(p.cells[1][3].type).toBe(CELL_TYPE.TETRIS);
    expect(p.cells[2][3].type).toBe(CELL_TYPE.TETRIS);
    // cell (0,1) is a horizontal 4-block bar in row 0
    for (let xx = 0; xx < 4; xx++) {
      expect(p.cells[0][1].tetris[xx][0]).toBe(true);
    }
    // tetris area/bounds recomputed
    expect(p.cells[0][1].tetrisArea).toBe(4);
  });
});
