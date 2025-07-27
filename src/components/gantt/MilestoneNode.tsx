/**
 * 里程碑节点组件
 * 渲染纯净图标的里程碑节点，支持拖拽和右键菜单
 */

import React from 'react';
import { MilestoneNode as MilestoneNodeData } from '../../types/task';
import { IconType } from '../../types/common';
import { getIconConfig } from '../../config/icons';
import EditableLabel from './EditableLabel';

interface MilestoneNodeProps {
  milestone: MilestoneNodeData;
  taskHeight: number;
  isSelected?: boolean;
  isDragging?: boolean;
  onMilestoneDragStart?: (e: React.MouseEvent, milestone: MilestoneNodeData) => void;
  onContextMenu?: (e: React.MouseEvent, milestoneId: string) => void;
  onClick?: (milestoneId: string) => void;
  onLabelEdit?: (milestoneId: string, newLabel: string) => void;
}

// 根据类型获取图标组件
const getIconComponent = (iconType: IconType) => {
  const iconConfig = getIconConfig(iconType);
  return iconConfig.component;
};

// 根据类型获取颜色
const getIconColor = (iconType: IconType) => {
  const iconConfig = getIconConfig(iconType);
  return iconConfig.color;
};

const MilestoneNode: React.FC<MilestoneNodeProps> = ({
  milestone,
  taskHeight,
  isSelected = false,
  isDragging = false,
  onMilestoneDragStart,
  onContextMenu,
  onClick,
  onLabelEdit
}) => {
  const IconComponent = getIconComponent(milestone.iconType);
  const iconColor = getIconColor(milestone.iconType);
  
  // 节点大小固定为16像素
  const nodeSize = 16;
  
  // 节点位置 - 确保垂直居中
  const calculatedLeft = milestone.x ? milestone.x - nodeSize / 2 : 0;
  const calculatedTop = milestone.y ? milestone.y - nodeSize / 2 : taskHeight / 2 - nodeSize / 2;
  
  
  const nodeStyle: React.CSSProperties = {
    position: 'absolute',
    left: calculatedLeft,
    top: calculatedTop,
    width: nodeSize,
    height: nodeSize,
    cursor: isDragging ? 'grabbing' : 'grab',
    zIndex: isSelected ? 1000 : isDragging ? 999 : 10,
    transform: isDragging ? 'scale(1.1)' : 'scale(1)',
    transition: isDragging ? 'none' : 'transform 0.15s ease',
    opacity: isDragging ? 0.8 : 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };


  // 图标样式
  const iconStyle: React.CSSProperties = {
    color: milestone.color || iconColor,
    width: nodeSize,
    height: nodeSize,
    filter: isSelected ? 'drop-shadow(0 0 4px rgba(25,118,210,0.6))' : 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))',
    transition: isDragging ? 'none' : 'filter 0.15s ease',
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // 阻止事件传播，由专用处理器处理
    
    // 使用专用的里程碑拖拽处理器
    if (onMilestoneDragStart) {
      onMilestoneDragStart(e, milestone);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // 右键菜单应该阻止事件传播
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
      <IconComponent style={iconStyle} />
      
      {/* 标签文本（如果有） */}
      {milestone.label && onLabelEdit && (
        <div
          style={{
            position: 'absolute',
            top: nodeSize + 4,
            left: '50%',
            transform: 'translateX(-50%)',
            pointerEvents: 'auto',
            zIndex: 1,
          }}
        >
          <EditableLabel
            value={milestone.label}
            onSave={(newLabel) => onLabelEdit(milestone.id, newLabel)}
            style={{
              fontSize: '10px',
              color: '#666',
              whiteSpace: 'nowrap',
              maxWidth: '80px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          />
        </div>
      )}
    </div>
  );
};

export default MilestoneNode;