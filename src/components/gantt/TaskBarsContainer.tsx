/**
 * 任务条容器组件
 * 负责渲染图表区域的所有任务条、里程碑和拖拽预览
 */

import React from 'react';
import TaskBar from './TaskBar';
import MilestoneTaskBar from './MilestoneTaskBar';
import { Task } from '../../types/task';
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
  onMouseDown: (e: React.MouseEvent, taskId: string) => void;
  onTaskSelect: (taskId: string) => void;
  onTaskContextMenu: (e: React.MouseEvent, taskId: string) => void;
  onEdgeHover: (e: React.MouseEvent, task: Task) => void;
  onMouseLeave: () => void;
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
  onMouseDown,
  onTaskSelect,
  onTaskContextMenu,
  onEdgeHover,
  onMouseLeave
}) => {
  // 判断是否为里程碑
  const isMilestone = (task: Task): boolean => {
    const isTimeEqual = task.startDate.getTime() === task.endDate.getTime();
    const isTypemilestone = task.type === 'milestone';
    const result = isTimeEqual || isTypemilestone;
    
    // 🔍 调试日志：里程碑判断逻辑
    console.log(`[TaskBarsContainer] 里程碑判断 - 任务ID: ${task.id}`, {
      taskTitle: task.title,
      startDate: task.startDate.toISOString(),
      endDate: task.endDate.toISOString(),
      taskType: task.type,
      isTimeEqual,
      isTypemilestone,
      isMilestoneResult: result,
      taskData: task
    });
    
    return result;
  };

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
          const milestoneCheck = isMilestone(chartTask);
          
          // 🔍 调试日志：任务渲染前的状态检查
          console.log(`[TaskBarsContainer] 渲染任务 ${chartTask.id}:`, {
            taskTitle: chartTask.title,
            taskType: chartTask.type,
            startDate: chartTask.startDate.toISOString(),
            endDate: chartTask.endDate.toISOString(),
            timesEqual: chartTask.startDate.getTime() === chartTask.endDate.getTime(),
            isMilestone: milestoneCheck,
            isBeingDragged,
            displayX,
            displayWidth,
            tempDragPosition,
            willRenderAs: milestoneCheck ? 'MilestoneTaskBar' : 'TaskBar'
          });

          // 渲染里程碑任务条
          if (isMilestone(chartTask)) {
            return (
              <MilestoneTaskBar
                key={chartTask.id}
                task={chartTask}
                rowIndex={rowIndex}
                taskHeight={taskHeight}
                isBeingDragged={isBeingDragged}
                displayX={displayX}
                dateToPixel={dateToPixel}
                onMouseDown={onMouseDown}
                onTaskSelect={onTaskSelect}
                onTaskContextMenu={onTaskContextMenu}
              />
            );
          }

          // 渲染普通任务条
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
    </div>
  );
};

export default TaskBarsContainer;