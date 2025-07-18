/**
 * Task 和 ProjectRow 映射工具函数
 * 统一数据结构，提供双向映射功能
 */

import { Task, ProjectRow } from '../types';

/**
 * 将 Task 转换为 ProjectRow
 */
export const taskToProjectRow = (task: Task): ProjectRow => {
  return {
    id: task.id,
    taskId: task.id,
    title: task.title,
    order: task.order || 0,
    level: task.level || 0,
    type: task.type,
    isExpanded: task.isExpanded || false,
    isVisible: true,
    parentId: task.parentId,
    children: task.children || [],
    height: 50, // 默认高度
    isSelected: false,
    isHovered: false,
    isGroup: false
  };
};

/**
 * 将 ProjectRow 转换为 Task（基础信息）
 */
export const projectRowToTask = (
  row: ProjectRow, 
  existingTask?: Partial<Task>
): Task => {
  const now = new Date();
  
  return {
    id: row.id,
    title: row.title,
    description: existingTask?.description || '',
    startDate: existingTask?.startDate || now,
    endDate: existingTask?.endDate || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    type: row.type || 'default',
    status: existingTask?.status || 'pending',
    progress: existingTask?.progress || 0,
    parentId: row.parentId,
    children: row.children || [],
    level: row.level || 0,
    color: existingTask?.color || '#4CAF50',
    tags: existingTask?.tags || [],
    order: row.order,
    isExpanded: row.isExpanded || false,
    x: existingTask?.x || 0,
    width: existingTask?.width || 100,
    createdAt: existingTask?.createdAt || now,
    updatedAt: existingTask?.updatedAt || now,
    rowId: row.id,
    isPlaceholder: false
  };
};

/**
 * 批量转换 Tasks 为 ProjectRows
 */
export const tasksToProjectRows = (tasks: Task[]): ProjectRow[] => {
  return tasks.map(taskToProjectRow);
};

/**
 * 批量转换 ProjectRows 为 Tasks
 */
export const projectRowsToTasks = (
  rows: ProjectRow[], 
  existingTasks: Task[] = []
): Task[] => {
  const existingTaskMap = new Map(existingTasks.map(task => [task.id, task]));
  
  return rows.map(row => {
    const existingTask = existingTaskMap.get(row.id);
    return projectRowToTask(row, existingTask);
  });
};

/**
 * 同步 Task 到 ProjectRow（保持 Task 为主数据源）
 */
export const syncTaskToProjectRow = (task: Task, row: ProjectRow): ProjectRow => {
  return {
    ...row,
    title: task.title,
    type: task.type,
    level: task.level || 0,
    parentId: task.parentId,
    children: task.children || [],
    isExpanded: task.isExpanded || false,
    order: task.order || row.order
  };
};

/**
 * 同步 ProjectRow 到 Task（保持显示相关属性）
 */
export const syncProjectRowToTask = (row: ProjectRow, task: Task): Task => {
  return {
    ...task,
    title: row.title,
    level: row.level || 0,
    parentId: row.parentId,
    children: row.children || [],
    isExpanded: row.isExpanded || false,
    order: row.order
  };
};

/**
 * 创建空的 ProjectRow
 */
export const createEmptyProjectRow = (
  id: string, 
  title: string = '新任务',
  parentId?: string
): ProjectRow => {
  return {
    id,
    title,
    order: 0,
    level: parentId ? 1 : 0,
    type: 'default',
    isExpanded: false,
    isVisible: true,
    parentId,
    children: [],
    height: 50,
    isSelected: false,
    isHovered: false,
    isGroup: false
  };
};

/**
 * 创建空的 Task
 */
export const createEmptyTask = (
  id: string, 
  title: string = '新任务',
  parentId?: string
): Task => {
  const now = new Date();
  
  return {
    id,
    title,
    description: '',
    startDate: now,
    endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    type: 'default',
    status: 'pending',
    progress: 0,
    parentId,
    children: [],
    level: parentId ? 1 : 0,
    color: '#4CAF50',
    tags: [],
    order: 0,
    isExpanded: false,
    x: 0,
    width: 100,
    createdAt: now,
    updatedAt: now,
    isPlaceholder: false
  };
};

/**
 * 验证 Task 和 ProjectRow 的一致性
 */
export const validateTaskProjectRowConsistency = (
  tasks: Task[], 
  rows: ProjectRow[]
): { isConsistent: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // 检查数量一致性
  if (tasks.length !== rows.length) {
    errors.push(`任务数量不一致: Tasks=${tasks.length}, ProjectRows=${rows.length}`);
  }
  
  // 检查 ID 一致性
  const taskIds = new Set(tasks.map(t => t.id));
  const rowIds = new Set(rows.map(r => r.id));
  
  for (const id of taskIds) {
    if (!rowIds.has(id)) {
      errors.push(`ProjectRow 中缺少 Task ID: ${id}`);
    }
  }
  
  for (const id of rowIds) {
    if (!taskIds.has(id)) {
      errors.push(`Task 中缺少 ProjectRow ID: ${id}`);
    }
  }
  
  // 检查层级一致性
  const rowMap = new Map(rows.map(r => [r.id, r]));
  
  for (const task of tasks) {
    const row = rowMap.get(task.id);
    if (row) {
      if (task.level !== row.level) {
        errors.push(`层级不一致 ID=${task.id}: Task.level=${task.level}, ProjectRow.level=${row.level}`);
      }
      
      if (task.parentId !== row.parentId) {
        errors.push(`父级不一致 ID=${task.id}: Task.parentId=${task.parentId}, ProjectRow.parentId=${row.parentId}`);
      }
    }
  }
  
  return {
    isConsistent: errors.length === 0,
    errors
  };
};