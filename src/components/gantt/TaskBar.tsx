/**
 * 单个任务条组件
 * 负责渲染单个任务条的所有视觉元素和交互行为
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Task } from '../../types/task';
import EditableLabel from './EditableLabel';
import MilestoneDatePicker from './MilestoneDatePicker';
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
  onTaskDateEdit?: (taskId: string, newStartDate: Date, newEndDate?: Date) => void;
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

  // 优化性能：为边缘悬停检测添加节流处理
  const animationFrameRef = useRef<number>();
  const throttledEdgeHover = useCallback((e: React.MouseEvent, task: Task) => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(() => {
      onEdgeHover(e, task);
    });
  }, [onEdgeHover]);

  // 组件卸载时清理 requestAnimationFrame
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const taskX = displayX !== undefined ? displayX : (task.x || 0);
  const taskWidth = displayWidth !== undefined ? displayWidth : (task.width || LAYOUT_CONSTANTS.DEFAULT_TASK_WIDTH);
  
  // 防止 NaN 值导致样式错误
  const safeTaskX = isNaN(taskX) ? 0 : taskX;
  const safeTaskWidth = isNaN(taskWidth) ? LAYOUT_CONSTANTS.DEFAULT_TASK_WIDTH : taskWidth;
  
  // 计算任务Y位置
  const taskY = layoutUtils.calculateTaskY(rowIndex, taskHeight);

  // 双击事件处理 - 打开日期编辑器
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 防止在拖拽状态下打开日期编辑器
    if (isDragging || isBeingDragged) return;
    
    if (onTaskDateEdit && task.startDate) {
      setIsDatePickerOpen(true);
    }
  };

  // 任务日期变更处理
  const handleTaskDateChange = (newDate: Date) => {
    if (onTaskDateEdit && task.startDate) {
      // 计算持续时间（天数）
      const originalDuration = task.endDate 
        ? Math.ceil((task.endDate.getTime() - task.startDate.getTime()) / (1000 * 60 * 60 * 24))
        : 1;
      
      // 计算新的结束日期
      const newEndDate = new Date(newDate);
      newEndDate.setDate(newEndDate.getDate() + originalDuration);
      
      onTaskDateEdit(task.id, newDate, newEndDate);
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
        onMouseMove={(e) => throttledEdgeHover(e, task)}
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
        title={onTaskDateEdit && task.startDate ? "双击编辑日期" : undefined}
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

      {/* 任务日期选择器 */}
      {onTaskDateEdit && task.startDate && (
        <MilestoneDatePicker
          date={task.startDate}
          isOpen={isDatePickerOpen}
          onOpenChange={setIsDatePickerOpen}
          onDateChange={handleTaskDateChange}
          position={getDatePickerPosition()}
          immediateMode={true}
        />
      )}
    </>
  );
};

export default TaskBar;