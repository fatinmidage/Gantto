import { useCallback } from 'react';
import { Task, ProjectRow, MilestoneNode, TaskType } from '../../types';
import { getIconConfig } from '../../config/icons';
import { CoordinateUtils } from '../../utils/coordinateUtils';

interface UseTaskCRUDProps {
  tasks: Task[];
  chartTasks: Task[];
  projectRows: ProjectRow[];
  milestones: MilestoneNode[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setChartTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setProjectRows: React.Dispatch<React.SetStateAction<ProjectRow[]>>;
  setMilestones: React.Dispatch<React.SetStateAction<MilestoneNode[]>>;
  milestoneManager?: {
    updateMilestone: (updates: { id: string; date?: Date; iconType?: string; color?: string; label?: string }) => void;
  };
  dateToPixel?: (date: Date) => number;
  taskHeight?: number;
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
  setMilestones,
  milestoneManager,
  dateToPixel,
  taskHeight = 40
}: UseTaskCRUDProps): UseTaskCRUDResult => {
  
  // 添加新任务
  const addNewTask = useCallback(() => {
    // 使用默认图标配置
    const defaultIconType = 'circle';
    const defaultTaskType: TaskType = 'default';
    const iconConfig = getIconConfig(defaultIconType);
    
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: '新任务',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      color: iconConfig.color, // 使用图标配置的颜色
      x: 0,
      width: 0,
      order: tasks.length,
      type: defaultTaskType,
      iconType: defaultIconType,
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
      return;
    }
    
    // 首先检查是否为里程碑
    const milestone = milestones.find(m => m.id === taskId);
    if (milestone) {
      // 🔧 使用 milestoneManager 的智能更新方法，支持自动标签日期更新
      if (milestoneManager) {
        milestoneManager.updateMilestone({
          id: taskId,
          date: startDate
        });
      } else {
        // 降级处理：直接更新状态（不含智能标签更新）
        setMilestones(prev => {
          const updatedMilestones = prev.map(m => {
            if (m.id === taskId) {
              const updatedMilestone = { 
                ...m, 
                date: startDate  // 里程碑只有一个日期
              };
              return updatedMilestone;
            }
            return m;
          });
          return updatedMilestones;
        });
      }
      return;
    }
    
    // 然后检查图表任务
    const chartTask = chartTasks.find(t => t.id === taskId);
    if (chartTask) {
      setChartTasks(prev => {
        const updatedTasks = prev.map(task => {
          if (task.id === taskId) {
            let updatedTask = { 
              ...task, 
              startDate, 
              endDate,
              // 保持原有的 type 字段不变
              type: task.type
            };
            
            // 🔧 关键修复：重新计算任务位置
            if (dateToPixel) {
              const coordinateUtils = new CoordinateUtils(dateToPixel, taskHeight);
              const rowIndex = prev.findIndex(t => t.id === taskId);
              const newPosition = coordinateUtils.calculateTaskPosition(updatedTask, rowIndex);
              
              // 🎯 坐标系统转换：从左边缘位置转换为中心点位置
              const leftEdgeX = newPosition.x;
              const width = newPosition.width;
              const centerX = leftEdgeX + width / 2;
              
              updatedTask = {
                ...updatedTask,
                x: centerX,  // 使用中心点坐标
                width: width
              };
            }
            
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
  }, [milestones, chartTasks, setMilestones, setChartTasks, setTasks, milestoneManager]);

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