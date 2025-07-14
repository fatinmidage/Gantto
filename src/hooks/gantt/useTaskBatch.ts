import { useCallback } from 'react';
import { Task } from '../../types';

interface UseTaskBatchProps {
  tasks: Task[];
  chartTasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setChartTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

export interface UseTaskBatchResult {
  batchUpdateTasks: (taskIds: string[], updates: Partial<Task>) => void;
}

export const useTaskBatch = ({
  tasks,
  chartTasks,
  setTasks,
  setChartTasks
}: UseTaskBatchProps): UseTaskBatchResult => {

  // 批量任务操作
  const batchUpdateTasks = useCallback((taskIds: string[], updates: Partial<Task>) => {
    // 分别更新图表任务和传统任务
    const chartTaskIds = chartTasks.filter(t => taskIds.includes(t.id)).map(t => t.id);
    const regularTaskIds = tasks.filter(t => taskIds.includes(t.id)).map(t => t.id);

    if (chartTaskIds.length > 0) {
      setChartTasks(prev => prev.map(task => 
        chartTaskIds.includes(task.id) ? { ...task, ...updates } : task
      ));
    }

    if (regularTaskIds.length > 0) {
      setTasks(prev => prev.map(task => 
        regularTaskIds.includes(task.id) ? { ...task, ...updates } : task
      ));
    }
  }, [chartTasks, tasks, setChartTasks, setTasks]);

  return {
    batchUpdateTasks
  };
};