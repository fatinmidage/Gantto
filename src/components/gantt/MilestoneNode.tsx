/**
 * 里程碑节点组件
 * 渲染纯净图标的里程碑节点，支持拖拽和右键菜单
 */

import React, { useState, useRef, useMemo } from 'react';
import { MilestoneNode as MilestoneNodeData } from '../../types/task';
import { IconType } from '../../types/common';
import { getIconConfig } from '../../config/icons';
import EditableLabel from './EditableLabel';
import MilestoneDatePicker from './MilestoneDatePicker';
import { hasDateInLabel, replaceDateInLabel } from '../../utils/ganttUtils';

interface MilestoneNodeProps {
  milestone: MilestoneNodeData;
  taskHeight: number;
  isSelected?: boolean;
  isDragging?: boolean;
  previewDate?: Date; // 拖拽时的预览日期
  onMilestoneDragStart?: (e: React.MouseEvent, milestone: MilestoneNodeData) => void;
  onContextMenu?: (e: React.MouseEvent, milestoneId: string) => void;
  onClick?: (milestoneId: string) => void;
  onLabelEdit?: (milestoneId: string, newLabel: string) => void;
  onDateChange?: (milestoneId: string, newDate: Date) => void;
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
  taskHeight: _taskHeight, // 保留参数但标记为未使用
  isSelected = false,
  isDragging = false,
  previewDate,
  onMilestoneDragStart,
  onContextMenu,
  onClick,
  onLabelEdit,
  onDateChange
}) => {
  const IconComponent = getIconComponent(milestone.iconType);
  const iconColor = getIconColor(milestone.iconType);
  
  // 日历选择器状态
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);
  
  // 计算要显示的标签：优先使用预览标签，否则使用原始标签
  const displayLabel = useMemo(() => {
    if (isDragging && previewDate && milestone.label && hasDateInLabel(milestone.label)) {
      const previewLabel = replaceDateInLabel(milestone.label, previewDate);
      return previewLabel;
    }
    return milestone.label;
  }, [isDragging, previewDate, milestone.label, milestone.id]);
  
  // 节点大小固定为16像素
  const nodeSize = 16;
  
  // 节点位置 - 确保垂直居中
  const calculatedLeft = milestone.x ? milestone.x - nodeSize / 2 : 0;
  // 直接使用传入的 milestone.y，它已经是正确的中心位置，只需减去节点半径
  const calculatedTop = milestone.y ? milestone.y - nodeSize / 2 : 0;
  
  
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

  // 双击事件处理 - 打开日历选择器
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 防止在拖拽状态下打开日历
    if (isDragging) return;
    
    setIsDatePickerOpen(true);
  };

  // 日期变更处理
  const handleDateChange = (newDate: Date) => {
    if (onDateChange) {
      onDateChange(milestone.id, newDate);
    }
    setIsDatePickerOpen(false);
  };

  // 获取日历选择器的定位
  const getDatePickerPosition = () => {
    if (!nodeRef.current) return undefined;
    
    const rect = nodeRef.current.getBoundingClientRect();
    return {
      x: rect.left + nodeSize / 2,
      y: rect.bottom + 8
    };
  };

  return (
    <>
      <div
        ref={nodeRef}
        style={nodeStyle}
        onMouseDown={handleMouseDown}
        onContextMenu={handleContextMenu}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        data-milestone-id={milestone.id}
        title={milestone.label || milestone.title}
      >
      <IconComponent style={iconStyle} />
      
      {/* 标签文本（如果有） */}
      {displayLabel && onLabelEdit && (
        <div
          style={{
            position: 'absolute',
            top: nodeSize + 4,
            left: '50%',
            transform: 'translateX(-50%)',
            pointerEvents: 'auto',
            zIndex: 1,
            // 明确设置容器宽度，确保有足够空间
            width: '180px',
          }}
        >
          <EditableLabel
            value={displayLabel}
            onSave={(newLabel) => onLabelEdit(milestone.id, newLabel)}
            style={{
              fontSize: '10px',
              color: isDragging ? '#007acc' : '#666', // 拖拽时使用蓝色提示预览
              maxWidth: '180px',
              wordWrap: 'break-word',
              textAlign: 'center',
              lineHeight: '1.2',
              transition: isDragging ? 'none' : 'color 0.15s ease',
            }}
          />
        </div>
      )}
      </div>

      {/* 日历选择器 */}
      <MilestoneDatePicker
        date={milestone.date}
        isOpen={isDatePickerOpen}
        onOpenChange={setIsDatePickerOpen}
        onDateChange={handleDateChange}
        position={getDatePickerPosition()}
        immediateMode={true} // 启用即时应用模式
      />
    </>
  );
};

export default MilestoneNode;