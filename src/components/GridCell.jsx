import React from 'react';
import { CELL_TYPE } from '../solver/shared.js';
import { nodeX, nodeY } from '../lib/geometry.js';
import { CELL_COLOR_HEX, COLOR_PANEL_GREEN } from '../lib/constants.js';

function colorOf(cell) {
  return CELL_COLOR_HEX[cell.color] || CELL_COLOR_HEX[0];
}

function Square({ cx, cy, s, fill }) {
  return <rect x={cx - s / 2} y={cy - s / 2} width={s} height={s} fill={fill} pointerEvents="none" />;
}

function Sun({ cx, cy, s, fill }) {
  const r1 = `translate(${cx}px, ${cy}px) rotate(45deg) translate(${-cx}px, ${-cy}px)`;
  return (
    <g pointerEvents="none">
      <rect x={cx - s / 2} y={cy - s / 2} width={s} height={s} fill={fill} />
      <rect x={cx - s / 2} y={cy - s / 2} width={s} height={s} fill={fill} style={{ transform: r1 }} />
    </g>
  );
}

function Cancellation({ cx, cy, spacing, fill }) {
  const half = spacing / 8;
  const rot = (deg) => `translate(${cx}px, ${cy}px) rotate(${deg}deg) translate(${-cx}px, ${-cy}px)`;
  return (
    <g pointerEvents="none">
      <line x1={cx} x2={cx} y1={cy} y2={cy - half} strokeWidth={10} stroke={fill} />
      <line x1={cx} x2={cx} y1={cy} y2={cy - half} strokeWidth={10} stroke={fill} style={{ transform: rot(120) }} />
      <line x1={cx} x2={cx} y1={cy} y2={cy - half} strokeWidth={10} stroke={fill} style={{ transform: rot(240) }} />
    </g>
  );
}

export default function GridCell({ x, y, cell, metrics, onOpen, onToggleTetris }) {
  const bx = nodeX(metrics, x);
  const by = nodeY(metrics, y);
  const s = metrics.spacing;
  const r = metrics.radius;
  const fill = colorOf(cell);
  const cx = bx + s / 2;
  const cy = by + s / 2;

  const open = (e) => {
    e.stopPropagation();
    onOpen({ kind: 'cell', x, y });
  };

  const isTetris =
    cell.type === CELL_TYPE.TETRIS ||
    cell.type === CELL_TYPE.TETRIS_ROTATED ||
    cell.type === CELL_TYPE.TETRIS_HOLLOW;

  let symbol = null;
  if (cell.type === CELL_TYPE.SQUARE) {
    symbol = <Square cx={cx} cy={cy} s={s / 4} fill={fill} />;
  } else if (cell.type === CELL_TYPE.SUN) {
    symbol = <Sun cx={cx} cy={cy} s={s / 4} fill={fill} />;
  } else if (cell.type === CELL_TYPE.CANCELLATION) {
    symbol = <Cancellation cx={cx} cy={cy} spacing={s} fill={fill} />;
  }

  const tetrisCells = isTetris
    ? (() => {
        const items = [];
        const cellSize = s / 8;
        const rotated = cell.type === CELL_TYPE.TETRIS_ROTATED;
        const hollow = cell.type === CELL_TYPE.TETRIS_HOLLOW;
        const rot = rotated
          ? `translate(${cx}px, ${cy}px) scale(0.8,0.8) rotate(45deg) translate(${-cx}px, ${-cy}px)`
          : null;
        for (let xx = 0; xx < 4; xx++) {
          for (let yy = 0; yy < 4; yy++) {
            const px = bx + ((s - r) / 5) * (xx + 1);
            const py = by + ((s - r) / 5) * (yy + 1);
            const on = !!cell.tetris[xx][yy];
            items.push(
              <rect
                key={`${xx}-${yy}`}
                className="tetris-cell"
                x={px}
                y={py}
                width={cellSize}
                height={cellSize}
                fill={hollow ? COLOR_PANEL_GREEN : fill}
                stroke={hollow ? 'blue' : 'none'}
                strokeWidth={hollow ? 4 : 0}
                opacity={on ? 1 : 0}
                style={rot ? { transform: rot } : undefined}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleTetris(x, y, xx, yy);
                }}
              />
            );
          }
        }
        return items;
      })()
    : null;

  return (
    <g>
      {/* click target / cell background */}
      <rect className="cell-hit" x={bx} y={by} width={s} height={s} rx={r / 2} ry={r / 2} fill="rgba(0,0,0,0)" onClick={open} />
      {symbol}
      {tetrisCells}
    </g>
  );
}
