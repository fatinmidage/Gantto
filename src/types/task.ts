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