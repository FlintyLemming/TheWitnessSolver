import { describe, it, expect } from 'vitest';
import { puzzle, resetPools, initPuzzle, NODE_TYPE, CELL_TYPE } from '../src/solver/shared.js';
import { findSolution } from '../src/solver/solver.js';

describe('solver module wrapping', () => {
  it('exports the puzzle object and enums', () => {
    expect(puzzle).toBeDefined();
    expect(NODE_TYPE.EXIT).toBe(3);
    expect(CELL_TYPE.TETRIS).toBe(2);
  });

  it('can solve a trivial 2x2 puzzle with start and exit', () => {
    initPuzzle(puzzle, 2, 2);
    puzzle.nodes[0][0].type = NODE_TYPE.START;
    puzzle.nodes[1][1].type = NODE_TYPE.EXIT;
    resetPools();
    const path = findSolution();
    expect(path).not.toBe(false);
    expect(path[0]).toMatchObject({ x: 0, y: 0 });
    expect(path[path.length - 1]).toMatchObject({ x: 1, y: 1 });
  });
});
