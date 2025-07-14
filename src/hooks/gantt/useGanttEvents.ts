import { useCallback } from 'react';
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
  
  // 添加新任务
  const addNewTask = useCallback(() => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: '新任务',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      color: '#4CAF50',
      x: 0,
      width: 0,
      order: tasks.length,
      type: 'default',
      status: 'pending'
    };
    setTasks(prev => [...prev, newTask]);
  }, [tasks.length, setTasks]);

  // 删除图表任务
  const deleteChartTask = useCallback((taskId: string) => {
    setChartTasks(prev => prev.filter(task => task.id !== taskId));
  }, [setChartTasks]);

  // 删除项目行
  const deleteProjectRow = useCallback((rowId: string) => {
    setProjectRows(prev => {
      const rowToDelete = prev.find(row => row.id === rowId);
      if (!rowToDelete) return prev;
      
      // 获取所有需要删除的行ID（包括子行）
      const rowsToDelete = new Set<string>();
      
      const collectChildRows = (parentId: string) => {
        rowsToDelete.add(parentId);
        const childRows = prev.filter(row => row.parentId === parentId);
        childRows.forEach(child => collectChildRows(child.id));
      };
      
      collectChildRows(rowId);
      
      // 更新父行的children数组，清理对被删除行的引用
      const updatedRows = prev.map(row => {
        if (row.children && row.children.includes(rowId)) {
          return {
            ...row,
            children: row.children.filter(childId => childId !== rowId)
          };
        }
        return row;
      });
      
      // 删除选中的行和其子行
      return updatedRows.filter(row => !rowsToDelete.has(row.id));
    });

    // 同时删除该行的所有图表任务
    setChartTasks(prev => prev.filter(task => task.rowId !== rowId));
  }, [setProjectRows, setChartTasks]);

  // 兼容性删除函数：根据任务类型决定删除逻辑
  const deleteTaskCore = useCallback((taskId: string) => {
    // 首先检查是否为图表任务
    const chartTask = chartTasks.find(task => task.id === taskId);
    if (chartTask) {
      deleteChartTask(taskId);
      return;
    }

    // 然后检查是否为项目行
    const projectRow = projectRows.find(row => row.id === taskId);
    if (projectRow) {
      // 注意：根据新需求，删除项目行的任务不应该删除行本身
      // 只删除该行对应的图表任务，保持左侧行结构不变
      setChartTasks(prev => prev.filter(task => task.rowId !== taskId));
      return;
    }

    // 兼容性：处理旧的tasks数据
    setTasks(prev => {
      const taskToDelete = prev.find(task => task.id === taskId);
      if (!taskToDelete) return prev;
      
      // 获取所有需要删除的任务ID（包括子任务）
      const tasksToDelete = new Set<string>();
      
      const collectChildTasks = (parentId: string) => {
        tasksToDelete.add(parentId);
        const childTasks = prev.filter(task => task.parentId === parentId);
        childTasks.forEach(child => collectChildTasks(child.id));
      };
      
      collectChildTasks(taskId);
      
      // 更新父任务的children数组，清理对被删除任务的引用
      const updatedTasks = prev.map(task => {
        if (task.children && task.children.includes(taskId)) {
          return {
            ...task,
            children: task.children.filter(childId => childId !== taskId)
          };
        }
        return task;
      });
      
      // 删除选中的任务和其子任务
      return updatedTasks.filter(task => !tasksToDelete.has(task.id));
    });
  }, [chartTasks, projectRows, deleteChartTask, setChartTasks, setTasks]);

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

  // 更新任务时间
  const updateTaskDates = useCallback((taskId: string, startDate: Date, endDate: Date) => {
    // 优先更新图表任务
    const chartTask = chartTasks.find(t => t.id === taskId);
    if (chartTask) {
      setChartTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, startDate, endDate } : task
      ));
    } else {
      // 兼容性：更新传统任务
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, startDate, endDate } : task
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

  // 创建新任务
  const createTask = useCallback((task: Task) => {
    setChartTasks(prev => [...prev, task]);
  }, [setChartTasks]);

  // 创建里程碑
  const createMilestone = useCallback((milestone: Task) => {
    setChartTasks(prev => [...prev, milestone]);
  }, [setChartTasks]);

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
    // 基础操作
    addNewTask,
    deleteChartTask,
    deleteProjectRow,
    deleteTaskCore,
    
    // 任务属性管理
    handleColorChange,
    handleTagAdd,
    handleTagRemove,
    updateTaskDates,
    updateTaskStatus,
    updateTaskProgress,
    
    // 任务创建
    createTask,
    createMilestone,
    
    // 批量操作
    batchUpdateTasks
  };
};