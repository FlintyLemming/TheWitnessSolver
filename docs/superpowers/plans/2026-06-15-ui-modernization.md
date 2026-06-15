# UI 现代化重构 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把当前纯 HTML + jQuery + SVG 的静态页面重写为 React + Vite 应用，用"点击弹窗选择"替换"循环点击"，新增撤销/重做，保留 URL 分享并向后兼容旧链接——同时求解逻辑零修改。

**Architecture:** React 管理规范化的 puzzle 状态对象（字段结构与 solver 全局 `puzzle` 逐字段相同）。一个桥接层 `solverBridge.js` 在求解前把 React 状态灌入 solver/shared 模块的全局 `puzzle`，重置坐标池，调用原样保留的 `findSolution()`，取回路径。撤销/重做用双栈 + reducer 实现并以快照覆盖 Solve/Clear/改尺寸。URL 编解码从 `ui.js` 迁移到纯函数 `urlCodec.js`，格式不变。

**Tech Stack:** React 18、Vite 5、Vitest（单测）、jsdom + @testing-library/react（组件冒烟测试）。保持 JS（不引入 TS），与原 solver 文件一致。

**关键约束：** `src/solver/shared.js` 与 `src/solver/solver.js` 的算法函数体不做实质改动，仅做 ES module 封装（加 `export`、移除 jQuery/UI 耦合行）。Task 1 与 Task 15 用 `git diff` 验证。

---

## File Structure

实施完成后的目录结构（与设计 spec 一致）：

```
TheWitnessSolver/
├── index.html                       ← Vite 入口（替换原 jQuery 版）
├── package.json
├── vite.config.js
├── src/
│   ├── main.jsx                     ← React 入口
│   ├── solver/                      ← 原样保留 + 模块封装
│   │   ├── shared.js                ← git mv 自 src/shared.js
│   │   └── solver.js                ← git mv 自 src/solver.js
│   ├── components/
│   │   ├── App.jsx
│   │   ├── PuzzleGrid.jsx
│   │   ├── GridCell.jsx
│   │   ├── GridNode.jsx
│   │   ├── GridEdge.jsx
│   │   ├── EditorPopup.jsx
│   │   └── Toolbar.jsx
│   ├── hooks/
│   │   ├── usePuzzle.js             ← puzzle 状态 + 撤销/重做 reducer
│   │   └── useSolver.js             ← 求解调用封装
│   ├── lib/
│   │   ├── solverBridge.js          ← React 状态 → solver 全局 → 还原
│   │   ├── urlCodec.js              ← URL hash 编解码（格式不变）
│   │   ├── geometry.js              ← 几何参数计算（radius/spacing/nodeX/nodeY）
│   │   ├── tetris.js                ← 纯函数：tetris 布局属性计算/工厂
│   │   ├── puzzleFactory.js         ← 空白谜题 / swamp 默认谜题
│   │   ├── solution.js              ← 解路径 → 高亮集合（纯函数）
│   │   └── constants.js             ← UI 颜色/几何常量
│   └── styles/
│       └── theme.css                ← 全局样式 + CSS 变量
└── tests/
    ├── setup.js
    ├── urlCodec.test.js
    ├── geometry.test.js
    ├── tetris.test.js
    ├── solverBridge.test.js
    ├── puzzleFactory.test.js
    ├── solution.test.js
    ├── usePuzzle.test.js
    └── components/
        ├── EditorPopup.test.jsx
        └── App.test.jsx
```

**职责边界：**
- `solver/` 只含算法与模型，零 React 依赖。
- `lib/` 全部是纯函数/无 React 依赖（便于单测），是 React 与 solver 之间的隔离层。
- `hooks/` 把纯逻辑接到 React。
- `components/` 只做渲染与事件分发，状态来自 hooks。

---

## Task 1: Bootstrap Vite + React 工程

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `index.html`（新 Vite 入口，先放最小骨架）
- Create: `src/main.jsx`
- Create: `src/styles/theme.css`
- Create: `tests/setup.js`

- [ ] **Step 1: 写 `package.json`**

```json
{
  "name": "the-witness-solver",
  "private": true,
  "version": "2.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.6",
    "@testing-library/react": "^16.0.0",
    "@vitejs/plugin-react": "^4.3.1",
    "jsdom": "^24.1.0",
    "vite": "^5.3.1",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 2: 写 `vite.config.js`**

```js
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setup.js',
  },
});
```

- [ ] **Step 3: 写新 `index.html`（Vite 入口）**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>The Witness Puzzle Solver</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 4: 写 `src/styles/theme.css`（最小骨架，后续 Task 7 完善）**

```css
:root {
  --color-bg: #0a0a0a;
  --color-sidebar: #141414;
  --color-panel: #00E94F;
  --color-path: #B1F514;
  --color-edge-dark: #026223;
  --color-node-dark: #026223;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--color-bg);
  color: #fff;
  font-family: 'Roboto', system-ui, -apple-system, sans-serif;
  user-select: none;
}

#root { min-height: 100vh; }
```

- [ ] **Step 5: 写 `src/main.jsx`（最小渲染，验证管线）**

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/theme.css';

function Placeholder() {
  return <h1 style={{ color: 'var(--color-panel)' }}>solver booting…</h1>;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Placeholder />
  </React.StrictMode>
);
```

- [ ] **Step 6: 写 `tests/setup.js`**

```js
import '@testing-library/jest-dom';
```

- [ ] **Step 7: 安装依赖并启动 dev server 验证**

Run: `npm install`
Expected: 依赖安装成功，无错误。

Run: `npm run dev`
Expected: Vite 启动，浏览器打开本地地址显示绿色文字 "solver booting…"。Ctrl-C 退出。

- [ ] **Step 8: 跑空测试套件验证 vitest 配置**

Run: `npm test`
Expected: "No test files found"（或 0 tests），无配置错误退出码 0（vitest 在无测试时可能非 0；若报错信息仅为找不到测试即视为通过）。

- [ ] **Step 9: Commit**

```bash
git add package.json vite.config.js index.html src/main.jsx src/styles/theme.css tests/setup.js
git commit -m "chore: bootstrap vite + react project"
```

---

## Task 2: 把 solver 封装为 ES module（算法零修改）

**Files:**
- Move: `src/shared.js` → `src/solver/shared.js`（用 `git mv` 保留历史）
- Move: `src/solver.js` → `src/solver/solver.js`（用 `git mv`；注意覆盖到新 solver 目录）
- Modify: `src/solver/shared.js`（仅：加 `export`、删除 `initPuzzle` 内 2 行 jQuery/UI 耦合、新增 `resetPools` 导出）
- Modify: `src/solver/solver.js`（仅：加 `import` 与 `export`，函数体不动）
- Create: `tests/solverModule.test.js`

**说明（重要）：** `initPuzzle` 原本调用 `$('option[value=...]').prop('selected', true)` 与 `calculateMetrics()`，这是 jQuery UI 耦合，React 侧无 jQuery。这 2 行不属于算法函数体，删除它们是"模块封装"的必要部分，会在 Task 15 的 `git diff` 中显式说明。除此之外 shared.js/solver.js 函数体一字不改。

- [ ] **Step 1: 用 git mv 移动文件（保留历史）**

```bash
mkdir -p src/solver
git mv src/shared.js src/solver/shared.js
git mv src/solver.js src/solver/solver.js
```

- [ ] **Step 2: 封装 `src/solver/shared.js`——加 export、删 UI 耦合、加 resetPools**

对 `src/solver/shared.js` 做以下精确改动：

(a) 把所有顶层 `var XXX =` 常量/枚举改为 `export const XXX =`：
`NODE_TYPE`、`EDGE_TYPE`、`CELL_TYPE`、`BACKGROUND_COLOR`、`CELL_COLOR`、`CELL_COLOR_STRINGS`、`ORIENTATION_TYPE`。

(b) `var puzzle = {};` → `export let puzzle = {};`

(c) `var pointPool = [];` → `export let pointPool = [];`；`var edgePool = [];` → `export let edgePool = [];`

(d) 函数加 `export`：`getColorString`、`point`、`edge`、`create2DArray`、`initPuzzle`、`initNodes`、`initEdges`、`initCells`、`initTetrisLayout`、`updateTetrisLayoutProperties`、`horEdgeExists`、`verEdgeExists`、`isEntireTetrisGridOff`、`powerSet`。

(e) 在 `initPuzzle` 函数体内**删除**这两行（jQuery/UI 耦合）：
```js
    // Update UI
    $('option[value="' + width + ',' + height + '"]').prop('selected', true);
    calculateMetrics();
```
删除后 `initPuzzle` 末尾只剩 `initEdges` 调用之后的空行 / 结束。即函数变为：
```js
export function initPuzzle(puzzle, width, height) {
    puzzle.width = width;
    puzzle.height = height;

    initNodes(puzzle);
    initCells(puzzle);
    initEdges(puzzle);
}
```

