/**
 * 任务条容器组件
 * 负责渲染图表区域的所有任务条、里程碑和拖拽预览
 */

import React from 'react';
import TaskBar from './TaskBar';
import MilestoneNode from './MilestoneNode';
import { Task, MilestoneNode as MilestoneNodeType } from '../../types/task';
import { COLOR_CONSTANTS } from './ganttStyles';

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
  onMilestoneContextMenu
}) => {
  // 现在所有任务都作为普通任务条渲染，不再区分里程碑任务条

  return (
    <div className="tasks" style={{
      position: 'absolute',
      top: timelineHeight + 10,
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
      {milestones.map((milestone) => {
        // 检查此里程碑是否正在被拖拽
        const isBeingDragged = draggedTask === milestone.id;
        
        // 计算里程碑的位置
        let milestoneX = dateToPixel(milestone.date);
        
        // 如果正在拖拽且有临时位置，使用临时位置的 x 坐标
        if (isBeingDragged && tempDragPosition) {
          milestoneX = tempDragPosition.x;
        }
        
        // 根据 rowId 找到对应的行索引来计算正确的Y坐标
        let milestoneY = milestone.y || 0; // 默认使用里程碑自带的Y坐标
        
        if (milestone.rowId) {
          // 查找该 rowId 对应的行索引
          const rowIndex = chartTaskRows.findIndex(row => row.rowId === milestone.rowId);
          
          if (rowIndex !== -1) {
            // 计算正确的Y坐标：行索引 * (任务高度 + 间距) + 任务高度的一半（居中）
            milestoneY = rowIndex * (taskHeight + 10) + taskHeight / 2;
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
            onMouseDown={(e, milestoneId) => {
              // 触发拖拽处理器，就像普通任务一样
              onMouseDown(e, milestoneId);
            }}
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
          />
        );
      })}
    </div>
  );
};

export default TaskBarsContainer;