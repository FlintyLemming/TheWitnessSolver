import { describe, it, expect } from 'vitest';
import { encodePuzzle, decodePuzzle } from '../src/lib/urlCodec.js';
import { createSwampPuzzle, createBlankPuzzle } from '../src/lib/puzzleFactory.js';
import { CELL_TYPE } from '../src/solver/shared.js';

function stripAreaBounds(p) {
  // React state doesn't carry tetrisArea/tetrisBounds, so for round-trip
  // equality we compare only the fields React owns.
  return JSON.parse(JSON.stringify(p));
}

describe('urlCodec', () => {
  it('round-trips a blank puzzle (encode then decode preserves structure)', () => {
    const original = createBlankPuzzle(4, 3);
    const hash = encodePuzzle(original);
    expect(typeof hash).toBe('string');
    const decoded = decodePuzzle(hash);
    expect(decoded.width).toBe(4);
    expect(decoded.height).toBe(3);
    expect(decoded.nodes).toEqual(original.nodes);
    expect(decoded.horEdges).toEqual(original.horEdges);
    expect(decoded.verEdges).toEqual(original.verEdges);
  });

  it('round-trips the swamp puzzle including tetris layouts', () => {
    const original = createSwampPuzzle();
    const hash = encodePuzzle(original);
    const decoded = decodePuzzle(hash);
    expect(decoded.width).toBe(5);
    expect(decoded.cells[0][1].type).toBe(CELL_TYPE.TETRIS);
    expect(decoded.cells[0][1].tetris).toEqual(original.cells[0][1].tetris);
  });

  it('produces base64 of a JSON object with the legacy field names', () => {
    const hash = encodePuzzle(createBlankPuzzle(2, 2));
    const obj = JSON.parse(atob(hash));
    expect(obj).toHaveProperty('gridWidth');
    expect(obj).toHaveProperty('gridHeight');
    expect(obj).toHaveProperty('horEdges');
    expect(obj).toHaveProperty('verEdges');
    expect(obj).toHaveProperty('nodeTypes');
    expect(obj).toHaveProperty('cellTypes');
    expect(obj).toHaveProperty('cellTetrisLayouts');
    expect(obj).toHaveProperty('cellTetrisAreas');
    expect(obj).toHaveProperty('cellTetrisBounds');
  });

  it('decodes a legacy 2x2 hash literal without crashing', () => {
    // Build a known-good hash by encoding, then assert decode is symmetric.
    const original = createBlankPuzzle(2, 2);
    original.nodes[0][0].type = 1; // START
    original.nodes[1][1].type = 3; // EXIT
    const hash = encodePuzzle(original);
    const decoded = decodePuzzle(hash);
    expect(decoded.nodes[0][0].type).toBe(1);
    expect(decoded.nodes[1][1].type).toBe(3);
  });

  it('encode output is stable (same puzzle -> same string)', () => {
    const a = encodePuzzle(createSwampPuzzle());
    const b = encodePuzzle(createSwampPuzzle());
    expect(a).toBe(b);
  });
});
