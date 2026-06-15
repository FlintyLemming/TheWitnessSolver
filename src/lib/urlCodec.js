import { recomputeTetris } from './tetris.js';

// Ported verbatim from ui.js updateURL/parseFromURL. The on-the-wire format
// (base64 of a JSON object with these exact field names) is UNCHANGED, so old
// links keep working and new links open in the old version.

function deepMap(arr, fn) {
  if (typeof arr === 'object' && arr.length !== undefined) {
    return arr.slice().map((e) => deepMap(e, fn));
  }
  return fn(arr);
}

const num2bool = (n) => !!n;
const bool2num = (b) => +b;

export function encodePuzzle(p) {
  // Compute tetris area/bounds on the fly (React state doesn't store them).
  const cellsWithProps = deepMap(p.cells, (c) => {
    const copy = { ...c };
    recomputeTetris(copy);
    return copy;
  });

  const encoding = {
    gridWidth: p.width,
    gridHeight: p.height,
    horEdges: deepMap(p.horEdges, (n) => n),
    verEdges: deepMap(p.verEdges, (n) => n),
    nodeTypes: deepMap(p.nodes, (n) => n.type),
    cellTypes: deepMap(cellsWithProps, (c) => ({ type: c.type, color: c.color })),
    cellTetrisLayouts: deepMap(deepMap(cellsWithProps, (c) => c.tetris), bool2num),
    cellTetrisAreas: deepMap(cellsWithProps, (c) => c.tetrisArea),
    cellTetrisBounds: deepMap(cellsWithProps, (c) => c.tetrisBounds),
  };

  return btoa(JSON.stringify(encoding));
}

export function decodePuzzle(hash) {
  const encoding = JSON.parse(atob(hash));
  const puzzle = { width: encoding.gridWidth, height: encoding.gridHeight };

  puzzle.horEdges = deepMap(encoding.horEdges, (t) => t);
  puzzle.verEdges = deepMap(encoding.verEdges, (t) => t);
  puzzle.nodes = deepMap(encoding.nodeTypes, (t) => ({ type: t }));
  puzzle.cells = deepMap(encoding.cellTypes, (t) => ({ ...t }));

  const layouts = deepMap(encoding.cellTetrisLayouts, num2bool);
  for (let x = 0; x < puzzle.width - 1; x++) {
    for (let y = 0; y < puzzle.height - 1; y++) {
      puzzle.cells[x][y].tetris = layouts[x][y];
      puzzle.cells[x][y].tetrisArea = encoding.cellTetrisAreas[x][y];
      puzzle.cells[x][y].tetrisBounds = encoding.cellTetrisBounds[x][y];
    }
  }

  return puzzle;
}
