import { useCallback } from 'react';
import { Task } from '../../types';

interface UseTaskAttributesProps {
  chartTasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setChartTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  availableTags?: string[];
  setAvailableTags?: React.Dispatch<React.SetStateAction<string[]>>;
}

export interface UseTaskAttributesResult {
  handleColorChange: (taskId: string, color: string) => void;
  handleTagAdd: (taskId: string, tag: string) => void;
  handleTagRemove: (taskId: string, tag: string) => void;
  updateTaskStatus: (taskId: string, status: Task['status']) => void;
  updateTaskProgress: (taskId: string, progress: number) => void;
}

export const useTaskAttributes = ({
  chartTasks,
  setTasks,
  setChartTasks,
  availableTags = [],
  setAvailableTags
}: UseTaskAttributesProps): UseTaskAttributesResult => {

  // 更改任务颜色
  const handleColorChange = useCallback((taskId: string, color: string) => {
    // 优先更新图表任务
    const chartTask = chartTasks.find(t => t.id === taskId);
    if (chartTask) {
      setChartTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, color } : task
      ));
    } else {
      // 兼容性：更新传统任务
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, color } : task
      ));
    }
  }, [chartTasks, setChartTasks, setTasks]);

  // 添加标签
  const handleTagAdd = useCallback((taskId: string, tag: string) => {
    if (!tag.trim()) return;
    
    // 优先更新图表任务
    const chartTask = chartTasks.find(t => t.id === taskId);
    if (chartTask) {
      setChartTasks(prev => prev.map(task => {
        if (task.id === taskId) {
          const currentTags = task.tags || [];
          if (!currentTags.includes(tag)) {
            return { ...task, tags: [...currentTags, tag] };
          }
        }
        return task;
      }));
    } else {
      // 兼容性：更新传统任务
      setTasks(prev => prev.map(task => {
        if (task.id === taskId) {
          const currentTags = task.tags || [];
          if (!currentTags.includes(tag)) {
            return { ...task, tags: [...currentTags, tag] };
          }
        }
        return task;
      }));
    }
    
    // 将新标签添加到可用标签列表
    if (setAvailableTags && !availableTags.includes(tag)) {
      setAvailableTags(prev => [...prev, tag]);
    }
  }, [chartTasks, setChartTasks, setTasks, availableTags, setAvailableTags]);

  // 移除标签
  const handleTagRemove = useCallback((taskId: string, tag: string) => {
    // 优先更新图表任务
    const chartTask = chartTasks.find(t => t.id === taskId);
    if (chartTask) {
      setChartTasks(prev => prev.map(task => {
        if (task.id === taskId) {
          const currentTags = task.tags || [];
          return { ...task, tags: currentTags.filter(t => t !== tag) };
        }
        return task;
      }));
    } else {
      // 兼容性：更新传统任务
      setTasks(prev => prev.map(task => {
        if (task.id === taskId) {
          const currentTags = task.tags || [];
          return { ...task, tags: currentTags.filter(t => t !== tag) };
        }
        return task;
      }));
    }
  }, [chartTasks, setChartTasks, setTasks]);

  // 任务状态管理
  const updateTaskStatus = useCallback((taskId: string, status: Task['status']) => {
    // 优先更新图表任务
    const chartTask = chartTasks.find(t => t.id === taskId);
    if (chartTask) {
      setChartTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status } : task
      ));
    } else {
      // 兼容性：更新传统任务
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status } : task
      ));
    }
  }, [chartTasks, setChartTasks, setTasks]);

  // 任务进度管理
  const updateTaskProgress = useCallback((taskId: string, progress: number) => {
    // 优先更新图表任务
    const chartTask = chartTasks.find(t => t.id === taskId);
    if (chartTask) {
      setChartTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, progress } : task
      ));
    } else {
      // 兼容性：更新传统任务
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, progress } : task
      ));
    }
  }, [chartTasks, setChartTasks, setTasks]);

  return {
    handleColorChange,
    handleTagAdd,
    handleTagRemove,
    updateTaskStatus,
    updateTaskProgress
  };
};