/**
 * 通用类型定义
 * 包含项目中使用的基础类型和枚举
 */

// 任务类型枚举
export type TaskType = 'development' | 'testing' | 'delivery' | 'default';

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

// 拖拽类型
export type DragType = 'move' | 'resize-left' | 'resize-right' | 'milestone-move';

// 视图类型
export type ViewType = 'timeline' | 'list' | 'grid';

// 右键菜单类型
export type ContextMenuType = 'task' | 'row' | 'timeline' | 'milestone';