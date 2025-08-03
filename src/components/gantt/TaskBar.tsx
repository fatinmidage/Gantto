/**
 * 单个任务条组件
 * 负责渲染单个任务条的所有视觉元素和交互行为
 */

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Task } from '../../types/task';
import EditableLabel from './EditableLabel';
import TaskDateRangePicker from './TaskDateRangePicker';
import { layoutUtils, LAYOUT_CONSTANTS } from './ganttStyles';

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
  onTaskDateEdit?: (taskId: string, newStartDate: Date, newEndDate: Date) => void;
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
  onTagEdit,
  onTaskDateEdit
}) => {
  // 日期编辑器状态
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  
  const taskBarRef = useRef<HTMLDivElement>(null);

  // 边缘悬停处理：直接处理，无需requestAnimationFrame
  const handleEdgeHover = useCallback((e: React.MouseEvent, task: Task) => {
    onEdgeHover(e, task);
  }, [onEdgeHover]);

  // 🔧 优化：统一中心点坐标系统的位置和尺寸计算
  const taskStyle = useMemo(() => {
    // 获取任务条中心点坐标和宽度
    const taskCenterX = displayX !== undefined ? displayX : (task.x || 0);
    const taskWidth = displayWidth !== undefined ? displayWidth : (task.width || LAYOUT_CONSTANTS.DEFAULT_TASK_WIDTH);
    
    console.log('📊 [DEBUG] TaskBar样式计算:', {
      taskId: task.id,
      taskTitle: task.title,
      task_x: task.x,
      task_width: task.width,
      displayX,
      displayWidth,
      finalCenterX: taskCenterX,
      finalWidth: taskWidth,
      startDate: task.startDate.toISOString().split('T')[0],
      endDate: task.endDate.toISOString().split('T')[0]
    });
    
    // 防止 NaN 值导致样式错误
    const safeCenterX = isNaN(taskCenterX) ? 0 : taskCenterX;
    const safeTaskWidth = isNaN(taskWidth) ? LAYOUT_CONSTANTS.DEFAULT_TASK_WIDTH : taskWidth;
    
    // 中心点坐标转换为渲染用的左边缘位置
    const renderLeft = safeCenterX - safeTaskWidth / 2;
    const safeRenderLeft = isNaN(renderLeft) ? 0 : renderLeft;
    
    // 计算任务Y位置
    const taskY = layoutUtils.calculateTaskY(rowIndex, taskHeight);

    console.log('🎨 [DEBUG] TaskBar最终渲染位置:', {
      taskId: task.id,
      renderLeft: safeRenderLeft,
      renderTop: taskY,
      renderWidth: safeTaskWidth
    });

    return {
      left: safeRenderLeft,
      top: taskY,
      width: safeTaskWidth,
      height: taskHeight,
      '--custom-task-color': task.color,
      cursor: isHoveringEdge === 'left' ? 'w-resize' : isHoveringEdge === 'right' ? 'e-resize' : 'grab'
    } as React.CSSProperties;
  }, [displayX, displayWidth, task.x, task.width, task.color, rowIndex, taskHeight, isHoveringEdge]);

  // 双击事件处理 - 打开日期范围编辑器
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 防止在拖拽状态下打开日期编辑器
    if (isDragging || isBeingDragged) return;
    
    if (onTaskDateEdit && task.startDate && task.endDate) {
      setIsDatePickerOpen(true);
    }
  };

  // 任务日期范围变更处理
  const handleTaskDateRangeChange = (newStartDate: Date, newEndDate: Date) => {
    console.log('📅 [DEBUG] TaskBar日期变更处理:', {
      taskId: task.id,
      taskTitle: task.title,
      oldStartDate: task.startDate.toISOString().split('T')[0],
      oldEndDate: task.endDate.toISOString().split('T')[0],
      newStartDate: newStartDate.toISOString().split('T')[0],
      newEndDate: newEndDate.toISOString().split('T')[0]
    });
    
    if (onTaskDateEdit) {
      onTaskDateEdit(task.id, newStartDate, newEndDate);
    }
    setIsDatePickerOpen(false);
  };

  // 获取日期选择器的定位
  const getDatePickerPosition = () => {
    if (!taskBarRef.current) return undefined;
    
    const rect = taskBarRef.current.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.bottom + LAYOUT_CONSTANTS.DATE_PICKER_OFFSET
    };
  };
  
  // 数据验证完成

  return (
    <>
      <div
        ref={taskBarRef}
        key={task.id}
        className={`gantt-task-bar custom-color ${isBeingDragged ? 'dragging' : ''} status-${task.status} type-${task.type} ${isHoveringEdge ? `edge-hover-${isHoveringEdge}` : ''}`}
        style={taskStyle}
        onMouseDown={(e) => {
          if (e.button === 0) { // 只处理左键
            onMouseDown(e, task.id);
          }
        }}
        onMouseMove={(e) => handleEdgeHover(e, task)}
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
        onDoubleClick={handleDoubleClick}
        onContextMenu={(e) => onTaskContextMenu(e, task.id)}
        title={onTaskDateEdit && task.startDate && task.endDate ? "双击编辑任务日期范围" : undefined}
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
                      maxWidth: `${LAYOUT_CONSTANTS.TAG_MAX_WIDTH}px`,
                    }}
                    maxLength={LAYOUT_CONSTANTS.TAG_MAX_LENGTH}
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

      {/* 任务日期范围选择器 */}
      {onTaskDateEdit && task.startDate && task.endDate && (
        <TaskDateRangePicker
          startDate={task.startDate}
          endDate={task.endDate}
          isOpen={isDatePickerOpen}
          onOpenChange={setIsDatePickerOpen}
          onDateRangeChange={handleTaskDateRangeChange}
          position={getDatePickerPosition()}
        />
      )}
    </>
  );
};

export default TaskBar;