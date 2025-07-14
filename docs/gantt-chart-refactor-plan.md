# GanttChart.tsx 组件拆分重构方案

## 📋 项目概述

### 当前状态
- **文件大小**: 655 行代码
- **目标**: 拆分至 < 300 行的核心组件
- **复杂度**: 高 - 包含状态管理、事件处理、数据计算、UI渲染等多重职责

### 拆分目标
将 GanttChart.tsx 拆分为职责单一的组件，每个组件控制在 150-200 行以内。

## 🎯 组件拆分设计方案

### 1. 核心组件架构
```
GanttChart.tsx (主组件) - 150-200行
├── GanttDataProvider.tsx (数据管理层) - 100-150行
├── GanttEventHandler.tsx (事件处理层) - 150-200行
├── GanttLayout.tsx (布局组件) - 100-150行
└── GanttContextManager.tsx (上下文菜单管理) - 100-150行
```

### 2. Hook 拆分方案
```
当前大文件拆分:
├── useGanttState.ts (状态管理) - 150-200行
├── useGanttCalculations.ts (数据计算) - 100-150行
├── useGanttHandlers.ts (事件处理器) - 150-200行
└── useGanttDragDrop.ts (拖拽逻辑) - 100-150行
```

### 3. 功能模块分析

#### 3.1 数据管理职责 (GanttDataProvider)
- **职责**: 管理任务数据、项目行数据、状态初始化
- **包含内容**:
  - Hook 集成 (useTaskManager, useTimeline, useGanttUI)
  - 数据计算 (sortedTasks, visibleTasks, taskRows)
  - 映射创建 (taskMap, projectRowMap)
  - 高度计算 (containerHeight, taskContentHeight)

#### 3.2 事件处理职责 (GanttEventHandler)
- **职责**: 处理所有用户交互事件
- **包含内容**:
  - 鼠标事件处理 (拖拽、选择、悬停)
  - 键盘事件处理
  - 右键菜单事件
  - 任务操作事件 (创建、删除、编辑)

#### 3.3 布局渲染职责 (GanttLayout)
- **职责**: 管理组件布局和渲染结构
- **包含内容**:
  - 主要布局结构
  - 子组件组装
  - 样式应用
  - 条件渲染

#### 3.4 上下文菜单管理 (GanttContextManager)
- **职责**: 管理所有上下文菜单
- **包含内容**:
  - 菜单状态管理
  - 菜单事件处理
  - 颜色选择器
  - 标签管理器

## 🔧 详细重构步骤

### 第一阶段: 数据管理分离 (优先级: 高)

#### 步骤 1.1: 创建 GanttDataProvider 组件
```typescript
// 目标文件: src/components/gantt/GanttDataProvider.tsx
// 行数目标: 100-150行
// 职责: 统一管理数据状态和计算逻辑
```

**实施清单**:
- [ ] 创建 GanttDataProvider 组件
- [ ] 迁移 Hook 集成逻辑 (useTaskManager, useTimeline, useGanttUI)
- [ ] 迁移数据计算逻辑 (sortedTasks, visibleTasks, taskRows)
- [ ] 迁移映射创建逻辑 (taskMap, projectRowMap)
- [ ] 迁移高度计算逻辑 (containerHeight, taskContentHeight)
- [ ] 创建数据上下文 (GanttDataContext)
- [ ] 验证功能正常运行

#### 步骤 1.2: 创建 useGanttState Hook
```typescript
// 目标文件: src/hooks/gantt/useGanttState.ts
// 行数目标: 150-200行
// 职责: 集中管理所有状态逻辑
```

**实施清单**:
- [ ] 创建 useGanttState Hook
- [ ] 迁移状态声明逻辑
- [ ] 迁移状态更新方法
- [ ] 优化状态依赖关系
- [ ] 添加状态验证逻辑

### 第二阶段: 事件处理分离 (优先级: 高)

#### 步骤 2.1: 创建 GanttEventHandler 组件
```typescript
// 目标文件: src/components/gantt/GanttEventHandler.tsx
// 行数目标: 150-200行
// 职责: 处理所有用户交互事件
```

**实施清单**:
- [ ] 创建 GanttEventHandler 组件
- [ ] 迁移鼠标事件处理器 (handleMouseDown, handleMouseMove, handleMouseUp)
- [ ] 迁移拖拽事件处理器 (handleTitleMouseDown, handleTitleMouseMove)
- [ ] 迁移边界检测逻辑 (detectEdgeHover, handleEdgeHover)
- [ ] 迁移键盘事件处理
- [ ] 整合事件监听器管理
- [ ] 验证事件处理正常

#### 步骤 2.2: 创建 useGanttHandlers Hook
```typescript
// 目标文件: src/hooks/gantt/useGanttHandlers.ts
// 行数目标: 150-200行
// 职责: 统一管理事件处理函数
```

**实施清单**:
- [ ] 创建 useGanttHandlers Hook
- [ ] 迁移回调函数创建逻辑
- [ ] 优化事件处理器性能
- [ ] 添加事件处理验证
- [ ] 统一事件处理接口

### 第三阶段: 上下文菜单分离 (优先级: 中)

#### 步骤 3.1: 创建 GanttContextManager 组件
```typescript
// 目标文件: src/components/gantt/GanttContextManager.tsx
// 行数目标: 100-150行
// 职责: 管理所有上下文菜单组件
```

**实施清单**:
- [ ] 创建 GanttContextManager 组件
- [ ] 迁移上下文菜单状态管理
- [ ] 迁移菜单事件处理器
- [ ] 迁移颜色选择器逻辑
- [ ] 迁移标签管理器逻辑
- [ ] 统一菜单组件渲染
- [ ] 验证菜单功能正常

