import { useMemo, useCallback } from 'react';
import { Task } from '../../../types';
import { getVisibleProjectRows } from '../GanttHelpers';
import { LAYOUT_CONSTANTS } from '../ganttStyles';

/**
 * 甘特图状态计算Hook
 * 负责所有派生状态的计算逻辑
 */
export const useGanttStateCalculations = ({
  projectRows,
  chartTasks,
  filteredTasks,
  dateToPixel,
  taskHeight,
  setTasks,
  setProjectRows
}: {
  projectRows: any[];
  chartTasks: any[];
  filteredTasks: Task[];
  dateToPixel: (date: Date) => number;
  taskHeight: number;
  setTasks: React.Dispatch<React.SetStateAction<any[]>>;
  setProjectRows: React.Dispatch<React.SetStateAction<any[]>>;
}) => {
  const MIN_CONTAINER_HEIGHT = LAYOUT_CONSTANTS.MIN_CONTAINER_HEIGHT;

  // 排序后的项目行
  const sortedProjectRows = useMemo(() => 
    [...projectRows].sort((a, b) => a.order - b.order), 
    [projectRows]
  );
  
  // 项目行映射
  const projectRowMapMemo = useMemo(() => 
    new Map(sortedProjectRows.map(row => [row.id, row])), 
    [sortedProjectRows]
  );
  
  // 可见项目行
  const visibleProjectRows = useMemo(() => 
    getVisibleProjectRows(sortedProjectRows, projectRowMapMemo), 
    [sortedProjectRows, projectRowMapMemo]
  );

  // 过滤后的图表任务
  const filteredChartTasks = useMemo(() => {
    if (!chartTasks || chartTasks.length === 0) {
      return [];
    }
    
    // 只保留过滤后任务中存在的图表任务
    const filteredTaskIds = new Set(filteredTasks.map(task => task.id));
    return chartTasks.filter(chartTask => filteredTaskIds.has(chartTask.id));
  }, [chartTasks, filteredTasks]);
  
  // 使用过滤后的图表任务，并添加位置计算
  const sortedChartTasks = useMemo(() => filteredChartTasks.map(task => {
    const x = dateToPixel(task.startDate);
    const width = dateToPixel(task.endDate) - x;
    return { ...task, x, width: Math.max(width, 20) };
  }), [filteredChartTasks, dateToPixel]);

  // 左侧面板任务
  const leftPanelTasks = useMemo(() => visibleProjectRows.map(row => ({
    ...row,
    startDate: new Date(),
    endDate: new Date(),
    color: '#ccc',
    x: 0,
    width: 0,
    status: 'pending' as const,
    rowId: row.id,
    isCreatedFromContext: false,
    isPlaceholder: false,
    type: (row.type || 'default') as 'milestone' | 'development' | 'testing' | 'delivery' | 'default'
  })), [visibleProjectRows]);

  // 图表任务行
  const chartTaskRows = useMemo(() => {
    const rowMap = new Map<string, Task[]>();
    visibleProjectRows.forEach(row => rowMap.set(row.id, []));
    sortedChartTasks.forEach(task => task.rowId && rowMap.has(task.rowId) && rowMap.get(task.rowId)!.push(task));
    return visibleProjectRows.map(row => ({
      rowId: row.id,
      tasks: rowMap.get(row.id)!.sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    }));
  }, [visibleProjectRows, sortedChartTasks]);

  // 容器高度
  const containerHeight = useMemo(() => 
    Math.max(MIN_CONTAINER_HEIGHT, leftPanelTasks.length * (taskHeight + 10) + 20), 
    [leftPanelTasks.length, taskHeight]
  );

  // 任务内容高度
  const taskContentHeight = useMemo(() => containerHeight, [containerHeight]);

  // 任务更新函数
  const handleTaskUpdate = useCallback((taskId: string, updates: Partial<Task>) => {
    // 更新 tasks 数组（如果任务存在于 tasks 中）
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? { ...task, ...updates }
          : task
      )
    );
    
    // 更新 projectRows 数组（任务标题列的数据源）
    setProjectRows(prevRows => 
      prevRows.map(row => 
        row.id === taskId 
          ? { ...row, ...updates }
          : row
      )
    );
  }, [setTasks, setProjectRows]);

  return {
    sortedProjectRows,
    visibleProjectRows,
    sortedChartTasks,
    leftPanelTasks,
    chartTaskRows,
    containerHeight,
    taskContentHeight,
    handleTaskUpdate
  };
};