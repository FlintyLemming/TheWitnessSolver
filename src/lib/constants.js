// UI color palette. CELL_COLOR_LIST replaces shared.js's getColorString with hex
// values (CSS accepts both names and hex; hex is more explicit for React inline styles).
export const COLOR_BG = '#0a0a0a';
export const COLOR_SIDEBAR = '#141414';
export const COLOR_PANEL_GREEN = '#00E94F';
export const COLOR_PANEL_GREEN_HOVER = '#00CE44';
export const COLOR_PANEL_GREEN_ACTIVE = '#00A032';
export const COLOR_PATH = '#B1F514';
export const COLOR_EDGE_DARK = '#026223';
export const COLOR_NODE_DARK = '#026223';

// Index aligns with CELL_COLOR enum (BLACK=0 .. ORANGE=8) in solver/shared.js.
export const CELL_COLOR_HEX = [
  '#000000', // BLACK
  '#ffffff', // WHITE
  '#00ffff', // CYAN
  '#ff00ff', // MAGENTA
  '#ffff00', // YELLOW
  '#ff0000', // RED
  '#00ff00', // GREEN
  '#0000ff', // BLUE
  '#ffa500', // ORANGE
];

export const CELL_COLOR_LABELS = [
  'Black', 'White', 'Cyan', 'Magenta', 'Yellow',
  'Red', 'Green', 'Blue', 'Orange',
];

export const UNDO_STACK_LIMIT = 100;
export const URL_SYNC_DEBOUNCE_MS = 300;
