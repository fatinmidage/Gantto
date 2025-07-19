import { useMemo } from 'react';
import { Task } from '../../types';

/**
 * 任务过滤 Hook
 * 根据日期范围过滤任务，实现重叠规则
 */
export const useTaskFilter = (
  tasks: Task[],
  startDate: Date,
  endDate: Date
) => {
  // 任务过滤逻辑
  const filteredTasks = useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return [];
    }

    return tasks.filter(task => {
      // 确保任务有有效的日期
      if (!task.startDate || !task.endDate) {
        return false;
      }

      const taskStart = new Date(task.startDate);
      const taskEnd = new Date(task.endDate);
      const rangeStart = new Date(startDate);
      const rangeEnd = new Date(endDate);

      // 任务过滤规则：任务与日期范围有任何重叠即显示
      // 1. 任务开始日期在范围内
      const taskStartInRange = taskStart >= rangeStart && taskStart <= rangeEnd;
      
      // 2. 任务结束日期在范围内
      const taskEndInRange = taskEnd >= rangeStart && taskEnd <= rangeEnd;
      
      // 3. 任务跨越整个日期范围（任务开始在范围前，结束在范围后）
      const taskSpansRange = taskStart <= rangeStart && taskEnd >= rangeEnd;
      
      // 4. 范围在任务时间内（任务包含整个范围）
      const rangeInTask = taskStart <= rangeStart && taskEnd >= rangeEnd;

      return taskStartInRange || taskEndInRange || taskSpansRange || rangeInTask;
    });
  }, [tasks, startDate, endDate]);

  // 获取过滤统计信息
  const filterStats = useMemo(() => {
    const totalTasks = tasks ? tasks.length : 0;
    const filteredCount = filteredTasks.length;
    const hiddenCount = totalTasks - filteredCount;

    return {
      totalTasks,
      filteredCount,
      hiddenCount,
      hasHiddenTasks: hiddenCount > 0
    };
  }, [tasks, filteredTasks]);

  return {
    filteredTasks,
    filterStats
  };
};

/**
 * 工具函数：检查任务是否在日期范围内
 */
export const isTaskInDateRange = (
  task: Task,
  startDate: Date,
  endDate: Date
): boolean => {
  if (!task.startDate || !task.endDate) {
    return false;
  }

  const taskStart = new Date(task.startDate);
  const taskEnd = new Date(task.endDate);
  const rangeStart = new Date(startDate);
  const rangeEnd = new Date(endDate);

  // 任务与日期范围有任何重叠
  return !(taskEnd < rangeStart || taskStart > rangeEnd);
};