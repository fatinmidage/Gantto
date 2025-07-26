import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { TaskIcon } from '..';
import { AVAILABLE_ICONS } from '../../config/icons';
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

  // 使用所有图标（不再需要分类过滤）
  const filteredIcons = AVAILABLE_ICONS;

  // 调整位置以避免超出视口 - 由于图标减少，菜单更小
  const adjustedPosition = {
    x: Math.min(position.x, window.innerWidth - 320), // 320是菜单的大概宽度
    y: Math.min(position.y, window.innerHeight - 200) // 200是菜单的大概高度
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
        width: '300px',
        maxHeight: '280px',
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
      {/* 标题栏 */}
      <div style={{borderBottom: '1px solid #e5e7eb', padding: '12px', textAlign: 'center'}}>
        <h3 style={{margin: 0, fontSize: '14px', fontWeight: '500', color: '#374151'}}>
          选择任务图标
        </h3>
      </div>

      {/* 图标网格 */}
      <div style={{padding: '16px', maxHeight: '200px', overflowY: 'auto'}}>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px'}}>
          {filteredIcons.map((icon) => (
            <div
              key={icon.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '12px 8px',
                borderRadius: '6px',
                cursor: 'pointer',
                backgroundColor: currentIconType === icon.id ? '#eff6ff' : 'transparent',
                border: currentIconType === icon.id ? '2px solid #3b82f6' : '2px solid transparent',
                transition: 'all 150ms ease-in-out',
                minHeight: '60px'
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
              <div style={{marginBottom: '6px'}}>
                <TaskIcon iconType={icon.id} size={24} />
              </div>
              <span style={{fontSize: '11px', color: '#6b7280', textAlign: 'center', lineHeight: '1.2', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%'}}>
                {icon.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 底部信息 */}
      <div style={{borderTop: '1px solid #e5e7eb', padding: '10px', fontSize: '12px', color: '#9ca3af', textAlign: 'center'}}>
        8个精选图标，满足日常需求
      </div>
    </div>
  );

  return createPortal(dropdownContent, document.body);
};

export default TaskIconSelector;