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
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
      if (e.altKey) {
        // Alt+Enter: 插入换行符
        e.preventDefault();
        const textarea = e.target as HTMLTextAreaElement;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newValue = editValue.substring(0, start) + '\n' + editValue.substring(end);
        setEditValue(newValue);
        
        // 设置光标位置到新插入的换行符后面
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 1;
          // 自动调整高度
          if (inputRef.current) {
            inputRef.current.style.height = 'auto';
            inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 60) + 'px';
          }
        }, 0);
      } else {
        // 单独Enter: 保存退出
        e.preventDefault();
        handleSave();
      }
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  // 失去焦点时保存
  const handleBlur = () => {
    handleSave();
  };

  // 编辑模式时自动聚焦和自动调整高度
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
      
      // 自动调整高度
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 60) + 'px';
    }
  }, [isEditing]);

  // 输入时自动调整高度
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditValue(e.target.value);
    
    // 自动调整高度
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 60) + 'px';
    }
  };

  const defaultStyle: React.CSSProperties = {
    fontSize: '10px',
    color: '#666',
    cursor: 'pointer',
    userSelect: 'none',
    whiteSpace: 'pre-wrap', // 保留换行符并自动换行
    ...style
  };

  const inputStyle: React.CSSProperties = {
    fontSize: '10px',
    color: '#666',
    border: '1px solid #1976d2',
    borderRadius: '2px',
    padding: '2px 4px',
    outline: 'none',
    backgroundColor: 'white',
    boxShadow: '0 0 3px rgba(25,118,210,0.3)',
    resize: 'none',
    fontFamily: 'inherit',
    lineHeight: '1.2',
    minHeight: '14px',
    ...style
  };

  if (isEditing) {
    return (
      <textarea
        ref={inputRef}
        value={editValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={placeholder}
        maxLength={maxLength}
        style={inputStyle}
        className={className}
        rows={1}
      />
    );
  }

  return (
    <div
      style={defaultStyle}
      className={className}
      onDoubleClick={handleDoubleClick}
      title={`双击编辑: ${value}
编辑时：Enter保存，Esc取消，Alt+Enter换行`}
    >
      {value}
    </div>
  );
};

export default EditableLabel;