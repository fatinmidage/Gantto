import { useTaskCRUD } from './useTaskCRUD';
import { useTaskAttributes } from './useTaskAttributes';
import { useTaskBatch } from './useTaskBatch';
import { useGlobalTags } from './useGlobalTags';
import { Task, ProjectRow, MilestoneNode } from '../../types';

interface UseGanttEventsProps {
  tasks: Task[];
  chartTasks: Task[];
  projectRows: ProjectRow[];
  milestones?: MilestoneNode[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setChartTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setProjectRows: React.Dispatch<React.SetStateAction<ProjectRow[]>>;
  setMilestones?: React.Dispatch<React.SetStateAction<MilestoneNode[]>>;
  milestoneManager?: {
    updateMilestone: (updates: { id: string; date: Date; [key: string]: any }) => void;
  };
}

export const useGanttEvents = ({
  tasks,
  chartTasks,
  projectRows,
  milestones = [],
  setTasks,
  setChartTasks,
  setProjectRows,
  setMilestones = () => {},
  milestoneManager
}: UseGanttEventsProps) => {
  
  // 使用统一的全局标签管理（供后续扩展使用）
  useGlobalTags();
  
  // 使用子hooks组合功能
  const taskCRUD = useTaskCRUD({
    tasks,
    chartTasks,
    projectRows,
    milestones,
    setTasks,
    setChartTasks,
    setProjectRows,
    setMilestones,
    milestoneManager
  });
  
  const taskAttributes = useTaskAttributes({
    chartTasks,
    setTasks,
    setChartTasks
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