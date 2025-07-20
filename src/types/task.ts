/**
 * 任务相关类型定义
 * 统一的任务数据模型
 */

import { TaskType, TaskStatus, DateRange } from './common';

// 核心任务接口 - 数据的单一来源
export interface Task {
  // 基础信息
  id: string;
  title: string;
  description?: string;
  
  // 时间信息
  startDate: Date;
  endDate: Date;
  
  // 状态信息
  type: TaskType;
  status: TaskStatus;
  progress?: number; // 0-100，改为可选兼容现有代码
  
  // 图标类型（用于里程碑图标显示，普通任务可忽略）
  iconType?: TaskType;
  
  // 层级关系
  parentId?: string;
  children?: string[]; // 改为可选，兼容现有代码
  level?: number; // 改为可选，兼容现有代码
  
  // 显示属性
  color: string;
  tags?: string[]; // 改为可选，兼容现有代码
  order?: number; // 改为可选，兼容现有代码
  
  // UI状态（从Task中分离，但保持兼容）
  isExpanded?: boolean;
  
  // 计算属性（用于图表绘制）
  x?: number;
  width?: number;
  
  // 元数据（改为可选，兼容现有代码）
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  
  // 兼容性字段（逐步移除）
  rowId?: string; // 行ID，同一行的任务有相同的rowId
  isCreatedFromContext?: boolean; // 是否通过右键菜单创建
  isPlaceholder?: boolean; // 是否为占位符任务
}

// 里程碑节点接口
export interface MilestoneNode {
  id: string;
  title: string;
  date: Date;
  iconType: TaskType;
  label?: string;
  color: string;
  
  // 附着信息
  attachedToBar?: string; // 附着的任务条ID
  relativePosition?: number; // 在任务条上的相对位置 (0-1)
  
  // 位置计算属性
  x?: number;
  y?: number;
  
  // 层级关系
  parentId?: string;
  level?: number;
  order?: number;
  
  // 元数据
  createdAt?: Date;
  updatedAt?: Date;
  
  // 兼容性字段
  rowId?: string; // 行ID，与关联任务保持一致
  isCreatedFromContext?: boolean; // 是否通过右键菜单创建
}

// 扩展任务条接口（基于Task但明确用于任务条）
export interface TaskBar extends Task {
  attachedMilestones?: string[]; // 附着的里程碑节点ID列表
}

// 任务创建输入类型
export interface TaskCreateInput {
  title: string;
  startDate: Date;
  endDate: Date;
  type?: TaskType;
  parentId?: string;
  color?: string;
  description?: string;
  tags?: string[];
}

// 里程碑节点创建输入类型
export interface MilestoneCreateInput {
  title: string;
  date: Date;
  iconType?: TaskType;
  label?: string;
  color?: string;
  attachedToBar?: string;
  relativePosition?: number;
}

// 任务更新输入类型
export interface TaskUpdateInput {
  id: string;
  title?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  status?: TaskStatus;
  progress?: number;
  color?: string;
  tags?: string[];
  parentId?: string;
  order?: number;
}

// 里程碑节点更新输入类型
export interface MilestoneUpdateInput {
  id: string;
  title?: string;
  date?: Date;
  iconType?: TaskType;
  label?: string;
  color?: string;
  attachedToBar?: string;
  relativePosition?: number;
  order?: number;
}

// 任务层级结构
export interface TaskHierarchy {
  task: Task;
  children: TaskHierarchy[];
  depth: number;
  isExpanded: boolean;
}

// 任务树节点
export interface TaskTreeNode {
  id: string;
  parentId?: string;
  children: string[];
  isLeaf: boolean;
  path: string[]; // 从根到当前节点的路径
}

// 任务查询条件
export interface TaskFilter {
  status?: TaskStatus[];
  type?: TaskType[];
  tags?: string[];
  dateRange?: DateRange;
  parentId?: string;
  searchText?: string;
}

// 任务排序选项
export interface TaskSortOptions {
  field: 'startDate' | 'endDate' | 'title' | 'progress' | 'order';
  direction: 'asc' | 'desc';
}

// 批量操作类型
export interface TaskBatchOperation {
  taskIds: string[];
  operation: 'delete' | 'move' | 'updateStatus' | 'updateTags';
  params?: Record<string, any>;
}

// 里程碑批量操作类型
export interface MilestoneBatchOperation {
  milestoneIds: string[];
  operation: 'delete' | 'move' | 'updateIcon' | 'detach';
  params?: Record<string, any>;
}

// 组合任务和里程碑的数据类型（用于统一处理）
export type TaskEntity = Task | MilestoneNode;

// 类型守卫函数接口
export interface TaskTypeGuards {
  isTask: (entity: TaskEntity) => entity is Task;
  isMilestone: (entity: TaskEntity) => entity is MilestoneNode;
  isTaskBar: (task: Task) => task is TaskBar;
}