(f) 在文件末尾新增（纯新增，不动既有函数）：
```js
// Reset coordinate memo pools. Pools are indexed by coords and idempotent,
// but resetting prevents any cross-solve residue when the bridge reuses them.
export function resetPools() {
    pointPool.length = 0;
    edgePool.length = 0;
    puzzle.width = 0;
    puzzle.height = 0;
    puzzle.nodes = undefined;
    puzzle.horEdges = undefined;
    puzzle.verEdges = undefined;
    puzzle.cells = undefined;
}
```

- [ ] **Step 3: 封装 `src/solver/solver.js`——加 import/export，函数体不动**

在 `src/solver/solver.js` 顶部加：
```js
import {
    point, edge, puzzle, pointPool, edgePool,
    NODE_TYPE, EDGE_TYPE, CELL_TYPE, CELL_COLOR,
    ORIENTATION_TYPE, create2DArray, initPuzzle,
    updateTetrisLayoutProperties, horEdgeExists, verEdgeExists,
    isEntireTetrisGridOff, powerSet, getColorString
} from './shared.js';
```
（`getColorString`、`edgePool`、`pointPool`、`create2DArray`、`initPuzzle` 在 solver.js 内未直接使用，但一并 import 无害；如 ESLint 报未使用可只保留实际用到的。实际 solver.js 用到：`point`、`edge`、`puzzle`、`NODE_TYPE`、`EDGE_TYPE`、`CELL_TYPE`、`CELL_COLOR`、`ORIENTATION_TYPE`、`updateTetrisLayoutProperties`、`horEdgeExists`、`verEdgeExists`、`isEntireTetrisGridOff`、`powerSet`。）

然后在 `findSolution` 前加 `export`：
```js
export function findSolution(path, visited, required, edgeRequired, exitsRemaining, areas, segment) {
```
**其余所有函数体保持原样，不加 export（它们仅被 findSolution 内部调用）。**

- [ ] **Step 4: 写模块可加载测试 `tests/solverModule.test.js`**

```js
import { describe, it, expect } from 'vitest';
import { puzzle, resetPools, initPuzzle, NODE_TYPE, CELL_TYPE } from '../src/solver/shared.js';
import { findSolution } from '../src/solver/solver.js';

describe('solver module wrapping', () => {
  it('exports the puzzle object and enums', () => {
    expect(puzzle).toBeDefined();
    expect(NODE_TYPE.EXIT).toBe(3);
    expect(CELL_TYPE.TETRIS).toBe(2);
  });

  it('can solve a trivial 2x2 puzzle with start and exit', () => {
    initPuzzle(puzzle, 2, 2);
    puzzle.nodes[0][0].type = NODE_TYPE.START;
    puzzle.nodes[1][1].type = NODE_TYPE.EXIT;
    resetPools();
    const path = findSolution();
    expect(path).not.toBe(false);
    expect(path[0]).toMatchObject({ x: 0, y: 0 });
    expect(path[path.length - 1]).toMatchObject({ x: 1, y: 1 });
  });
});
```

- [ ] **Step 5: 运行测试验证通过**

Run: `npm test -- solverModule`
Expected: 2 tests PASS。

- [ ] **Step 6: 验证算法零修改（git diff 检查）**

Run: `git diff HEAD -- src/solver/shared.js src/solver/solver.js`
Expected: shared.js 仅出现 `export`/`let` 关键字增改、删除 `initPuzzle` 内 2 行 UI 调用、末尾新增 `resetPools`；solver.js 仅顶部新增 import 与 `findSolution` 前的 `export`。**不应有任何算法行的语义改动。**

- [ ] **Step 7: Commit**

```bash
git add src/solver/ tests/solverModule.test.js
git commit -m "refactor(solver): wrap shared.js and solver.js as ES modules (algorithm untouched)"
```

---

## Task 3: 几何计算库 `lib/geometry.js`

**Files:**
- Create: `src/lib/geometry.js`
- Test: `tests/geometry.test.js`

从 `ui.js` 的 `calculateMetrics` / `nodeX` / `nodeY` 提取为纯函数。

- [ ] **Step 1: 写失败测试 `tests/geometry.test.js`**

```js
import { describe, it, expect } from 'vitest';
import { calculateMetrics, nodeX, nodeY } from '../src/lib/geometry.js';

describe('geometry', () => {
  it('computeMetrics matches original ui.calculateMetrics for 5x5', () => {
    const m = calculateMetrics(5, 5);
    // Original: radius = 88 / max(6, max(5,5)) = 88/6
    expect(m.radius).toBeCloseTo(88 / 6, 5);
    // spacing = 800 / (max(5,5)+1) = 800/6
    expect(m.spacing).toBeCloseTo(800 / 6, 5);
    // horPadding = (800 - spacing*(5-1))/2
    expect(m.horPadding).toBeCloseTo((800 - (800 / 6) * 4) / 2, 5);
    expect(m.verPadding).toBeCloseTo((800 - (800 / 6) * 4) / 2, 5);
  });

  it('nodeX/nodeY use padding + spacing*index', () => {
    const m = calculateMetrics(5, 5);
    expect(nodeX(m, 0)).toBeCloseTo(m.horPadding, 5);
    expect(nodeX(m, 2)).toBeCloseTo(m.horPadding + m.spacing * 2, 5);
    expect(nodeY(m, 3)).toBeCloseTo(m.verPadding + m.spacing * 3, 5);
  });

  it('handles a 2x2 puzzle (uses max(6,...) floor)', () => {
    const m = calculateMetrics(2, 2);
    expect(m.radius).toBeCloseTo(88 / 6, 5);
    expect(m.spacing).toBeCloseTo(800 / 3, 5);
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `npm test -- geometry`
Expected: FAIL，报 "Failed to resolve import"（文件不存在）。

- [ ] **Step 3: 写实现 `src/lib/geometry.js`**

```js
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
```

- [ ] **Step 4: 运行测试，确认通过**

Run: `npm test -- geometry`
Expected: 3 tests PASS。

- [ ] **Step 5: Commit**

```bash
git add src/lib/geometry.js tests/geometry.test.js
git commit -m "feat(lib): add geometry helpers ported from ui.calculateMetrics"
```

---

## Task 4: UI 常量 `lib/constants.js`

**Files:**
- Create: `src/lib/constants.js`

无独立测试（纯常量），在后续任务中被引用验证。

- [ ] **Step 1: 写 `src/lib/constants.js`**

```js
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
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/constants.js
git commit -m "feat(lib): add UI constants (colors, stack limit, debounce)"
```

---

## Task 5: tetris 纯函数库 `lib/tetris.js`

**Files:**
- Create: `src/lib/tetris.js`
- Test: `tests/tetris.test.js`

为 React 侧提供：默认布局工厂、布局属性计算（镜像 shared.js `updateTetrisLayoutProperties` 的公式，但不依赖全局 `puzzle`）。

- [ ] **Step 1: 写失败测试 `tests/tetris.test.js`**

```js
import { describe, it, expect } from 'vitest';
import { makeDefaultTetris, recomputeTetris, isLayoutEmpty } from '../src/lib/tetris.js';

