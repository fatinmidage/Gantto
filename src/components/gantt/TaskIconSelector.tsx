import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { TaskIcon } from '..';
import { AVAILABLE_ICONS, ICON_CATEGORIES } from '../../config/icons';
import { IconType } from '../../types/common';

interface TaskIconSelectorProps {
  currentIconType: IconType;
  onIconTypeChange: (iconType: IconType) => void;
  onClose: () => void;
  position: { x: number; y: number };
}

const TaskIconSelector: React.FC<TaskIconSelectorProps> = ({
  currentIconType,
  onIconTypeChange,
  onClose,
  position
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(ICON_CATEGORIES[0].id);

  useEffect(() => {
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

  const handleIconSelect = (iconType: IconType) => {
    onIconTypeChange(iconType);
    handleClose();
  };

  // 根据选中的分类过滤图标
  const filteredIcons = AVAILABLE_ICONS.filter(icon => 
    selectedCategory === 'default' ? true : icon.category === selectedCategory
  );

  // 调整位置以避免超出视口
  const adjustedPosition = {
    x: Math.min(position.x, window.innerWidth - 400), // 400是菜单的大概宽度
    y: Math.min(position.y, window.innerHeight - 300) // 300是菜单的大概高度
  };

  const dropdownContent = (
    <div
      ref={dropdownRef}
      style={{
        position: 'fixed',
        left: adjustedPosition.x,
        top: adjustedPosition.y,
        transformOrigin: 'top left',
        zIndex: 9999,
        width: '380px',
        maxHeight: '400px',
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'scale(1)' : 'scale(0.95)',
        transition: 'all 150ms ease-in-out'
      }}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      {/* 分类选择器 */}
      <div style={{borderBottom: '1px solid #e5e7eb', padding: '8px'}}>
        <div style={{display: 'flex', flexWrap: 'wrap', gap: '4px'}}>
          {ICON_CATEGORIES.map((category) => (
            <button
              key={category.id}
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: selectedCategory === category.id ? '#dbeafe' : 'transparent',
                color: selectedCategory === category.id ? '#1d4ed8' : '#6b7280',
                transition: 'all 150ms ease-in-out'
              }}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* 图标网格 */}
      <div style={{padding: '12px', maxHeight: '256px', overflowY: 'auto'}}>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '8px'}}>
          {filteredIcons.map((icon) => (
            <div
              key={icon.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '8px',
                borderRadius: '4px',
                cursor: 'pointer',
                backgroundColor: currentIconType === icon.id ? '#eff6ff' : 'transparent',
                border: currentIconType === icon.id ? '2px solid #3b82f6' : '2px solid transparent',
                transition: 'all 150ms ease-in-out'
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleIconSelect(icon.id);
              }}
              title={icon.label}
              onMouseEnter={(e) => {
                if (currentIconType !== icon.id) {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }
              }}
              onMouseLeave={(e) => {
                if (currentIconType !== icon.id) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div style={{marginBottom: '4px'}}>
                <TaskIcon iconType={icon.id} size={20} />
              </div>
              <span style={{fontSize: '12px', color: '#6b7280', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%'}}>
                {icon.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 底部信息 */}
      <div style={{borderTop: '1px solid #e5e7eb', padding: '8px', fontSize: '12px', color: '#6b7280', textAlign: 'center'}}>
        选择图标来自定义任务外观
      </div>
    </div>
  );

  return createPortal(dropdownContent, document.body);
};

export default TaskIconSelector;