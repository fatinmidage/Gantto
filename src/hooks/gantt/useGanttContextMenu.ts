import { useCallback, useState } from 'react';
import { Task, MilestoneNode } from '../../types';
import { formatDateToMD } from '../../utils/ganttUtils';
import { layoutUtils } from '../../components/gantt/ganttStyles';

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
  setMilestones: React.Dispatch<React.SetStateAction<MilestoneNode[]>>;
  leftPanelTasks: any[];
  taskHeight: number;
  timelineHeight: number;
  pixelToDate: (pixel: number) => Date;
  taskContextMenuVisible: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
}

export const useGanttContextMenu = ({
  setChartTasks,
  setMilestones,
  leftPanelTasks,
  taskHeight,
  timelineHeight,
  pixelToDate,
  taskContextMenuVisible,
  containerRef
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
    const rawChartAreaX = e.clientX - rect.left; // 容器内的相对X坐标（未考虑滚动）
    const chartAreaY = e.clientY - rect.top; // 容器内的相对Y坐标
    
    // 获取容器的滚动偏移量
    const scrollLeft = containerRef.current?.scrollLeft || 0;
    
    // 修正X坐标，加上滚动偏移量
    const chartAreaX = rawChartAreaX + scrollLeft;
    
    // 检查是否在时间轴区域内
    const isInTimelineArea = chartAreaY < timelineHeight;
    
    // 在整个甘特图容器区域都可以右键，但点击位置用于创建任务的坐标需要调整
    const taskAreaY = Math.max(0, chartAreaY - timelineHeight);
    
    
    const clickPosition = { 
      x: chartAreaX, 
      y: isInTimelineArea ? 0 : taskAreaY // 如果在时间轴区域，任务创建位置设为第一行
    };
    
    
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      clickPosition: clickPosition
    });
  }, [timelineHeight, taskContextMenuVisible, containerRef]);

  // 隐藏右键菜单
  const hideContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  }, []);

  // 创建新任务条
  const handleCreateTask = useCallback(() => {
    const clickDate = pixelToDate(contextMenu.clickPosition.x);
    
    // 计算点击位置对应的行索引
    const taskRowHeight = layoutUtils.calculateRowHeight(taskHeight);
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
    const taskRowHeight = layoutUtils.calculateRowHeight(taskHeight);
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
    
    const newMilestone: MilestoneNode = {
      id: `milestone-${Date.now()}`,
      title: '新节点',
      date: clickDate,
      iconType: 'default',
      color: '#FF5722',
      label: formatDateToMD(clickDate), // 默认标签为M.D格式日期
      x: 0,
      y: 0,
      rowId: targetRowId,
      order: Date.now(),
      isCreatedFromContext: true
    };
    
    setMilestones(prev => [...prev, newMilestone]);
    hideContextMenu();
  }, [contextMenu.clickPosition.x, contextMenu.clickPosition.y, pixelToDate, taskHeight, leftPanelTasks, hideContextMenu, setMilestones]);

  return {
    contextMenu,
    handleContextMenu,
    hideContextMenu,
    handleCreateTask,
    handleCreateMilestone
  };
};