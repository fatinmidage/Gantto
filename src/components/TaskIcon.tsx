import React from 'react';
import { 
  Target, 
  Package, 
  Code, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Circle,
  GripVertical,
  Calendar,
  Zap
} from 'lucide-react';

interface TaskIconProps {
  type?: 'milestone' | 'development' | 'testing' | 'delivery' | 'default';
  status?: 'pending' | 'in-progress' | 'completed' | 'overdue';
  size?: number;
  className?: string;
}

const TaskIcon: React.FC<TaskIconProps> = ({ 
  type = 'default', 
  status = 'pending',
  size = 16,
  className = ''
}) => {
  const getTypeIcon = () => {
    switch (type) {
      case 'milestone':
        return <Target size={size} className={className} />;
      case 'development':
        return <Code size={size} className={className} />;
      case 'testing':
        return <CheckCircle size={size} className={className} />;
      case 'delivery':
        return <Package size={size} className={className} />;
      default:
        return <Circle size={size} className={className} />;
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={size} className={`${className} text-green-500`} />;
      case 'in-progress':
        return <Clock size={size} className={`${className} text-blue-500`} />;
      case 'overdue':
        return <AlertCircle size={size} className={`${className} text-red-500`} />;
      default:
        return <Circle size={size} className={`${className} text-gray-400`} />;
    }
  };

  return (
    <div className="task-icon-container">
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