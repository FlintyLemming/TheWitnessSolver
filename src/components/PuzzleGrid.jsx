import React from 'react';
import { VIEW_SIZE } from '../lib/geometry.js';
import { COLOR_PANEL_GREEN } from '../lib/constants.js';
import GridNode from './GridNode.jsx';
import GridEdge from './GridEdge.jsx';
import GridCell from './GridCell.jsx';

export default function PuzzleGrid({ puzzle, metrics, highlights, onOpen, onToggleTetris }) {
  const { nodes, horEdges, verEdges } = highlights;

  const cellEls = [];
  for (let x = 0; x < puzzle.width - 1; x++) {
    for (let y = 0; y < puzzle.height - 1; y++) {
      cellEls.push(
        <GridCell
          key={`c-${x}-${y}`}
          x={x} y={y}
          cell={puzzle.cells[x][y]}
          metrics={metrics}
          onOpen={onOpen}
          onToggleTetris={onToggleTetris}
        />
      );
    }
  }

  const renderEdges = (onlyHighlighted) => {
    const els = [];
    for (let x = 0; x < puzzle.width - 1; x++) {
      for (let y = 0; y < puzzle.height; y++) {
        const h = horEdges.has(`${x},${y}`);
        if (h !== onlyHighlighted) continue;
        els.push(
          <GridEdge key={`h-${x}-${y}`} orientation="hor" x={x} y={y} type={puzzle.horEdges[x][y]} metrics={metrics} highlighted={h} onOpen={onOpen} />
        );
      }
    }
    for (let x = 0; x < puzzle.width; x++) {
      for (let y = 0; y < puzzle.height - 1; y++) {
        const h = verEdges.has(`${x},${y}`);
        if (h !== onlyHighlighted) continue;
        els.push(
          <GridEdge key={`v-${x}-${y}`} orientation="ver" x={x} y={y} type={puzzle.verEdges[x][y]} metrics={metrics} highlighted={h} onOpen={onOpen} />
        );
      }
    }
    return els;
  };

  const nodeEls = [];
  for (let x = 0; x < puzzle.width; x++) {
    for (let y = 0; y < puzzle.height; y++) {
      nodeEls.push(
        <GridNode
          key={`n-${x}-${y}`}
          x={x} y={y}
          node={puzzle.nodes[x][y]}
          puzzle={puzzle}
          metrics={metrics}
          highlighted={nodes.has(`${x},${y}`)}
          onOpen={onOpen}
        />
      );
    }
  }

  return (
    <svg
      className="puzzle-grid"
      viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
      width="100%"
      preserveAspectRatio="xMidYMid meet"
      style={{ background: COLOR_PANEL_GREEN, boxShadow: '0 0 50px 0 rgba(0,0,0,0.5) inset', maxWidth: VIEW_SIZE }}
    >
      {cellEls}
      {renderEdges(false)}
      {renderEdges(true)}
      {nodeEls}
    </svg>
  );
}
