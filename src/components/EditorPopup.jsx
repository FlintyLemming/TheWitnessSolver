import React, { useEffect, useRef } from 'react';
import { NODE_TYPE, EDGE_TYPE, CELL_TYPE } from '../solver/shared.js';
import {
  CELL_COLOR_HEX, CELL_COLOR_LABELS,
  COLOR_NODE_DARK, COLOR_EDGE_DARK, COLOR_PANEL_GREEN, COLOR_PATH,
} from '../lib/constants.js';

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

// Accent color used for cell-type icons: a bright, clearly visible cyan so the
// glyph pops against the dark card regardless of the cell's own color (which
// the user picks separately via the color swatches).
const ICON_ACCENT = '#5ef2ff';

// ---- Type icons (small inline SVG, 28x28 viewBox) ----
function hexPath(cx, cy, r) {
  const hr = r * 0.5;
  let d = `M ${cx + r} ${cy} l ${-hr} ${r} h ${-r} l ${-hr} ${-r} l ${hr} ${-r} h ${r} l ${hr} ${r}`;
  return d;
}

function NodeIcon({ typeKey }) {
  const c = 14;
  if (typeKey === 'START') {
    return (
      <svg viewBox="0 0 28 28" className="type-icon">
        <circle cx={c} cy={c} r={10} fill={COLOR_PATH} />
      </svg>
    );
  }
  if (typeKey === 'REQUIRED') {
    return (
      <svg viewBox="0 0 28 28" className="type-icon">
        <circle cx={c} cy={c} r={9} fill={COLOR_NODE_DARK} />
        <path d={hexPath(c, c, 5.5)} fill={ICON_ACCENT} />
      </svg>
    );
  }
  if (typeKey === 'EXIT') {
    return (
      <svg viewBox="0 0 28 28" className="type-icon">
        {/* exit "tail" shape pointing right */}
        <rect x={2} y={9} width={14} height={10} fill={COLOR_PATH} />
        <circle cx={2} cy={c} r={5} fill={COLOR_PATH} />
      </svg>
    );
  }
  // NORMAL
  return (
    <svg viewBox="0 0 28 28" className="type-icon">
      <circle cx={c} cy={c} r={5} fill={COLOR_NODE_DARK} />
    </svg>
  );
}

function EdgeIcon({ typeKey }) {
  if (typeKey === 'OBSTACLE') {
    return (
      <svg viewBox="0 0 28 28" className="type-icon">
        <rect x={2} y={12} width={24} height={4} fill={COLOR_EDGE_DARK} />
        <rect x={10} y={7} width={8} height={14} fill={COLOR_PANEL_GREEN} />
      </svg>
    );
  }
  if (typeKey === 'REQUIRED') {
    return (
      <svg viewBox="0 0 28 28" className="type-icon">
        <rect x={2} y={12} width={24} height={4} fill={COLOR_EDGE_DARK} />
        <path d={hexPath(14, 14, 6)} fill={ICON_ACCENT} />
      </svg>
    );
  }
  // NORMAL
  return (
    <svg viewBox="0 0 28 28" className="type-icon">
      <rect x={2} y={12} width={24} height={4} fill={COLOR_EDGE_DARK} />
    </svg>
  );
}