#### 步骤 3.2: 创建 useGanttContextMenu Hook
```typescript
// 目标文件: src/hooks/gantt/useGanttContextMenu.ts
// 行数目标: 100-150行
// 职责: 管理上下文菜单状态和逻辑
```

**实施清单**:
- [ ] 创建 useGanttContextMenu Hook
- [ ] 迁移菜单状态管理
- [ ] 迁移菜单显示隐藏逻辑
- [ ] 优化菜单位置计算
- [ ] 添加菜单状态验证

### 第四阶段: 布局组件分离 (优先级: 中)

#### 步骤 4.1: 创建 GanttLayout 组件
```typescript
// 目标文件: src/components/gantt/GanttLayout.tsx
// 行数目标: 100-150行
// 职责: 管理甘特图布局和渲染结构
```

**实施清单**:
- [ ] 创建 GanttLayout 组件
- [ ] 迁移主要布局结构
- [ ] 迁移子组件组装逻辑
- [ ] 迁移样式应用逻辑
- [ ] 迁移条件渲染逻辑
- [ ] 优化布局性能
- [ ] 验证布局正常

#### 步骤 4.2: 创建 useGanttLayout Hook
```typescript
// 目标文件: src/hooks/gantt/useGanttLayout.ts
// 行数目标: 100行
// 职责: 管理布局计算和样式
```

**实施清单**:
- [ ] 创建 useGanttLayout Hook
- [ ] 迁移布局计算逻辑
- [ ] 迁移样式生成逻辑
- [ ] 优化布局性能
- [ ] 添加布局验证

### 第五阶段: 主组件重构 (优先级: 高)

#### 步骤 5.1: 重构 GanttChart 主组件
```typescript
// 目标文件: src/components/GanttChart.tsx
// 行数目标: 150-200行
// 职责: 组件组装和数据流管理
```

**实施清单**:
- [ ] 简化 GanttChart 主组件
- [ ] 集成拆分后的子组件
- [ ] 优化组件组装逻辑
- [ ] 简化 props 传递
- [ ] 添加组件验证
- [ ] 优化性能和内存使用

#### 步骤 5.2: 创建组件接口规范
```typescript
// 目标文件: src/types/gantt.ts
// 行数目标: 50-100行
// 职责: 定义组件间通信接口
```

**实施清单**:
- [ ] 定义组件间通信接口
- [ ] 创建数据流类型定义
- [ ] 添加组件 Props 类型
- [ ] 优化类型导出
- [ ] 验证类型正确性

## 🔍 质量验证清单

### 代码质量检查
- [ ] 每个组件 < 200 行代码
- [ ] 每个 Hook < 200 行代码
- [ ] 主组件 < 300 行代码
- [ ] 函数单一职责原则
- [ ] 避免深度嵌套 (< 3 层)

### 功能验证检查
- [ ] 任务拖拽功能正常
- [ ] 任务创建删除功能正常
- [ ] 时间轴缩放功能正常
- [ ] 右键菜单功能正常
- [ ] 键盘快捷键功能正常
- [ ] 任务层级展开折叠正常

### 性能验证检查
- [ ] 组件渲染性能无退化
- [ ] 内存使用无泄漏
- [ ] 事件处理响应及时
- [ ] 大数据量渲染流畅

## 📊 预期效果

### 代码结构优化
- **GanttChart.tsx**: 655行 → 150-200行 (减少 70%)
- **组件职责**: 单一职责原则，易于维护
- **代码复用**: 逻辑抽象，可重用性提高

### 开发体验提升
- **调试效率**: 问题定位更精确
- **功能扩展**: 新功能添加更容易
- **团队协作**: 代码结构清晰，协作更顺畅

### 性能优化
- **渲染性能**: 组件拆分减少不必要重渲染
- **内存使用**: 精细化状态管理减少内存占用
- **加载速度**: 模块化加载提升初始化速度

## ⚠️ 注意事项

### 重构风险控制
1. **分步实施**: 每个步骤独立验证，避免大规模破坏
2. **功能保持**: 确保重构过程中功能不受影响
3. **测试覆盖**: 每个阶段完成后进行全面测试
4. **回滚准备**: 每个步骤都有回滚方案

### 兼容性考虑
1. **接口一致性**: 保持外部接口不变
2. **数据格式**: 保持数据结构兼容
3. **样式保持**: 确保 UI 表现一致
4. **性能维持**: 确保性能不降级

### 优先级建议
1. **高优先级**: 步骤 1, 2, 5 (数据管理、事件处理、主组件)
2. **中优先级**: 步骤 3, 4 (上下文菜单、布局)
3. **低优先级**: 性能优化、额外功能

## 🎯 实施时间估算

- **第一阶段**: 2-3 天 (数据管理分离)
- **第二阶段**: 3-4 天 (事件处理分离)
- **第三阶段**: 2-3 天 (上下文菜单分离)
- **第四阶段**: 2-3 天 (布局组件分离)
- **第五阶段**: 2-3 天 (主组件重构)
- **总计**: 11-16 天

## 📝 总结

此重构方案将 GanttChart.tsx 从 655 行的复杂组件拆分为多个职责单一的组件，每个组件控制在 200 行以内。通过系统化的拆分和优化，不仅提升了代码质量和可维护性，还为后续功能扩展奠定了良好基础。

重构过程采用渐进式方法，每个阶段都有明确的目标和验证标准，确保重构过程可控、安全、高效。