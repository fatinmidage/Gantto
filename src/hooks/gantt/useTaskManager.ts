import { useState, useCallback, useMemo } from 'react';
import { Task, ProjectRow } from '../../types';

// 初始化数据接口
interface InitialTaskData {
  tasks?: Task[];
  projectRows?: ProjectRow[];
  chartTasks?: Task[];
}

// 任务管理Hook
export const useTaskManager = (initialData?: InitialTaskData) => {
  const [tasks, setTasks] = useState<Task[]>(initialData?.tasks || []);
  const [projectRows, setProjectRows] = useState<ProjectRow[]>(initialData?.projectRows || []);
  const [chartTasks, setChartTasks] = useState<Task[]>(initialData?.chartTasks || []);

  // 创建任务映射
  const taskMap = useMemo(() => {
    const map = new Map<string, Task>();
    tasks.forEach(task => map.set(task.id, task));
    return map;
  }, [tasks]);

  // 创建项目行映射
  const projectRowMap = useMemo(() => {
    const map = new Map<string, ProjectRow>();
    projectRows.forEach(row => map.set(row.id, row));
    return map;
  }, [projectRows]);

  // 添加任务
  const addTask = useCallback((task: Task) => {
    setTasks(prev => [...prev, task]);
  }, []);

  // 添加项目行
  const addProjectRow = useCallback((row: ProjectRow) => {
    setProjectRows(prev => [...prev, row]);
  }, []);

  // 添加图表任务
  const addChartTask = useCallback((task: Task) => {
    setChartTasks(prev => [...prev, task]);
  }, []);

  // 删除任务
  const deleteTask = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  }, []);

  // 删除项目行
  const deleteProjectRow = useCallback((rowId: string) => {
    setProjectRows(prev => prev.filter(row => row.id !== rowId));
  }, []);

  // 删除图表任务
  const deleteChartTask = useCallback((taskId: string) => {
    setChartTasks(prev => prev.filter(task => task.id !== taskId));
  }, []);

  // 更新任务
  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    setTasks(prev => {
      return prev.map(task => {
        if (task.id === taskId) {
          return { ...task, ...updates };
        }
        return task;
      });
    });

    // 同步更新 projectRows 数组（用于任务标题列显示）
    setProjectRows(prev => {
      return prev.map(row => {
        if (row.id === taskId) {
          return { ...row, ...updates };
        }
        return row;
      });
    });
  }, []);

  // 更新项目行
  const updateProjectRow = useCallback((rowId: string, updates: Partial<ProjectRow>) => {
    setProjectRows(prev => prev.map(row => 
      row.id === rowId ? { ...row, ...updates } : row
    ));
  }, []);

  // 更新图表任务
  const updateChartTask = useCallback((taskId: string, updates: Partial<Task>) => {
    setChartTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    ));
  }, []);

  // 复制任务
  const duplicateTask = useCallback((taskId: string) => {
    const task = taskMap.get(taskId);
    if (task) {
      const newTask = {
        ...task,
        id: `${task.id}-copy-${Date.now()}`,
        title: `${task.title} (副本)`,
        order: (task.order || 0) + 0.1
      };
      addTask(newTask);
      return newTask;
    }
    return null;
  }, [taskMap, addTask]);

  // 切换展开/折叠状态
  const toggleExpand = useCallback((taskId: string) => {
    // 检查是否为项目行
    const projectRow = projectRowMap.get(taskId);
    if (projectRow) {
      updateProjectRow(taskId, { isExpanded: !projectRow.isExpanded });
      return;
    }

    // 检查是否为普通任务
    const task = taskMap.get(taskId);
    if (task) {
      updateTask(taskId, { isExpanded: !task.isExpanded });
    }
  }, [projectRowMap, taskMap, updateProjectRow, updateTask]);

  // 获取可见任务（考虑展开/折叠状态）
  const getVisibleTasks = useCallback((tasks: Task[], taskMap: Map<string, Task>): Task[] => {
    const visibleTasks: Task[] = [];
    
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
  }, []);

  // 获取可见项目行（考虑展开/折叠状态）
  const getVisibleProjectRows = useCallback((rows: ProjectRow[], rowMap: Map<string, ProjectRow>): ProjectRow[] => {
    const visibleRows: ProjectRow[] = [];
    
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
  }, []);

  // 计算父任务进度
  const calculateParentProgress = useCallback((parentId: string, allTasks: Task[]): number => {
    const childTasks = allTasks.filter(task => task.parentId === parentId);
    if (childTasks.length === 0) return 0;
    
    const totalProgress = childTasks.reduce((sum, child) => {
      return sum + (child.progress || 0);
    }, 0);
    
    return totalProgress / childTasks.length;
  }, []);

  // 获取所有子代行
  const getAllDescendantRows = useCallback((rowId: string, rows: ProjectRow[]): ProjectRow[] => {
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
  }, []);

  return {
    // === 状态 ===
    tasks,
    projectRows,
    chartTasks,
    taskMap,
    projectRowMap,
    
    // === 状态设置器 ===
    setTasks,
    setProjectRows,
    setChartTasks,
    
    // === CRUD操作 ===
    addTask,
    addProjectRow,
    addChartTask,
    deleteTask,
    deleteProjectRow,
    deleteChartTask,
    updateTask,
    updateProjectRow,
    updateChartTask,
    duplicateTask,
    
    // === 层级管理 ===
    toggleExpand,
    getVisibleTasks,
    getVisibleProjectRows,
    calculateParentProgress,
    getAllDescendantRows
  };
};