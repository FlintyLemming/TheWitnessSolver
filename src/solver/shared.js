// Types
export const NODE_TYPE = {
    'NORMAL': 0,
    'START': 1,
    'REQUIRED': 2,
    'EXIT': 3,

    // Used in UI to loop around
    'LAST': 3
};

export const EDGE_TYPE = {
    'NORMAL': 0,
    'REQUIRED': 1,
    'OBSTACLE': 2,

    // Used in UI to loop around
    'LAST': 2
};

export const CELL_TYPE = {
    'NONE': 0,
    'SQUARE': 1,
    'TETRIS': 2,
    'TETRIS_ROTATED': 3,
    'SUN': 4,
    'CANCELLATION': 5,
    'TETRIS_HOLLOW': 6,

    // Used in UI to loop around
    'LAST': 6
};

export const BACKGROUND_COLOR = '#BBBBBB';
export const CELL_COLOR = {
    'BLACK': 0,
    'WHITE': 1,
    'CYAN': 2,
    'MAGENTA': 3,
    'YELLOW': 4,
    'RED': 5,
    'GREEN': 6,
    'BLUE': 7,
    'ORANGE': 8,

    'LAST': 8
};

export const CELL_COLOR_STRINGS = [
    'black',
    'white',
    'cyan',
    'magenta',
    'yellow',
    'red',
    'green',
    'blue',
    'orange'
];

export function getColorString(c) {
    return CELL_COLOR_STRINGS[c];
}

// Helpers
export const ORIENTATION_TYPE = {
    'HOR': 0, // Horizontal
    'VER': 1  // Vertical
}

// Puzzle definition
export let puzzle = {};

// Used for keeping track of visited points with a Set
// This requires that a given X,Y point is always the exact same JS object
export let pointPool = [];

export function point(x, y) {
    if (!pointPool[x]) pointPool[x] = [];
    if (!pointPool[x][y]) pointPool[x][y] = {x: x, y: y};

    return pointPool[x][y];
}

export let edgePool = [];

// x and y are the left top point of a edge. ori is orientation
export function edge(x, y, ori) {
    ori = ori == ORIENTATION_TYPE.HOR ? 0 : 1;
    if (!edgePool[x]) edgePool[x] = [];
    if (!edgePool[x][y]) edgePool[x][y] = {x: x, y: y};
    if (!edgePool[x][y][ori]) edgePool[x][y][ori] = {x: x, y: y, ori: ori};

    return edgePool[x][y][ori];
}

export function create2DArray(w, h) {
    var arr = [];

    for (var x = 0; x < w; x++) {
        arr[x] = [];
        arr[x].length = h;
    }

    return arr;
}

// Set up default puzzle with all edges and no special nodes or cells
export function initPuzzle(puzzle, width, height) {
    puzzle.width = width;
    puzzle.height = height;

    initNodes(puzzle);
    initCells(puzzle);
    initEdges(puzzle);
}

export function initNodes(puzzle) {
    puzzle.nodes = create2DArray(puzzle.width, puzzle.height);

    for (var x = 0; x < puzzle.width; x++) {
        for (var y = 0; y < puzzle.height; y++) {
            puzzle.nodes[x][y] = {type: NODE_TYPE.NORMAL};
        }
    }
}

export function initEdges(puzzle) {
    puzzle.horEdges = create2DArray(puzzle.width - 1, puzzle.height);

    for (var x = 0; x < puzzle.width - 1; x++) {
        for (var y = 0; y < puzzle.height; y++) {
            puzzle.horEdges[x][y] = EDGE_TYPE.NORMAL;
        }
    }

    puzzle.verEdges = create2DArray(puzzle.width, puzzle.height - 1);

    for (var x = 0; x < puzzle.width; x++) {
        for (var y = 0; y < puzzle.height - 1; y++) {
            puzzle.verEdges[x][y] = EDGE_TYPE.NORMAL;
        }
    }
}

export function initCells(puzzle) {
    puzzle.cells = create2DArray(puzzle.width - 1, puzzle.height - 1);

    for (var x = 0; x < puzzle.width - 1; x++) {
        for (var y = 0; y < puzzle.height - 1; y++) {
            puzzle.cells[x][y] = {type: CELL_TYPE.NONE, color: CELL_COLOR.BLACK};

            initTetrisLayout(puzzle, x, y);
        }
    }
}

export function initTetrisLayout(puzzle, x, y) {
    puzzle.cells[x][y].tetris = create2DArray(4, 4);

    for (var xx = 0; xx < 4; xx++) {
        for (var yy = 0; yy < 4; yy++) {
            puzzle.cells[x][y].tetris[xx][yy] = xx < 2 && yy < 2;
        }
    }

    updateTetrisLayoutProperties(x, y);
}

// Recalculate the area and top-left anchor of the tetris layout in cell (x, y)
export function updateTetrisLayoutProperties(x, y) {
    puzzle.cells[x][y].tetrisArea = 0;
    puzzle.cells[x][y].tetrisBounds = [Number.MAX_VALUE, Number.MAX_VALUE, 0, 0];

    for (var xx = 0; xx < 4; xx++) {
        for (var yy = 0; yy < 4; yy++) {
            puzzle.cells[x][y].tetrisArea += +puzzle.cells[x][y].tetris[xx][yy];

            // Extend bounds
            if (puzzle.cells[x][y].tetris[xx][yy]) {
                puzzle.cells[x][y].tetrisBounds[0] = Math.min(puzzle.cells[x][y].tetrisBounds[0], xx);
                puzzle.cells[x][y].tetrisBounds[1] = Math.min(puzzle.cells[x][y].tetrisBounds[1], yy);
                puzzle.cells[x][y].tetrisBounds[2] = Math.max(puzzle.cells[x][y].tetrisBounds[2], xx);
                puzzle.cells[x][y].tetrisBounds[3] = Math.max(puzzle.cells[x][y].tetrisBounds[3], yy);
            }
        }
    }
}

export function horEdgeExists(x, y) {
    if (x < 0 || y < 0 || x >= puzzle.width - 1 || y >= puzzle.height) return false;
    return puzzle.horEdges[x][y] != EDGE_TYPE.OBSTACLE;
}

export function verEdgeExists(x, y) {
    if (x < 0 || y < 0 || x >= puzzle.width || y >= puzzle.height - 1) return false;
    return puzzle.verEdges[x][y] != EDGE_TYPE.OBSTACLE;
}

export function isEntireTetrisGridOff(x, y) {
    var tetris = puzzle.cells[x][y].tetris;
    for (var xx = 0; xx < 4; xx ++) {
        for (var yy = 0; yy < 4; yy ++) {
            if (tetris[xx][yy]) {
                return false;
            }
        }
    }
    return true;
}

export function powerSet(list) {
    var set = [],
        listSize = list.length,
        combinationsCount = (1 << listSize),
        combination;

    for (var i = 0; i < combinationsCount ; i++ ){
        var combination = [];
        for (var j=0;j<listSize;j++){
            if ((i & (1 << j))){
                combination.push(list[j]);
            }
        }
        set.push(combination);
    }
    return set;
}

// Reset coordinate memo pools. The point/edge pools memoize objects by coords
// so identity-based Set membership stays stable *within* a solve; clearing them
// between solves prevents any residue across runs. The puzzle fields themselves
// are populated by the caller (initPuzzle or the bridge) right before solving,
// so they are intentionally left untouched here.
export function resetPools() {
    pointPool.length = 0;
    edgePool.length = 0;
}
