/**
 * 任务标题项组件
 * 负责渲染单个任务标题项，包括层级缩进、图标、展开/折叠控制等
 */

import React, { useState, useRef, useEffect } from 'react';
import { TaskIcon, DragHandle } from '../..';
import { Task } from '../../../types';
import { IconType } from '../../../types/common';
import { TaskHierarchyControls } from './TaskHierarchyControls';
import TaskTitleContextMenu from '../TaskTitleContextMenu';
import { LAYOUT_CONSTANTS } from '../ganttStyles';

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
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
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
  onTitleMouseDown,
  onTaskUpdate
}) => {
  // 编辑状态
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.title);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0
  });
  
  const editInputRef = useRef<HTMLInputElement>(null);
  
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


  // 编辑模式聚焦
  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [isEditing]);

  // 处理右键菜单
  const handleContextMenu = (e: React.MouseEvent) => {
    if (task.isPlaceholder) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // 使用鼠标相对于视口的坐标
    const x = e.clientX;
    const y = e.clientY;
    
    
    setContextMenu({
      visible: true,
      x,
      y
    });
  };

  // 关闭右键菜单
  const handleCloseContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0 });
  };

  // 开始编辑任务名称
  const handleStartNameEdit = () => {
    setIsEditing(true);
    setEditValue(task.title);
  };

  // 确认编辑
  const handleConfirmEdit = () => {
    if (editValue.trim() && onTaskUpdate) {
      onTaskUpdate(task.id, { title: editValue.trim() });
    }
    setIsEditing(false);
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditValue(task.title);
    setIsEditing(false);
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirmEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  // 处理输入框失焦
  const handleBlur = () => {
    handleConfirmEdit();
  };

  // 处理图标更改
  const handleIconChange = (taskId: string, iconType: IconType, color?: string) => {
    if (onTaskUpdate) {
      // 支持新的 iconType 字段，同时保持向后兼容的 type 字段
      const updates: Partial<Task> = { 
        iconType,
        type: iconType as any // 保持向后兼容
      };
      
      // 如果提供了颜色，则同时更新颜色
      if (color) {
        updates.color = color;
      }
      
      onTaskUpdate(taskId, updates);
    }
  };

  // 🔧 修复：使用整个行高来确保与TaskBar/Milestone对齐
  const fullRowHeight = taskHeight + LAYOUT_CONSTANTS.ROW_SPACING;
  
  const taskTitleStyle: React.CSSProperties = {
    height: fullRowHeight, // 使用完整行高而不是只有taskHeight
    marginBottom: 0, // 移除marginBottom，避免重复间距
    display: 'flex',
    alignItems: 'center', // 在整个行高内垂直居中
    justifyContent: 'flex-start',
    padding: '0 20px',
    paddingLeft: `${20 + indentWidth}px`,
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
    boxSizing: 'border-box'
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
        onMouseDown={(e) => !task.isPlaceholder && !isEditing && onTitleMouseDown(e, task.id)}
        onClick={() => !task.isPlaceholder && !isEditing && onTaskSelect(task.id)}
        onContextMenu={handleContextMenu}
      >
        <DragHandle size={14} />
        
        <TaskHierarchyControls
          task={task}
          level={level}
          onTaskToggle={onTaskToggle}
          onTaskCreateSubtask={onTaskCreateSubtask}
        />
        
        <TaskIcon 
          iconType={task.iconType || task.type}
          type={task.type} 
          size={16} 
          className={`task-icon-${task.iconType || task.type}`}
          level={task.level}
        />
        
        {/* 任务标题：编辑模式或显示模式 */}
        {isEditing ? (
          <input
            ref={editInputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            style={{
              border: '1px solid #2196F3',
              borderRadius: '4px',
              padding: '2px 6px',
              fontSize: '14px',
              flex: 1,
              minWidth: 0,
              background: '#fff'
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span 
            className="task-title-text"
            style={{ 
              color: task.isPlaceholder ? '#999' : 'inherit',
              fontStyle: task.isPlaceholder ? 'italic' : 'normal',
              flex: 1,
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {task.title}
          </span>
        )}
        
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

      {/* 任务标题右键菜单 */}
      <TaskTitleContextMenu
        visible={contextMenu.visible}
        x={contextMenu.x}
        y={contextMenu.y}
        taskId={task.id}
        task={task}
        onClose={handleCloseContextMenu}
        onNameEdit={handleStartNameEdit}
        onIconChange={handleIconChange}
      />
    </div>
  );
};