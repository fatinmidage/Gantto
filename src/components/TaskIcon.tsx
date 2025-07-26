import React from 'react';
import { 
  Package, 
  Code, 
  CheckCircle, 
  Circle,
  GripVertical
} from './icons';

interface TaskIconProps {
  type?: 'development' | 'testing' | 'delivery' | 'default';
  size?: number;
  className?: string;
  level?: number; // 任务层级，0为根任务，1为子任务
}

const TaskIcon: React.FC<TaskIconProps> = ({ 
  type = 'default', 
  size = 16,
  className = '',
  level = 0
}) => {
  // 根据层级调整图标大小和透明度
  const adjustedSize = level > 0 ? size * 0.85 : size;
  const opacity = level > 0 ? 0.8 : 1;

  // 根据任务类型获取颜色
  const getTypeColor = () => {
    switch (type) {
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

  const iconColor = getTypeColor();
  const iconStyle = { color: iconColor };

  const getTypeIcon = () => {
    switch (type) {
      case 'development':
        return <Code size={adjustedSize} className={className} style={iconStyle} />;
      case 'testing':
        return <CheckCircle size={adjustedSize} className={className} style={iconStyle} />;
      case 'delivery':
        return <Package size={adjustedSize} className={className} style={iconStyle} />;
      default:
        return <Circle size={adjustedSize} className={className} style={iconStyle} />;
    }
  };

  return (
    <div className="task-icon-container" style={{ opacity }}>
      {getTypeIcon()}
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