import { useCallback, useState } from 'react';
import { Task } from '../../types';

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  clickPosition: {
    x: number;
    y: number;
  };
}

interface UseGanttContextMenuProps {
  setChartTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  leftPanelTasks: any[];
  taskHeight: number;
  timelineHeight: number;
  pixelToDate: (pixel: number) => Date;
  taskContextMenuVisible: boolean;
}

export const useGanttContextMenu = ({
  setChartTasks,
  leftPanelTasks,
  taskHeight,
  timelineHeight,
  pixelToDate,
  taskContextMenuVisible
}: UseGanttContextMenuProps) => {
  
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    clickPosition: { x: 0, y: 0 }
  });

  // 容器右键菜单处理
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    
    // 如果任务条右键菜单正在显示，不处理容器右键菜单
    if (taskContextMenuVisible) {
      return;
    }
    
    const rect = e.currentTarget.getBoundingClientRect();
    const chartAreaX = e.clientX - rect.left; // 容器内的相对X坐标
    const chartAreaY = e.clientY - rect.top; // 容器内的相对Y坐标
    
    // 检查是否在时间轴区域内
    const isInTimelineArea = chartAreaY < timelineHeight;
    
    // 在整个甘特图容器区域都可以右键，但点击位置用于创建任务的坐标需要调整
    const taskAreaY = Math.max(0, chartAreaY - timelineHeight);
    
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      clickPosition: { 
        x: chartAreaX, 
        y: isInTimelineArea ? 0 : taskAreaY // 如果在时间轴区域，任务创建位置设为第一行
      }
    });
  }, [timelineHeight, taskContextMenuVisible]);

  // 隐藏右键菜单
  const hideContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  }, []);

  // 创建新任务条
  const handleCreateTask = useCallback(() => {
    const clickDate = pixelToDate(contextMenu.clickPosition.x);
    
    // 计算点击位置对应的行索引
    const taskRowHeight = taskHeight + 10; // 任务高度 + 间距
    const clickedRowIndex = Math.floor(contextMenu.clickPosition.y / taskRowHeight);
    
    // 获取目标行ID
    let targetRowId: string;
    
    if (clickedRowIndex < leftPanelTasks.length) {
      // 在现有项目行创建图表任务
      const targetRow = leftPanelTasks[clickedRowIndex];
      targetRowId = targetRow.id; // 直接使用项目行ID
    } else {
      // 如果点击在空白区域，使用最后一个项目行
      const lastRow = leftPanelTasks[leftPanelTasks.length - 1];
      targetRowId = lastRow ? lastRow.id : 'row-0';
    }
    
    const newTask: Task = {
      id: `chart-${Date.now()}`,
      title: '新任务',
      startDate: clickDate,
      endDate: new Date(clickDate.getTime() + 7 * 24 * 60 * 60 * 1000),
      color: '#9C27B0',
      x: 0,
      width: 0,
      rowId: targetRowId,
      type: 'default',
      status: 'pending',
      progress: 0,
      children: [],
      level: 0,
      order: Date.now(),
      tags: []
    };
    
    setChartTasks(prev => [...prev, newTask]);
    hideContextMenu();
  }, [contextMenu.clickPosition.x, contextMenu.clickPosition.y, pixelToDate, taskHeight, leftPanelTasks, hideContextMenu, setChartTasks]);

  // 创建新节点（里程碑）
  const handleCreateMilestone = useCallback(() => {
    const clickDate = pixelToDate(contextMenu.clickPosition.x);
    
    // 计算点击位置对应的行索引
    const taskRowHeight = taskHeight + 10; // 任务高度 + 间距
    const clickedRowIndex = Math.floor(contextMenu.clickPosition.y / taskRowHeight);
    
    // 获取目标行ID
    let targetRowId: string;
    
    if (clickedRowIndex < leftPanelTasks.length) {
      // 在现有项目行创建里程碑
      const targetRow = leftPanelTasks[clickedRowIndex];
      targetRowId = targetRow.id; // 直接使用项目行ID
    } else {
      // 如果点击在空白区域，使用最后一个项目行
      const lastRow = leftPanelTasks[leftPanelTasks.length - 1];
      targetRowId = lastRow ? lastRow.id : 'row-0';
    }
    
    const newMilestone: Task = {
      id: `milestone-${Date.now()}`,
      title: '新节点',
      startDate: clickDate,
      endDate: clickDate, // 里程碑开始和结束时间相同
      color: '#FF5722',
      x: 0,
      width: 0,
      rowId: targetRowId,
      type: 'milestone',
      status: 'pending',
      progress: 0,
      children: [],
      level: 0,
      order: Date.now(),
      tags: []
    };
    
    setChartTasks(prev => [...prev, newMilestone]);
    hideContextMenu();
  }, [contextMenu.clickPosition.x, contextMenu.clickPosition.y, pixelToDate, taskHeight, leftPanelTasks, hideContextMenu, setChartTasks]);

  return {
    contextMenu,
    handleContextMenu,
    hideContextMenu,
    handleCreateTask,
    handleCreateMilestone
  };
};