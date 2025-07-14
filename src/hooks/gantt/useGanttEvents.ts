import { useTaskCRUD } from './useTaskCRUD';
import { useTaskAttributes } from './useTaskAttributes';
import { useTaskBatch } from './useTaskBatch';
import { Task, ProjectRow } from '../../types';

interface UseGanttEventsProps {
  tasks: Task[];
  chartTasks: Task[];
  projectRows: ProjectRow[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setChartTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setProjectRows: React.Dispatch<React.SetStateAction<ProjectRow[]>>;
  availableTags?: string[];
  setAvailableTags?: React.Dispatch<React.SetStateAction<string[]>>;
}

export const useGanttEvents = ({
  tasks,
  chartTasks,
  projectRows,
  setTasks,
  setChartTasks,
  setProjectRows,
  availableTags = [],
  setAvailableTags
}: UseGanttEventsProps) => {
  
  // 使用子hooks组合功能
  const taskCRUD = useTaskCRUD({
    tasks,
    chartTasks,
    projectRows,
    setTasks,
    setChartTasks,
    setProjectRows
  });
  
  const taskAttributes = useTaskAttributes({
    chartTasks,
    setTasks,
    setChartTasks,
    availableTags,
    setAvailableTags
  });
  
  const taskBatch = useTaskBatch({
    tasks,
    chartTasks,
    setTasks,
    setChartTasks
  });

  return {
    // 基础操作 (来自 useTaskCRUD)
    ...taskCRUD,
    
    // 任务属性管理 (来自 useTaskAttributes)
    ...taskAttributes,
    
    // 批量操作 (来自 useTaskBatch)
    ...taskBatch
  };
};