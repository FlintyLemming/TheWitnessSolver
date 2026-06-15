# The Witness Solver — UI 现代化重构设计

日期：2026-06-15
状态：待批准

## 背景与目标

当前项目是纯 HTML + jQuery 2.2 + SVG 的静态页面，无构建步骤。主要痛点：

- **交互低效**：所有元素（节点、边、方块）通过"循环点击"切换——方块需左键连点切换 7 种类型、右键连点切换 9 种颜色。
- **界面陈旧**：单列布局，按钮挤在一行，无撤销/重做。

目标：把 UI 层重写为现代前端，把循环点击替换为点击弹窗选择；新增撤销/重做；保留 URL 分享并向后兼容旧链接。

### 核心约束：求解逻辑零修改

`src/solver.js`（branch-and-bound 算法，含 `findSolution` 及其调用的 `checkRequiredNodes`、`checkRequiredEdges`、`separateAreasStep`、`getNextNodes`、`determineAuxilaryRequired` 等所有函数）和 `src/shared.js` 的 puzzle 模型定义**原样保留**。只做从全局脚本到 ES module 的封装，算法函数体不做实质改动。实现完成后用 `git diff` 验证。

## 技术栈

- **React + Vite**（用户选定）
- TypeScript 不引入（保持 JS，与原 solver 文件一致，降低封装难度）
- 部署：Vite 构建产物可直接挂 GitHub Pages

## 架构

### 目录结构

```
TheWitnessSolver/
├── src/
│   ├── solver/                  ← 求解逻辑，原样保留 + 模块封装
│   │   ├── shared.js            ← 原 shared.js（puzzle 模型、枚举、point/edge 池）
│   │   └── solver.js            ← 原 solver.js（branch-and-bound 算法）
│   ├── components/
│   │   ├── App.jsx              ← 根组件，全局状态编排
│   │   ├── PuzzleGrid.jsx       ← SVG 网格容器（节点/边/方块）
│   │   ├── GridCell.jsx         ← 单个方块渲染 + 各符号子组件
│   │   ├── GridNode.jsx         ← 节点渲染（起点/终点/六边形）
│   │   ├── GridEdge.jsx         ← 边渲染（普通/必需/障碍）
│   │   ├── EditorPopup.jsx      ← 点击弹窗（核心交互）
│   │   ├── Toolbar.jsx          ← 左侧工具栏
│   │   └── icons/               ← 符号 SVG（方块/太阳/取消/俄罗斯方块）
│   ├── hooks/
│   │   ├── usePuzzle.js         ← puzzle 状态 + 撤销/重做栈
│   │   └── useSolver.js         ← 求解调用封装
│   ├── lib/
│   │   ├── solverBridge.js      ← 桥接层：React 状态 → solver 全局 → 还原
│   │   ├── urlCodec.js          ← URL hash 编解码（从 ui.js 迁移，格式不变）
│   │   └── constants.js         ← UI 用常量（颜色名、几何参数）
│   ├── styles/
│   │   └── theme.css            ← 全局样式 + CSS 变量
│   └── main.jsx                 ← React 入口
├── index.html                   ← Vite 入口 HTML
├── package.json
└── vite.config.js
```

### 数据模型与桥接层

React 管理一个规范的 puzzle 对象，字段结构与 solver 的全局 `puzzle` 逐字段相同：

```js
{
  width: 5,
  height: 5,
  nodes:    [[{type}, ...], ...],   // [width][height]
  horEdges: [[n, ...], ...],        // [width-1][height]
  verEdges: [[n, ...], ...],        // [width][height-1]
  cells: [[{type, color, tetris, tetrisArea, tetrisBounds}, ...], ...]  // [width-1][height-1]
}
```

**桥接层 `solverBridge.js`** 采用"借出-归还"模式：

1. 把 React puzzle 状态灌入 solver/shared 模块的全局 `puzzle`
2. 重置 `pointPool` / `edgePool`（坐标索引池，与 puzzle 内容无关，重置防止跨次残留）
3. 调用 `findSolution()`（无参调用，内部自动初始化 required/exit）
4. 取回 path 或 false
5. 归还：调用结束后 solver 的全局状态不被外部依赖，React 始终以自己的状态为准

类型枚举 `NODE_TYPE` / `EDGE_TYPE` / `CELL_TYPE` / `CELL_COLOR` 保留在 solver/shared 模块，React 组件通过 `import` 引用——不复制，避免定义漂移。

## 交互设计：点击弹窗

点击网格上任意元素 → 弹出面板 → 选择 → 关闭。三种元素各有面板。

