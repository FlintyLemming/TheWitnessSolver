import { describe, it, expect } from 'vitest';
import { puzzleReducer, makeSolution } from '../src/hooks/usePuzzle.js';
import { createBlankPuzzle } from '../src/lib/puzzleFactory.js';
import { NODE_TYPE } from '../src/solver/shared.js';

function init() {
  return puzzleReducer(undefined, { type: 'INIT', puzzle: createBlankPuzzle(3, 3) });
}

describe('puzzleReducer', () => {
  it('INIT sets puzzle and empty stacks', () => {
    const s = init();
    expect(s.puzzle.width).toBe(3);
    expect(s.undo).toEqual([]);
    expect(s.redo).toEqual([]);
    expect(s.solution.viewing).toBe(false);
  });

  it('EDIT pushes undo snapshot, applies change, clears redo and solution', () => {
    let s = init();
    s = puzzleReducer(s, {
      type: 'EDIT',
      next: (p) => {
        const q = JSON.parse(JSON.stringify(p));
        q.nodes[0][0].type = NODE_TYPE.START;
        return q;
      },
    });
    expect(s.puzzle.nodes[0][0].type).toBe(NODE_TYPE.START);
    expect(s.undo).toHaveLength(1);
    expect(s.redo).toEqual([]);
  });

  it('UNDO restores previous puzzle and pushes redo', () => {
    let s = init();
    s = puzzleReducer(s, { type: 'EDIT', next: (p) => { const q = JSON.parse(JSON.stringify(p)); q.nodes[0][0].type = NODE_TYPE.START; return q; } });
    s = puzzleReducer(s, { type: 'UNDO' });
    expect(s.puzzle.nodes[0][0].type).toBe(NODE_TYPE.NORMAL);
    expect(s.undo).toHaveLength(0);
    expect(s.redo).toHaveLength(1);
  });

  it('REDO replays the edit', () => {
    let s = init();
    s = puzzleReducer(s, { type: 'EDIT', next: (p) => { const q = JSON.parse(JSON.stringify(p)); q.nodes[0][0].type = NODE_TYPE.START; return q; } });
    s = puzzleReducer(s, { type: 'UNDO' });
    s = puzzleReducer(s, { type: 'REDO' });
    expect(s.puzzle.nodes[0][0].type).toBe(NODE_TYPE.START);
    expect(s.redo).toHaveLength(0);
  });

  it('UNDO with empty stack is a no-op', () => {
    const s = init();
    const s2 = puzzleReducer(s, { type: 'UNDO' });
    expect(s2).toBe(s);
  });

  it('SOLVE pushes snapshot and enters viewing state', () => {
    let s = init();
    const path = [{ x: 0, y: 0 }, { x: 1, y: 0 }];
    s = puzzleReducer(s, { type: 'SOLVE', path, fraction: 1 });
    expect(s.solution.viewing).toBe(true);
    expect(s.solution.path).toEqual(path);
    expect(s.undo).toHaveLength(1);
  });

  it('CLEAR exits viewing and is undoable', () => {
    let s = init();
    s = puzzleReducer(s, { type: 'SOLVE', path: [{ x: 0, y: 0 }], fraction: 1 });
    s = puzzleReducer(s, { type: 'CLEAR' });
    expect(s.solution.viewing).toBe(false);
    expect(s.solution.path).toBeNull();
    s = puzzleReducer(s, { type: 'UNDO' });
    expect(s.solution.viewing).toBe(true);
  });

  it('RESIZE pushes snapshot and replaces puzzle', () => {
    let s = init();
    s = puzzleReducer(s, { type: 'RESIZE', puzzle: createBlankPuzzle(4, 4) });
    expect(s.puzzle.width).toBe(4);
    expect(s.undo).toHaveLength(1);
    expect(s.solution.viewing).toBe(false);
  });

  it('undo stack is capped at UNDO_STACK_LIMIT', () => {
    let s = init();
    for (let i = 0; i < 105; i++) {
      s = puzzleReducer(s, { type: 'EDIT', next: (p) => JSON.parse(JSON.stringify(p)) });
    }
    expect(s.undo.length).toBeLessThanOrEqual(100);
  });
});
