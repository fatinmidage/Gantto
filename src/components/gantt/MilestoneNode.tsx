/**
 * 里程碑节点组件
 * 渲染菱形图标的里程碑节点，支持拖拽和右键菜单
 */

import React from 'react';
import { Target, Code, CheckCircle, Package, Circle } from 'lucide-react';
import { MilestoneNode as MilestoneNodeData } from '../../types/task';
import { TaskType } from '../../types/common';

interface MilestoneNodeProps {
  milestone: MilestoneNodeData;
  taskHeight: number;
  isSelected?: boolean;
  isDragging?: boolean;
  onMouseDown?: (e: React.MouseEvent, milestoneId: string) => void;
  onContextMenu?: (e: React.MouseEvent, milestoneId: string) => void;
  onClick?: (milestoneId: string) => void;
}

// 根据类型获取图标组件
const getIconComponent = (iconType: TaskType) => {
  switch (iconType) {
    case 'milestone':
      return Target;
    case 'development':
      return Code;
    case 'testing':
      return CheckCircle;
    case 'delivery':
      return Package;
    default:
      return Circle;
  }
};

// 根据类型获取颜色
const getIconColor = (iconType: TaskType) => {
  switch (iconType) {
    case 'milestone':
      return '#ff9800'; // 橙色
    case 'development':
      return '#2196f3'; // 蓝色
    case 'testing':
      return '#4caf50'; // 绿色
    case 'delivery':
      return '#9c27b0'; // 紫色
    default:
      return '#666666'; // 灰色
  }
};

const MilestoneNode: React.FC<MilestoneNodeProps> = ({
  milestone,
  taskHeight,
  isSelected = false,
  isDragging = false,
  onMouseDown,
  onContextMenu,
  onClick
}) => {
  const IconComponent = getIconComponent(milestone.iconType);
  const iconColor = getIconColor(milestone.iconType);
  
  // 节点大小基于任务高度计算
  const nodeSize = Math.max(12, Math.min(20, taskHeight * 0.7));
  
  // 节点位置
  const nodeStyle: React.CSSProperties = {
    position: 'absolute',
    left: milestone.x ? milestone.x - nodeSize / 2 : 0,
    top: milestone.y ? milestone.y - nodeSize / 2 : taskHeight / 2 - nodeSize / 2,
    width: nodeSize,
    height: nodeSize,
    cursor: isDragging ? 'grabbing' : 'grab',
    zIndex: isSelected ? 1000 : isDragging ? 999 : 10,
    transform: isDragging ? 'scale(1.1)' : 'scale(1)',
    transition: isDragging ? 'none' : 'transform 0.15s ease',
    opacity: isDragging ? 0.8 : 1,
  };

  // 菱形容器样式
  const diamondStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    backgroundColor: milestone.color || iconColor,
    transform: 'rotate(45deg)',
    borderRadius: '2px',
    border: isSelected ? '2px solid #1976d2' : '1px solid rgba(0,0,0,0.2)',
    boxShadow: isSelected ? '0 0 8px rgba(25,118,210,0.4)' : '0 1px 3px rgba(0,0,0,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  // 图标样式
  const iconStyle: React.CSSProperties = {
    transform: 'rotate(-45deg)', // 抵消菱形的旋转
    color: '#ffffff',
    width: nodeSize * 0.6,
    height: nodeSize * 0.6,
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onMouseDown) {
      onMouseDown(e, milestone.id);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onContextMenu) {
      onContextMenu(e, milestone.id);
    }
  };

  const handleClick = () => {
    if (onClick) {
      onClick(milestone.id);
    }
  };

  return (
    <div
      style={nodeStyle}
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
      onClick={handleClick}
      data-milestone-id={milestone.id}
      title={milestone.label || milestone.title}
    >
      <div style={diamondStyle}>
        <IconComponent style={iconStyle} />
      </div>
      
      {/* 标签文本（如果有） */}
      {milestone.label && (
        <div
          style={{
            position: 'absolute',
            top: nodeSize + 2,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '10px',
            color: '#666',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            maxWidth: '80px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {milestone.label}
        </div>
      )}
    </div>
  );
};

export default MilestoneNode;