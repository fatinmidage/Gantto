import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import TaskIcon from '../TaskIcon';

interface TaskIconSelectorProps {
  currentType: 'milestone' | 'development' | 'testing' | 'delivery' | 'default';
  onTypeChange: (type: 'milestone' | 'development' | 'testing' | 'delivery' | 'default') => void;
  onClose: () => void;
  position: { x: number; y: number };
}

const TaskIconSelector: React.FC<TaskIconSelectorProps> = ({
  currentType,
  onTypeChange,
  onClose,
  position
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  const iconTypes = [
    { type: 'default' as const, label: '默认任务' },
    { type: 'milestone' as const, label: '里程碑' },
    { type: 'development' as const, label: '开发' },
    { type: 'testing' as const, label: '测试' },
    { type: 'delivery' as const, label: '交付' }
  ];

  useEffect(() => {
    setIsVisible(true);
    
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 150); // 延迟关闭以显示动画
  };

  const handleTypeSelect = (type: 'milestone' | 'development' | 'testing' | 'delivery' | 'default') => {
    onTypeChange(type);
    handleClose();
  };

  // 调整位置以避免超出视口
  const adjustedPosition = {
    x: Math.min(position.x, window.innerWidth - 150), // 150是菜单的大概宽度
    y: Math.min(position.y, window.innerHeight - 200) // 200是菜单的大概高度
  };

  const dropdownContent = (
    <div
      ref={dropdownRef}
      className={`fixed bg-white border border-gray-200 rounded-lg shadow-lg min-w-32 transition-all duration-150 ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
        transformOrigin: 'top left',
        zIndex: 9999
      }}
    >
      <div className="py-1">
        {iconTypes.map((iconType) => (
          <div
            key={iconType.type}
            className={`flex items-center px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors ${
              currentType === iconType.type ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
            }`}
            onClick={() => handleTypeSelect(iconType.type)}
          >
            <div className="mr-2">
              <TaskIcon type={iconType.type} size={16} />
            </div>
            <span className="text-sm">{iconType.label}</span>
            {currentType === iconType.type && (
              <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return createPortal(dropdownContent, document.body);
};

export default TaskIconSelector;