function CellIcon({ typeKey }) {
  if (typeKey === 'SQUARE') {
    return (
      <svg viewBox="0 0 28 28" className="type-icon">
        <rect x={9} y={9} width={10} height={10} fill={ICON_ACCENT} />
      </svg>
    );
  }
  if (typeKey === 'TETRIS' || typeKey === 'TETRIS_ROTATED' || typeKey === 'TETRIS_HOLLOW') {
    const rot = typeKey === 'TETRIS_ROTATED';
    const hollow = typeKey === 'TETRIS_HOLLOW';
    const cells = [];
    // 2x2 block in the center
    const positions = [[8, 8], [14, 8], [8, 14], [14, 14]];
    positions.forEach(([px, py], i) => {
      cells.push(
        <rect
          key={i}
          x={px} y={py} width={5} height={5}
          fill={hollow ? COLOR_PANEL_GREEN : ICON_ACCENT}
          stroke={hollow ? '#3a7bff' : 'none'}
          strokeWidth={hollow ? 1.5 : 0}
        />
      );
    });
    const transform = rot ? `rotate(45 14 14)` : undefined;
    return <svg viewBox="0 0 28 28" className="type-icon"><g transform={transform}>{cells}</g></svg>;
  }
  if (typeKey === 'SUN') {
    // two overlapping squares rotated 45° = 8-point star
    return (
      <svg viewBox="0 0 28 28" className="type-icon">
        <rect x={9} y={9} width={10} height={10} fill={ICON_ACCENT} />
        <rect x={9} y={9} width={10} height={10} fill={ICON_ACCENT} transform="rotate(45 14 14)" />
      </svg>
    );
  }
  if (typeKey === 'CANCELLATION') {
    // Y-shaped cancellation mark
    const rot = (deg) => `rotate(${deg} 14 14)`;
    return (
      <svg viewBox="0 0 28 28" className="type-icon">
        <line x1={14} x2={14} y1={14} y2={5} stroke={ICON_ACCENT} strokeWidth={2.5} />
        <line x1={14} x2={14} y1={14} y2={5} stroke={ICON_ACCENT} strokeWidth={2.5} transform={rot(120)} />
        <line x1={14} x2={14} y1={14} y2={5} stroke={ICON_ACCENT} strokeWidth={2.5} transform={rot(240)} />
      </svg>
    );
  }
  // NONE — dashed empty square
  return (
    <svg viewBox="0 0 28 28" className="type-icon">
      <rect x={7} y={7} width={14} height={14} fill="none" stroke="#555" strokeWidth={1.5} strokeDasharray="3 2" />
    </svg>
  );
}

function TypeIcon({ kind, typeKey }) {
  if (kind === 'node') return <NodeIcon typeKey={typeKey} />;
  if (kind === 'edge') return <EdgeIcon typeKey={typeKey} />;
  return <CellIcon typeKey={typeKey} />;
}

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
    left: Math.min(anchor.x, window.innerWidth - 280),
    top: Math.min(anchor.y, window.innerHeight - 320),
    zIndex: 50,
  };

  const applyAndClose = (payload) => {
    onApply({ ...target, ...payload });
    onClose();
  };

  const titleFor = (kind) =>
    kind === 'node' ? 'Node type' : kind === 'edge' ? 'Edge type' : 'Cell';

  const optionsFor = (kind) =>
    kind === 'node' ? NODE_OPTIONS : kind === 'edge' ? EDGE_OPTIONS : CELL_TYPE_OPTIONS;

  const kind = target.kind;
  const options = optionsFor(kind);
  const currentValue = kind === 'node'
    ? null // node panel applies & closes; no persistent selection to show
    : kind === 'edge'
    ? null
    : (cell ? cell.type : undefined);

  return (
    <div className="popup-backdrop" onClick={onBackdrop} style={{ position: 'fixed', inset: 0, zIndex: 40 }}>
      <div ref={panelRef} className="popup-panel" style={style} onClick={(e) => e.stopPropagation()}>
        <button data-testid="popup-close" className="popup-close" onClick={onClose} aria-label="Close">×</button>
        <div className="popup-title">{titleFor(kind)}</div>

        {/* Node / Edge: click-to-select-and-close cards */}
        {(kind === 'node' || kind === 'edge') && (
          <div className="popup-grid">
            {options.map((o) => (
              <button
                key={o.key}
                data-testid={`${kind}-opt-${o.key}`}
                className="type-card"
                onClick={() => applyAndClose({ value: o.value })}
              >
                <TypeIcon kind={kind} typeKey={o.key} />
                <span className="type-card-label">{o.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Cell: type cards (no auto-close) + color swatches */}
        {kind === 'cell' && (
          <div className="popup-cell">
            <div className="popup-section">
              <div className="popup-section-title">Type</div>
              <div className="popup-grid">
                {options.map((o) => (
                  <button
                    key={o.key}
                    data-testid={`cell-type-${o.key}`}
                    className={`type-card${currentValue === o.value ? ' selected' : ''}`}
                    onClick={() => onApply({ ...target, type: o.value })}
                  >
                    <TypeIcon kind="cell" typeKey={o.key} />
                    <span className="type-card-label">{o.label}</span>
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
