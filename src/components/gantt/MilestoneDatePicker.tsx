/**
 * 里程碑日历选择器组件
 * 专门用于里程碑节点的日期选择，支持双击弹出
 */

import React, { useState, useCallback, useEffect } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Calendar, Check, X } from 'lucide-react';

interface MilestoneDatePickerProps {
  date: Date;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onDateChange: (newDate: Date) => void;
  position?: { x: number; y: number };
  className?: string;
}

const MilestoneDatePicker: React.FC<MilestoneDatePickerProps> = ({
  date,
  isOpen,
  onOpenChange,
  onDateChange,
  position,
  className = ''
}) => {
  const [tempDate, setTempDate] = useState(date);

  // 同步外部日期变化
  useEffect(() => {
    setTempDate(date);
  }, [date]);

  // 格式化日期为 YYYY-MM-DD 格式
  const formatDateForInput = (inputDate: Date): string => {
    return inputDate.toISOString().split('T')[0];
  };

  // 解析日期字符串为 Date 对象
  const parseInputDate = (dateStr: string): Date => {
    return new Date(dateStr + 'T00:00:00');
  };

  // 处理日期变化
  const handleDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const newDate = parseInputDate(e.target.value);
      setTempDate(newDate);
    }
  }, []);

  // 确认日期选择
  const handleConfirm = useCallback(() => {
    onDateChange(tempDate);
    onOpenChange(false);
  }, [tempDate, onDateChange, onOpenChange]);

  // 取消日期选择
  const handleCancel = useCallback(() => {
    setTempDate(date); // 恢复原始日期
    onOpenChange(false);
  }, [date, onOpenChange]);

  // 键盘事件处理
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        handleConfirm();
        break;
      case 'Escape':
        e.preventDefault();
        handleCancel();
        break;
    }
  }, [handleConfirm, handleCancel]);

  // 格式化显示的日期
  const formatDisplayDate = (inputDate: Date): string => {
    return inputDate.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      weekday: 'short'
    });
  };

  // 计算内容位置样式
  const getContentStyle = (): React.CSSProperties => {
    if (!position) return {};
    
    return {
      position: 'fixed',
      left: position.x,
      top: position.y,
      zIndex: 1000
    };
  };

  return (
    <Popover.Root open={isOpen} onOpenChange={onOpenChange}>
      <Popover.Portal>
        <Popover.Content 
          className={`milestone-date-picker-content ${className}`}
          side="bottom"
          align="center"
          sideOffset={8}
          style={getContentStyle()}
          onKeyDown={handleKeyDown}
        >
          <div className="milestone-date-picker-header">
            <Calendar size={16} />
            <h3>选择里程碑日期</h3>
            <button
              className="milestone-date-picker-close"
              onClick={handleCancel}
              aria-label="关闭日历"
            >
              <X size={14} />
            </button>
          </div>

          <div className="milestone-date-picker-body">
            {/* 当前日期显示 */}
            <div className="current-date-display">
              <span className="current-date-label">当前日期：</span>
              <span className="current-date-value">{formatDisplayDate(date)}</span>
            </div>

            {/* 日期输入 */}
            <div className="date-input-container">
              <label htmlFor="milestone-date" className="date-input-label">
                新日期
              </label>
              <input
                id="milestone-date"
                type="date"
                value={formatDateForInput(tempDate)}
                onChange={handleDateChange}
                className="milestone-date-input"
                autoFocus
              />
            </div>

            {/* 预览新日期 */}
            {tempDate.getTime() !== date.getTime() && (
              <div className="new-date-preview">
                <span className="new-date-label">新日期预览：</span>
                <span className="new-date-value">{formatDisplayDate(tempDate)}</span>
              </div>
            )}
          </div>

          <div className="milestone-date-picker-footer">
            <button
              className="date-picker-btn cancel-btn"
              onClick={handleCancel}
            >
              取消
            </button>
            <button
              className="date-picker-btn confirm-btn"
              onClick={handleConfirm}
              disabled={tempDate.getTime() === date.getTime()}
            >
              <Check size={14} />
              确认
            </button>
          </div>

          <Popover.Arrow className="milestone-date-picker-arrow" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

export default MilestoneDatePicker;