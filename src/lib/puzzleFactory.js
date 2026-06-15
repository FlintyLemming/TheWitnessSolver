import {
  NODE_TYPE, EDGE_TYPE, CELL_TYPE, CELL_COLOR,
} from '../solver/shared.js';
import { makeDefaultTetris, recomputeTetris } from './tetris.js';

function create2DArray(w, h) {
  const arr = [];
  for (let x = 0; x < w; x++) {
    arr[x] = new Array(h);
  }
  return arr;
}

// Mirrors shared.js initNodes/initEdges/initCells (model only — no UI calls).
export function createBlankPuzzle(width, height) {
  const puzzle = { width, height };

  puzzle.nodes = create2DArray(width, height);
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      puzzle.nodes[x][y] = { type: NODE_TYPE.NORMAL };
    }
  }

  puzzle.horEdges = create2DArray(width - 1, height);
  for (let x = 0; x < width - 1; x++) {
    for (let y = 0; y < height; y++) {
      puzzle.horEdges[x][y] = EDGE_TYPE.NORMAL;
    }
  }

  puzzle.verEdges = create2DArray(width, height - 1);
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height - 1; y++) {
      puzzle.verEdges[x][y] = EDGE_TYPE.NORMAL;
    }
  }

  puzzle.cells = create2DArray(width - 1, height - 1);
  for (let x = 0; x < width - 1; x++) {
    for (let y = 0; y < height - 1; y++) {
      const cell = { type: CELL_TYPE.NONE, color: CELL_COLOR.BLACK };
      cell.tetris = makeDefaultTetris();
      recomputeTetris(cell);
      puzzle.cells[x][y] = cell;
    }
  }

  return puzzle;
}

// The swamp sample puzzle from the original ui.js initialize().
export function createSwampPuzzle() {
  const puzzle = createBlankPuzzle(5, 5);

  puzzle.verEdges[2][1] = EDGE_TYPE.OBSTACLE;
  puzzle.nodes[0][4].type = NODE_TYPE.START;
  puzzle.nodes[4][0].type = NODE_TYPE.EXIT;
  puzzle.cells[0][1].type = CELL_TYPE.TETRIS;
  puzzle.cells[1][3].type = CELL_TYPE.TETRIS;
  puzzle.cells[2][3].type = CELL_TYPE.TETRIS;

  const tetrisCells = [[0, 1], [1, 3], [2, 3]];
  for (const [cx, cy] of tetrisCells) {
    for (let xx = 0; xx < 4; xx++) {
      for (let yy = 0; yy < 4; yy++) {
        puzzle.cells[cx][cy].tetris[xx][yy] = false;
      }
    }
  }
  for (let xx = 0; xx < 4; xx++) puzzle.cells[0][1].tetris[xx][0] = true;
  for (let yy = 0; yy < 3; yy++) {
    puzzle.cells[1][3].tetris[0][yy] = true;
    puzzle.cells[2][3].tetris[0][yy] = true;
  }

  for (const [cx, cy] of tetrisCells) recomputeTetris(puzzle.cells[cx][cy]);

  return puzzle;
}
