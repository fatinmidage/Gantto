import { useCallback } from 'react';
import { Task } from '../../types';
import { useGlobalTags } from './useGlobalTags';

interface UseTaskAttributesProps {
  chartTasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setChartTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

export interface UseTaskAttributesResult {
  handleColorChange: (taskId: string, color: string) => void;
  handleTagAdd: (taskId: string, tag: string) => void;
  handleTagRemove: (taskId: string, tag: string) => void;
  handleLabelEdit: (taskId: string, label: string) => void; // 里程碑标签编辑
  updateTaskStatus: (taskId: string, status: Task['status']) => void;
  updateTaskProgress: (taskId: string, progress: number) => void;
}

export const useTaskAttributes = ({
  chartTasks,
  setTasks,
  setChartTasks
}: UseTaskAttributesProps): UseTaskAttributesResult => {
  
  // 使用统一的全局标签管理
  const { addTag } = useGlobalTags();

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
    addTag(tag);
  }, [chartTasks, setChartTasks, setTasks, addTag]);

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

  // 里程碑标签编辑
  const handleLabelEdit = useCallback((taskId: string, label: string) => {
    // 优先更新图表任务
    const chartTask = chartTasks.find(t => t.id === taskId);
    if (chartTask) {
      setChartTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, label: label.trim() || undefined } : task
      ));
    } else {
      // 兼容性：更新传统任务
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, label: label.trim() || undefined } : task
      ));
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
    handleLabelEdit,
    updateTaskStatus,
    updateTaskProgress
  };
};