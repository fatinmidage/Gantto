import { useMemo, useCallback } from 'react';
import { Task, ProjectRow } from '../../../types';
import { getVisibleProjectRows } from '../GanttHelpers';
import { LAYOUT_CONSTANTS, layoutUtils } from '../ganttStyles';

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
  projectRows: ProjectRow[];
  chartTasks: Task[];
  filteredTasks: Task[];
  dateToPixel: (date: Date) => number;
  taskHeight: number;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setProjectRows: React.Dispatch<React.SetStateAction<ProjectRow[]>>;
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
    // 🔧 修复：只在任务没有x和width时才重新计算，避免覆盖updateTaskDates的更新
    if (task.x !== undefined && task.width !== undefined) {
      // 任务已有位置信息，直接使用（保留updateTaskDates的坐标转换结果）
      return { ...task };
    }
    
    // 任务没有位置信息，计算初始位置（使用中心点坐标系统）
    const leftEdgeX = dateToPixel(task.startDate);
    const rightEdgeX = dateToPixel(task.endDate);
    const width = Math.max(rightEdgeX - leftEdgeX, 20);
    const centerX = leftEdgeX + width / 2;  // 转换为中心点坐标
    
    return { ...task, x: centerX, width };
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
    type: (row.type || 'default') as 'development' | 'testing' | 'delivery' | 'default'
  })), [visibleProjectRows]);

  // 图表任务行
  const chartTaskRows = useMemo(() => {
    // 创建可见行ID的集合，用于快速查找
    const visibleRowIds = new Set(visibleProjectRows.map(row => row.id));
    
    // 只保留属于可见行的图表任务
    const visibleChartTasks = sortedChartTasks.filter(task => 
      task.rowId && visibleRowIds.has(task.rowId)
    );
    
    // 创建行映射
    const rowMap = new Map<string, Task[]>();
    visibleProjectRows.forEach(row => rowMap.set(row.id, []));
    
    // 将可见的图表任务分配到对应的行
    visibleChartTasks.forEach(task => {
      if (task.rowId && rowMap.has(task.rowId)) {
        rowMap.get(task.rowId)!.push(task);
      }
    });
    
    return visibleProjectRows.map(row => ({
      rowId: row.id,
      tasks: rowMap.get(row.id)!.sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    }));
  }, [visibleProjectRows, sortedChartTasks]);

  // 容器高度
  const containerHeight = useMemo(() => 
    Math.max(MIN_CONTAINER_HEIGHT, leftPanelTasks.length * layoutUtils.calculateRowHeight(taskHeight) + 20), 
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