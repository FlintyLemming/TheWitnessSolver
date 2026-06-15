import React from 'react';

const SIZE_OPTIONS = [];
for (let x = 1; x <= 6; x++) {
  for (let y = 1; y <= 6; y++) {
    SIZE_OPTIONS.push({ value: `${x + 1},${y + 1}`, label: `${x} × ${y}`, w: x + 1, h: y + 1 });
  }
}

const FRACTION_OPTIONS = [];
for (let i = 100; i >= 10; i -= 10) {
  FRACTION_OPTIONS.push({ value: i / 100, label: i === 100 ? 'Full solution' : `${i}%` });
}

export default function Toolbar({
  onSolve, onUndo, onRedo, onClear, onShare,
  canUndo, canRedo, solving, viewingSolution,
  width, height, onSizeChange,
  fraction, onFractionChange,
}) {
  const currentSize = `${width},${height}`;

  return (
    <aside className="toolbar">
      <div className="toolbar-group">
        <button className="btn btn-primary" onClick={onSolve} disabled={solving}>
          {solving ? 'Solving…' : 'Solve ▶'}
        </button>
      </div>

      <div className="toolbar-group">
        <button className="btn" onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl/Cmd+Z)">↶</button>
        <button className="btn" onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl/Cmd+Shift+Z)">↷</button>
        <button className="btn btn-danger" onClick={onClear} title="Clear puzzle">✕ Clear</button>
      </div>

      <div className="toolbar-group">
        <label className="toolbar-label">Size</label>
        <select value={currentSize} onChange={(e) => {
          const [w, h] = e.target.value.split(',').map(Number);
          onSizeChange(w, h);
        }}>
          {SIZE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="toolbar-group">
        <label className="toolbar-label">Hint</label>
        <select value={fraction} onChange={(e) => onFractionChange(Number(e.target.value))}>
          {FRACTION_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="toolbar-group">
        <button className="btn" onClick={onShare} title="Copy share link">🔗 Share</button>
      </div>

      {viewingSolution && <div className="toolbar-hint">Viewing solution — Clear to edit</div>}
    </aside>
  );
}
