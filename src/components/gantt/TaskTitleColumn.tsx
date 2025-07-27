/**
 * 任务标题列组件
 * 负责渲染左侧任务列表，包括层级结构、拖拽交互和编辑功能
 */

import React from 'react';
import { Task } from '../../types';
import { COLOR_CONSTANTS, LAYOUT_CONSTANTS } from './ganttStyles';
import { useTitleColumnResize } from './hooks/useTitleColumnResize';
import { TaskTitleItem } from './components/TaskTitleItem';

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
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
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
  onWidthChange,
  onTaskUpdate
}) => {
  // 使用宽度调整 hook
  const { currentWidth, isResizing, handleResizeStart, resizeHandleStyle } = useTitleColumnResize({
    initialWidth: titleColumnWidth,
    onWidthChange
  });

  // 样式定义
  const titleColumnStyle: React.CSSProperties = {
    width: currentWidth,
    border: `1px solid ${COLOR_CONSTANTS.BORDER_COLOR}`,
    borderTop: `1px solid ${COLOR_CONSTANTS.BORDER_COLOR}`,
    borderRight: `1px solid ${COLOR_CONSTANTS.BORDER_COLOR}`,
    backgroundColor: '#fafafa',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative'
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
    paddingTop: LAYOUT_CONSTANTS.ROW_SPACING,
    height: taskContentHeight,
    overflow: 'auto'
  };

  // 拖拽指示器样式
  const dragIndicatorStyle: React.CSSProperties = {
    height: '2px',
    backgroundColor: '#2196F3',
    margin: '0 10px',
    borderRadius: '1px',
    boxShadow: '0 0 4px rgba(33, 150, 243, 0.6)',
  };

  return (
    <div className="title-column" style={titleColumnStyle}>
      {/* 标题头部 */}
      <div className="title-header" style={titleHeaderStyle}>
        <span>任务列表</span>
      </div>
      
      {/* 任务标题列表 */}
      <div className="task-titles" style={taskTitlesContainerStyle}>
        {tasks.map((task, index) => (
          <TaskTitleItem
            key={task.id}
            task={task}
            index={index}
            verticalDragState={verticalDragState}
            selectedTitleTaskId={selectedTitleTaskId}
            taskHeight={taskHeight}
            onTaskSelect={onTaskSelect}
            onTaskToggle={onTaskToggle}
            onTaskCreateSubtask={onTaskCreateSubtask}
            onTitleMouseDown={onTitleMouseDown}
            onTaskUpdate={onTaskUpdate}
          />
        ))}
        
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
          if (!isResizing) {
            e.currentTarget.style.backgroundColor = 'rgba(33, 150, 243, 0.3)';
          }
        }}
        onMouseLeave={(e) => {
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