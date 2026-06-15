// Convert a solver path into highlight sets, mirroring the loop in the
// original ui.js actualSolve(). Edge keys follow the original convention:
//   next.x > cur.x  -> hor edge (cur.x, cur.y)
//   next.x < cur.x  -> hor edge (next.x, next.y)
//   next.y > cur.y  -> ver edge (cur.x, cur.y)
//   next.y < cur.y  -> ver edge (next.x, next.y)

export function computeHighlights(path, fraction) {
  const nodes = new Set();
  const horEdges = new Set();
  const verEdges = new Set();

  if (!path || path.length === 0) return { nodes, horEdges, verEdges };

  const len = Math.ceil(path.length * fraction);
  const truncated = path.slice(0, len);

  for (let i = 0; i < truncated.length; i++) {
    const cur = truncated[i];
    const next = truncated[i + 1];

    nodes.add(`${cur.x},${cur.y}`);

    if (next) {
      if (next.x > cur.x) horEdges.add(`${cur.x},${cur.y}`);
      if (next.x < cur.x) horEdges.add(`${next.x},${next.y}`);
      if (next.y > cur.y) verEdges.add(`${cur.x},${cur.y}`);
      if (next.y < cur.y) verEdges.add(`${next.x},${next.y}`);
    }
  }

  return { nodes, horEdges, verEdges };
}
