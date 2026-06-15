import React, { useEffect, useRef } from 'react';
import { NODE_TYPE, EDGE_TYPE, CELL_TYPE } from '../solver/shared.js';
import { CELL_COLOR_HEX, CELL_COLOR_LABELS } from '../lib/constants.js';

const NODE_OPTIONS = [
  { key: 'NORMAL', label: 'Normal', value: NODE_TYPE.NORMAL },
  { key: 'START', label: 'Start', value: NODE_TYPE.START },
  { key: 'REQUIRED', label: 'Required', value: NODE_TYPE.REQUIRED },
  { key: 'EXIT', label: 'Exit', value: NODE_TYPE.EXIT },
];

const EDGE_OPTIONS = [
  { key: 'NORMAL', label: 'Normal', value: EDGE_TYPE.NORMAL },
  { key: 'REQUIRED', label: 'Required', value: EDGE_TYPE.REQUIRED },
  { key: 'OBSTACLE', label: 'Obstacle', value: EDGE_TYPE.OBSTACLE },
];

const CELL_TYPE_OPTIONS = [
  { key: 'NONE', label: 'None', value: CELL_TYPE.NONE },
  { key: 'SQUARE', label: 'Square', value: CELL_TYPE.SQUARE },
  { key: 'TETRIS', label: 'Tetris', value: CELL_TYPE.TETRIS },
  { key: 'TETRIS_ROTATED', label: 'Rotated', value: CELL_TYPE.TETRIS_ROTATED },
  { key: 'TETRIS_HOLLOW', label: 'Hollow', value: CELL_TYPE.TETRIS_HOLLOW },
  { key: 'SUN', label: 'Sun', value: CELL_TYPE.SUN },
  { key: 'CANCELLATION', label: 'Cancel', value: CELL_TYPE.CANCELLATION },
];

export default function EditorPopup({ target, cell, anchor, onApply, onClose }) {
  const panelRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const onBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const style = {
    position: 'fixed',
    left: Math.min(anchor.x, window.innerWidth - 260),
    top: Math.min(anchor.y, window.innerHeight - 240),
    zIndex: 50,
  };

  const applyAndClose = (payload) => {
    onApply({ ...target, ...payload });
    onClose();
  };

  return (
    <div className="popup-backdrop" onClick={onBackdrop} style={{ position: 'fixed', inset: 0, zIndex: 40 }}>
      <div ref={panelRef} className="popup-panel" style={style} onClick={(e) => e.stopPropagation()}>
        <button data-testid="popup-close" className="popup-close" onClick={onClose} aria-label="Close">×</button>

        {target.kind === 'node' && (
          <div className="popup-row">
            {NODE_OPTIONS.map((o) => (
              <button key={o.key} data-testid={`node-opt-${o.key}`} onClick={() => applyAndClose({ value: o.value })}>
                {o.label}
              </button>
            ))}
          </div>
        )}

        {target.kind === 'edge' && (
          <div className="popup-row">
            {EDGE_OPTIONS.map((o) => (
              <button key={o.key} data-testid={`edge-opt-${o.key}`} onClick={() => applyAndClose({ value: o.value })}>
                {o.label}
              </button>
            ))}
          </div>
        )}

        {target.kind === 'cell' && (
          <div className="popup-cell">
            <div className="popup-section">
              <div className="popup-section-title">Type</div>
              <div className="popup-grid">
                {CELL_TYPE_OPTIONS.map((o) => (
                  <button
                    key={o.key}
                    data-testid={`cell-type-${o.key}`}
                    className={cell && cell.type === o.value ? 'selected' : ''}
                    onClick={() => onApply({ ...target, type: o.value })}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="popup-section">
              <div className="popup-section-title">Color</div>
              <div className="popup-colors">
                {CELL_COLOR_HEX.map((hex, i) => (
                  <button
                    key={i}
                    data-testid={`cell-color-${CELL_COLOR_LABELS[i].toUpperCase()}`}
                    className={`swatch ${cell && cell.color === i ? 'selected' : ''}`}
                    style={{ background: hex }}
                    title={CELL_COLOR_LABELS[i]}
                    onClick={() => onApply({ ...target, color: i })}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
