/**
 * 里程碑任务条组件
 * 负责渲染里程碑类型的任务（与普通任务条区分）
 */

import React from 'react';
import { Target, Code, CheckCircle, Package } from 'lucide-react';
import { Task } from '../../types/task';

interface MilestoneTaskBarProps {
  task: Task;
  rowIndex: number;
  taskHeight: number;
  isSelected: boolean;
  isBeingDragged: boolean;
  displayX?: number;
  dateToPixel: (date: Date) => number;
  onMouseDown: (e: React.MouseEvent, taskId: string) => void;
  onTaskSelect: (taskId: string) => void;
  onTaskContextMenu: (e: React.MouseEvent, taskId: string) => void;
}

const MilestoneTaskBar: React.FC<MilestoneTaskBarProps> = ({
  task,
  rowIndex,
  taskHeight,
  isSelected,
  isBeingDragged,
  displayX,
  dateToPixel,
  onMouseDown,
  onTaskSelect,
  onTaskContextMenu
}) => {
  // 里程碑节点使用统一的位置计算逻辑，与普通任务保持一致
  const milestoneX = displayX !== undefined ? displayX : (task.x !== undefined ? task.x : dateToPixel(task.startDate));

  // 根据任务类型选择图标
  const renderIcon = () => {
    switch (task.type) {
      case 'development':
        return <Code size={16} />;
      case 'testing':
        return <CheckCircle size={16} />;
      case 'delivery':
        return <Package size={16} />;
      default:
        return <Target size={16} />;
    }
  };

  return (
    <div
      key={task.id}
      className={`gantt-milestone-node ${isBeingDragged ? 'dragging' : ''} ${isSelected ? 'selected' : ''} status-${task.status}`}
      style={{
        left: milestoneX - 8, // 减去图标宽度的一半，让它居中对齐
        top: rowIndex * (taskHeight + 10) + (taskHeight - 16) / 2, // 居中对齐
      }}
      onMouseDown={(e) => {
        if (e.button === 0) { // 只处理左键
          onMouseDown(e, task.id);
        }
      }}
      onClick={(e) => {
        if (e.button === 0) { // 只处理左键点击
          onTaskSelect(task.id);
        }
      }}
      onContextMenu={(e) => onTaskContextMenu(e, task.id)}
    >
      <div className="milestone-icon" style={{ color: task.color }}>
        {renderIcon()}
      </div>
      {/* 显示里程碑标签 */}
      {task.tags && task.tags.length > 0 && (
        <div className="milestone-tags">
          {task.tags.map(tag => (
            <span key={tag} className="milestone-tag">{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
};

export default MilestoneTaskBar;