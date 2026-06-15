import { describe, it, expect } from 'vitest';
import { solvePuzzle } from '../src/lib/solverBridge.js';
import { createSwampPuzzle, createBlankPuzzle } from '../src/lib/puzzleFactory.js';

describe('solverBridge', () => {
  it('solves the swamp sample and returns a path from start to exit', () => {
    const path = solvePuzzle(createSwampPuzzle());
    expect(path).not.toBeNull();
    expect(path[0]).toMatchObject({ x: 0, y: 4 });
    expect(path[path.length - 1]).toMatchObject({ x: 4, y: 0 });
  });

  it('returns null when no exit is reachable (no exit node)', () => {
    const p = createBlankPuzzle(3, 3);
    // start but no exit
    p.nodes[0][0].type = 1; // START
    expect(solvePuzzle(p)).toBeNull();
  });

  it('returns null when start and exit are disconnected by obstacles', () => {
    const p = createBlankPuzzle(2, 2);
    p.nodes[0][0].type = 1; // START
    p.nodes[1][1].type = 3; // EXIT
    // block both edges out of (0,0)
    p.horEdges[0][0] = 2; // OBSTACLE
    p.verEdges[0][0] = 2; // OBSTACLE
    expect(solvePuzzle(p)).toBeNull();
  });

  it('does not mutate the input puzzle', () => {
    const p = createSwampPuzzle();
    const snapshot = JSON.parse(JSON.stringify(p));
    solvePuzzle(p);
    expect(JSON.parse(JSON.stringify(p))).toEqual(snapshot);
  });
});
