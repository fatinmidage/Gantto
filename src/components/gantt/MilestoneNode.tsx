/**
 * 里程碑节点组件
 * 渲染纯净图标的里程碑节点，支持拖拽和右键菜单
 */

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { MilestoneNode as MilestoneNodeData } from '../../types/task';
import { IconType } from '../../types/common';
import { getIconConfig } from '../../config/icons';
import EditableLabel from './EditableLabel';
import MilestoneDatePicker from './MilestoneDatePicker';
import { hasDateInLabel, replaceDateInLabel } from '../../utils/ganttUtils';
import { LAYOUT_CONSTANTS } from './ganttStyles';

interface MilestoneNodeProps {
  milestone: MilestoneNodeData;
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
  
  // 🔧 修复：保存里程碑的原始标签，避免拖拽时被修改
  const originalLabelRef = useRef<string | undefined>(milestone.label);
  
  // 当不在拖拽状态时，更新原始标签引用
  useEffect(() => {
    if (!isDragging) {
      originalLabelRef.current = milestone.label;
    }
  }, [isDragging, milestone.label]);
  
  // 计算要显示的标签：优先使用预览标签，否则使用原始标签
  // 🔧 修复：直接计算而不使用 useMemo，确保每次渲染都重新计算
  const originalLabel = originalLabelRef.current;
  const hasDate = originalLabel ? hasDateInLabel(originalLabel) : false;
  const shouldShowPreview = isDragging && previewDate && originalLabel && hasDate;
  
  let displayLabel: string;
  if (shouldShowPreview) {
    displayLabel = replaceDateInLabel(originalLabel!, previewDate!);
  } else {
    // 使用当前的 milestone.label（可能已被拖拽系统更新）
    displayLabel = milestone.label;
  }
  
  
  // 使用常量定义的节点大小
  const nodeSize = LAYOUT_CONSTANTS.MILESTONE_NODE_SIZE;
  
  // 🔧 修复：milestone.x 和 milestone.y 已经是渲染位置（左上角），不需要再次转换
  const nodeStyle = useMemo(() => {
    // 防止 NaN 值导致样式错误
    const safeRenderLeft = isNaN(milestone.x || 0) ? 0 : (milestone.x || 0);
    const safeRenderTop = isNaN(milestone.y || 0) ? 0 : (milestone.y || 0);
    
    
    return {
      position: 'absolute' as const,
      left: safeRenderLeft,
      top: safeRenderTop,
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
  }, [milestone.x, milestone.y, nodeSize, isDragging, isSelected]);

  // 🔧 性能优化：缓存图标样式计算
  const iconStyle = useMemo(() => ({
    color: milestone.color || iconColor,
    width: nodeSize,
    height: nodeSize,
    filter: isSelected ? 'drop-shadow(0 0 4px rgba(25,118,210,0.6))' : 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))',
    transition: isDragging ? 'none' : 'filter 0.15s ease',
  }), [milestone.color, iconColor, nodeSize, isSelected, isDragging]);

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
            top: nodeSize + LAYOUT_CONSTANTS.MILESTONE_LABEL_OFFSET,
            left: '50%',
            transform: 'translateX(-50%)',
            pointerEvents: 'auto',
            zIndex: 1,
            // 使用常量定义的标签宽度
            width: `${LAYOUT_CONSTANTS.MILESTONE_LABEL_MAX_WIDTH}px`,
          }}
        >
          <EditableLabel
            value={displayLabel || ''}
            onSave={(newLabel) => onLabelEdit(milestone.id, newLabel)}
            style={{
              fontSize: '10px',
              color: isDragging && previewDate ? '#ff6b35' : '#666', // 拖拽时使用橙色醒目预览
              maxWidth: `${LAYOUT_CONSTANTS.MILESTONE_LABEL_MAX_WIDTH}px`,
              wordWrap: 'break-word',
              textAlign: 'center',
              lineHeight: '1.2',
              transition: isDragging ? 'none' : 'color 0.15s ease',
              fontWeight: isDragging && previewDate ? 'bold' : 'normal', // 拖拽时加粗显示预览
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