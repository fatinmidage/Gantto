/**
 * 可编辑标签组件
 * 支持双击编辑功能，用于任务条和里程碑的标签编辑
 */

import React, { useState, useEffect, useRef } from 'react';

interface EditableLabelProps {
  value: string;
  onSave: (newValue: string) => void;
  style?: React.CSSProperties;
  className?: string;
  placeholder?: string;
  maxLength?: number;
}

const EditableLabel: React.FC<EditableLabelProps> = ({
  value,
  onSave,
  style,
  className,
  placeholder = '输入标签',
  maxLength = 20
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // 进入编辑模式
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditValue(value);
  };

  // 保存编辑
  const handleSave = () => {
    const trimmedValue = editValue.trim();
    if (trimmedValue && trimmedValue !== value) {
      onSave(trimmedValue);
    }
    setIsEditing(false);
  };

  // 取消编辑
  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  // 键盘事件处理
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  // 失去焦点时保存
  const handleBlur = () => {
    handleSave();
  };

  // 编辑模式时自动聚焦
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const defaultStyle: React.CSSProperties = {
    fontSize: '10px',
    color: '#666',
    whiteSpace: 'nowrap',
    maxWidth: '80px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    cursor: 'pointer',
    userSelect: 'none',
    ...style
  };

  const inputStyle: React.CSSProperties = {
    fontSize: '10px',
    color: '#666',
    border: '1px solid #1976d2',
    borderRadius: '2px',
    padding: '1px 3px',
    maxWidth: '80px',
    outline: 'none',
    backgroundColor: 'white',
    boxShadow: '0 0 3px rgba(25,118,210,0.3)',
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={placeholder}
        maxLength={maxLength}
        style={inputStyle}
        className={className}
      />
    );
  }

  return (
    <div
      style={defaultStyle}
      className={className}
      onDoubleClick={handleDoubleClick}
      title={`双击编辑: ${value}`}
    >
      {value}
    </div>
  );
};

export default EditableLabel;