import React from 'react';
import { GripVertical } from './icons';
import { getIconConfig, LEGACY_TYPE_MAPPING } from '../config/icons';
import { TaskType, IconType } from '../types/common';

interface TaskIconProps {
  type?: TaskType; // 保留向后兼容
  iconType?: IconType; // 新的图标类型支持
  size?: number;
  className?: string;
  level?: number; // 任务层级，0为根任务，1为子任务
  color?: string; // 自定义颜色，优先级高于配置
}

const TaskIcon: React.FC<TaskIconProps> = ({ 
  type = 'default',
  iconType, 
  size = 16,
  className = '',
  level = 0,
  color
}) => {
  // 根据层级调整图标大小和透明度
  const adjustedSize = level > 0 ? size * 0.85 : size;
  const opacity = level > 0 ? 0.8 : 1;

  // 确定要使用的图标类型
  const finalIconType = iconType || LEGACY_TYPE_MAPPING[type] || type;
  
  // 获取图标配置
  const iconConfig = getIconConfig(finalIconType);
  const IconComponent = iconConfig.component;
  
  // 确定图标颜色
  const iconColor = color || iconConfig.color;
  const iconStyle = { color: iconColor };

  return (
    <div className="task-icon-container" style={{ opacity }}>
      <IconComponent 
        size={adjustedSize} 
        className={className} 
        style={iconStyle} 
      />
    </div>
  );
};

export const DragHandle: React.FC<{ size?: number }> = ({ size = 16 }) => {
  return (
    <div className="drag-handle">
      <GripVertical size={size} className="text-gray-400" />
    </div>
  );
};

export default TaskIcon; 