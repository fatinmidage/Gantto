# Hooks 优化方案详细步骤清单

## 项目概述

本文档提供了对 Gantto 项目中超标 Hooks 文件的详细重构方案和实施步骤。

### 当前状况
- `useGanttEvents.ts`: 307行 (超出200行标准)
- `useGanttMouseEvents.ts`: 290行 (超出200行标准)  
- `useGanttHandlers.ts`: 274行 (超出200行标准)

### 目标
- 所有 Hook 文件控制在200行以内
- 保持单一职责原则
- 提升代码可维护性和可测试性

---

## 阶段1：useGanttEvents.ts 重构

### 📋 任务清单

#### 1.1 分析现有函数分布
- [ ] 统计所有导出函数 (当前13个函数)
- [ ] 按功能域分组：
  - **CRUD操作**: addNewTask, deleteTaskCore, deleteChartTask, deleteProjectRow, createTask, createMilestone
  - **任务属性**: handleColorChange, handleTagAdd, handleTagRemove
  - **状态更新**: updateTaskDates, updateTaskStatus, updateTaskProgress
  - **批量操作**: batchUpdateTasks

#### 1.2 创建 useTaskCRUD.ts (约100行)
- [ ] 创建文件: `src/hooks/gantt/useTaskCRUD.ts`
- [ ] 移迁函数：
  ```typescript
  // 基础CRUD操作
  - addNewTask
  - deleteTaskCore  
  - deleteChartTask
  - deleteProjectRow
  - createTask
  - createMilestone
  ```
- [ ] 定义接口: `UseTaskCRUDProps` 和 `UseTaskCRUDResult`
- [ ] 测试基础CRUD功能是否正常

#### 1.3 创建 useTaskAttributes.ts (约80行)
- [ ] 创建文件: `src/hooks/gantt/useTaskAttributes.ts`
- [ ] 移迁函数：
  ```typescript
  // 属性管理操作
  - handleColorChange
  - handleTagAdd
  - handleTagRemove
  - updateTaskStatus
  - updateTaskProgress
  ```
- [ ] 定义接口: `UseTaskAttributesProps` 和 `UseTaskAttributesResult`
- [ ] 测试属性修改功能是否正常

#### 1.4 创建 useTaskBatch.ts (约60行)
- [ ] 创建文件: `src/hooks/gantt/useTaskBatch.ts`
- [ ] 移迁函数：
  ```typescript
  // 批量操作
  - batchUpdateTasks
  - updateTaskDates (如果逻辑复杂)
  ```
- [ ] 定义接口: `UseTaskBatchProps` 和 `UseTaskBatchResult`
- [ ] 测试批量操作功能是否正常

#### 1.5 重构 useGanttEvents.ts
- [ ] 重写 `useGanttEvents.ts` 作为聚合器
- [ ] 组合所有子hooks：
  ```typescript
  export const useGanttEvents = (props) => {
    const taskCRUD = useTaskCRUD(props);
    const taskAttributes = useTaskAttributes(props);
    const taskBatch = useTaskBatch(props);
    
    return {
      ...taskCRUD,
      ...taskAttributes,
      ...taskBatch
    };
  };
  ```
- [ ] 确保接口保持不变 (向后兼容)
- [ ] 文件行数控制在50行以内

#### 1.6 验证和测试
- [ ] 运行 `pnpm run build` 确保无 TypeScript 错误
- [ ] 运行 `pnpm run tauri dev` 测试所有甘特图功能
- [ ] 确认任务创建、删除、编辑功能正常
- [ ] 确认颜色和标签管理功能正常

---

## 阶段2：useGanttMouseEvents.ts 重构

### 📋 任务清单

#### 2.1 分析鼠标事件分布
- [ ] 统计鼠标事件处理函数
- [ ] 按拖拽类型分组：
  - **水平拖拽**: 任务条移动、调整大小、边界检测
  - **垂直拖拽**: 任务重排序、预览效果

#### 2.2 创建 useHorizontalDrag.ts (约150行)
- [ ] 创建文件: `src/hooks/gantt/useHorizontalDrag.ts`
- [ ] 移迁功能：
  ```typescript
  // 水平拖拽逻辑
  - 边界检测函数
  - 任务条拖拽处理
  - 任务条调整大小
  - 拖拽预览计算
  ```
- [ ] 定义接口: `UseHorizontalDragProps` 和 `UseHorizontalDragResult`
- [ ] 测试水平拖拽功能

#### 2.3 创建 useVerticalDrag.ts (约140行)
- [ ] 创建文件: `src/hooks/gantt/useVerticalDrag.ts`
- [ ] 移迁功能：
  ```typescript
  // 垂直拖拽逻辑
  - 任务重排序逻辑
  - 拖拽目标计算
  - 拖拽预览效果
  ```
- [ ] 定义接口: `UseVerticalDragProps` 和 `UseVerticalDragResult`
- [ ] 测试垂直拖拽功能

#### 2.4 重构 useGanttMouseEvents.ts
- [ ] 重写为聚合器模式：
  ```typescript
  export const useGanttMouseEvents = (props) => {
    const horizontalDrag = useHorizontalDrag(props);
    const verticalDrag = useVerticalDrag(props);
    
    return {
      ...horizontalDrag,
      ...verticalDrag
    };
  };
  ```
- [ ] 确保接口兼容性
- [ ] 文件行数控制在50行以内

