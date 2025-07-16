import { useCallback, useState } from 'react';
import { Task, ProjectRow } from '../../types';

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
}

interface TaskContextMenuState extends ContextMenuState {
  taskId: string | null;
}

interface ColorPickerState {
  visible: boolean;
  taskId: string | null;
}

interface TagManagerState {
  visible: boolean;
  taskId: string | null;
  newTag: string;
}

interface UseGanttInteractionsProps {
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setChartTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setProjectRows: React.Dispatch<React.SetStateAction<ProjectRow[]>>;
  deleteTaskCore: (taskId: string) => void;
  projectRows: ProjectRow[];
}

export const useGanttInteractions = ({
  setTasks,
  setChartTasks,
  setProjectRows,
  deleteTaskCore,
  projectRows
}: UseGanttInteractionsProps) => {
  
  // 菜单状态
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0
  });

  const [taskContextMenu, setTaskContextMenu] = useState<TaskContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    taskId: null
  });

  const [colorPickerState, setColorPickerState] = useState<ColorPickerState>({
    visible: false,
    taskId: null
  });

  const [tagManagerState, setTagManagerState] = useState<TagManagerState>({
    visible: false,
    taskId: null,
    newTag: ''
  });

  // 其他状态
  const [selectedTitleTaskId, setSelectedTitleTaskId] = useState<string | null>(null);


  // 切换展开/折叠
  const handleToggleExpand = useCallback((taskId: string) => {
    setProjectRows(prev => prev.map(row => 
      row.id === taskId 
        ? { ...row, isExpanded: !row.isExpanded }
        : row
    ));
  }, [setProjectRows]);

  // 创建子任务
  const handleCreateSubtask = useCallback((parentId: string) => {
    const subtaskId = `task-${Date.now()}`;
    const parentRow = projectRows.find(row => row.id === parentId);
    
    if (!parentRow) return;
    
    // 计算新子任务的位置
    const maxOrder = Math.max(...projectRows.map(row => row.order), -1);
    const newOrder = maxOrder + 1;
    
    // 创建新的子行
    const newSubRow: ProjectRow = {
      id: subtaskId,
      title: '新子任务',
      order: newOrder,
      type: parentRow.type || 'default',
      level: (parentRow.level || 0) + 1,
      parentId: parentId,
      isExpanded: false
    };
    
    // 更新项目行
    setProjectRows(prev => {
      const updated = prev.map(row => {
        if (row.id === parentId) {
          return {
            ...row,
            children: [...(row.children || []), subtaskId],
            isExpanded: true // 自动展开父行
          };
        }
        return row;
      });
      return [...updated, newSubRow];
    });

    // 创建对应的图表任务
    const newChartTask: Task = {
      id: `chart-${subtaskId}`,
      title: '新子任务',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      color: parentRow.type === 'development' ? '#FF9800' :
             parentRow.type === 'testing' ? '#E91E63' :
             parentRow.type === 'delivery' ? '#F44336' : '#4CAF50',
      rowId: subtaskId,
      type: parentRow.type || 'default',
      status: 'pending',
      progress: 0
    };
    
    setChartTasks(prev => [...prev, newChartTask]);
  }, [projectRows, setProjectRows, setChartTasks]);

  // 右键菜单处理
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY
    });
    
    // 隐藏其他菜单
    setTaskContextMenu(prev => ({ ...prev, visible: false }));
    setColorPickerState(prev => ({ ...prev, visible: false }));
    setTagManagerState(prev => ({ ...prev, visible: false }));
  }, []);

  // 任务右键菜单
  const handleTaskContextMenu = useCallback((e: React.MouseEvent, taskId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    setTaskContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      taskId
    });
    
    // 隐藏其他菜单
    setContextMenu(prev => ({ ...prev, visible: false }));
    setColorPickerState(prev => ({ ...prev, visible: false }));
    setTagManagerState(prev => ({ ...prev, visible: false }));
  }, []);

  // 颜色修改
  const handleColorChange = useCallback((taskId: string, color: string) => {
    setChartTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, color } : task
    ));
    setColorPickerState({ visible: false, taskId: null });
  }, [setChartTasks]);

  // 标签添加
  const handleTagAdd = useCallback((taskId: string, tag: string) => {
    if (!tag.trim()) return;
    
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const currentTags = task.tags || [];
        if (!currentTags.includes(tag.trim())) {
          return { ...task, tags: [...currentTags, tag.trim()] };
        }
      }
      return task;
    }));
  }, [setTasks]);

  // 标签移除
  const handleTagRemove = useCallback((taskId: string, tag: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId && task.tags) {
        return { ...task, tags: task.tags.filter(t => t !== tag) };
      }
      return task;
    }));
  }, [setTasks]);

  // 任务删除
  const handleTaskDelete = useCallback((taskId: string) => {
    deleteTaskCore(taskId);
    setTaskContextMenu({ visible: false, x: 0, y: 0, taskId: null });
  }, [deleteTaskCore]);

  return {
    // 状态
    contextMenu,
    taskContextMenu,
    colorPickerState,
    tagManagerState,
    selectedTitleTaskId,
    
    // 状态设置函数
    setContextMenu,
    setTaskContextMenu,
    setColorPickerState,
    setTagManagerState,
    setSelectedTitleTaskId,
    
    // 事件处理函数
    handleToggleExpand,
    handleCreateSubtask,
    handleContextMenu,
    handleTaskContextMenu,
    handleColorChange,
    handleTagAdd,
    handleTagRemove,
    handleTaskDelete
  };
};