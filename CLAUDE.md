# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Gantto is a modern cross-platform Gantt chart application built with Tauri + React + TypeScript. It provides an intuitive interface for project planning, task management, and progress tracking with features like drag-and-drop task management, hierarchical task structures, and visual timeline views.

## Development Commands

### Setup and Installation
```bash
pnpm install               # Install dependencies
```

### Development
```bash
pnpm run dev              # Start Vite development server only
pnpm run tauri dev        # Start full Tauri development mode (recommended)
```

### Building
```bash
pnpm run build            # Build frontend (TypeScript compilation + Vite build)
pnpm run tauri build      # Build complete Tauri application for distribution
```

### Preview
```bash
pnpm run preview          # Preview built frontend locally
```

## Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Tauri v2 (Rust)
- **UI Components**: Radix UI (@radix-ui/react-dropdown-menu, @radix-ui/react-tooltip)
- **Icons**: Lucide React
- **Package Manager**: pnpm

### Project Structure
```
src/                          # Frontend source code
├── App.tsx                   # Main application component with theme management
├── main.tsx                  # React application entry point
├── components/               # React components
│   ├── GanttChart.tsx        # Main Gantt chart component (complex, 2000+ lines)
│   ├── Header.tsx            # Application header with project controls
│   ├── TaskIcon.tsx          # Task type icons and drag handles
│   └── Toolbar.tsx           # Chart toolbar with zoom/view controls
└── assets/                   # Static assets

src-tauri/                    # Tauri backend
├── src/                      # Rust source code
├── tauri.conf.json          # Tauri configuration
└── Cargo.toml               # Rust dependencies

public/                       # Static files
dist/                        # Build output
```

### Key Components

#### GanttChart.tsx
The core component handling:
- **Task Management**: CRUD operations for tasks with hierarchical support (parent/child relationships)
- **Drag & Drop**: Horizontal task dragging for timeline adjustment and vertical dragging for task reordering
- **Task Hierarchy**: Support for parent-child task relationships with expand/collapse functionality
- **Visual Features**: Progress bars, task status indicators, current date line, timeline scaling
- **State Management**: Complex state including task data, drag states, zoom levels, and selection

#### Task Data Structure
```typescript
interface Task {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  color: string;
  x: number;               // Calculated position
  width: number;           // Calculated width  
  order: number;           // Display order
  type?: 'milestone' | 'development' | 'testing' | 'delivery' | 'default';
  status?: 'pending' | 'in-progress' | 'completed' | 'overdue';
  progress?: number;       // 0-100
  parentId?: string;       // For hierarchical tasks
  children?: string[];     // Child task IDs
  level?: number;          // Nesting level (0 = root)
  isExpanded?: boolean;    // Expand/collapse state
}
```

## Claude Code 开发指导原则

### 代码简洁性要求
- **文件长度分级控制**: 
  - 核心组件: 200-300行（允许适度复杂性）
  - 简单组件: 150行以内
  - 工具函数: 100行以内
  - Hook: 200行以内
- **组件拆分原则**: 复杂组件必须拆分为多个小组件，每个组件职责单一
- **函数长度限制**: 单个函数不超过 30 行，复杂逻辑需要拆分
- **避免深度嵌套**: 最多 3 层嵌套，超出需要提取子组件或函数

### 模块化开发策略
- **功能导向拆分**: 按功能将大组件拆分为独立的小组件
- **Hook 抽离**: 复杂状态逻辑抽离为自定义 hooks
- **工具函数分离**: 纯函数逻辑放在单独的 utils 文件中
- **类型定义集中**: 共享类型放在 types/ 目录下

### Claude Code 最佳实践
- **优先重构而非新建**: 总是优先考虑重构现有代码而非创建新文件
- **逐步迭代**: 大功能分解为多个小的可验证步骤
- **保持一致性**: 严格遵循现有的代码风格和组织结构
- **中文注释**: 使用中文进行代码注释和文档编写

### 中文本地化
- 项目使用中文进行 UI 文本和注释
- 遵循现有的中文命名规范
- 新功能添加时使用合适的中文本地化模式

### Tauri 开发
- 使用 `pnpm run tauri dev` 进行开发（而非仅 `pnpm run dev`）
- 开发时前端运行在 http://localhost:1420
- Tauri 配置位于 `src-tauri/tauri.conf.json`

### Performance Considerations
- The GanttChart component uses throttled mouse events for smooth dragging
- Batched React updates for drag operations
- Memoized calculations for date/pixel conversions
- Lazy evaluation of visible tasks based on hierarchy expansion state

### Cursor AI Rules Integration
The project includes Cursor AI rules (`.cursor/rules/commandplan.mdc`) that enforce:
- RIPER-5 development protocol with strict mode transitions
- Chinese language responses with structured planning approach
- Systematic code analysis and implementation phases

## Claude Code 重构指导

### 当前重构优先级
1. **GanttChart.tsx 拆分** (1171 行 → 核心组件 <300 行)
   - 提取任务渲染逻辑为独立组件
   - 拆分拖拽功能为自定义 hooks
   - 分离时间轴和网格渲染逻辑

2. **状态管理优化**
   - 复杂状态逻辑抽离为 custom hooks
   - 拖拽状态单独管理
   - 任务数据操作函数模块化

3. **组件职责分离**
   - 每个组件只负责单一功能
   - 避免在一个文件中混合多种逻辑
   - UI 组件与业务逻辑完全分离

### 代码质量控制
- **文件大小监控**: 
  - 核心组件超过 300 行立即重构
  - 简单组件超过 150 行需要拆分
  - Hook 超过 200 行需要拆分
  - 工具函数超过 100 行需要拆分
- **函数复杂度**: 单个函数超过 30 行需要拆分
- **嵌套深度**: 超过 3 层嵌套必须提取子组件
- **重复代码**: 发现重复立即抽离为共享函数

### 开发任务模式
- **小步骤迭代**: 每次只修改一个小功能点
- **验证驱动**: 每个修改后立即验证功能正常
- **渐进式重构**: 在添加新功能时同步重构相关代码
- **保持简洁**: 宁可多创建几个小文件也不要单个大文件

## Testing and Quality

### Testing Commands
```bash
# Currently no test setup - tests need to be configured
# Project uses TypeScript strict mode for type checking
pnpm run build            # Validates TypeScript compilation
```

### Code Quality
- TypeScript strict mode enabled for type safety
- Use Chinese language for UI text and comments
- Follow existing component patterns and performance optimizations

## Claude Code 工作流程

### 开发前检查
1. 使用 `Grep` 搜索相关代码模式
2. 用 `Read` 工具了解现有组件结构
3. 评估当前文件长度，超过 200 行优先重构

### 编码原则
- **单一职责**: 每个文件/函数只做一件事
- **可读性优先**: 代码要易于理解，避免复杂逻辑
- **渐进式开发**: 小步骤迭代，频繁验证
- **保持简洁**: 优先选择简单方案而非复杂实现

### 质量验证命令
每次修改后必须运行:
```bash
pnpm run build     # TypeScript 编译检查
```