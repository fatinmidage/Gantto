import React, { createContext, useContext } from 'react';
import { Task, ProjectRow } from '../../types';

// 导入自定义 Hooks
import {
  useTaskManager,
  useTimeline,
  useGanttUI,
} from '../../hooks';
import { useGanttState } from '../../hooks/gantt/useGanttState';
import { useGanttCalculations } from '../../hooks/gantt/useGanttCalculations';


// 导入初始数据
import { initialProjectRows, initialChartTasks } from '../../data/initialData';

// 数据上下文类型定义
export interface GanttDataContextType {
  // 基础数据
  projectRows: ProjectRow[];
  chartTasks: Task[];
  tasks: Task[];
  availableTags: string[];
  
  // 数据更新方法
  setProjectRows: (rows: ProjectRow[]) => void;
  setChartTasks: (tasks: Task[]) => void;
  setTasks: (tasks: Task[]) => void;
  setAvailableTags: (tags: string[]) => void;
  
  // 计算数据
  sortedTasks: Task[];
  sortedProjectRows: ProjectRow[];
  sortedChartTasks: Task[];
  visibleProjectRows: ProjectRow[];
  visibleTasks: Task[];
  leftPanelTasks: Task[];
  chartTaskRows: Array<{ rowId: string; tasks: Task[] }>;
  taskRows: Array<{ rowId: string; tasks: Task[] }>;
  
  // 映射数据
  taskMapMemo: Map<string, Task>;
  projectRowMapMemo: Map<string, ProjectRow>;
  
  // 布局计算
  containerHeight: number;
  taskContentHeight: number;
  
  // 时间轴相关
  dateToPixel: (date: Date) => number;
  pixelToDate: (pixel: number) => Date;
  
  // UI 状态
  selectedChartTaskId: string | null;
  setSelectedChartTaskId: (id: string | null) => void;
}

// 创建数据上下文
const GanttDataContext = createContext<GanttDataContextType | undefined>(undefined);

// Hook 用于获取数据上下文
export const useGanttData = () => {
  const context = useContext(GanttDataContext);
  if (!context) {
    throw new Error('useGanttData 必须在 GanttDataProvider 内部使用');
  }
  return context;
};

// GanttDataProvider 组件属性
interface GanttDataProviderProps {
  children: React.ReactNode;
  startDate: Date;
  endDate: Date;
  taskHeight: number;
}

// GanttDataProvider 组件
export const GanttDataProvider: React.FC<GanttDataProviderProps> = ({
  children,
  startDate,
  endDate,
  taskHeight
}) => {
  // === 使用自定义 Hooks ===
  
  // 任务管理
  const taskManager = useTaskManager({
    projectRows: initialProjectRows,
    chartTasks: initialChartTasks
  });
  
  // 时间轴管理
  const timeline = useTimeline(startDate, endDate);
  
  // UI 状态管理
  const ganttUI = useGanttUI();
  
  // 状态管理
  const ganttState = useGanttState();

  // === 从 Hooks 解构状态和方法 ===
  
  const { 
    projectRows, 
    chartTasks, 
    tasks, 
    setProjectRows, 
    setChartTasks, 
    setTasks 
  } = taskManager;

  const {
    dateToPixel,
    pixelToDate
  } = timeline;
  
  const {
    selectedChartTaskId,
    setSelectedChartTaskId
  } = ganttUI;

  const {
    availableTags,
    setAvailableTags
  } = ganttState;

  // === 数据计算逻辑 ===
  const calculations = useGanttCalculations(
    tasks,
    projectRows,
    chartTasks,
    dateToPixel,
    taskHeight
  );

  const {
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
  } = calculations;

  // 构建上下文值
  const contextValue: GanttDataContextType = {
    // 基础数据
    projectRows,
    chartTasks,
    tasks,
    availableTags,
    
    // 数据更新方法
    setProjectRows,
    setChartTasks,
    setTasks,
    setAvailableTags,
    
    // 计算数据
    sortedTasks,
    sortedProjectRows,
    sortedChartTasks,
    visibleProjectRows,
    visibleTasks,
    leftPanelTasks,
    chartTaskRows,
    taskRows,
    
    // 映射数据
    taskMapMemo,
    projectRowMapMemo,
    
    // 布局计算
    containerHeight,
    taskContentHeight,
    
    // 时间轴相关
    dateToPixel,
    pixelToDate,
    
    // UI 状态
    selectedChartTaskId,
    setSelectedChartTaskId
  };

  return (
    <GanttDataContext.Provider value={contextValue}>
      {children}
    </GanttDataContext.Provider>
  );
};