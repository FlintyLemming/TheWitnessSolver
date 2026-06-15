import { describe, it, expect } from 'vitest';
import { computeHighlights } from '../src/lib/solution.js';

describe('computeHighlights', () => {
  it('highlights nodes and edges along a straight horizontal path', () => {
    const path = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }];
    const h = computeHighlights(path, 1);
    expect(h.nodes).toEqual(new Set(['0,0', '1,0', '2,0']));
    // next.x>cur.x => hor edge at (cur.x,cur.y)
    expect(h.horEdges).toEqual(new Set(['0,0', '1,0']));
    expect(h.verEdges.size).toBe(0);
  });

  it('detects vertical edges (next.y > cur.y)', () => {
    const path = [{ x: 0, y: 0 }, { x: 0, y: 1 }];
    const h = computeHighlights(path, 1);
    expect(h.verEdges).toEqual(new Set(['0,0']));
    expect(h.horEdges.size).toBe(0);
  });

  it('detects reverse horizontal edge (next.x < cur.x) at next coords', () => {
    const path = [{ x: 2, y: 0 }, { x: 1, y: 0 }];
    const h = computeHighlights(path, 1);
    expect(h.horEdges).toEqual(new Set(['1,0']));
  });

  it('detects reverse vertical edge (next.y < cur.y) at next coords', () => {
    const path = [{ x: 0, y: 2 }, { x: 0, y: 1 }];
    const h = computeHighlights(path, 1);
    expect(h.verEdges).toEqual(new Set(['0,1']));
  });

  it('respects fraction by truncating the path', () => {
    const path = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }];
    const h = computeHighlights(path, 0.5); // ceil(4*0.5)=2
    expect(h.nodes).toEqual(new Set(['0,0', '1,0']));
    expect(h.horEdges).toEqual(new Set(['0,0']));
  });

  it('returns empty sets for null/empty path', () => {
    const h = computeHighlights(null, 1);
    expect(h.nodes.size).toBe(0);
    expect(h.horEdges.size).toBe(0);
    expect(h.verEdges.size).toBe(0);
  });
});
