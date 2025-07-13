/**
 * 类型定义统一导出文件
 * 提供项目中所有类型的单一导入入口
 */

// 导出通用类型
export * from './common';

// 导出任务相关类型
export * from './task';

// 导出项目相关类型
export * from './project';

// 导出UI状态相关类型
export * from './ui';

// 导出时间轴相关类型
export * from './timeline';

// 向后兼容的别名（逐步移除）
export type { Task as ChartTask } from './task';

// 重新导出常用类型组合
export type {
  Task,
  TaskCreateInput,
  TaskUpdateInput,
  TaskHierarchy
} from './task';

export type {
  ProjectRow,
  ProjectConfig,
  ProjectData
} from './project';

export type {
  DragState,
  VerticalDragState,
  SelectionState,
  ContextMenuState,
  TaskContextMenu,
  ColorPickerState,
  TagManagerState
} from './ui';

export type {
  TimelineConfig,
  TimelineMetrics,
  TimelineScale
} from './timeline';