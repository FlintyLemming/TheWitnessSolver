import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useReducer } from 'react';
import { NODE_TYPE } from '../solver/shared.js';
import { calculateMetrics } from '../lib/geometry.js';
import { computeHighlights } from '../lib/solution.js';
import { createBlankPuzzle, createSwampPuzzle } from '../lib/puzzleFactory.js';
import { encodePuzzle, decodePuzzle } from '../lib/urlCodec.js';
import { puzzleReducer, initialState, makeSolution } from '../hooks/usePuzzle.js';
import { useSolver } from '../hooks/useSolver.js';
import { URL_SYNC_DEBOUNCE_MS } from '../lib/constants.js';
import PuzzleGrid from './PuzzleGrid.jsx';
import EditorPopup from './EditorPopup.jsx';
import Toolbar from './Toolbar.jsx';

function loadInitialPuzzle() {
  const hash = window.location.hash.replace(/^#/, '');
  if (hash) {
    try {
      return decodePuzzle(hash);
    } catch (e) {
      /* ignore, use default */
    }
  }
  return createSwampPuzzle();
}

export default function App() {
  const initial = useMemo(loadInitialPuzzle, []);
  const [state, dispatch] = useReducer(puzzleReducer, { ...initialState, puzzle: initial });
  const { puzzle, solution, undo, redo } = state;

  const [popup, setPopup] = useState(null);
  const { solving, solve: runSolve } = useSolver();

  const metrics = useMemo(() => calculateMetrics(puzzle.width, puzzle.height), [puzzle.width, puzzle.height]);
  const highlights = useMemo(
    () => computeHighlights(solution.path, solution.fraction),
    [solution.path, solution.fraction]
  );

  // Sync URL hash (debounced) whenever the puzzle changes.
  useEffect(() => {
    const t = setTimeout(() => {
      window.location.hash = encodePuzzle(puzzle);
    }, URL_SYNC_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [puzzle]);

  // Global keyboard shortcuts.
  useEffect(() => {
    const onKey = (e) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key === 'z' || e.key === 'Z') {
        e.preventDefault();
        if (e.shiftKey) dispatch({ type: 'REDO' });
        else dispatch({ type: 'UNDO' });
      } else if (e.key === 'y') {
        e.preventDefault();
        dispatch({ type: 'REDO' });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onOpen = useCallback((target) => {
    if (solution.viewing) return;
    setPopup({ target, anchor: { x: lastClickPos.x, y: lastClickPos.y } });
  }, [solution.viewing]);

  // Track last click position for popup anchoring.
  const lastClickPosRef = React.useRef({ x: 100, y: 100 });
  useEffect(() => {
    const onDown = (e) => {
      lastClickPosRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, []);

  const applyEdit = useCallback((next) => dispatch({ type: 'EDIT', next }), []);

  const onApplyPopup = useCallback((payload) => {
    const { kind, x, y } = payload;
    if (kind === 'node') {
      applyEdit((p) => {
        const q = JSON.parse(JSON.stringify(p));
        // Exit only allowed on boundary; downgrade to NORMAL otherwise.
        let value = payload.value;
        if (value === NODE_TYPE.EXIT) {
          if (x !== 0 && y !== 0 && x !== q.width - 1 && y !== q.height - 1) {
            value = NODE_TYPE.NORMAL;
          }
        }
        q.nodes[x][y].type = value;
        return q;
      });
    } else if (kind === 'edge') {
      applyEdit((p) => {
        const q = JSON.parse(JSON.stringify(p));
        if (payload.orientation === 'hor') q.horEdges[x][y] = payload.value;
        else q.verEdges[x][y] = payload.value;
        return q;
      });
    } else if (kind === 'cell') {
      applyEdit((p) => {
        const q = JSON.parse(JSON.stringify(p));
        if (payload.type !== undefined) q.cells[x][y].type = payload.type;
        if (payload.color !== undefined) q.cells[x][y].color = payload.color;
        return q;
      });
    }
  }, [applyEdit]);

  const onToggleTetris = useCallback((x, y, xx, yy) => {
    applyEdit((p) => {
      const q = JSON.parse(JSON.stringify(p));
      q.cells[x][y].tetris[xx][yy] = !q.cells[x][y].tetris[xx][yy];
      return q;
    });
  }, [applyEdit]);

  const onSolve = useCallback(() => {
    runSolve(puzzle, solution.fraction, (path, fraction) => {
      if (path) {
        dispatch({ type: 'SOLVE', path, fraction });
      } else {
        dispatch({ type: 'CLEAR' });
        // eslint-disable-next-line no-alert
        alert('No solution!');
      }
    });
  }, [puzzle, solution.fraction, runSolve]);

  const onClear = useCallback(() => dispatch({ type: 'CLEAR' }), []);
  const onUndo = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const onRedo = useCallback(() => dispatch({ type: 'REDO' }), []);
  const onSizeChange = useCallback((w, h) => {
    dispatch({ type: 'RESIZE', puzzle: createBlankPuzzle(w, h) });
  }, []);
  const onFractionChange = useCallback((fraction) => {
    dispatch({ type: 'SET_FRACTION', fraction });
  }, []);
  const onShare = useCallback(() => {
    navigator.clipboard?.writeText(window.location.href);
  }, []);

  const openPopup = useCallback((target) => {
    if (solution.viewing) return;
    setPopup({ target, anchor: { ...lastClickPosRef.current } });
  }, [solution.viewing]);

  return (
    <div className="app-layout">
      <Toolbar
        onSolve={onSolve}
        onUndo={onUndo}
        onRedo={onRedo}
        onClear={onClear}
        onShare={onShare}
        canUndo={undo.length > 0}
        canRedo={redo.length > 0}
        solving={solving}
        viewingSolution={solution.viewing}
        width={puzzle.width}
        height={puzzle.height}
        onSizeChange={onSizeChange}
        fraction={solution.fraction}
        onFractionChange={onFractionChange}
      />
      <main className="app-main">
        <PuzzleGrid
          puzzle={puzzle}
          metrics={metrics}
          highlights={highlights}
          onOpen={openPopup}
          onToggleTetris={onToggleTetris}
        />
      </main>

      {popup && (
        <EditorPopup
          target={popup.target}
          cell={popup.target.kind === 'cell' ? puzzle.cells[popup.target.x][popup.target.y] : null}
          anchor={popup.anchor}
          onApply={onApplyPopup}
          onClose={() => setPopup(null)}
        />
      )}
    </div>
  );
}
