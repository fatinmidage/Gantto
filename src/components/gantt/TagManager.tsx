import React, { useState } from 'react';
import { Task } from '../../types';

interface TagManagerProps {
  visible: boolean;
  x: number;
  y: number;
  taskId?: string;
  task?: Task;
  availableTags: string[];
  onTagAdd: (taskId: string, tag: string) => void;
  onTagRemove: (taskId: string, tag: string) => void;
  onClose: () => void;
}

const TagManager: React.FC<TagManagerProps> = ({
  visible,
  x,
  y,
  taskId,
  task,
  availableTags,
  onTagAdd,
  onTagRemove
}) => {
  const [newTag, setNewTag] = useState('');

  if (!visible) return null;

  const currentTags = task?.tags || [];

  const handleTagAdd = () => {
    if (taskId && newTag.trim()) {
      onTagAdd(taskId, newTag.trim());
      setNewTag('');
    }
  };

  const handleTagRemove = (tag: string) => {
    if (taskId) {
      onTagRemove(taskId, tag);
    }
  };

  const handleQuickAdd = (tag: string) => {
    if (taskId) {
      onTagAdd(taskId, tag);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTagAdd();
    }
  };

  const handleTagMouseEnter = (e: React.MouseEvent<HTMLSpanElement>) => {
    e.currentTarget.style.backgroundColor = '#e0e0e0';
  };

  const handleTagMouseLeave = (e: React.MouseEvent<HTMLSpanElement>) => {
    e.currentTarget.style.backgroundColor = '#f5f5f5';
  };

  return (
    <div
      className="tag-manager-panel"
      style={{
        position: 'fixed',
        top: y,
        left: x + 180,
        backgroundColor: '#fff',
        border: '1px solid #ddd',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: 1001,
        padding: '16px',
        minWidth: '250px',
        maxHeight: '300px',
        overflowY: 'auto'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '500' }}>
        管理标签
      </div>
      
      {/* 当前任务的标签 */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
          当前标签：
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {currentTags.length > 0 ? (
            currentTags.map(tag => (
              <span
                key={tag}
                className="tag-item"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '4px 8px',
                  backgroundColor: '#e3f2fd',
                  color: '#1976d2',
                  borderRadius: '12px',
                  fontSize: '12px',
                  gap: '4px'
                }}
              >
                {tag}
                <button
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#1976d2',
                    cursor: 'pointer',
                    fontSize: '12px',
                    padding: '0'
                  }}
                  onClick={() => handleTagRemove(tag)}
                >
                  ×
                </button>
              </span>
            ))
          ) : (
            <span style={{ color: '#999', fontSize: '12px' }}>无标签</span>
          )}
        </div>
      </div>
      
      {/* 添加新标签 */}
      <div style={{ marginBottom: '12px' }}>
        <input
          type="text"
          placeholder="输入新标签..."
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyPress={handleKeyPress}
          style={{
            width: '100%',
            padding: '6px 8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '12px'
          }}
        />
        <button
          style={{
            marginTop: '6px',
            padding: '6px 12px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer'
          }}
          onClick={handleTagAdd}
        >
          添加标签
        </button>
      </div>
      
      {/* 可用标签 */}
      <div>
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
          快速添加：
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {availableTags.map(tag => (
            <span
              key={tag}
              style={{
                padding: '4px 8px',
                backgroundColor: '#f5f5f5',
                color: '#333',
                borderRadius: '12px',
                fontSize: '12px',
                cursor: 'pointer',
                border: '1px solid #ddd'
              }}
              onMouseEnter={handleTagMouseEnter}
              onMouseLeave={handleTagMouseLeave}
              onClick={() => handleQuickAdd(tag)}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TagManager;