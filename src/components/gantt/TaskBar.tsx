/**
 * 单个任务条组件
 * 负责渲染单个任务条的所有视觉元素和交互行为
 */

import React from 'react';
import { Task } from '../../types/task';

interface TaskBarProps {
  task: Task;
  rowIndex: number;
  taskHeight: number;
  isSelected: boolean;
  isBeingDragged: boolean;
  isHoveringEdge: 'left' | 'right' | null;
  displayX?: number;
  displayWidth?: number;
  isDragging: boolean;
  onMouseDown: (e: React.MouseEvent, taskId: string) => void;
  onTaskSelect: (taskId: string) => void;
  onTaskContextMenu: (e: React.MouseEvent, taskId: string) => void;
  onEdgeHover: (e: React.MouseEvent, task: Task) => void;
  onMouseLeave: () => void;
}

const TaskBar: React.FC<TaskBarProps> = ({
  task,
  rowIndex,
  taskHeight,
  isSelected,
  isBeingDragged,
  isHoveringEdge,
  displayX,
  displayWidth,
  isDragging,
  onMouseDown,
  onTaskSelect,
  onTaskContextMenu,
  onEdgeHover,
  onMouseLeave
}) => {
  const taskX = displayX !== undefined ? displayX : task.x;
  const taskWidth = displayWidth !== undefined ? displayWidth : task.width;

  return (
    <div
      key={task.id}
      className={`gantt-task-bar custom-color ${isBeingDragged ? 'dragging' : ''} ${isSelected ? 'selected' : ''} status-${task.status} type-${task.type} ${isHoveringEdge ? `edge-hover-${isHoveringEdge}` : ''}`}
      style={{
        left: taskX,
        top: rowIndex * (taskHeight + 10),
        width: taskWidth,
        height: taskHeight,
        '--custom-task-color': task.color,
        cursor: isHoveringEdge === 'left' ? 'w-resize' : isHoveringEdge === 'right' ? 'e-resize' : 'grab'
      } as React.CSSProperties}
      onMouseDown={(e) => {
        if (e.button === 0) { // 只处理左键
          onMouseDown(e, task.id);
        }
      }}
      onMouseMove={(e) => onEdgeHover(e, task)}
      onMouseLeave={() => {
        if (!isDragging) {
          onMouseLeave();
        }
      }}
      onClick={(e) => {
        if (e.button === 0) { // 只处理左键点击
          onTaskSelect(task.id);
        }
      }}
      onContextMenu={(e) => onTaskContextMenu(e, task.id)}
    >
      {/* 任务内容 */}
      <div className="gantt-task-content">
        {/* 显示任务标签 */}
        {task.tags && task.tags.length > 0 && (
          <div className="task-tags">
            {task.tags.map(tag => (
              <span key={tag} className="task-tag">{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskBar;