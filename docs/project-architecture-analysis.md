# Gantto 项目架构分析

## 技术栈
- **前端**: React 18 + TypeScript + Vite
- **后端**: Tauri v2 (Rust)
- **UI组件**: Radix UI + Lucide React
- **包管理**: pnpm

## 项目结构总览

```
Gantto/
├── src/                    # 前端代码
├── src-tauri/             # Tauri 后端代码
├── public/                # 静态资源
├── docs/                  # 文档资源
└── 配置文件               # 项目配置
```

## 前端模块架构

### 1. 组件层次结构
```
App.tsx (根组件)
├── Header.tsx (应用头部)
└── GanttChart.tsx (核心甘特图组件)
    ├── gantt/TaskBars.tsx (任务条渲染)
    ├── gantt/TimelineHeader.tsx (时间轴头部)
    ├── gantt/TaskTitleColumn.tsx (任务标题列)
    └── gantt/GanttHelpers.ts (甘特图工具函数)
```

### 2. 核心组件功能

**GanttChart.tsx** (核心组件)
- 主要职责: 甘特图核心逻辑和状态管理
- 特点: 2000+ 行代码，需要重构拆分
- 功能: 任务管理、拖拽、层级关系、时间轴

**TaskBars.tsx** (任务条组件)
- 职责: 渲染任务条和里程碑
- 功能: 拖拽交互、状态显示、标签管理
- 位置: src/components/gantt/TaskBars.tsx:114

**TimelineHeader.tsx** (时间轴头部)
- 职责: 时间轴和网格线渲染
- 功能: 时间刻度、当前日期指示线
- 位置: src/components/gantt/TimelineHeader.tsx:22

### 3. 状态管理层

**Hooks 结构**:
```
hooks/
├── gantt/                 # 甘特图相关 hooks
│   ├── useTaskManager.ts  # 任务数据管理
│   ├── useDragAndDrop.ts  # 拖拽功能
│   ├── useTimeline.ts     # 时间轴逻辑
│   ├── useGanttUI.ts      # UI 状态管理
│   └── useGanttEvents.ts  # 事件处理
└── common/                # 通用 hooks
    ├── useThrottle.ts     # 节流功能
    └── useCache.ts        # 缓存管理
```

### 4. 类型定义体系

**类型结构**:
```typescript
types/
├── task.ts          # 任务相关类型
├── project.ts       # 项目相关类型
├── timeline.ts      # 时间轴类型
├── ui.ts           # UI 状态类型
└── common.ts       # 通用类型
```

**核心数据模型**:
```typescript
interface Task {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  type: TaskType;
  status: TaskStatus;
  color: string;
  // ... 其他属性
}
```

### 5. 样式架构

**CSS 结构**:
```
styles/
├── index.css        # 总入口
├── base.css         # 基础样式
├── layout.css       # 布局样式
└── components/      # 组件样式
    ├── gantt.css    # 甘特图样式
    ├── tasks.css    # 任务样式
    └── toolbar.css  # 工具栏样式
```

## 后端架构 (Tauri)

### 1. 基础结构
```
src-tauri/
├── src/
│   ├── main.rs      # 应用入口
│   └── lib.rs       # 库代码
├── tauri.conf.json  # 配置文件
└── Cargo.toml       # 依赖管理
```

### 2. 应用配置
- **窗口尺寸**: 1300x800 (最小尺寸)
- **开发URL**: http://localhost:1420
- **构建命令**: pnpm build
- **开发命令**: pnpm dev

### 3. 依赖项
```toml
tauri = "2"
tauri-plugin-opener = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
```

## 模块关系图

```
┌─────────────────┐
│     App.tsx     │
│   (应用根组件)    │
└─────────────────┘
         │
    ┌────▼────┐
    │ Header  │
    └─────────┘
         │
   ┌─────▼──────┐
   │ GanttChart │
   │ (核心组件)  │
   └─────┬──────┘
         │
    ┌────▼────┐
    │ gantt/  │
    │ 子组件群 │
    └─────────┘
         │
    ┌────▼────┐
    │ hooks/  │
    │ 状态管理 │
    └─────────┘
         │
    ┌────▼────┐
    │ types/  │
    │ 类型定义 │
    └─────────┘
```

## 重构需求分析

### 1. 优先级任务
- **GanttChart.tsx** 拆分 (2000+ 行 → 多个 < 200 行组件)
- **状态管理** 优化 (Hook 化)
- **组件职责** 分离 (单一职责原则)

### 2. 架构特点
- **模块化程度**: 中等，需要进一步拆分
- **代码复用**: 良好，Hook 系统完善
- **类型安全**: 优秀，TypeScript 严格模式
- **性能优化**: 已实现节流和缓存机制

## 开发建议

### 1. 代码质量控制
- 文件大小限制: 单个文件不超过 200 行
- 函数长度限制: 单个函数不超过 30 行
- 嵌套深度限制: 最多 3 层嵌套

### 2. 组件拆分策略
- 按功能维度拆分大组件
- 复杂状态逻辑抽离为 custom hooks
- UI 组件与业务逻辑完全分离

### 3. 性能优化
- 使用 throttle 优化高频事件
- 实现任务可见性懒加载
- 优化拖拽操作的渲染性能

### 4. 开发工作流
- 使用 `pnpm run tauri dev` 进行开发
- 每次修改后运行 `pnpm run build` 验证
- 保持中文注释和本地化