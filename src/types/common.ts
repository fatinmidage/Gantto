/**
 * 通用类型定义
 * 包含项目中使用的基础类型和枚举
 */

// 任务类型枚举 (保留向后兼容)
export type TaskType = 'development' | 'testing' | 'delivery' | 'default';

// 图标类型 - 使用字符串以支持扩展
export type IconType = string;

// 任务状态枚举
export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'overdue';

// 位置接口
export interface Position {
  x: number;
  y: number;
}

// 尺寸接口
export interface Size {
  width: number;
  height: number;
}

// 矩形区域接口
export interface Rectangle extends Position, Size {}

// 时间范围接口
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

// 拖拽类型 (已移至 drag.ts，保留此处为向后兼容)
// export type DragType = 'move' | 'resize-left' | 'resize-right' | 'milestone-move';

// 视图类型
export type ViewType = 'timeline' | 'list' | 'grid';

// 右键菜单类型
export type ContextMenuType = 'task' | 'row' | 'timeline' | 'milestone';