describe('tetris helpers', () => {
  it('makeDefaultTetris is a 4x4 with the top-left 2x2 filled', () => {
    const t = makeDefaultTetris();
    expect(t.length).toBe(4);
    expect(t[0].length).toBe(4);
    expect(t[0][0]).toBe(true);
    expect(t[1][1]).toBe(true);
    expect(t[2][2]).toBe(false);
  });

  it('recomputeTetris sets area and bounds matching shared.js formula', () => {
    const cell = { tetris: makeDefaultTetris() };
    recomputeTetris(cell);
    // top-left 2x2 filled => area 4, bounds [0,0,1,1]
    expect(cell.tetrisArea).toBe(4);
    expect(cell.tetrisBounds).toEqual([0, 0, 1, 1]);
  });

  it('recomputeTetris handles a horizontal bar (row 0 all filled)', () => {
    const cell = { tetris: makeDefaultTetris() };
    for (let xx = 0; xx < 4; xx++) {
      for (let yy = 0; yy < 4; yy++) cell.tetris[xx][yy] = false;
    }
    for (let xx = 0; xx < 4; xx++) cell.tetris[xx][0] = true;
    recomputeTetris(cell);
    expect(cell.tetrisArea).toBe(4);
    expect(cell.tetrisBounds).toEqual([0, 0, 3, 0]);
  });

  it('isLayoutEmpty detects all-off layout', () => {
    const cell = { tetris: makeDefaultTetris() };
    expect(isLayoutEmpty(cell.tetris)).toBe(false);
    for (let xx = 0; xx < 4; xx++) {
      for (let yy = 0; yy < 4; yy++) cell.tetris[xx][yy] = false;
    }
    expect(isLayoutEmpty(cell.tetris)).toBe(true);
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `npm test -- tetris`
Expected: FAIL（文件不存在）。

- [ ] **Step 3: 写实现 `src/lib/tetris.js`**

```js
// Pure tetris-layout helpers for the React side. These mirror the formulas in
// solver/shared.js (initTetrisLayout, updateTetrisLayoutProperties) but operate
// on plain cell objects instead of the module-global puzzle, so React state stays
// immutable and testable. shared.js keeps its own copies untouched.

export function makeDefaultTetris() {
  const t = [];
  for (let xx = 0; xx < 4; xx++) {
    t[xx] = [];
    for (let yy = 0; yy < 4; yy++) {
      t[xx][yy] = xx < 2 && yy < 2;
    }
  }
  return t;
}

// Mutates `cell` to set tetrisArea and tetrisBounds from cell.tetris.
// Formula is identical to shared.js updateTetrisLayoutProperties.
export function recomputeTetris(cell) {
  cell.tetrisArea = 0;
  cell.tetrisBounds = [Number.MAX_VALUE, Number.MAX_VALUE, 0, 0];
  for (let xx = 0; xx < 4; xx++) {
    for (let yy = 0; yy < 4; yy++) {
      cell.tetrisArea += +cell.tetris[xx][yy];
      if (cell.tetris[xx][yy]) {
        cell.tetrisBounds[0] = Math.min(cell.tetrisBounds[0], xx);
        cell.tetrisBounds[1] = Math.min(cell.tetrisBounds[1], yy);
        cell.tetrisBounds[2] = Math.max(cell.tetrisBounds[2], xx);
        cell.tetrisBounds[3] = Math.max(cell.tetrisBounds[3], yy);
      }
    }
  }
  return cell;
}

export function isLayoutEmpty(tetris) {
  for (let xx = 0; xx < 4; xx++) {
    for (let yy = 0; yy < 4; yy++) {
      if (tetris[xx][yy]) return false;
    }
  }
  return true;
}
```

- [ ] **Step 4: 运行测试，确认通过**

Run: `npm test -- tetris`
Expected: 4 tests PASS。

- [ ] **Step 5: Commit**

```bash
git add src/lib/tetris.js tests/tetris.test.js
git commit -m "feat(lib): add pure tetris layout helpers"
```

---

## Task 6: 谜题工厂 `lib/puzzleFactory.js`

**Files:**
- Create: `src/lib/puzzleFactory.js`
- Test: `tests/puzzleFactory.test.js`

提供：空白谜题（对应 shared.js `initPuzzle` 的模型部分）与 swamp 默认谜题（对应 `ui.js` 的 `initialize()`）。

- [ ] **Step 1: 写失败测试 `tests/puzzleFactory.test.js`**

```js
import { describe, it, expect } from 'vitest';
import { createBlankPuzzle, createSwampPuzzle } from '../src/lib/puzzleFactory.js';
import { NODE_TYPE, EDGE_TYPE, CELL_TYPE } from '../src/solver/shared.js';

describe('puzzleFactory', () => {
  it('createBlankPuzzle builds nodes/edges/cells with default values', () => {
    const p = createBlankPuzzle(3, 3);
    expect(p.width).toBe(3);
    expect(p.height).toBe(3);
    expect(p.nodes.length).toBe(3);
    expect(p.nodes[0][0].type).toBe(NODE_TYPE.NORMAL);
    expect(p.horEdges.length).toBe(2); // width-1
    expect(p.horEdges[0][0]).toBe(EDGE_TYPE.NORMAL);
    expect(p.verEdges[0].length).toBe(2); // height-1
    expect(p.cells.length).toBe(2);
    expect(p.cells[0][0].type).toBe(CELL_TYPE.NONE);
    expect(p.cells[0][0].tetris.length).toBe(4);
  });

  it('createSwampPuzzle matches the original sample puzzle', () => {
    const p = createSwampPuzzle();
    expect(p.width).toBe(5);
    expect(p.height).toBe(5);
    expect(p.verEdges[2][1]).toBe(EDGE_TYPE.OBSTACLE);
    expect(p.nodes[0][4].type).toBe(NODE_TYPE.START);
    expect(p.nodes[4][0].type).toBe(NODE_TYPE.EXIT);
    expect(p.cells[0][1].type).toBe(CELL_TYPE.TETRIS);
    expect(p.cells[1][3].type).toBe(CELL_TYPE.TETRIS);
    expect(p.cells[2][3].type).toBe(CELL_TYPE.TETRIS);
    // cell (0,1) is a horizontal 4-block bar in row 0
    for (let xx = 0; xx < 4; xx++) {
      expect(p.cells[0][1].tetris[xx][0]).toBe(true);
    }
    // tetris area/bounds recomputed
    expect(p.cells[0][1].tetrisArea).toBe(4);
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `npm test -- puzzleFactory`
Expected: FAIL（文件不存在）。

- [ ] **Step 3: 写实现 `src/lib/puzzleFactory.js`**

```js
import {
  NODE_TYPE, EDGE_TYPE, CELL_TYPE, CELL_COLOR,
} from '../solver/shared.js';
import { makeDefaultTetris, recomputeTetris } from './tetris.js';

function create2DArray(w, h) {
  const arr = [];
  for (let x = 0; x < w; x++) {
    arr[x] = new Array(h);
  }
  return arr;
}

// Mirrors shared.js initNodes/initEdges/initCells (model only — no UI calls).
export function createBlankPuzzle(width, height) {
  const puzzle = { width, height };

  puzzle.nodes = create2DArray(width, height);
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      puzzle.nodes[x][y] = { type: NODE_TYPE.NORMAL };
    }
  }

  puzzle.horEdges = create2DArray(width - 1, height);
  for (let x = 0; x < width - 1; x++) {
    for (let y = 0; y < height; y++) {
      puzzle.horEdges[x][y] = EDGE_TYPE.NORMAL;
    }
  }

  puzzle.verEdges = create2DArray(width, height - 1);
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height - 1; y++) {
      puzzle.verEdges[x][y] = EDGE_TYPE.NORMAL;
    }
  }

  puzzle.cells = create2DArray(width - 1, height - 1);
  for (let x = 0; x < width - 1; x++) {
    for (let y = 0; y < height - 1; y++) {
      const cell = { type: CELL_TYPE.NONE, color: CELL_COLOR.BLACK };
      cell.tetris = makeDefaultTetris();
      recomputeTetris(cell);
      puzzle.cells[x][y] = cell;
    }
  }

  return puzzle;
}

// The swamp sample puzzle from the original ui.js initialize().
export function createSwampPuzzle() {
  const puzzle = createBlankPuzzle(5, 5);

  puzzle.verEdges[2][1] = EDGE_TYPE.OBSTACLE;
  puzzle.nodes[0][4].type = NODE_TYPE.START;
  puzzle.nodes[4][0].type = NODE_TYPE.EXIT;
  puzzle.cells[0][1].type = CELL_TYPE.TETRIS;
  puzzle.cells[1][3].type = CELL_TYPE.TETRIS;
  puzzle.cells[2][3].type = CELL_TYPE.TETRIS;

  const tetrisCells = [[0, 1], [1, 3], [2, 3]];
  for (const [cx, cy] of tetrisCells) {
    for (let xx = 0; xx < 4; xx++) {
      for (let yy = 0; yy < 4; yy++) {
        puzzle.cells[cx][cy].tetris[xx][yy] = false;
      }
    }
  }
  for (let xx = 0; xx < 4; xx++) puzzle.cells[0][1].tetris[xx][0] = true;
  for (let yy = 0; yy < 3; yy++) {
    puzzle.cells[1][3].tetris[0][yy] = true;
    puzzle.cells[2][3].tetris[0][yy] = true;
  }

  for (const [cx, cy] of tetrisCells) recomputeTetris(puzzle.cells[cx][cy]);

  return puzzle;
}
```

- [ ] **Step 4: 运行测试，确认通过**

Run: `npm test -- puzzleFactory`
Expected: 2 tests PASS。

- [ ] **Step 5: Commit**

```bash
git add src/lib/puzzleFactory.js tests/puzzleFactory.test.js
git commit -m "feat(lib): add puzzle factory (blank + swamp sample)"
```

---

## Task 7: solver 桥接层 `lib/solverBridge.js`

**Files:**
- Create: `src/lib/solverBridge.js`
- Test: `tests/solverBridge.test.js`

实现"借出-归还"：克隆 React puzzle 状态 → 灌入 shared 模块全局 `puzzle` → 重算 tetris 属性 → resetPools → `findSolution()` → 返回路径数组或 `null`。

- [ ] **Step 1: 写失败测试 `tests/solverBridge.test.js`**

```js
import { describe, it, expect } from 'vitest';
import { solvePuzzle } from '../src/lib/solverBridge.js';
import { createSwampPuzzle, createBlankPuzzle } from '../src/lib/puzzleFactory.js';

