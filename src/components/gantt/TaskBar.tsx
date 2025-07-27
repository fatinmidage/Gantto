/**
 * 单个任务条组件
 * 负责渲染单个任务条的所有视觉元素和交互行为
 */

import React from 'react';
import { Task } from '../../types/task';
import EditableLabel from './EditableLabel';
import { layoutUtils } from './ganttStyles';

interface TaskBarProps {
  task: Task;
  rowIndex: number;
  taskHeight: number;
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
  onTagEdit?: (taskId: string, oldTag: string, newTag: string) => void;
}

const TaskBar: React.FC<TaskBarProps> = ({
  task,
  rowIndex,
  taskHeight,
  isBeingDragged,
  isHoveringEdge,
  displayX,
  displayWidth,
  isDragging,
  onMouseDown,
  onTaskSelect,
  onTaskContextMenu,
  onEdgeHover,
  onMouseLeave,
  onTagEdit
}) => {
  const taskX = displayX !== undefined ? displayX : (task.x || 0);
  const taskWidth = displayWidth !== undefined ? displayWidth : (task.width || 100);
  
  // 防止 NaN 值导致样式错误
  const safeTaskX = isNaN(taskX) ? 0 : taskX;
  const safeTaskWidth = isNaN(taskWidth) ? 100 : taskWidth;
  
  // 计算任务Y位置
  const taskY = layoutUtils.calculateTaskY(rowIndex, taskHeight);
  
  
  // 数据验证完成

  return (
    <div
      key={task.id}
      className={`gantt-task-bar custom-color ${isBeingDragged ? 'dragging' : ''} status-${task.status} type-${task.type} ${isHoveringEdge ? `edge-hover-${isHoveringEdge}` : ''}`}
      style={{
        left: safeTaskX,
        top: taskY,
        width: safeTaskWidth,
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
              <span key={tag} className="task-tag">
                {onTagEdit ? (
                  <EditableLabel
                    value={tag}
                    onSave={(newTag) => onTagEdit(task.id, tag, newTag)}
                    style={{
                      fontSize: '11px',
                      color: 'inherit',
                      whiteSpace: 'nowrap',
                      maxWidth: '60px',
                    }}
                    maxLength={15}
                  />
                ) : (
                  tag
                )}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskBar;