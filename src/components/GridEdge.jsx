import React from 'react';
import { EDGE_TYPE } from '../solver/shared.js';
import { nodeX, nodeY } from '../lib/geometry.js';
import { COLOR_EDGE_DARK, COLOR_PANEL_GREEN, COLOR_PATH } from '../lib/constants.js';

export default function GridEdge({ orientation, x, y, type, metrics, highlighted, onOpen }) {
  const r = metrics.radius;
  const fill = highlighted ? COLOR_PATH : COLOR_EDGE_DARK;
  const onClick = (e) => {
    e.stopPropagation();
    onOpen({ kind: 'edge', orientation, x, y });
  };

  if (orientation === 'hor') {
    const bx = nodeX(metrics, x);
    const by = nodeY(metrics, y) - r;
    const children = [];
    children.push(
      <rect key="base" className="edge-hit" x={bx} y={by} width={metrics.spacing} height={r * 2} fill={fill} onClick={onClick} />
    );
    if (type === EDGE_TYPE.OBSTACLE) {
      children.push(
        <rect key="obs" className="edge-hit" x={bx + metrics.spacing / 2 - r} y={by - 2} width={r * 2} height={r * 2 + 4} fill={COLOR_PANEL_GREEN} onClick={onClick} />
      );
    } else if (type === EDGE_TYPE.REQUIRED) {
      const hr = r * 0.5;
      const rr = r * 0.8;
      const cx = bx + metrics.spacing / 2;
      const cy = by + r;
      let d = '';
      d += `M ${cx + r} ${cy}`;
      d += `l ${-hr} ${rr}`;
      d += `h ${-r}`;
      d += `l ${-hr} ${-rr}`;
      d += `l ${hr} ${-rr}`;
      d += `h ${r}`;
      d += `l ${hr} ${rr}`;
      children.push(<path key="req" className="edge-hit" d={d} fill="black" onClick={onClick} />);
    }
    return <g>{children}</g>;
  }

  // vertical
  const bx = nodeX(metrics, x) - r;
  const by = nodeY(metrics, y);
  const children = [];
  children.push(
    <rect key="base" className="edge-hit" x={bx} y={by} width={r * 2} height={metrics.spacing} fill={fill} onClick={onClick} />
  );
  if (type === EDGE_TYPE.OBSTACLE) {
    children.push(
      <rect key="obs" className="edge-hit" x={bx - 2} y={by + metrics.spacing / 2 - r} width={r * 2 + 4} height={r * 2} fill={COLOR_PANEL_GREEN} onClick={onClick} />
    );
  } else if (type === EDGE_TYPE.REQUIRED) {
    const hr = r * 0.5;
    const rr = r * 0.8;
    const cx = bx + r - 2;
    const cy = by + metrics.spacing / 2;
    let d = '';
    d += `M ${cx} ${cy + r}`;
    d += `l ${-hr} ${rr}`;
    d += `h ${-r}`;
    d += `l ${-hr} ${-rr}`;
    d += `l ${hr} ${-rr}`;
    d += `h ${r}`;
    d += `l ${hr} ${rr}`;
    children.push(<path key="req" className="edge-hit" d={d} fill="black" onClick={onClick} />);
  }
  return <g>{children}</g>;
}
