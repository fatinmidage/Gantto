/**
 * 任务条渲染组件
 * 负责渲染图表区域的任务条、里程碑和拖拽预览
 * (重构后的版本，保持向后兼容)
 */

import React from 'react';
import TaskBarsContainer from './TaskBarsContainer';
import { Task, MilestoneNode } from '../../types/task';

// 任务行数据接口
interface TaskRow {
  rowId: string;
  tasks: Task[];
}

// 拖拽位置接口
interface DragPosition {
  x: number;
  width: number;
}

// 组件 Props 接口
interface TaskBarsProps {
  chartTaskRows: TaskRow[];
  taskHeight: number;
  timelineHeight: number;
  draggedTask: string | null;
  tempDragPosition: DragPosition | null;
  isHoveringEdge: 'left' | 'right' | null;
  dateToPixel: (date: Date) => number;
  pixelToDate: (pixel: number) => Date; // 添加 pixelToDate 参数
  isDragging: boolean;
  milestones?: MilestoneNode[];
  selectedMilestone?: string | null;
  onMouseDown: (e: React.MouseEvent, taskId: string) => void;
  onTaskSelect: (taskId: string) => void;
  onTaskContextMenu: (e: React.MouseEvent, taskId: string) => void;
  onEdgeHover: (e: React.MouseEvent, task: Task) => void;
  onMouseLeave: () => void;
  onMilestoneSelect?: (milestoneId: string) => void;
  onMilestoneContextMenu?: (e: React.MouseEvent, milestoneId: string) => void;
  onMilestoneDragStart?: (e: React.MouseEvent, milestone: any) => void;
  onMilestoneLabelEdit?: (milestoneId: string, label: string) => void;
  onMilestoneDateChange?: (milestoneId: string, newDate: Date) => void;
}

// 重构后的 TaskBars 组件，现在是 TaskBarsContainer 的包装器
const TaskBars: React.FC<TaskBarsProps> = (props) => {
  return <TaskBarsContainer {...props} />;
};

export default TaskBars;