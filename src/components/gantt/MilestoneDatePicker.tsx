/**
 * 里程碑日历选择器组件
 * 专门用于里程碑节点的日期选择，支持双击弹出
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Calendar, Check, X } from 'lucide-react';

interface MilestoneDatePickerProps {
  date: Date;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onDateChange: (newDate: Date) => void;
  position?: { x: number; y: number };
  className?: string;
  immediateMode?: boolean; // 即时应用模式，选择日期后立即应用
}

const MilestoneDatePicker: React.FC<MilestoneDatePickerProps> = ({
  date,
  isOpen,
  onOpenChange,
  onDateChange,
  position,
  className = '',
  immediateMode = false
}) => {
  const [tempDate, setTempDate] = useState(date);
  const dateInputRef = useRef<HTMLInputElement>(null);

  // 同步外部日期变化
  useEffect(() => {
    setTempDate(date);
  }, [date]);

  // 弹窗打开时自动聚焦到日期输入框并触发日历
  useEffect(() => {
    if (isOpen && dateInputRef.current) {
      // 延迟聚焦，确保弹窗动画完成
      const timer = setTimeout(() => {
        const inputElement = dateInputRef.current;
        if (inputElement) {
          inputElement.focus();
          
          // 在即时模式下，尝试多种方法自动显示日期选择器
          if (immediateMode) {
            // 方法1: 使用 showPicker
            if (inputElement.showPicker) {
              try {
                inputElement.showPicker();
              } catch (error) {
                // showPicker not supported or failed
              }
            }
            
            // 方法2: 模拟点击事件
            setTimeout(() => {
              const clickEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window
              });
              inputElement.dispatchEvent(clickEvent);
            }, 50);
            
            // 方法3: 模拟键盘事件（某些浏览器支持）
            setTimeout(() => {
              const spaceEvent = new KeyboardEvent('keydown', {
                key: ' ',
                code: 'Space',
                bubbles: true
              });
              inputElement.dispatchEvent(spaceEvent);
            }, 100);
          }
        }
      }, 200); // 稍微增加延迟以确保DOM完全加载
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, immediateMode]);

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
      
      // 即时模式下直接应用变更
      if (immediateMode) {
        onDateChange(newDate);
        onOpenChange(false);
      }
    }
  }, [immediateMode, onDateChange, onOpenChange]);

  // 强制触发日期选择器的函数
  const forceTriggerDatePicker = useCallback((inputElement: HTMLInputElement) => {
    // 尝试多种方法触发日期选择器
    if (inputElement.showPicker) {
      try {
        inputElement.showPicker();
        return true;
      } catch (error) {
        // showPicker failed, trying alternative methods
      }
    }
    
    // 备选方法: 模拟用户交互
    const events = [
      new MouseEvent('mousedown', { bubbles: true }),
      new MouseEvent('mouseup', { bubbles: true }),
      new MouseEvent('click', { bubbles: true })
    ];
    
    events.forEach((event, index) => {
      setTimeout(() => {
        inputElement.dispatchEvent(event);
      }, index * 10);
    });
    
    return false;
  }, []);

  // 处理输入框点击 - 自动显示日期选择器
  const handleInputClick = useCallback((_e: React.MouseEvent) => {
    // 让默认行为执行，不阻止
    if (dateInputRef.current && immediateMode) {
      setTimeout(() => {
        forceTriggerDatePicker(dateInputRef.current!);
      }, 10);
    }
  }, [immediateMode, forceTriggerDatePicker]);

  // 处理输入框聚焦 - 自动显示日期选择器
  const handleInputFocus = useCallback(() => {
    if (immediateMode && dateInputRef.current) {
      // 稍微延迟以避免与聚焦冲突
      setTimeout(() => {
        forceTriggerDatePicker(dateInputRef.current!);
      }, 150);
    }
  }, [immediateMode, forceTriggerDatePicker]);

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
        // 即时模式下 Enter 键关闭弹窗，非即时模式下确认选择
        if (immediateMode) {
          onOpenChange(false);
        } else {
          handleConfirm();
        }
        break;
      case 'Escape':
        e.preventDefault();
        handleCancel();
        break;
    }
  }, [immediateMode, handleConfirm, handleCancel, onOpenChange]);

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
          data-immediate-mode={immediateMode}
        >
          <div className="milestone-date-picker-header">
            <Calendar size={16} />
            <h3>{immediateMode ? '选择里程碑日期' : '编辑里程碑日期'}</h3>
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
              <div className="date-input-wrapper">
                <input
                  ref={dateInputRef}
                  id="milestone-date"
                  type="date"
                  value={formatDateForInput(tempDate)}
                  onChange={handleDateChange}
                  onClick={handleInputClick}
                  onFocus={handleInputFocus}
                  className="milestone-date-input"
                  placeholder="选择日期"
                />
                {/* 自定义日期选择按钮 */}
                <button
                  type="button"
                  className="date-picker-trigger-btn"
                  onClick={() => {
                    dateInputRef.current?.focus();
                    forceTriggerDatePicker(dateInputRef.current!);
                  }}
                  title="点击选择日期"
                >
                  <Calendar size={16} />
                  选择日期
                </button>
              </div>
            </div>

            {/* 预览新日期 - 仅非即时模式下显示 */}
            {!immediateMode && tempDate.getTime() !== date.getTime() && (
              <div className="new-date-preview">
                <span className="new-date-label">新日期预览：</span>
                <span className="new-date-value">{formatDisplayDate(tempDate)}</span>
              </div>
            )}
            
            {/* 即时模式提示 */}
            {immediateMode && (
              <div className="immediate-mode-hint">
                <span>💡 点击下方"选择日期"按钮，选择后立即生效</span>
              </div>
            )}
          </div>

          {/* 底部按钮 - 仅在非即时模式下显示 */}
          {!immediateMode && (
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
          )}

          <Popover.Arrow className="milestone-date-picker-arrow" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

export default MilestoneDatePicker;