/**
 * 任务条容器组件
 * 负责渲染图表区域的所有任务条、里程碑和拖拽预览
 */

import React from 'react';
import TaskBar from './TaskBar';
import MilestoneNode from './MilestoneNode';
import { Task, MilestoneNode as MilestoneNodeType } from '../../types/task';
import { COLOR_CONSTANTS, layoutUtils } from './ganttStyles';

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
}

const TaskBarsContainer: React.FC<TaskBarsContainerProps> = ({
  chartTaskRows,
  taskHeight,
  timelineHeight,
  draggedTask,
  tempDragPosition,
  isHoveringEdge,
  dateToPixel,
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
  onMilestoneLabelEdit
}) => {
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
        
        // 计算里程碑的位置
        let milestoneX = dateToPixel(milestone.date);
        
        // 🔧 同步里程碑坐标：确保存储坐标与渲染坐标一致
        const hasCoordinateDrift = milestone.x && Math.abs(milestoneX - milestone.x) > 0.1;
        
        
        // 如果正在拖拽且有临时位置，使用临时位置的 x 坐标
        if (isBeingDragged && tempDragPosition) {
          milestoneX = tempDragPosition.x;
        }
        
        
        // 🔧 坐标漂移检测（暂时注释掉同步逻辑，避免崩溃）
        // 这样可以避免每次渲染都重新计算，提高性能
        if (hasCoordinateDrift && !isBeingDragged) {
          // 注意：如果需要自动同步坐标，需要传递 onMilestoneUpdate 回调函数
          // 当前暂时跳过自动同步，避免程序崩溃
        }
        
        // 根据 rowId 找到对应的行索引来计算正确的Y坐标
        let milestoneY = milestone.y || 0; // 默认使用里程碑自带的Y坐标
        
        if (milestone.rowId) {
          // 查找该 rowId 对应的行索引（只在可见的chartTaskRows中查找）
          const rowIndex = chartTaskRows.findIndex(row => row.rowId === milestone.rowId);
          
          if (rowIndex !== -1) {
            // 计算正确的Y坐标：行索引 * (任务高度 + 间距) + 任务高度的一半（居中）
            milestoneY = layoutUtils.calculateMilestoneY(rowIndex, taskHeight);
          }
        }
        
        // 更新里程碑的位置
        const updatedMilestone = {
          ...milestone,
          x: milestoneX,
          y: milestoneY
        };
        
        return (
          <MilestoneNode
            key={milestone.id}
            milestone={updatedMilestone}
            taskHeight={taskHeight}
            isSelected={selectedMilestone === milestone.id}
            isDragging={draggedTask === milestone.id}
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
          />
        );
      })}
    </div>
  );
};

export default TaskBarsContainer;