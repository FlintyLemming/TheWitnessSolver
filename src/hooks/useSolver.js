import { useState, useCallback, useRef } from 'react';
import { solvePuzzle } from '../lib/solverBridge.js';

export function useSolver() {
  const [solving, setSolving] = useState(false);
  const timerRef = useRef(null);

  const solve = useCallback((puzzle, fraction, onResult) => {
    setSolving(true);
    // Defer to let the browser repaint the "Solving..." state before the
    // (potentially long) synchronous search blocks the main thread.
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const path = solvePuzzle(puzzle);
      setSolving(false);
      onResult(path, fraction);
    }, 0);
  }, []);

  return { solving, solve };
}
