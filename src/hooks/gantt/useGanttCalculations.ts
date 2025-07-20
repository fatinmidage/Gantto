import { useMemo } from 'react';
import { Task, ProjectRow } from '../../types';

// 导入层级帮助函数
import {
  getVisibleProjectRows,
  getVisibleTasks
} from '../../components/gantt/GanttHelpers';

// 计算结果接口
export interface GanttCalculationsResult {
  sortedTasks: Task[];
  sortedProjectRows: ProjectRow[];
  sortedChartTasks: Task[];
  visibleProjectRows: ProjectRow[];
  visibleTasks: Task[];
  leftPanelTasks: Task[];
  chartTaskRows: Array<{ rowId: string; tasks: Task[] }>;
  taskRows: Array<{ rowId: string; tasks: Task[] }>;
  taskMapMemo: Map<string, Task>;
  projectRowMapMemo: Map<string, ProjectRow>;
  containerHeight: number;
  taskContentHeight: number;
}

/**
 * 甘特图数据计算 Hook
 * 负责所有数据计算和转换逻辑
 */
export const useGanttCalculations = (
  tasks: Task[],
  projectRows: ProjectRow[],
  chartTasks: Task[],
  dateToPixel: (date: Date) => number,
  taskHeight: number
): GanttCalculationsResult => {

  // 添加任务排序辅助函数，同时计算位置信息
  const sortedTasks = useMemo(() => {
    return [...tasks]
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(task => {
        const x = dateToPixel(task.startDate);
        const width = dateToPixel(task.endDate) - x;
        return { ...task, x, width: Math.max(width, 20) };
      });
  }, [tasks, dateToPixel]);

  // 优化taskMap的创建，避免不必要的状态更新
  const taskMapMemo = useMemo(() => {
    const newMap = new Map<string, Task>();
    sortedTasks.forEach(task => {
      newMap.set(task.id, task);
    });
    return newMap;
  }, [sortedTasks]);

  // 获取排序后的项目行
  const sortedProjectRows = useMemo(() => {
    return [...projectRows].sort((a, b) => a.order - b.order);
  }, [projectRows]);

  // 创建项目行映射
  const projectRowMapMemo = useMemo(() => {
    const newMap = new Map<string, ProjectRow>();
    sortedProjectRows.forEach(row => {
      newMap.set(row.id, row);
    });
    return newMap;
  }, [sortedProjectRows]);

  // 获取可见项目行列表（固定的左侧任务列表）
  const visibleProjectRows = useMemo(() => {
    return getVisibleProjectRows(sortedProjectRows, projectRowMapMemo);
  }, [sortedProjectRows, projectRowMapMemo]);

  // 获取排序后的图表任务，添加位置信息
  const sortedChartTasks = useMemo(() => {
    console.log('🔧 [useGanttCalculations] sortedChartTasks 重新计算, chartTasks数量:', chartTasks.length);
    chartTasks.forEach(task => {
      console.log(`  - ${task.id} (${task.title}) type:${task.type} rowId:${task.rowId}`);
    });
    
    const result = chartTasks.map(task => {
      const x = dateToPixel(task.startDate);
      const width = dateToPixel(task.endDate) - x;
      return { ...task, x, width: Math.max(width, 20) };
    });
    
    console.log('🔧 [useGanttCalculations] sortedChartTasks 计算完成, 结果数量:', result.length);
    return result;
  }, [chartTasks, dateToPixel]);

  // 获取可见任务列表（考虑层级展开状态）
  const visibleTasks = useMemo(() => {
    return getVisibleTasks(sortedTasks, taskMapMemo);
  }, [sortedTasks, taskMapMemo]);

  // 左侧面板任务现在直接使用visibleProjectRows，无需复杂的占位符逻辑
  const leftPanelTasks = useMemo(() => {
    // 将ProjectRow转换为Task格式以保持兼容性
    return visibleProjectRows.map(row => ({
      id: row.id,
      title: row.title,
      startDate: new Date(), // 占位符日期
      endDate: new Date(),   // 占位符日期
      color: '#ccc',
      x: 0,
      width: 0,
      order: row.order,
      type: row.type || 'default',
      status: 'pending' as const,
      level: row.level,
      parentId: row.parentId,
      children: row.children,
      isExpanded: row.isExpanded,
      rowId: row.id,
      isCreatedFromContext: false,
      isPlaceholder: false
    }));
  }, [visibleProjectRows]);

  // 基于新的数据结构：按rowId分组图表任务
  const chartTaskRows = useMemo(() => {
    console.log('🔧 [useGanttCalculations] chartTaskRows 重新计算');
    console.log('  visibleProjectRows数量:', visibleProjectRows.length);
    console.log('  sortedChartTasks数量:', sortedChartTasks.length);
    
    const rowMap = new Map<string, Task[]>();
    
    // 为每个可见项目行创建一个空的任务数组
    visibleProjectRows.forEach(row => {
      rowMap.set(row.id, []);
      console.log(`  创建空行: ${row.id}`);
    });
    
    // 将图表任务分组到对应的行
    sortedChartTasks.forEach(task => {
      console.log(`  处理任务: ${task.id} rowId:${task.rowId} 行存在:${rowMap.has(task.rowId || '')}`);
      if (task.rowId && rowMap.has(task.rowId)) {
        rowMap.get(task.rowId)!.push(task);
        console.log(`    ✅ 任务 ${task.id} 添加到行 ${task.rowId}`);
      } else {
        console.log(`    ❌ 任务 ${task.id} 无法添加，rowId:${task.rowId}`);
      }
    });
    
    // 按项目行顺序排序，同一行内按startDate排序任务
    const result = visibleProjectRows.map(row => ({
      rowId: row.id,
      tasks: rowMap.get(row.id)!.sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    }));
    
    console.log('🔧 [useGanttCalculations] chartTaskRows 计算完成:');
    result.forEach((row, index) => {
      console.log(`  Row ${index} (${row.rowId}): ${row.tasks.length} 个任务`);
    });
    
    return result;
  }, [visibleProjectRows, sortedChartTasks]);

  // 兼容性：按rowId分组任务，支持同一行显示多个任务
  const taskRows = useMemo(() => {
    const rowMap = new Map<string, Task[]>();
    
    visibleTasks.forEach(task => {
      const rowId = task.rowId || `row-${Math.floor(task.order || 0)}`;
      if (!rowMap.has(rowId)) {
        rowMap.set(rowId, []);
      }
      rowMap.get(rowId)!.push(task);
    });
    
    // 按order排序行，同一行内按startDate排序任务
    return Array.from(rowMap.entries())
      .sort(([, tasksA], [, tasksB]) => {
        const orderA = Math.min(...tasksA.map(t => t.order || 0));
        const orderB = Math.min(...tasksB.map(t => t.order || 0));
        return orderA - orderB;
      })
      .map(([rowId, tasks]) => ({
        rowId,
        tasks: tasks.sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
      }));
  }, [visibleTasks]);

  // 计算容器高度：根据左侧任务列表的行数动态调整
  const containerHeight = useMemo(() => {
    const taskRowHeight = taskHeight + 10; // 任务高度 + 间距
    const calculatedHeight = leftPanelTasks.length * taskRowHeight + 20; // 额外20px留白
    const MIN_CONTAINER_HEIGHT = 300; // 最小容器高度
    return Math.max(MIN_CONTAINER_HEIGHT, calculatedHeight);
  }, [leftPanelTasks.length, taskHeight]);

  // 计算任务内容区域高度（不包含时间轴）
  const taskContentHeight = useMemo(() => {
    return containerHeight; // 左侧任务列表区域的内容高度
  }, [containerHeight]);

  return {
    sortedTasks,
    sortedProjectRows,
    sortedChartTasks,
    visibleProjectRows,
    visibleTasks,
    leftPanelTasks,
    chartTaskRows,
    taskRows,
    taskMapMemo,
    projectRowMapMemo,
    containerHeight,
    taskContentHeight
  };
};