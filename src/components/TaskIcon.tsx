import React from 'react';
import { 
  Target, 
  Package, 
  Code, 
  CheckCircle, 
  Circle,
  GripVertical
} from './icons';

interface TaskIconProps {
  type?: 'milestone' | 'development' | 'testing' | 'delivery' | 'default';
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

  const getTypeIcon = () => {
    switch (type) {
      case 'milestone':
        return <Target size={adjustedSize} className={className} />;
      case 'development':
        return <Code size={adjustedSize} className={className} />;
      case 'testing':
        return <CheckCircle size={adjustedSize} className={className} />;
      case 'delivery':
        return <Package size={adjustedSize} className={className} />;
      default:
        return <Circle size={adjustedSize} className={className} />;
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