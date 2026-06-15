import { puzzle, resetPools } from '../solver/shared.js';
import { findSolution } from '../solver/solver.js';
import { recomputeTetris } from './tetris.js';

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// Bridge: lend React state to the solver's global puzzle, solve, return a plain
// path (array of {x,y}) or null. The input puzzle is never mutated.
export function solvePuzzle(state) {
  puzzle.width = state.width;
  puzzle.height = state.height;
  puzzle.nodes = deepClone(state.nodes);
  puzzle.horEdges = deepClone(state.horEdges);
  puzzle.verEdges = deepClone(state.verEdges);
  puzzle.cells = deepClone(state.cells);

  // Ensure tetrisArea/tetrisBounds are present on every cell (solver reads them).
  for (let x = 0; x < puzzle.width - 1; x++) {
    for (let y = 0; y < puzzle.height - 1; y++) {
      recomputeTetris(puzzle.cells[x][y]);
    }
  }

  resetPools();
  const path = findSolution();
  return path ? path.map((p) => ({ x: p.x, y: p.y })) : null;
}
