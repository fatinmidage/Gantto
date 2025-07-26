import { useCallback } from 'react';
import { Task, ProjectRow, MilestoneNode } from '../../types';

interface UseTaskCRUDProps {
  tasks: Task[];
  chartTasks: Task[];
  projectRows: ProjectRow[];
  milestones: MilestoneNode[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setChartTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setProjectRows: React.Dispatch<React.SetStateAction<ProjectRow[]>>;
  setMilestones: React.Dispatch<React.SetStateAction<MilestoneNode[]>>;
}

export interface UseTaskCRUDResult {
  addNewTask: () => void;
  deleteChartTask: (taskId: string) => void;
  deleteProjectRow: (rowId: string) => void;
  deleteTaskCore: (taskId: string) => void;
  createTask: (task: Task) => void;
  createMilestone: (milestone: MilestoneNode) => void;
  updateTaskDates: (taskId: string, startDate: Date, endDate: Date) => void;
}

export const useTaskCRUD = ({
  tasks,
  chartTasks,
  projectRows,
  milestones,
  setTasks,
  setChartTasks,
  setProjectRows,
  setMilestones
}: UseTaskCRUDProps): UseTaskCRUDResult => {
  
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

  // 更新任务日期
  const updateTaskDates = useCallback((taskId: string, startDate: Date, endDate: Date) => {
    // 验证日期有效性
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.error('Invalid dates passed to updateTaskDates:', {
        taskId,
        startDate,
        endDate,
        startDateValid: !isNaN(startDate.getTime()),
        endDateValid: !isNaN(endDate.getTime())
      });
      return;
    }
    
    
    // 优先更新图表任务
    const chartTask = chartTasks.find(t => t.id === taskId);
    if (chartTask) {
      
      setChartTasks(prev => {
        const updatedTasks = prev.map(task => {
          if (task.id === taskId) {
            const updatedTask = { 
              ...task, 
              startDate, 
              endDate,
              // 保持原有的 type 字段不变，这是关键！
              type: task.type
            };
            
            
            return updatedTask;
          }
          return task;
        });
        
        return updatedTasks;
      });
    } else {
      // 兼容性：更新传统任务
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { 
          ...task, 
          startDate, 
          endDate,
          // 保持原有的 type 字段不变
          type: task.type 
        } : task
      ));
    }
  }, [chartTasks, setChartTasks, setTasks]);

  // 创建新任务
  const createTask = useCallback((task: Task) => {
    setChartTasks(prev => [...prev, task]);
  }, [setChartTasks]);

  // 创建里程碑
  const createMilestone = useCallback((milestone: MilestoneNode) => {
    setMilestones(prev => [...prev, milestone]);
  }, [setMilestones]);

  return {
    addNewTask,
    deleteChartTask,
    deleteProjectRow,
    deleteTaskCore,
    createTask,
    createMilestone,
    updateTaskDates
  };
};