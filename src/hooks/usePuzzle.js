import { UNDO_STACK_LIMIT } from '../lib/constants.js';
import { createBlankPuzzle } from '../lib/puzzleFactory.js';

const clone = (obj) => JSON.parse(JSON.stringify(obj));

export function makeSolution() {
  return { path: null, fraction: 1, viewing: false };
}

export const initialState = {
  puzzle: null,
  solution: makeSolution(),
  undo: [],   // array of { puzzle, solution } snapshots
  redo: [],
};

function snapshot(state) {
  return { puzzle: clone(state.puzzle), solution: clone(state.solution) };
}

function pushCapped(stack, item) {
  const next = [...stack, item];
  if (next.length > UNDO_STACK_LIMIT) next.shift();
  return next;
}

export function puzzleReducer(state, action) {
  switch (action.type) {
    case 'INIT':
      return { ...initialState, puzzle: action.puzzle };

    case 'EDIT': {
      if (state.solution.viewing) return state; // edits disabled while viewing
      const undo = pushCapped(state.undo, snapshot(state));
      const puzzle = action.next(clone(state.puzzle));
      return { ...state, puzzle, undo, redo: [], solution: makeSolution() };
    }

    case 'SOLVE': {
      const undo = pushCapped(state.undo, snapshot(state));
      const solution = { path: action.path, fraction: action.fraction, viewing: true };
      return { ...state, undo, redo: [], solution };
    }

    case 'CLEAR': {
      const undo = pushCapped(state.undo, snapshot(state));
      const puzzle = createBlankPuzzle(state.puzzle.width, state.puzzle.height);
      return { ...state, puzzle, undo, redo: [], solution: makeSolution() };
    }

    case 'RESIZE': {
      const undo = pushCapped(state.undo, snapshot(state));
      return { ...state, puzzle: action.puzzle, undo, redo: [], solution: makeSolution() };
    }

    case 'SET_FRACTION': {
      // View-only tweak; no undo snapshot.
      return { ...state, solution: { ...state.solution, fraction: action.fraction } };
    }

    case 'UNDO': {
      if (state.undo.length === 0) return state;
      const prev = state.undo[state.undo.length - 1];
      const undo = state.undo.slice(0, -1);
      const redo = pushCapped(state.redo, snapshot(state));
      return { ...state, puzzle: clone(prev.puzzle), solution: clone(prev.solution), undo, redo };
    }

    case 'REDO': {
      if (state.redo.length === 0) return state;
      const next = state.redo[state.redo.length - 1];
      const redo = state.redo.slice(0, -1);
      const undo = pushCapped(state.undo, snapshot(state));
      return { ...state, puzzle: clone(next.puzzle), solution: clone(next.solution), undo, redo };
    }

    default:
      return state;
  }
}