#### 2.5 验证和测试
- [ ] 运行构建检查
- [ ] 测试任务条水平拖拽功能
- [ ] 测试任务重排序功能
- [ ] 测试边界检测和调整大小功能

---

## 阶段3：useGanttHandlers.ts 重构

### 📋 任务清单

#### 3.1 分析处理器函数分布
- [ ] 统计所有处理器函数 (当前17个)
- [ ] 按处理器类型分组：
  - **任务处理器**: 创建、删除、属性修改
  - **拖拽处理器**: 鼠标事件、边界检测

#### 3.2 创建 useTaskHandlers.ts (约140行)
- [ ] 创建文件: `src/hooks/gantt/useTaskHandlers.ts`
- [ ] 移迁函数：
  ```typescript
  // 任务相关处理器
  - handleCreateTask
  - handleCreateMilestone
  - handleTaskDelete
  - handleColorChange
  - handleTagAdd
  - handleTagRemove
  ```
- [ ] 定义接口并测试功能

#### 3.3 创建 useDragHandlers.ts (约134行)
- [ ] 创建文件: `src/hooks/gantt/useDragHandlers.ts`
- [ ] 移迁函数：
  ```typescript
  // 拖拽相关处理器
  - handleMouseDown
  - handleTitleMouseDown
  - handleMouseUp
  - handleTitleMouseUp
  - detectEdgeHover
  - handleEdgeHover
  ```
- [ ] 定义接口并测试功能

#### 3.4 重构 useGanttHandlers.ts
- [ ] 重写为聚合器
- [ ] 组合子hooks并保持接口兼容
- [ ] 控制文件行数在60行以内

#### 3.5 验证和测试
- [ ] 完整功能测试
- [ ] 性能回归测试

---

## 全局优化任务

### 📋 任务清单

#### 4.1 更新索引文件
- [ ] 更新 `src/hooks/index.ts`
- [ ] 添加新的hook导出：
  ```typescript
  // CRUD操作
  export { useTaskCRUD } from './gantt/useTaskCRUD';
  export { useTaskAttributes } from './gantt/useTaskAttributes';
  export { useTaskBatch } from './gantt/useTaskBatch';
  
  // 鼠标事件
  export { useHorizontalDrag } from './gantt/useHorizontalDrag';
  export { useVerticalDrag } from './gantt/useVerticalDrag';
  
  // 处理器
  export { useTaskHandlers } from './gantt/useTaskHandlers';
  export { useDragHandlers } from './gantt/useDragHandlers';
  ```

#### 4.2 更新类型定义
- [ ] 检查 `src/types/` 下的类型定义
- [ ] 确保新hooks的类型定义完整
- [ ] 添加必要的新接口定义

#### 4.3 文档更新
- [ ] 更新 `CLAUDE.md` 中的hooks说明
- [ ] 添加新hooks的功能描述
- [ ] 更新架构图和组件关系说明

#### 4.4 代码质量检查
- [ ] 运行 `pnpm run build` 最终构建检查
- [ ] 确保所有新文件都在200行以内
- [ ] 检查函数复杂度和嵌套深度
- [ ] 确认所有hooks都遵循单一职责原则

---

## 质量保证检查表

### ✅ 验收标准

#### 代码质量
- [ ] 所有hook文件行数 ≤ 200行
- [ ] 单个函数长度 ≤ 30行
- [ ] 嵌套深度 ≤ 3层
- [ ] TypeScript编译无错误

#### 功能完整性
- [ ] 任务创建功能正常
- [ ] 任务删除功能正常
- [ ] 任务拖拽功能正常
- [ ] 任务属性编辑功能正常
- [ ] 右键菜单功能正常

#### 性能要求
- [ ] 拖拽操作流畅，无明显延迟
- [ ] 大量任务时性能稳定
- [ ] 内存使用合理，无内存泄漏

#### 代码一致性
- [ ] 命名规范统一
- [ ] 注释完整且准确
- [ ] 接口定义清晰
- [ ] 错误处理完善

---

## 实施时间预估

| 阶段 | 预估时间 | 说明 |
|------|----------|------|
| 阶段1 | 3-4小时 | useGanttEvents.ts 重构 |
| 阶段2 | 2-3小时 | useGanttMouseEvents.ts 重构 |
| 阶段3 | 2-3小时 | useGanttHandlers.ts 重构 |
| 全局优化 | 1-2小时 | 索引更新、文档更新、质量检查 |
| **总计** | **8-12小时** | 包含测试和验证时间 |

---

## 注意事项

### ⚠️ 重要提醒

1. **渐进式重构**: 一次只重构一个文件，避免同时修改多个文件导致问题难以排查
2. **接口兼容**: 确保重构后的接口与原来完全兼容，避免破坏现有功能
3. **功能验证**: 每个阶段完成后都要进行完整的功能测试
4. **备份原文件**: 重构前建议备份原文件或创建新分支
5. **依赖关系**: 注意hooks之间的依赖关系，避免循环依赖

### 🔧 开发建议

1. **使用TypeScript严格模式**: 确保类型安全
2. **保持中文注释**: 遵循项目的中文本地化要求
3. **性能优化**: 合理使用 `useCallback` 和 `useMemo`
4. **错误处理**: 添加适当的错误边界和异常处理
5. **代码复用**: 提取公共逻辑到工具函数中

---

*文档创建时间: 2025-07-14*  
*项目: Gantto - 甘特图应用*  
*作者: Claude Code Assistant*