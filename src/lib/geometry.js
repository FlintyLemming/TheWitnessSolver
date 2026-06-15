// Geometry helpers, ported verbatim from the original ui.js calculateMetrics/nodeX/nodeY.
// All rendering uses a fixed 800x800 coordinate space exposed via the SVG viewBox.

export const VIEW_SIZE = 800;

export function calculateMetrics(width, height) {
  const radius = 88 / Math.max(6, Math.max(width, height));
  const spacing = VIEW_SIZE / (Math.max(width, height) + 1);
  const horPadding = (VIEW_SIZE - spacing * (width - 1)) / 2;
  const verPadding = (VIEW_SIZE - spacing * (height - 1)) / 2;
  return { radius, spacing, horPadding, verPadding };
}

export function nodeX(metrics, x) {
  return metrics.horPadding + metrics.spacing * x;
}

export function nodeY(metrics, y) {
  return metrics.verPadding + metrics.spacing * y;
}
