/**
 * 任务条容器组件
 * 负责渲染图表区域的所有任务条、里程碑和拖拽预览
 */

import React, { useMemo } from 'react';
import TaskBar from './TaskBar';
import MilestoneNode from './MilestoneNode';
import { Task, MilestoneNode as MilestoneNodeType } from '../../types/task';
import { COLOR_CONSTANTS, LAYOUT_CONSTANTS } from './ganttStyles';
import { createCoordinateUtils } from '../../utils/coordinateUtils';

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
interface TaskBarsContainerProps {
  chartTaskRows: TaskRow[];
  taskHeight: number;
  timelineHeight: number;
  draggedTask: string | null;
  tempDragPosition: DragPosition | null;
  isHoveringEdge: 'left' | 'right' | null;
  dateToPixel: (date: Date) => number;
  pixelToDate: (pixel: number) => Date;
  isDragging: boolean;
  milestones?: MilestoneNodeType[];
  selectedMilestone?: string | null;
  onMouseDown: (e: React.MouseEvent, taskId: string) => void;
  onTaskSelect: (taskId: string) => void;
  onTaskContextMenu: (e: React.MouseEvent, taskId: string) => void;
  onEdgeHover: (e: React.MouseEvent, task: Task) => void;
  onMouseLeave: () => void;
  onMilestoneSelect?: (milestoneId: string) => void;
  onMilestoneContextMenu?: (e: React.MouseEvent, milestoneId: string) => void;
  onMilestoneDragStart?: (e: React.MouseEvent, milestone: MilestoneNodeType) => void;
  onMilestoneLabelEdit?: (milestoneId: string, label: string) => void;
  onMilestoneDateChange?: (milestoneId: string, newDate: Date) => void;
}

const TaskBarsContainer: React.FC<TaskBarsContainerProps> = ({
  chartTaskRows,
  taskHeight,
  timelineHeight,
  draggedTask,
  tempDragPosition,
  isHoveringEdge,
  dateToPixel,
  pixelToDate,
  isDragging,
  milestones = [],
  selectedMilestone,
  onMouseDown,
  onTaskSelect,
  onTaskContextMenu,
  onEdgeHover,
  onMouseLeave,
  onMilestoneSelect,
  onMilestoneContextMenu,
  onMilestoneDragStart,
  onMilestoneLabelEdit,
  onMilestoneDateChange
}) => {
  // 创建坐标计算工具实例
  const coordinateUtils = useMemo(() => 
    createCoordinateUtils(dateToPixel, taskHeight), 
    [dateToPixel, taskHeight]
  );

  // 现在所有任务都作为普通任务条渲染，不再区分里程碑任务条

  return (
    <div className="tasks" style={{
      position: 'absolute',
      top: timelineHeight, // 任务容器紧贴时间轴底部
      left: 0,
      right: 0,
      bottom: 0,
      border: `1px solid ${COLOR_CONSTANTS.BORDER_COLOR}`,
      borderTop: 'none' // 避免与时间轴重复边框
    }}>
        {chartTaskRows.map((row, rowIndex) => 
        row.tasks.map((chartTask) => {
          const isBeingDragged = draggedTask === chartTask.id;
          const displayX = isBeingDragged && tempDragPosition ? tempDragPosition.x : chartTask.x;
          const displayWidth = isBeingDragged && tempDragPosition ? tempDragPosition.width : chartTask.width;
          
          // 所有任务都作为普通任务条渲染
          return (
            <TaskBar
              key={chartTask.id}
              task={chartTask}
              rowIndex={rowIndex}
              taskHeight={taskHeight}
              isBeingDragged={isBeingDragged}
              isHoveringEdge={isHoveringEdge}
              displayX={displayX}
              displayWidth={displayWidth}
              isDragging={isDragging}
              onMouseDown={onMouseDown}
              onTaskSelect={onTaskSelect}
              onTaskContextMenu={onTaskContextMenu}
              onEdgeHover={onEdgeHover}
              onMouseLeave={onMouseLeave}
            />
          );
        })
      )}
      
      {/* 渲染独立的里程碑节点 */}
      {milestones
        .filter((milestone) => {
          // 过滤掉对应行不可见的里程碑
          if (!milestone.rowId) return true; // 没有rowId的里程碑总是可见
          return chartTaskRows.some(row => row.rowId === milestone.rowId);
        })
        .map((milestone) => {
        // 检查此里程碑是否正在被拖拽
        const isBeingDragged = draggedTask === milestone.id;
        
        // 查找对应的行索引
        const rowIndex = milestone.rowId 
          ? chartTaskRows.findIndex(row => row.rowId === milestone.rowId)
          : 0;

        // 使用统一的坐标计算工具
        const calculatedPosition = coordinateUtils.calculateMilestonePosition(milestone, rowIndex);
        
        // 如果正在拖拽且有临时位置，使用临时位置
        let finalPosition = calculatedPosition;
        if (isBeingDragged && tempDragPosition) {
          finalPosition = {
            ...calculatedPosition,
            x: tempDragPosition.x - LAYOUT_CONSTANTS.MILESTONE_NODE_SIZE / 2, // 节点半径偏移
            centerX: tempDragPosition.x
          };
        }
        
        // 计算预览日期（如果正在拖拽）
        let previewDate: Date | undefined;
        if (isBeingDragged && tempDragPosition && pixelToDate) {
          previewDate = pixelToDate(tempDragPosition.x);
        }
        
        // 更新里程碑的位置
        const updatedMilestone = {
          ...milestone,
          x: finalPosition.x,
          y: finalPosition.y
        };
        
        return (
          <MilestoneNode
            key={milestone.id}
            milestone={updatedMilestone}
            taskHeight={taskHeight}
            isSelected={selectedMilestone === milestone.id}
            isDragging={draggedTask === milestone.id}
            previewDate={previewDate}
            onMilestoneDragStart={onMilestoneDragStart}
            onContextMenu={(e, milestoneId) => {
              if (onMilestoneContextMenu) {
                onMilestoneContextMenu(e, milestoneId);
              }
            }}
            onClick={(milestoneId) => {
              // 选择里程碑
              if (onMilestoneSelect) {
                onMilestoneSelect(milestoneId);
              }
            }}
            onLabelEdit={onMilestoneLabelEdit}
            onDateChange={onMilestoneDateChange}
          />
        );
      })}
    </div>
  );
};

export default TaskBarsContainer;