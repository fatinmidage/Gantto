/**
 * 任务标题列组件
 * 负责渲染左侧任务列表，包括层级结构、拖拽交互和编辑功能
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import TaskIcon, { DragHandle } from '../TaskIcon';
import { Task } from '../../types';
import { COLOR_CONSTANTS } from './ganttStyles';

// 垂直拖拽状态接口
interface VerticalDragState {
  isDragging: boolean;
  draggedTaskId: string | null;
  draggedTaskIndex: number | null;
  targetIndex: number | null;
  shouldShowIndicator: boolean;
  startY: number;
}

// 组件 Props 接口
interface TaskTitleColumnProps {
  tasks: Task[];
  selectedTitleTaskId: string | null;
  verticalDragState: VerticalDragState;
  titleColumnWidth: number;
  timelineHeight: number;
  taskHeight: number;
  taskContentHeight: number;
  onTaskSelect: (taskId: string) => void;
  onTaskToggle: (taskId: string) => void;
  onTaskCreateSubtask: (taskId: string) => void;
  onTitleMouseDown: (e: React.MouseEvent, taskId: string) => void;
  onWidthChange?: (width: number) => void;
}

const TaskTitleColumn: React.FC<TaskTitleColumnProps> = ({
  tasks,
  selectedTitleTaskId,
  verticalDragState,
  titleColumnWidth,
  timelineHeight,
  taskHeight,
  taskContentHeight,
  onTaskSelect,
  onTaskToggle,
  onTaskCreateSubtask,
  onTitleMouseDown,
  onWidthChange
}) => {
  // 宽度调整状态
  const [isResizing, setIsResizing] = useState(false);
  const [currentWidth, setCurrentWidth] = useState(titleColumnWidth);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  // 同步外部宽度变化
  useEffect(() => {
    setCurrentWidth(titleColumnWidth);
  }, [titleColumnWidth]);

  // 开始拖拽调整宽度
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = currentWidth;
  }, [currentWidth]);

  // 拖拽调整宽度
  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    const deltaX = e.clientX - startXRef.current;
    const newWidth = Math.max(260, Math.min(400, startWidthRef.current + deltaX)); // 限制最小260px，最大400px
    
    setCurrentWidth(newWidth);
    onWidthChange?.(newWidth);
  }, [isResizing, onWidthChange]);

  // 结束拖拽
  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
  }, []);

  // 添加全局事件监听器
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  // 样式定义
  const titleColumnStyle: React.CSSProperties = {
    width: currentWidth,
    border: `1px solid ${COLOR_CONSTANTS.BORDER_COLOR}`,
    borderTop: `1px solid ${COLOR_CONSTANTS.BORDER_COLOR}`,
    borderRight: `1px solid ${COLOR_CONSTANTS.BORDER_COLOR}`,
    backgroundColor: '#fafafa',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative' // 确保可以包含绝对定位的手柄
  };

  const titleHeaderStyle: React.CSSProperties = {
    height: timelineHeight,
    borderBottom: `1px solid ${COLOR_CONSTANTS.BORDER_COLOR}`,
    display: 'flex',
    alignItems: 'center',
    padding: '0 20px',
    boxSizing: 'border-box',
    backgroundColor: '#f5f5f5',
    color: '#333',
    fontWeight: 600,
    fontSize: '16px'
  };

  const taskTitlesContainerStyle: React.CSSProperties = {
    paddingTop: '10px',
    height: taskContentHeight,
    overflow: 'auto'
  };

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
    position: 'relative'
  };

  // 拖拽指示器样式
  const dragIndicatorStyle: React.CSSProperties = {
    height: '2px',
    backgroundColor: '#2196F3',
    margin: '0 10px',
    borderRadius: '1px',
    boxShadow: '0 0 4px rgba(33, 150, 243, 0.6)',
  };

  // 宽度调整手柄样式
  const resizeHandleStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    right: -4, // 向右偏移更多，让它更容易被触发
    width: '4px', // 调整为4px宽度
    height: '100%',
    backgroundColor: isResizing ? '#2196F3' : 'transparent',
    cursor: 'col-resize',
    zIndex: 100, // 大幅提高层级
    borderRadius: '0 4px 4px 0', // 右侧圆角
    transition: 'all 0.2s ease',
    border: 'none'
  };

  return (
    <div className="title-column" style={titleColumnStyle}>
      {/* 标题头部 */}
      <div className="title-header" style={titleHeaderStyle}>
        <span>任务列表</span>
      </div>
      
      {/* 任务标题列表 */}
      <div className="task-titles" style={taskTitlesContainerStyle}>
        {tasks.map((task, index) => {
          const isDraggedTask = verticalDragState.draggedTaskId === task.id;
          const isTargetPosition = verticalDragState.isDragging && 
                                  verticalDragState.targetIndex === index && 
                                  verticalDragState.shouldShowIndicator;
          const isDraggingDown = verticalDragState.isDragging && 
                                verticalDragState.draggedTaskIndex !== null && 
                                verticalDragState.targetIndex !== null &&
                                verticalDragState.targetIndex > verticalDragState.draggedTaskIndex;
          
          const hasChildren = task.children && task.children.length > 0;
          const level = task.level || 0;
          const indentWidth = level * 20; // 每级缩进20px
          
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
                style={{
                  ...taskTitleStyle,
                  backgroundColor: isDraggedTask ? '#e3f2fd' : 'transparent',
                  opacity: isDraggedTask ? 0.7 : 1,
                  cursor: task.isPlaceholder ? 'default' : (verticalDragState.isDragging ? 'grabbing' : 'grab'),
                  userSelect: 'none',
                  transform: isDraggedTask ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: isDraggedTask ? '0 4px 8px rgba(0,0,0,0.15)' : 'none',
                  zIndex: isDraggedTask ? 10 : 1,
                  paddingLeft: `${20 + indentWidth}px` // 添加层级缩进
                }}
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
                
                {/* 展开/折叠按钮 */}
                {hasChildren && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTaskToggle(task.id);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '2px',
                      marginRight: '4px',
                      fontSize: '12px',
                      color: '#666'
                    }}
                  >
                    {task.isExpanded ? '▼' : '▶'}
                  </button>
                )}
                
                {/* 如果没有子任务，添加占位符保持对齐 */}
                {!hasChildren && (
                  <div style={{ width: '16px', marginRight: '4px' }} />
                )}
                
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
                
                {/* 创建子任务按钮 - 只有顶级任务可以创建子任务，防止孙任务 */}
                {!task.isPlaceholder && level === 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTaskCreateSubtask(task.id);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '2px 4px',
                      marginLeft: 'auto',
                      fontSize: '12px',
                      color: '#666',
                      opacity: 0.7,
                      borderRadius: '2px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f0f0f0';
                      e.currentTarget.style.opacity = '1';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.opacity = '0.7';
                    }}
                    title="创建子任务"
                  >
                    +
                  </button>
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
            </div>
          );
        })}
        
        {/* 拖拽指示器 - 拖拽到最后位置时显示 */}
        {verticalDragState.isDragging && 
         verticalDragState.targetIndex === tasks.length && 
         verticalDragState.shouldShowIndicator && (
          <div style={{
            ...dragIndicatorStyle,
            animation: 'pulse 1s infinite'
          }} />
        )}
      </div>
      
      {/* 宽度调整手柄 */}
      <div
        className="resize-handle"
        style={resizeHandleStyle}
        onMouseDown={handleResizeStart}
        onMouseEnter={(e) => {
          console.log('Mouse enter resize handle'); // 调试信息
          if (!isResizing) {
            e.currentTarget.style.backgroundColor = 'rgba(33, 150, 243, 0.3)';
          }
        }}
        onMouseLeave={(e) => {
          console.log('Mouse leave resize handle'); // 调试信息
          if (!isResizing) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
        title="拖拽调整列宽"
      />
    </div>
  );
};

export default TaskTitleColumn;