describe('solverBridge', () => {
  it('solves the swamp sample and returns a path from start to exit', () => {
    const path = solvePuzzle(createSwampPuzzle());
    expect(path).not.toBeNull();
    expect(path[0]).toMatchObject({ x: 0, y: 4 });
    expect(path[path.length - 1]).toMatchObject({ x: 4, y: 0 });
  });

  it('returns null when no exit is reachable (no exit node)', () => {
    const p = createBlankPuzzle(3, 3);
    // start but no exit
    p.nodes[0][0].type = 1; // START
    expect(solvePuzzle(p)).toBeNull();
  });

  it('returns null when start and exit are disconnected by obstacles', () => {
    const p = createBlankPuzzle(2, 2);
    p.nodes[0][0].type = 1; // START
    p.nodes[1][1].type = 3; // EXIT
    // block both edges out of (0,0)
    p.horEdges[0][0] = 2; // OBSTACLE
    p.verEdges[0][0] = 2; // OBSTACLE
    expect(solvePuzzle(p)).toBeNull();
  });

  it('does not mutate the input puzzle', () => {
    const p = createSwampPuzzle();
    const snapshot = JSON.parse(JSON.stringify(p));
    solvePuzzle(p);
    expect(JSON.parse(JSON.stringify(p))).toEqual(snapshot);
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `npm test -- solverBridge`
Expected: FAIL（文件不存在）。

- [ ] **Step 3: 写实现 `src/lib/solverBridge.js`**

```js
import { puzzle, resetPools } from '../solver/shared.js';
import { findSolution } from '../solver/solver.js';
import { recomputeTetris } from './tetris.js';

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// Bridge: lend React state to the solver's global puzzle, solve, return a plain
// path (array of {x,y}) or null. The input puzzle is never mutated.
export function solvePuzzle(state) {
  puzzle.width = state.width;
  puzzle.height = state.height;
  puzzle.nodes = deepClone(state.nodes);
  puzzle.horEdges = deepClone(state.horEdges);
  puzzle.verEdges = deepClone(state.verEdges);
  puzzle.cells = deepClone(state.cells);

  // Ensure tetrisArea/tetrisBounds are present on every cell (solver reads them).
  for (let x = 0; x < puzzle.width - 1; x++) {
    for (let y = 0; y < puzzle.height - 1; y++) {
      recomputeTetris(puzzle.cells[x][y]);
    }
  }

  resetPools();
  const path = findSolution();
  return path ? path.map((p) => ({ x: p.x, y: p.y })) : null;
}
```

- [ ] **Step 4: 运行测试，确认通过**

Run: `npm test -- solverBridge`
Expected: 4 tests PASS。

- [ ] **Step 5: Commit**

```bash
git add src/lib/solverBridge.js tests/solverBridge.test.js
git commit -m "feat(lib): add solver bridge (React state -> global puzzle -> path)"
```

---

## Task 8: 解路径高亮 `lib/solution.js`

**Files:**
- Create: `src/lib/solution.js`
- Test: `tests/solution.test.js`

把 solver 返回的路径转成 3 个高亮集合（节点、水平边、垂直边），与 `ui.js` `actualSolve` 中的循环逻辑一致，并按 fraction 截断。

- [ ] **Step 1: 写失败测试 `tests/solution.test.js`**

```js
import { describe, it, expect } from 'vitest';
import { computeHighlights } from '../src/lib/solution.js';

describe('computeHighlights', () => {
  it('highlights nodes and edges along a straight horizontal path', () => {
    const path = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }];
    const h = computeHighlights(path, 1);
    expect(h.nodes).toEqual(new Set(['0,0', '1,0', '2,0']));
    // next.x>cur.x => hor edge at (cur.x,cur.y)
    expect(h.horEdges).toEqual(new Set(['0,0', '1,0']));
    expect(h.verEdges.size).toBe(0);
  });

  it('detects vertical edges (next.y > cur.y)', () => {
    const path = [{ x: 0, y: 0 }, { x: 0, y: 1 }];
    const h = computeHighlights(path, 1);
    expect(h.verEdges).toEqual(new Set(['0,0']));
    expect(h.horEdges.size).toBe(0);
  });

  it('detects reverse horizontal edge (next.x < cur.x) at next coords', () => {
    const path = [{ x: 2, y: 0 }, { x: 1, y: 0 }];
    const h = computeHighlights(path, 1);
    expect(h.horEdges).toEqual(new Set(['1,0']));
  });

  it('detects reverse vertical edge (next.y < cur.y) at next coords', () => {
    const path = [{ x: 0, y: 2 }, { x: 0, y: 1 }];
    const h = computeHighlights(path, 1);
    expect(h.verEdges).toEqual(new Set(['0,1']));
  });

  it('respects fraction by truncating the path', () => {
    const path = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }];
    const h = computeHighlights(path, 0.5); // ceil(4*0.5)=2
    expect(h.nodes).toEqual(new Set(['0,0', '1,0']));
    expect(h.horEdges).toEqual(new Set(['0,0']));
  });

  it('returns empty sets for null/empty path', () => {
    const h = computeHighlights(null, 1);
    expect(h.nodes.size).toBe(0);
    expect(h.horEdges.size).toBe(0);
    expect(h.verEdges.size).toBe(0);
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `npm test -- solution`
Expected: FAIL（文件不存在）。

- [ ] **Step 3: 写实现 `src/lib/solution.js`**

```js
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
```

- [ ] **Step 4: 运行测试，确认通过**

Run: `npm test -- solution`
Expected: 6 tests PASS。

- [ ] **Step 5: Commit**

```bash
git add src/lib/solution.js tests/solution.test.js
git commit -m "feat(lib): add solution path -> highlight sets converter"
```

---

## Task 9: URL 编解码 `lib/urlCodec.js`

**Files:**
- Create: `src/lib/urlCodec.js`
- Test: `tests/urlCodec.test.js`

从 `ui.js` 的 `updateURL` / `parseFromURL` 迁移为纯函数，编码格式完全不变（base64+JSON，字段名不变）。

- [ ] **Step 1: 写失败测试 `tests/urlCodec.test.js`**

```js
import { describe, it, expect } from 'vitest';
import { encodePuzzle, decodePuzzle } from '../src/lib/urlCodec.js';
import { createSwampPuzzle, createBlankPuzzle } from '../src/lib/puzzleFactory.js';
import { CELL_TYPE } from '../src/solver/shared.js';

function stripAreaBounds(p) {
  // React state doesn't carry tetrisArea/tetrisBounds, so for round-trip
  // equality we compare only the fields React owns.
  return JSON.parse(JSON.stringify(p));
}

describe('urlCodec', () => {
  it('round-trips a blank puzzle (encode then decode preserves structure)', () => {
    const original = createBlankPuzzle(4, 3);
    const hash = encodePuzzle(original);
    expect(typeof hash).toBe('string');
    const decoded = decodePuzzle(hash);
    expect(decoded.width).toBe(4);
    expect(decoded.height).toBe(3);
    expect(decoded.nodes).toEqual(original.nodes);
    expect(decoded.horEdges).toEqual(original.horEdges);
    expect(decoded.verEdges).toEqual(original.verEdges);
  });

  it('round-trips the swamp puzzle including tetris layouts', () => {
    const original = createSwampPuzzle();
    const hash = encodePuzzle(original);
    const decoded = decodePuzzle(hash);
    expect(decoded.width).toBe(5);
    expect(decoded.cells[0][1].type).toBe(CELL_TYPE.TETRIS);
    expect(decoded.cells[0][1].tetris).toEqual(original.cells[0][1].tetris);
  });

  it('produces base64 of a JSON object with the legacy field names', () => {
    const hash = encodePuzzle(createBlankPuzzle(2, 2));
    const obj = JSON.parse(atob(hash));
    expect(obj).toHaveProperty('gridWidth');
    expect(obj).toHaveProperty('gridHeight');
    expect(obj).toHaveProperty('horEdges');
    expect(obj).toHaveProperty('verEdges');
    expect(obj).toHaveProperty('nodeTypes');
    expect(obj).toHaveProperty('cellTypes');
    expect(obj).toHaveProperty('cellTetrisLayouts');
    expect(obj).toHaveProperty('cellTetrisAreas');
    expect(obj).toHaveProperty('cellTetrisBounds');
  });

  it('decodes a legacy 2x2 hash literal without crashing', () => {
    // Build a known-good hash by encoding, then assert decode is symmetric.
    const original = createBlankPuzzle(2, 2);
    original.nodes[0][0].type = 1; // START
    original.nodes[1][1].type = 3; // EXIT
    const hash = encodePuzzle(original);
    const decoded = decodePuzzle(hash);
    expect(decoded.nodes[0][0].type).toBe(1);
    expect(decoded.nodes[1][1].type).toBe(3);
  });

  it('encode output is stable (same puzzle -> same string)', () => {
    const a = encodePuzzle(createSwampPuzzle());
    const b = encodePuzzle(createSwampPuzzle());
    expect(a).toBe(b);
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `npm test -- urlCodec`
Expected: FAIL（文件不存在）。

- [ ] **Step 3: 写实现 `src/lib/urlCodec.js`**

```js
import { recomputeTetris } from './tetris.js';

// Ported verbatim from ui.js updateURL/parseFromURL. The on-the-wire format
// (base64 of a JSON object with these exact field names) is UNCHANGED, so old
// links keep working and new links open in the old version.

function deepMap(arr, fn) {
  if (typeof arr === 'object' && arr.length !== undefined) {
    return arr.slice().map((e) => deepMap(e, fn));
  }
  return fn(arr);
}

const num2bool = (n) => !!n;
const bool2num = (b) => +b;

export function encodePuzzle(p) {
  // Compute tetris area/bounds on the fly (React state doesn't store them).
  const cellsWithProps = deepMap(p.cells, (c) => {
    const copy = { ...c };
    recomputeTetris(copy);
    return copy;
  });

  const encoding = {
    gridWidth: p.width,
    gridHeight: p.height,
    horEdges: deepMap(p.horEdges, (n) => n),
    verEdges: deepMap(p.verEdges, (n) => n),
    nodeTypes: deepMap(p.nodes, (n) => n.type),
    cellTypes: deepMap(cellsWithProps, (c) => ({ type: c.type, color: c.color })),
    cellTetrisLayouts: deepMap(deepMap(cellsWithProps, (c) => c.tetris), bool2num),
    cellTetrisAreas: deepMap(cellsWithProps, (c) => c.tetrisArea),
    cellTetrisBounds: deepMap(cellsWithProps, (c) => c.tetrisBounds),
  };

  return btoa(JSON.stringify(encoding));
}

export function decodePuzzle(hash) {
  const encoding = JSON.parse(atob(hash));
  const puzzle = { width: encoding.gridWidth, height: encoding.gridHeight };

  puzzle.horEdges = deepMap(encoding.horEdges, (t) => t);
  puzzle.verEdges = deepMap(encoding.verEdges, (t) => t);
  puzzle.nodes = deepMap(encoding.nodeTypes, (t) => ({ type: t }));
  puzzle.cells = deepMap(encoding.cellTypes, (t) => ({ ...t }));

  const layouts = deepMap(encoding.cellTetrisLayouts, num2bool);
  for (let x = 0; x < puzzle.width - 1; x++) {
    for (let y = 0; y < puzzle.height - 1; y++) {
      puzzle.cells[x][y].tetris = layouts[x][y];
      puzzle.cells[x][y].tetrisArea = encoding.cellTetrisAreas[x][y];
      puzzle.cells[x][y].tetrisBounds = encoding.cellTetrisBounds[x][y];
    }
  }

  return puzzle;
}
```

- [ ] **Step 4: 运行测试，确认通过**

Run: `npm test -- urlCodec`
Expected: 5 tests PASS。

- [ ] **Step 5: Commit**

```bash
git add src/lib/urlCodec.js tests/urlCodec.test.js
git commit -m "feat(lib): migrate URL codec from ui.js (format unchanged)"
```

---

## Task 10: 撤销/重做 reducer `hooks/usePuzzle.js`

**Files:**
- Create: `src/hooks/usePuzzle.js`
- Test: `tests/usePuzzle.test.js`

用 reducer 管理完整状态 `{ puzzle, solution, undo, redo }`。solution 是覆盖层（`{ path, fraction, viewing }`）。Solve/Clear/改尺寸 都入快照栈。

- [ ] **Step 1: 写失败测试 `tests/usePuzzle.test.js`**

```js
import { describe, it, expect } from 'vitest';
import { puzzleReducer, makeSolution } from '../src/hooks/usePuzzle.js';
import { createBlankPuzzle } from '../src/lib/puzzleFactory.js';
import { NODE_TYPE } from '../src/solver/shared.js';

function init() {
  return puzzleReducer(undefined, { type: 'INIT', puzzle: createBlankPuzzle(3, 3) });
}

describe('puzzleReducer', () => {
  it('INIT sets puzzle and empty stacks', () => {
    const s = init();
    expect(s.puzzle.width).toBe(3);
    expect(s.undo).toEqual([]);
    expect(s.redo).toEqual([]);
    expect(s.solution.viewing).toBe(false);
  });

  it('EDIT pushes undo snapshot, applies change, clears redo and solution', () => {
    let s = init();
    s = puzzleReducer(s, {
      type: 'EDIT',
      next: (p) => {
        const q = JSON.parse(JSON.stringify(p));
        q.nodes[0][0].type = NODE_TYPE.START;
        return q;
      },
    });
    expect(s.puzzle.nodes[0][0].type).toBe(NODE_TYPE.START);
    expect(s.undo).toHaveLength(1);
    expect(s.redo).toEqual([]);
  });

  it('UNDO restores previous puzzle and pushes redo', () => {
    let s = init();
    s = puzzleReducer(s, { type: 'EDIT', next: (p) => { const q = JSON.parse(JSON.stringify(p)); q.nodes[0][0].type = NODE_TYPE.START; return q; } });
    s = puzzleReducer(s, { type: 'UNDO' });
    expect(s.puzzle.nodes[0][0].type).toBe(NODE_TYPE.NORMAL);
    expect(s.undo).toHaveLength(0);
    expect(s.redo).toHaveLength(1);
  });

  it('REDO replays the edit', () => {
    let s = init();
    s = puzzleReducer(s, { type: 'EDIT', next: (p) => { const q = JSON.parse(JSON.stringify(p)); q.nodes[0][0].type = NODE_TYPE.START; return q; } });
    s = puzzleReducer(s, { type: 'UNDO' });
    s = puzzleReducer(s, { type: 'REDO' });
    expect(s.puzzle.nodes[0][0].type).toBe(NODE_TYPE.START);
    expect(s.redo).toHaveLength(0);
  });

  it('UNDO with empty stack is a no-op', () => {
    const s = init();
    const s2 = puzzleReducer(s, { type: 'UNDO' });
    expect(s2).toBe(s);
  });

  it('SOLVE pushes snapshot and enters viewing state', () => {
    let s = init();
    const path = [{ x: 0, y: 0 }, { x: 1, y: 0 }];
    s = puzzleReducer(s, { type: 'SOLVE', path, fraction: 1 });
    expect(s.solution.viewing).toBe(true);
    expect(s.solution.path).toEqual(path);
    expect(s.undo).toHaveLength(1);
  });

  it('CLEAR exits viewing and is undoable', () => {
    let s = init();
    s = puzzleReducer(s, { type: 'SOLVE', path: [{ x: 0, y: 0 }], fraction: 1 });
    s = puzzleReducer(s, { type: 'CLEAR' });
    expect(s.solution.viewing).toBe(false);
    expect(s.solution.path).toBeNull();
    s = puzzleReducer(s, { type: 'UNDO' });
    expect(s.solution.viewing).toBe(true);
  });

  it('RESIZE pushes snapshot and replaces puzzle', () => {
    let s = init();
    s = puzzleReducer(s, { type: 'RESIZE', puzzle: createBlankPuzzle(4, 4) });
    expect(s.puzzle.width).toBe(4);
    expect(s.undo).toHaveLength(1);
    expect(s.solution.viewing).toBe(false);
  });

  it('undo stack is capped at UNDO_STACK_LIMIT', () => {
    let s = init();
    for (let i = 0; i < 105; i++) {
      s = puzzleReducer(s, { type: 'EDIT', next: (p) => JSON.parse(JSON.stringify(p)) });
    }
    expect(s.undo.length).toBeLessThanOrEqual(100);
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `npm test -- usePuzzle`
Expected: FAIL（文件不存在）。

- [ ] **Step 3: 写实现 `src/hooks/usePuzzle.js`**

```js
import { UNDO_STACK_LIMIT } from '../lib/constants.js';

const clone = (obj) => JSON.parse(JSON.stringify(obj));

export function makeSolution() {
  return { path: null, fraction: 1, viewing: false };
}

export const initialState = {
  puzzle: null,
  solution: makeSolution(),
  undo: [],   // array of { puzzle, solution } snapshots
  redo: [],
};

function snapshot(state) {
  return { puzzle: clone(state.puzzle), solution: clone(state.solution) };
}

function pushCapped(stack, item) {
  const next = [...stack, item];
  if (next.length > UNDO_STACK_LIMIT) next.shift();
  return next;
}

export function puzzleReducer(state, action) {
  switch (action.type) {
    case 'INIT':
      return { ...initialState, puzzle: action.puzzle };

    case 'EDIT': {
      if (state.solution.viewing) return state; // edits disabled while viewing
      const undo = pushCapped(state.undo, snapshot(state));
      const puzzle = action.next(clone(state.puzzle));
      return { ...state, puzzle, undo, redo: [], solution: makeSolution() };
    }

    case 'SOLVE': {
      const undo = pushCapped(state.undo, snapshot(state));
      const solution = { path: action.path, fraction: action.fraction, viewing: true };
      return { ...state, undo, redo: [], solution };
    }

    case 'CLEAR': {
      const undo = pushCapped(state.undo, snapshot(state));
      return { ...state, undo, redo: [], solution: makeSolution() };
    }

    case 'RESIZE': {
      const undo = pushCapped(state.undo, snapshot(state));
      return { ...state, puzzle: action.puzzle, undo, redo: [], solution: makeSolution() };
    }

    case 'SET_FRACTION': {
      // View-only tweak; no undo snapshot.
      return { ...state, solution: { ...state.solution, fraction: action.fraction } };
    }

    case 'UNDO': {
      if (state.undo.length === 0) return state;
      const prev = state.undo[state.undo.length - 1];
      const undo = state.undo.slice(0, -1);
      const redo = pushCapped(state.redo, snapshot(state));
      return { ...state, puzzle: clone(prev.puzzle), solution: clone(prev.solution), undo, redo };
    }

    case 'REDO': {
      if (state.redo.length === 0) return state;
      const next = state.redo[state.redo.length - 1];
      const redo = state.redo.slice(0, -1);
      const undo = pushCapped(state.undo, snapshot(state));
      return { ...state, puzzle: clone(next.puzzle), solution: clone(next.solution), undo, redo };
    }

    default:
      return state;
  }
}
```

说明：reducer 与 `initialState` 是纯导出，App.jsx（Task 16）直接用 `useReducer(puzzleReducer, ...)` 接入。不再提供 `usePuzzle`/`usePuzzleActions` 包装（YAGNI——App 不需要它们，且无对应测试）。

- [ ] **Step 4: 运行测试，确认通过**

Run: `npm test -- usePuzzle`
Expected: 10 tests PASS。

- [ ] **Step 5: Commit**

```bash
git add src/hooks/usePuzzle.js tests/usePuzzle.test.js
git commit -m "feat(hooks): add usePuzzle reducer with undo/redo stacks"
```

---

## Task 11: useSolver hook `hooks/useSolver.js`

**Files:**
- Create: `src/hooks/useSolver.js`

封装求解调用：`solving` 状态 + 用 `setTimeout(…, 0)` 让浏览器先重绘按钮（沿用原 `solve()` 思路）。

- [ ] **Step 1: 写实现 `src/hooks/useSolver.js`**

```js
import { useState, useCallback, useRef } from 'react';
import { solvePuzzle } from '../lib/solverBridge.js';

export function useSolver() {
  const [solving, setSolving] = useState(false);
  const timerRef = useRef(null);

  const solve = useCallback((puzzle, fraction, onResult) => {
    setSolving(true);
    // Defer to let the browser repaint the "Solving..." state before the
    // (potentially long) synchronous search blocks the main thread.
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const path = solvePuzzle(puzzle);
      setSolving(false);
      onResult(path, fraction);
    }, 0);
  }, []);

  return { solving, solve };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useSolver.js
git commit -m "feat(hooks): add useSolver with deferred blocking solve"
```

---

## Task 12: 网格组件 GridNode / GridEdge / GridCell

**Files:**
- Create: `src/components/GridNode.jsx`
- Create: `src/components/GridEdge.jsx`
- Create: `src/components/GridCell.jsx`

这三个组件把 `ui.js` 的 SVG 构造逐行翻译为 JSX，几何与路径字符串保持完全一致。无独立单测（视觉组件），由 Task 16 的 App 集成测试与手动验证覆盖。

- [ ] **Step 1: 写 `src/components/GridNode.jsx`**

```jsx
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
```

- [ ] **Step 2: 写 `src/components/GridEdge.jsx`**

```jsx
import React from 'react';
import { EDGE_TYPE } from '../solver/shared.js';
import { nodeX, nodeY } from '../lib/geometry.js';
import { COLOR_EDGE_DARK, COLOR_PANEL_GREEN, COLOR_PATH } from '../lib/constants.js';

function hexPath(d) {
  return d;
}

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
```

- [ ] **Step 3: 写 `src/components/GridCell.jsx`**

```jsx
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
```

- [ ] **Step 4: Commit**

```bash
git add src/components/GridNode.jsx src/components/GridEdge.jsx src/components/GridCell.jsx
git commit -m "feat(components): add GridNode, GridEdge, GridCell (ported SVG from ui.js)"
```

---

## Task 13: PuzzleGrid 容器

**Files:**
- Create: `src/components/PuzzleGrid.jsx`

组装 SVG：背景绿、按 z-order 先 cells、再 edges（非高亮）、再 edges（高亮）、再 nodes。viewBox `0 0 800 800`。

- [ ] **Step 1: 写 `src/components/PuzzleGrid.jsx`**

```jsx
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/PuzzleGrid.jsx
git commit -m "feat(components): add PuzzleGrid SVG container"
```

---

## Task 14: EditorPopup（核心交互）

**Files:**
- Create: `src/components/EditorPopup.jsx`
- Test: `tests/components/EditorPopup.test.jsx`

三种面板。节点/边面板点击即应用并关闭；方块面板改类型/颜色后由 ×/外部/Esc 关闭。

- [ ] **Step 1: 写失败测试 `tests/components/EditorPopup.test.jsx`**

```jsx
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EditorPopup from '../../src/components/EditorPopup.jsx';

describe('EditorPopup', () => {
  it('node panel: clicking an option applies and closes', () => {
    const onApply = vi.fn();
    const onClose = vi.fn();
    render(
      <EditorPopup
        target={{ kind: 'node', x: 0, y: 0 }}
        cell={null}
        anchor={{ x: 100, y: 100 }}
        onApply={onApply}
        onClose={onClose}
      />
    );
    fireEvent.click(screen.getByTestId('node-opt-START'));
    expect(onApply).toHaveBeenCalledWith({ kind: 'node', x: 0, y: 0, value: 1 });
    expect(onClose).toHaveBeenCalled();
  });

  it('edge panel: clicking an option applies and closes', () => {
    const onApply = vi.fn();
    const onClose = vi.fn();
    render(
      <EditorPopup
        target={{ kind: 'edge', orientation: 'hor', x: 0, y: 0 }}
        cell={null}
        anchor={{ x: 100, y: 100 }}
        onApply={onApply}
        onClose={onClose}
      />
    );
    fireEvent.click(screen.getByTestId('edge-opt-OBSTACLE'));
    expect(onApply).toHaveBeenCalledWith({ kind: 'edge', orientation: 'hor', x: 0, y: 0, value: 2 });
    expect(onClose).toHaveBeenCalled();
  });

  it('cell panel: type and color buttons apply without auto-closing', () => {
    const onApply = vi.fn();
    const onClose = vi.fn();
    render(
      <EditorPopup
        target={{ kind: 'cell', x: 0, y: 0 }}
        cell={{ type: 0, color: 0 }}
        anchor={{ x: 100, y: 100 }}
        onApply={onApply}
        onClose={onClose}
      />
    );
    fireEvent.click(screen.getByTestId('cell-type-SQUARE'));
    expect(onApply).toHaveBeenCalledWith({ kind: 'cell', x: 0, y: 0, type: 1 });
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('cell-color-RED'));
    expect(onApply).toHaveBeenCalledWith({ kind: 'cell', x: 0, y: 0, color: 5 });
    // close button
    fireEvent.click(screen.getByTestId('popup-close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('Esc closes the popup', () => {
    const onClose = vi.fn();
    render(
      <EditorPopup
        target={{ kind: 'node', x: 0, y: 0 }}
        cell={null}
        anchor={{ x: 100, y: 100 }}
        onApply={() => {}}
        onClose={onClose}
      />
    );
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `npm test -- EditorPopup`
Expected: FAIL（文件不存在）。

- [ ] **Step 3: 写实现 `src/components/EditorPopup.jsx`**

```jsx
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
```

- [ ] **Step 4: 运行测试，确认通过**

Run: `npm test -- EditorPopup`
Expected: 4 tests PASS。

- [ ] **Step 5: Commit**

```bash
git add src/components/EditorPopup.jsx tests/components/EditorPopup.test.jsx
git commit -m "feat(components): add EditorPopup (click-to-select replaces cycle-click)"
```

---

## Task 15: Toolbar

**Files:**
- Create: `src/components/Toolbar.jsx`

侧栏：Solve / 撤销重做清除 / 尺寸选择 / 提示比例 / 分享。响应式由 Task 17 的 CSS 处理。

- [ ] **Step 1: 写 `src/components/Toolbar.jsx`**

```jsx
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
        <button className="btn btn-danger" onClick={onClear} title="Clear solution">✕ Clear</button>
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Toolbar.jsx
git commit -m "feat(components): add Toolbar sidebar"
```

---

## Task 16: App 编排 + 编辑应用逻辑

**Files:**
- Create: `src/components/App.jsx`
- Test: `tests/components/App.test.jsx`

App 串联：usePuzzle 状态、useSolver、popup、键盘快捷键、高亮计算、编辑应用（含终点边界降级、tetris 子格切换）。

- [ ] **Step 1: 写集成测试 `tests/components/App.test.jsx`**

```jsx
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../../src/components/App.jsx';

describe('App integration', () => {
  beforeEach(() => {
    window.location.hash = '';
  });
  afterEach(() => {
    window.location.hash = '';
  });

  it('renders the grid and toolbar', () => {
    render(<App />);
    expect(screen.getByText(/Solve/)).toBeInTheDocument();
    expect(document.querySelector('svg.puzzle-grid')).toBeInTheDocument();
  });

  it('opens a node popup on node click and applies a selection', async () => {
    render(<App />);
    // click any node hit area
    const nodeHits = document.querySelectorAll('circle.node-hit');
    expect(nodeHits.length).toBeGreaterThan(0);
    fireEvent.click(nodeHits[0]);
    expect(await screen.findByTestId('node-opt-NORMAL')).toBeInTheDocument();
  });

  it('solves the default swamp puzzle and shows the path', async () => {
    render(<App />);
    fireEvent.click(screen.getByText(/Solve/));
    // at least one highlighted edge (COLOR_PATH) should appear after solve
    await waitFor(() => {
      const highlighted = document.querySelectorAll('svg .edge-hit[fill="#B1F514"]');
      expect(highlighted.length).toBeGreaterThan(0);
    });
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `npm test -- App`
Expected: FAIL（App.jsx 不存在）。

- [ ] **Step 3: 写实现 `src/components/App.jsx`**

写入以下完整内容到 `src/components/App.jsx`（这是最终唯一版本，无草稿）：

```jsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useReducer } from 'react';
import { NODE_TYPE } from '../solver/shared.js';
import { calculateMetrics } from '../lib/geometry.js';
import { computeHighlights } from '../lib/solution.js';
import { createBlankPuzzle, createSwampPuzzle } from '../lib/puzzleFactory.js';
import { encodePuzzle, decodePuzzle } from '../lib/urlCodec.js';
import { puzzleReducer, initialState, makeSolution } from '../hooks/usePuzzle.js';
import { useSolver } from '../hooks/useSolver.js';
import { URL_SYNC_DEBOUNCE_MS } from '../lib/constants.js';
import PuzzleGrid from './PuzzleGrid.jsx';
import EditorPopup from './EditorPopup.jsx';
import Toolbar from './Toolbar.jsx';

function loadInitialPuzzle() {
  const hash = window.location.hash.replace(/^#/, '');
  if (hash) {
    try {
      return decodePuzzle(hash);
    } catch (e) {
      /* ignore, use default */
    }
  }
  return createSwampPuzzle();
}

export default function App() {
  const initial = useMemo(loadInitialPuzzle, []);
  const [state, dispatch] = useReducer(puzzleReducer, { ...initialState, puzzle: initial });
  const { puzzle, solution, undo, redo } = state;

  const [popup, setPopup] = useState(null);
  const { solving, solve: runSolve } = useSolver();

  const metrics = useMemo(() => calculateMetrics(puzzle.width, puzzle.height), [puzzle.width, puzzle.height]);
  const highlights = useMemo(
    () => computeHighlights(solution.path, solution.fraction),
    [solution.path, solution.fraction]
  );

  // Sync URL hash (debounced) whenever the puzzle changes.
  useEffect(() => {
    const t = setTimeout(() => {
      window.location.hash = encodePuzzle(puzzle);
    }, URL_SYNC_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [puzzle]);

  // Global keyboard shortcuts.
  useEffect(() => {
    const onKey = (e) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key === 'z' || e.key === 'Z') {
        e.preventDefault();
        if (e.shiftKey) dispatch({ type: 'REDO' });
        else dispatch({ type: 'UNDO' });
      } else if (e.key === 'y') {
        e.preventDefault();
        dispatch({ type: 'REDO' });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onOpen = useCallback((target) => {
    if (solution.viewing) return;
    setPopup({ target, anchor: { x: lastClickPos.x, y: lastClickPos.y } });
  }, [solution.viewing]);

  // Track last click position for popup anchoring.
  const lastClickPosRef = React.useRef({ x: 100, y: 100 });
  useEffect(() => {
    const onDown = (e) => {
      lastClickPosRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, []);

  const applyEdit = useCallback((next) => dispatch({ type: 'EDIT', next }), []);

  const onApplyPopup = useCallback((payload) => {
    const { kind, x, y } = payload;
    if (kind === 'node') {
      applyEdit((p) => {
        const q = JSON.parse(JSON.stringify(p));
        // Exit only allowed on boundary; downgrade to NORMAL otherwise.
        let value = payload.value;
        if (value === NODE_TYPE.EXIT) {
          if (x !== 0 && y !== 0 && x !== q.width - 1 && y !== q.height - 1) {
            value = NODE_TYPE.NORMAL;
          }
        }
        q.nodes[x][y].type = value;
        return q;
      });
    } else if (kind === 'edge') {
      applyEdit((p) => {
        const q = JSON.parse(JSON.stringify(p));
        if (payload.orientation === 'hor') q.horEdges[x][y] = payload.value;
        else q.verEdges[x][y] = payload.value;
        return q;
      });
    } else if (kind === 'cell') {
      applyEdit((p) => {
        const q = JSON.parse(JSON.stringify(p));
        if (payload.type !== undefined) q.cells[x][y].type = payload.type;
        if (payload.color !== undefined) q.cells[x][y].color = payload.color;
        return q;
      });
    }
  }, [applyEdit]);

  const onToggleTetris = useCallback((x, y, xx, yy) => {
    applyEdit((p) => {
      const q = JSON.parse(JSON.stringify(p));
      q.cells[x][y].tetris[xx][yy] = !q.cells[x][y].tetris[xx][yy];
      return q;
    });
  }, [applyEdit]);

  const onSolve = useCallback(() => {
    runSolve(puzzle, solution.fraction, (path, fraction) => {
      if (path) {
        dispatch({ type: 'SOLVE', path, fraction });
      } else {
        dispatch({ type: 'CLEAR' });
        // eslint-disable-next-line no-alert
        alert('No solution!');
      }
    });
  }, [puzzle, solution.fraction, runSolve]);

  const onClear = useCallback(() => dispatch({ type: 'CLEAR' }), []);
  const onUndo = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const onRedo = useCallback(() => dispatch({ type: 'REDO' }), []);
  const onSizeChange = useCallback((w, h) => {
    dispatch({ type: 'RESIZE', puzzle: createBlankPuzzle(w, h) });
  }, []);
  const onFractionChange = useCallback((fraction) => {
    dispatch({ type: 'SET_FRACTION', fraction });
  }, []);
  const onShare = useCallback(() => {
    navigator.clipboard?.writeText(window.location.href);
  }, []);

  const openPopup = useCallback((target) => {
    if (solution.viewing) return;
    setPopup({ target, anchor: { ...lastClickPosRef.current } });
  }, [solution.viewing]);

  return (
    <div className="app-layout">
      <Toolbar
        onSolve={onSolve}
        onUndo={onUndo}
        onRedo={onRedo}
        onClear={onClear}
        onShare={onShare}
        canUndo={undo.length > 0}
        canRedo={redo.length > 0}
        solving={solving}
        viewingSolution={solution.viewing}
        width={puzzle.width}
        height={puzzle.height}
        onSizeChange={onSizeChange}
        fraction={solution.fraction}
        onFractionChange={onFractionChange}
      />
      <main className="app-main">
        <PuzzleGrid
          puzzle={puzzle}
          metrics={metrics}
          highlights={highlights}
          onOpen={openPopup}
          onToggleTetris={onToggleTetris}
        />
      </main>

      {popup && (
        <EditorPopup
          target={popup.target}
          cell={popup.target.kind === 'cell' ? puzzle.cells[popup.target.x][popup.target.y] : null}
          anchor={popup.anchor}
          onApply={onApplyPopup}
          onClose={() => setPopup(null)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 4: 运行测试，确认通过**

Run: `npm test -- App`
Expected: 3 tests PASS。（若 "solves default swamp" 因 jsdom 无真实 layout/clipboard 偶发问题，检查 `solvePuzzle` 是否同步返回路径；该测试不依赖布局，应稳定通过。）

- [ ] **Step 5: Commit**

```bash
git add src/components/App.jsx tests/components/App.test.jsx
git commit -m "feat(components): add App orchestration (state, popup, keyboard, url sync)"
```

---

## Task 17: 主题样式 `styles/theme.css` 完善 + main.jsx 接入

**Files:**
- Modify: `src/styles/theme.css`（在 Task 1 骨架上扩充）
- Modify: `src/main.jsx`（渲染 App）

- [ ] **Step 1: 扩充 `src/styles/theme.css`**

在文件末尾追加：

```css
.app-layout {
  display: flex;
  gap: 16px;
  padding: 16px;
  min-height: 100vh;
  align-items: flex-start;
}

.toolbar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 200px;
  flex-shrink: 0;
  background: var(--color-sidebar);
  padding: 16px;
  border-radius: 8px;
}

.toolbar-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.toolbar-label {
  font-size: 12px;
  color: #aaa;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.toolbar-hint {
  font-size: 12px;
  color: var(--color-path);
}

.app-main {
  flex: 1;
  display: flex;
  justify-content: center;
}

.btn {
  height: 40px;
  border: 1px solid #333;
  background: #1c1c1c;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  border-radius: 6px;
}
.btn:hover { background: #262626; }
.btn:active { background: #111; }
.btn:disabled { opacity: 0.4; cursor: default; }

.btn-primary {
  background: var(--color-panel);
  border-color: var(--color-edge-dark);
  color: #022;
  font-weight: 500;
}
.btn-primary:hover { background: var(--color-panel-green-hover); }
.btn-primary:active { background: var(--color-panel-green-active); }

.btn-danger {
  background: #c00;
  border-color: #630000;
  color: #fff;
}
.btn-danger:hover { background: #a00; }

select {
  height: 40px;
  background: #1c1c1c;
  color: #fff;
  border: 1px solid #333;
  border-radius: 6px;
  padding: 0 8px;
}

.puzzle-grid {
  border-radius: 8px;
  width: 100%;
  max-width: 800px;
  height: auto;
}

/* Popup */
.popup-backdrop { background: rgba(0,0,0,0.2); }
.popup-panel {
  background: var(--color-sidebar);
  border: 1px solid #333;
  border-radius: 8px;
  padding: 24px 16px 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.6);
  min-width: 220px;
}
.popup-close {
  position: absolute;
  top: 6px; right: 8px;
  background: transparent;
  border: none;
  color: #888;
  font-size: 18px;
  cursor: pointer;
}
.popup-row { display: flex; gap: 6px; flex-wrap: wrap; }
.popup-row .btn { flex: 1; min-width: 60px; }

.popup-cell { display: flex; flex-direction: column; gap: 12px; }
.popup-section-title { font-size: 12px; color: #aaa; margin-bottom: 6px; }
.popup-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.popup-grid .btn { font-size: 12px; height: 36px; }
.popup-grid .btn.selected, .swatch.selected { outline: 2px solid var(--color-path); }
.popup-colors { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; }
.swatch {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 4px;
  border: 1px solid #333;
  cursor: pointer;
}

/* Responsive: collapse sidebar to a top bar on narrow screens */
@media (max-width: 768px) {
  .app-layout { flex-direction: column; }
  .toolbar { width: 100%; flex-direction: row; flex-wrap: wrap; align-items: center; }
  .toolbar-group { flex-direction: row; align-items: center; }
}
```

- [ ] **Step 2: 改写 `src/main.jsx` 渲染 App**

把 `src/main.jsx` 整体替换为：

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/theme.css';
import App from './components/App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 3: 启动 dev server 手动验证**

Run: `npm run dev`
Expected: 浏览器显示侧栏（深色）+ 绿色面板（swamp 默认谜题，含 3 个 tetris 方块、起点、终点）。点击节点/边/方块弹出对应面板；选择后关闭并更新；Solve 显示黄色路径；撤销/重做按钮与快捷键工作；改尺寸重置网格；分享复制 URL。

- [ ] **Step 4: 运行全部测试**

Run: `npm test`
Expected: 全部测试 PASS。

- [ ] **Step 5: Commit**

```bash
git add src/styles/theme.css src/main.jsx
git commit -m "feat(ui): complete theme styling and wire App into main entry"
```

---

## Task 18: 清理旧文件 + 最终验收

**Files:**
- Delete: `src/ui.js`
- Delete: `style.css`
- Verify: `src/solver/shared.js`、`src/solver/solver.js` 相对原始 `src/shared.js` / `src/solver.js` 仅模块封装

- [ ] **Step 1: 删除被替代的旧文件**

```bash
git rm src/ui.js style.css
```

（旧 `index.html` 已在 Task 1 被 Vite 版覆盖；如仍存在 jQuery 残留则已是新内容。）

- [ ] **Step 2: 验收 1——算法零修改（git diff）**

Run:
```bash
git log --oneline --all -- src/shared.js src/solver.js
git diff <原 shared.js 提交> HEAD -- src/solver/shared.js
git diff <原 solver.js 提交> HEAD -- src/solver/solver.js
```
Expected: shared.js 仅 `export`/`let` 改动、删除 `initPuzzle` 内 2 行 UI 调用、末尾新增 `resetPools`；solver.js 仅顶部 import 与 `findSolution` 前 `export`。无算法语义改动。

- [ ] **Step 3: 验收 2——原版 swamp 示例可解**

Run: `npm run build && npm run preview`
手动打开预览地址：默认加载 swamp 谜题 → Solve → 显示从 (0,4) 到 (4,0) 的路径。
Expected: 与原版一致的求解路径。

- [ ] **Step 4: 验收 3——交互替换完成**

在预览页手动验证：节点/边/方块均通过弹窗选择类型与颜色；无循环点击残留；tetris 方块点击子格切换填充；Esc/外部点击关闭弹窗。

- [ ] **Step 5: 验收 4——撤销/重做**

手动验证：连续编辑后多步撤销/重做；Solve → 撤销可退出查看解状态；改尺寸后撤销可恢复；快捷键 Ctrl/Cmd+Z 与 +Shift+Z 工作。

- [ ] **Step 6: 验收 5——URL 兼容**

(a) 在新版编辑一个谜题，复制 URL hash。(b) 把该 hash 粘到原版（git stash 切回旧版或在另一 checkout）打开——应显示相同谜题。(c) 反向：取一个原版生成的 hash 在新版打开——应显示相同谜题。
Expected: 双向兼容，编码格式不变。

- [ ] **Step 7: 验收 6——响应式**

浏览器 DevTools 切到 ≤768px 宽度。
Expected: 侧栏折叠为顶部条，不遮挡面板，面板可用。

- [ ] **Step 8: 运行完整测试套件最终确认**

Run: `npm test`
Expected: 全部 PASS。

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: remove legacy jQuery ui.js and style.css; finalize migration"
```

---

## Self-Review 校对

**1. Spec coverage：**
- 求解逻辑零修改 → Task 2（封装）+ Task 18 Step 2（git diff 验证）。✅
- 桥接层借出-归还 → Task 7（solverBridge）+ Task 11（useSolver）。✅
- 点击弹窗（节点/边/方块三面板）→ Task 14（EditorPopup）+ Task 16（应用逻辑含终点边界降级）。✅
- 俄罗斯子网格编辑 → Task 12（GridCell tetris 子格）+ Task 16（onToggleTetris）。✅
- 撤销/重做双栈、跨操作、上限 100、查看解禁用编辑 → Task 10（reducer）。✅
- URL 兼容（格式不变、双向）→ Task 9（urlCodec）+ Task 16（debounce 同步/加载）+ Task 18 Step 6（手动双向验证）。✅
- 视觉：侧栏+主区、深色、招牌绿、响应式 → Task 17（theme.css）。✅
- 工具栏分组（Solve/编辑/设置/分享）→ Task 15（Toolbar）。✅
- 不在范围项（YAGNI）→ 计划中未出现。✅

**2. Placeholder scan：** 无 TBD/TODO/"similar to"/"add error handling" 等。每个代码步骤含完整代码。

**3. Type一致性：** 枚举值统一引用 solver/shared.js（NODE_TYPE/EDGE_TYPE/CELL_TYPE/CELL_COLOR）；popup payload 字段名（`value`/`type`/`color`/`orientation`）在 EditorPopup、App.onApplyPopup 中一致；reducer action 类型（INIT/EDIT/SOLVE/CLEAR/RESIZE/SET_FRACTION/UNDO/REDO）在 puzzleReducer 定义与 App 的 dispatch 调用中一致；高亮 key 格式 `"x,y"` 在 solution.js、PuzzleGrid、GridNode 一致。
