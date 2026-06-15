import React from 'react';
import { NODE_TYPE } from '../solver/shared.js';
import { nodeX, nodeY } from '../lib/geometry.js';
import { COLOR_NODE_DARK, COLOR_PATH } from '../lib/constants.js';

function hexPath(cx, cy, r) {
  const hr = r * 0.5;
  let d = '';
  d += `M ${cx + r} ${cy}`;
  d += `l ${-hr} ${r}`;
  d += `h ${-r}`;
  d += `l ${-hr} ${-r}`;
  d += `l ${hr} ${-r}`;
  d += `h ${r}`;
  d += `l ${hr} ${r}`;
  return d;
}

function exitAngle(x, y, puzzle) {
  let ang = 0;
  if (x === 0) ang = 0;
  else if (x === puzzle.width - 1) ang = 180;
  if (y === 0) ang = 90;
  else if (y === puzzle.height - 1) ang = -90;
  if (x === 0 && y === 0) ang -= 45;
  else if (x === 0 && y === puzzle.height - 1) ang += 45;
  else if (x === puzzle.width - 1 && y === 0) ang += 45;
  else if (x === puzzle.width - 1 && y === puzzle.height - 1) ang -= 45;
  return ang;
}

export default function GridNode({ x, y, node, puzzle, metrics, highlighted, onOpen }) {
  const cx = nodeX(metrics, x);
  const cy = nodeY(metrics, y);
  const r = metrics.radius;
  const fill = highlighted ? COLOR_PATH : COLOR_NODE_DARK;

  const onClick = (e) => {
    e.stopPropagation();
    onOpen({ kind: 'node', x, y });
  };

  let content = null;
  if (node.type === NODE_TYPE.START) {
    content = <circle className="node-hit" cx={cx} cy={cy} r={r * 2} fill={fill} onClick={onClick} />;
  } else if (node.type === NODE_TYPE.REQUIRED) {
    content = (
      <g>
        <circle className="node-hit" cx={cx} cy={cy} r={r} fill={fill} onClick={onClick} />
        <path className="node-hit" d={hexPath(cx, cy, r * 0.8)} fill={highlighted ? COLOR_PATH : 'black'} onClick={onClick} />
      </g>
    );
  } else if (node.type === NODE_TYPE.EXIT) {
    const ang = exitAngle(x, y, puzzle);
    const transform = `translate(${cx}px, ${cy}px) rotate(${ang}deg) translate(${-cx}px, ${-cy}px)`;
    content = (
      <g style={{ transform }}>
        <rect className="node-hit" x={cx - r * 2} y={cy - r} width={r * 2} height={r * 2} fill={fill} onClick={onClick} />
        <circle className="node-hit" cx={cx - r * 2} cy={cy} r={r} fill={fill} onClick={onClick} />
      </g>
    );
  } else {
    content = <circle className="node-hit" cx={cx} cy={cy} r={r} fill={fill} onClick={onClick} />;
  }

  return content;
}