### 节点面板

4 个选项横排，点击即应用并关闭：
- 普通（圆点）、起点（大圆点）、必需（六边形）、终点（半圆 + 槽）

限制（沿用原逻辑）：终点只能设在边界节点；点非边界节点的终点会自动降为普通。

### 边面板

3 个选项横排，点击即应用并关闭：
- 普通、必需（六边形）、障碍（粗实线）

### 方块面板

分两区，类型与颜色独立选择，可同时改两者：
- 上区「类型」：无、方块、俄罗斯方块、旋转俄罗斯、空心俄罗斯、太阳、取消符（7 个图标，可换行）
- 下区「颜色」：黑/白/青/品红/黄/红/绿/蓝/橙（9 色色板）
- 关闭方式：点 ×、点面板外空白、按 Esc

**俄罗斯方块特例**：选中俄罗斯类型后，方块内出现 4×4 子网格，点击子格切换填充（即原项目右键 tetris 编辑功能），选空心俄罗斯类型同样用此子网格。

### 桌面端 hover 增强

桌面端鼠标悬停元素时面板可更快出现（可选增强），触屏端用点击。

## 撤销 / 重做

- 用双栈实现：每次应用一次编辑操作前，push 当前 puzzle 深拷贝到撤销栈
- 撤销（Cmd/Ctrl+Z）：把当前状态压入重做栈，pop 撤销栈恢复
- 重做（Cmd/Ctrl+Shift+Z）：反向操作
- Solve / Clear / 改尺寸 作为整体快照入栈，撤销可跨操作回退
- 栈上限 100 步，溢出丢弃最旧
- Solve 后进入"查看解"状态，此状态下编辑被禁用（沿用原 `viewingSolution` 语义），需先 Clear 才能编辑

## URL 分享（向后兼容）

从原 `ui.js` 的 `updateURL` / `parseFromURL` 迁移到 `lib/urlCodec.js`：
- **编码格式完全不变**（同样的 base64+JSON 结构：gridWidth/gridHeight/horEdges/verEdges/nodeTypes/cellTypes/cellTetrisLayouts/cellTetrisAreas/cellTetrisBounds）
- 旧链接 `#<base64>` 继续可打开
- 新链接与老版本互通
- React 状态变化时同步 hash（debounce）；页面加载时从 hash 还原状态

## 视觉风格：侧栏 + 主区

```
┌─────────────────────────────────────────────┐
│ ┌──────────┐  ┌──────────────────────────┐  │
│ │ 工具栏    │  │                          │  │
│ │ (侧栏)   │  │     绿色面板 (SVG)       │  │
│ │          │  │                          │  │
│ │ Solve ▶  │  │     点击元素 → 弹窗       │  │
│ │ ↶ ↷      │  │                          │  │
│ │ 尺寸 ▾   │  │                          │  │
│ │ 提示 ▾   │  │                          │  │
│ │ 分享 🔗  │  │                          │  │
│ │ 清除 ✕   │  │                          │  │
│ └──────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────┘
```

- 深色背景（`#0a0a0a`），侧栏 `#141414`
- 面板保留招牌绿 `#00E94F`，解题路径高亮保留 `#B1F514`
- 工具栏分组：主操作（Solve）/ 编辑（撤销重做清除）/ 设置（尺寸提示）/ 分享
- 响应式：窄屏时侧栏折叠为顶部条
- 现代字体栈；按钮 hover/active 反馈

## 不在范围内（YAGNI）

以下明确**不做**：
- 谜题库 / 预设示例集
- 导出 PNG
- 求解过程可中断 / 进度显示
- TypeScript 迁移
- 国际化

## 验收标准

1. **求解逻辑等价**：`git diff` 显示 `src/solver/shared.js` 与 `src/solver/solver.js` 相对原 `src/shared.js` / `src/solver.js` 无算法函数体实质改动（仅模块封装：加 `export`、去除全局脚本标签引用）。
2. **原版示例可解**：原项目默认加载的 swamp 示例谜题（5×5，含俄罗斯方块）能正确求解并显示与原版一致的路径。
3. **交互替换完成**：节点/边/方块均通过点击弹窗选择类型与颜色，无循环点击残留。
4. **撤销/重做可用**：连续编辑后可多步撤销/重做，跨 Solve/Clear/改尺寸 操作可回退。
5. **URL 兼容**：原版生成的链接能在新版打开并显示相同谜题；新版生成的链接能在原版打开（编码格式不变）。
6. **响应式**：窄屏（≤768px）布局可用，侧栏不遮挡面板。
