/**
 * Gantt 图表层级帮助函数
 * 处理项目行和任务的层级关系、可见性逻辑
 */

import { Task, ProjectRow } from '../../types';

// --- Project Row Hierarchy Helpers ---

/**
 * 获取可见项目行列表（考虑展开/折叠状态）
 */
export const getVisibleProjectRows = (rows: ProjectRow[], rowMap: Map<string, ProjectRow>): ProjectRow[] => {
  const visibleRows: ProjectRow[] = [];
  
  // 检查行是否可见（递归检查所有父行的展开状态）
  const isRowVisible = (row: ProjectRow): boolean => {
    if (!row.parentId) {
      return true; // 根行总是可见
    }
    
    const parentRow = rowMap.get(row.parentId);
    if (!parentRow) {
      return false; // 找不到父行
    }
    
    // 父行必须展开，并且父行本身也必须可见
    return (parentRow.isExpanded || false) && isRowVisible(parentRow);
  };
  
  for (const row of rows) {
    if (isRowVisible(row)) {
      visibleRows.push(row);
    }
  }
  
  return visibleRows;
};

// --- Task Hierarchy Helpers (兼容性) ---

/**
 * 获取可见任务列表（考虑展开/折叠状态）
 */
export const getVisibleTasks = (tasks: Task[], taskMap: Map<string, Task>): Task[] => {
  const visibleTasks: Task[] = [];
  
  // 检查任务是否可见（递归检查所有父任务的展开状态）
  const isTaskVisible = (task: Task): boolean => {
    if (!task.parentId) {
      return true; // 根任务总是可见
    }
    
    const parentTask = taskMap.get(task.parentId);
    if (!parentTask) {
      return false; // 找不到父任务
    }
    
    // 父任务必须展开，并且父任务本身也必须可见
    return (parentTask.isExpanded || false) && isTaskVisible(parentTask);
  };
  
  for (const task of tasks) {
    if (isTaskVisible(task)) {
      visibleTasks.push(task);
    }
  }
  
  return visibleTasks;
};

/**
 * 递归获取项目行的所有子行（包括子行的子行）
 */
export const getAllDescendantRows = (rowId: string, rows: ProjectRow[]): ProjectRow[] => {
  const descendants: ProjectRow[] = [];
  
  const collectDescendants = (parentId: string) => {
    for (const row of rows) {
      if (row.parentId === parentId) {
        descendants.push(row);
        collectDescendants(row.id); // 递归收集子行的子行
      }
    }
  };
  
  collectDescendants(rowId);
  return descendants;
};

/**
 * 创建项目行映射表，用于快速查找
 */
export const createProjectRowMap = (rows: ProjectRow[]): Map<string, ProjectRow> => {
  const map = new Map<string, ProjectRow>();
  rows.forEach(row => map.set(row.id, row));
  return map;
};

/**
 * 创建任务映射表，用于快速查找
 */
export const createTaskMap = (tasks: Task[]): Map<string, Task> => {
  const map = new Map<string, Task>();
  tasks.forEach(task => map.set(task.id, task));
  return map;
};

/**
 * 获取任务的层级深度
 */
export const getTaskDepth = (task: Task, taskMap: Map<string, Task>): number => {
  let depth = 0;
  let currentTask = task;
  
  while (currentTask.parentId) {
    const parentTask = taskMap.get(currentTask.parentId);
    if (!parentTask) break;
    depth++;
    currentTask = parentTask;
  }
  
  return depth;
};

/**
 * 检查项目行是否有子行
 */
export const hasChildRows = (rowId: string, rows: ProjectRow[]): boolean => {
  return rows.some(row => row.parentId === rowId);
};

/**
 * 检查任务是否有子任务
 */
export const hasChildTasks = (taskId: string, tasks: Task[]): boolean => {
  return tasks.some(task => task.parentId === taskId);
};