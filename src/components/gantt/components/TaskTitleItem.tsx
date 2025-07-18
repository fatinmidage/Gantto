/**
 * 任务标题项组件
 * 负责渲染单个任务标题项，包括层级缩进、图标、展开/折叠控制等
 */

import React from 'react';
import TaskIcon, { DragHandle } from '../../TaskIcon';
import { Task } from '../../../types';
import { TaskHierarchyControls } from './TaskHierarchyControls';

interface TaskTitleItemProps {
  task: Task;
  index: number;
  verticalDragState: {
    isDragging: boolean;
    draggedTaskId: string | null;
    draggedTaskIndex: number | null;
    targetIndex: number | null;
    shouldShowIndicator: boolean;
  };
  selectedTitleTaskId: string | null;
  taskHeight: number;
  onTaskSelect: (taskId: string) => void;
  onTaskToggle: (taskId: string) => void;
  onTaskCreateSubtask: (taskId: string) => void;
  onTitleMouseDown: (e: React.MouseEvent, taskId: string) => void;
}

export const TaskTitleItem: React.FC<TaskTitleItemProps> = ({
  task,
  index,
  verticalDragState,
  selectedTitleTaskId,
  taskHeight,
  onTaskSelect,
  onTaskToggle,
  onTaskCreateSubtask,
  onTitleMouseDown
}) => {
  const isDraggedTask = verticalDragState.draggedTaskId === task.id;
  const isTargetPosition = verticalDragState.isDragging && 
                          verticalDragState.targetIndex === index && 
                          verticalDragState.shouldShowIndicator;
  const isDraggingDown = verticalDragState.isDragging && 
                        verticalDragState.draggedTaskIndex !== null && 
                        verticalDragState.targetIndex !== null &&
                        verticalDragState.targetIndex > verticalDragState.draggedTaskIndex;
  
  const level = task.level || 0;
  const indentWidth = level * 20;

  const taskTitleStyle: React.CSSProperties = {
    height: taskHeight,
    marginBottom: 10,
    display: 'flex',
    alignItems: 'center',
    padding: '0 20px',
    fontSize: '14px',
    color: '#555',
    borderBottom: '1px solid #f0f0f0',
    transition: 'all 0.2s ease',
    position: 'relative',
    backgroundColor: isDraggedTask ? '#e3f2fd' : 'transparent',
    opacity: isDraggedTask ? 0.7 : 1,
    cursor: task.isPlaceholder ? 'default' : (verticalDragState.isDragging ? 'grabbing' : 'grab'),
    userSelect: 'none',
    transform: isDraggedTask ? 'scale(1.02)' : 'scale(1)',
    boxShadow: isDraggedTask ? '0 4px 8px rgba(0,0,0,0.15)' : 'none',
    zIndex: isDraggedTask ? 10 : 1,
    paddingLeft: `${20 + indentWidth}px`
  };

  const dragIndicatorStyle: React.CSSProperties = {
    height: '2px',
    backgroundColor: '#2196F3',
    margin: '0 10px',
    borderRadius: '1px',
    boxShadow: '0 0 4px rgba(33, 150, 243, 0.6)',
  };

  return (
    <div key={task.id}>
      {/* 拖拽指示器 - 向上拖拽时在目标位置上方显示 */}
      {isTargetPosition && 
       !isDraggingDown &&
       verticalDragState.draggedTaskIndex !== index && (
        <div style={dragIndicatorStyle} />
      )}
      
      <div
        className="task-title"
        style={taskTitleStyle}
        onMouseEnter={(e) => {
          if (!verticalDragState.isDragging) {
            e.currentTarget.style.backgroundColor = '#f0f0f0';
          }
        }}
        onMouseLeave={(e) => {
          if (!verticalDragState.isDragging && !isDraggedTask) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
        onMouseDown={(e) => !task.isPlaceholder && onTitleMouseDown(e, task.id)}
        onClick={() => !task.isPlaceholder && onTaskSelect(task.id)}
      >
        <DragHandle size={14} />
        
        <TaskHierarchyControls
          task={task}
          level={level}
          onTaskToggle={onTaskToggle}
          onTaskCreateSubtask={onTaskCreateSubtask}
        />
        
        <TaskIcon 
          type={task.type} 
          size={16} 
          className={`task-icon-${task.type}`}
          level={task.level}
        />
        
        <span 
          className="task-title-text"
          style={{ 
            color: task.isPlaceholder ? '#999' : 'inherit',
            fontStyle: task.isPlaceholder ? 'italic' : 'normal'
          }}
        >
          {task.title}
        </span>
        
        {/* 选中指示器 */}
        {selectedTitleTaskId === task.id && (
          <div className="task-selected-indicator" />
        )}
      </div>
      
      {/* 拖拽指示器 - 向下拖拽时在目标位置下方显示 */}
      {isTargetPosition && 
       isDraggingDown &&
       verticalDragState.draggedTaskIndex !== index && (
        <div style={dragIndicatorStyle} />
      )}
    </div>
  );
};