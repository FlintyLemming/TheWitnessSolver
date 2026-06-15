import { describe, it, expect } from 'vitest';
import { calculateMetrics, nodeX, nodeY } from '../src/lib/geometry.js';

describe('geometry', () => {
  it('computeMetrics matches original ui.calculateMetrics for 5x5', () => {
    const m = calculateMetrics(5, 5);
    // Original: radius = 88 / max(6, max(5,5)) = 88/6
    expect(m.radius).toBeCloseTo(88 / 6, 5);
    // spacing = 800 / (max(5,5)+1) = 800/6
    expect(m.spacing).toBeCloseTo(800 / 6, 5);
    // horPadding = (800 - spacing*(5-1))/2
    expect(m.horPadding).toBeCloseTo((800 - (800 / 6) * 4) / 2, 5);
    expect(m.verPadding).toBeCloseTo((800 - (800 / 6) * 4) / 2, 5);
  });

  it('nodeX/nodeY use padding + spacing*index', () => {
    const m = calculateMetrics(5, 5);
    expect(nodeX(m, 0)).toBeCloseTo(m.horPadding, 5);
    expect(nodeX(m, 2)).toBeCloseTo(m.horPadding + m.spacing * 2, 5);
    expect(nodeY(m, 3)).toBeCloseTo(m.verPadding + m.spacing * 3, 5);
  });

  it('handles a 2x2 puzzle (uses max(6,...) floor)', () => {
    const m = calculateMetrics(2, 2);
    expect(m.radius).toBeCloseTo(88 / 6, 5);
    expect(m.spacing).toBeCloseTo(800 / 3, 5);
  });
});
