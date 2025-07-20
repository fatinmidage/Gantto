/**
 * 任务条渲染组件
 * 负责渲染图表区域的任务条、里程碑和拖拽预览
 */

import React from 'react';
import { Target } from '..';
import { Task } from '../../types';
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
interface TaskBarsProps {
  chartTaskRows: TaskRow[];
  taskHeight: number;
  timelineHeight: number;
  draggedTask: string | null;
  tempDragPosition: DragPosition | null;
  selectedChartTaskId: string | null;
  isHoveringEdge: 'left' | 'right' | null;
  dateToPixel: (date: Date) => number;
  isDragging: boolean;
  onMouseDown: (e: React.MouseEvent, taskId: string) => void;
  onTaskSelect: (taskId: string) => void;
  onTaskContextMenu: (e: React.MouseEvent, taskId: string) => void;
  onEdgeHover: (e: React.MouseEvent, task: Task) => void;
  onMouseLeave: () => void;
}

const TaskBars: React.FC<TaskBarsProps> = ({
  chartTaskRows,
  taskHeight,
  timelineHeight,
  draggedTask,
  tempDragPosition,
  selectedChartTaskId,
  isHoveringEdge,
  dateToPixel,
  isDragging,
  onMouseDown,
  onTaskSelect,
  onTaskContextMenu,
  onEdgeHover,
  onMouseLeave
}) => {

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
          // 直接使用rowIndex，因为chartTaskRows已经按照visibleProjectRows的顺序排列
          const index = rowIndex;
          
          const isBeingDragged = draggedTask === chartTask.id;
          const displayX = isBeingDragged && tempDragPosition ? tempDragPosition.x : chartTask.x;
          const displayWidth = isBeingDragged && tempDragPosition ? tempDragPosition.width : chartTask.width;
          const isSelected = selectedChartTaskId === chartTask.id;
          
          // 里程碑节点渲染
          if (chartTask.type === 'milestone') {
            // 里程碑节点基于开始时间定位，不使用任务条宽度
            const milestoneX = isBeingDragged && tempDragPosition ? tempDragPosition.x : dateToPixel(chartTask.startDate);
            return (
              <div
                key={chartTask.id}
                className={`gantt-milestone-node ${isBeingDragged ? 'dragging' : ''} ${isSelected ? 'selected' : ''} status-${chartTask.status}`}
                style={{
                  left: milestoneX - 8, // 减去图标宽度的一半，让它居中对齐
                  top: index * (taskHeight + 10) + (taskHeight - 16) / 2, // 居中对齐
                }}
                onMouseDown={(e) => {
                  if (e.button === 0) { // 只处理左键
                    onMouseDown(e, chartTask.id);
                  }
                }}
                onClick={(e) => {
                  if (e.button === 0) { // 只处理左键点击
                    onTaskSelect(chartTask.id);
                  }
                }}
                onContextMenu={(e) => onTaskContextMenu(e, chartTask.id)}
              >
                <div className="milestone-icon custom-color" style={{ '--custom-milestone-color': chartTask.color } as React.CSSProperties}>
                  <Target size={16} />
                </div>
                {/* 显示里程碑标签 */}
                {chartTask.tags && chartTask.tags.length > 0 && (
                  <div className="milestone-tags">
                    {chartTask.tags.map(tag => (
                      <span key={tag} className="milestone-tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            );
          }
          
          // 普通任务条渲染
          return (
            <div
              key={chartTask.id}
              className={`gantt-task-bar custom-color ${isBeingDragged ? 'dragging' : ''} ${isSelected ? 'selected' : ''} status-${chartTask.status} type-${chartTask.type} ${isHoveringEdge ? `edge-hover-${isHoveringEdge}` : ''}`}
              style={{
                left: displayX,
                top: index * (taskHeight + 10),
                width: displayWidth,
                height: taskHeight,
                '--custom-task-color': chartTask.color,
                cursor: isHoveringEdge === 'left' ? 'w-resize' : isHoveringEdge === 'right' ? 'e-resize' : 'grab'
              } as React.CSSProperties}
              onMouseDown={(e) => {
                if (e.button === 0) { // 只处理左键
                  onMouseDown(e, chartTask.id);
                }
              }}
              onMouseMove={(e) => onEdgeHover(e, chartTask)}
              onMouseLeave={() => {
                if (!isDragging) {
                  onMouseLeave();
                }
              }}
              onClick={(e) => {
                if (e.button === 0) { // 只处理左键点击
                  onTaskSelect(chartTask.id);
                }
              }}
              onContextMenu={(e) => onTaskContextMenu(e, chartTask.id)}
            >
              {/* 任务内容 */}
              <div className="gantt-task-content">
                {/* 显示任务标签 */}
                {chartTask.tags && chartTask.tags.length > 0 && (
                  <div className="task-tags">
                    {chartTask.tags.map(tag => (
                      <span key={tag} className="task-tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default TaskBars;