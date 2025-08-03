import React, { useState, useCallback, useEffect, useRef } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Calendar, X } from 'lucide-react';

export interface TaskDateRangePickerProps {
  startDate: Date;
  endDate: Date;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onDateRangeChange: (startDate: Date, endDate: Date) => void;
  position?: { x: number; y: number };
  className?: string;
}

const TaskDateRangePicker: React.FC<TaskDateRangePickerProps> = ({
  startDate,
  endDate,
  isOpen,
  onOpenChange,
  onDateRangeChange,
  position,
  className = ''
}) => {
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempEndDate, setTempEndDate] = useState(endDate);
  const startDateInputRef = useRef<HTMLInputElement>(null);
  const endDateInputRef = useRef<HTMLInputElement>(null);
  
  // 用于区分用户主动关闭和Radix UI自动关闭的标志
  const userTriggeredCloseRef = useRef(false);

  // 同步外部日期变化
  useEffect(() => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
  }, [startDate, endDate]);

  // 弹窗打开时自动聚焦到开始日期输入框
  useEffect(() => {
    if (isOpen && startDateInputRef.current) {
      const timer = setTimeout(() => {
        startDateInputRef.current?.focus();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // 格式化日期为 YYYY-MM-DD 格式
  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // 解析日期字符串为 Date 对象
  const parseInputDate = (dateStr: string): Date => {
    return new Date(dateStr + 'T00:00:00');
  };

  // 验证日期范围
  const validateDateRange = (start: Date, end: Date): { start: Date; end: Date } => {
    let validStart = new Date(start);
    let validEnd = new Date(end);

    // 确保开始日期不大于结束日期
    if (validStart > validEnd) {
      // 如果开始日期大于结束日期，自动调整结束日期为开始日期 + 1天
      validEnd = new Date(validStart);
      validEnd.setDate(validEnd.getDate() + 1);
    }

    // 确保最小持续时间为1天
    const oneDayMs = 24 * 60 * 60 * 1000;
    if (validEnd.getTime() - validStart.getTime() < oneDayMs) {
      validEnd = new Date(validStart.getTime() + oneDayMs);
    }

    return { start: validStart, end: validEnd };
  };

  // 处理开始日期变化
  const handleStartDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const newStart = parseInputDate(e.target.value);
      setTempStartDate(newStart);
      
      // 验证并调整日期范围
      const validated = validateDateRange(newStart, tempEndDate);
      if (validated.end.getTime() !== tempEndDate.getTime()) {
        setTempEndDate(validated.end);
      }
    }
  }, [tempEndDate]);

  // 处理结束日期变化
  const handleEndDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const newEnd = parseInputDate(e.target.value);
      setTempEndDate(newEnd);
      
      // 验证并调整日期范围
      const validated = validateDateRange(tempStartDate, newEnd);
      if (validated.start.getTime() !== tempStartDate.getTime()) {
        setTempStartDate(validated.start);
      }
    }
  }, [tempStartDate]);

  // 确认日期选择
  const handleConfirm = useCallback(() => {
    const validated = validateDateRange(tempStartDate, tempEndDate);
    onDateRangeChange(validated.start, validated.end);
    userTriggeredCloseRef.current = true;
    onOpenChange(false);
  }, [tempStartDate, tempEndDate, onDateRangeChange, onOpenChange]);

  // 取消日期选择
  const handleCancel = useCallback(() => {
    setTempStartDate(startDate); // 恢复原始日期
    setTempEndDate(endDate);
    userTriggeredCloseRef.current = true;
    onOpenChange(false);
  }, [startDate, endDate, onOpenChange]);

  // 键盘事件处理
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        handleConfirm();
        break;
      case 'Escape':
        e.preventDefault();
        userTriggeredCloseRef.current = true;
        handleCancel();
        break;
      case 'Tab':
        // Tab键在开始和结束日期输入框之间切换
        if (e.target === startDateInputRef.current && !e.shiftKey) {
          e.preventDefault();
          endDateInputRef.current?.focus();
        } else if (e.target === endDateInputRef.current && e.shiftKey) {
          e.preventDefault();
          startDateInputRef.current?.focus();
        }
        break;
    }
  }, [handleConfirm, handleCancel]);

  // 计算持续天数
  const calculateDuration = (): number => {
    return Math.ceil((tempEndDate.getTime() - tempStartDate.getTime()) / (24 * 60 * 60 * 1000));
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

  // 包装onOpenChange以阻止不当关闭
  const handleOpenChange = useCallback((open: boolean) => {
    // 🔧 修复：阻止Radix UI在用户与日期输入框交互时自动关闭
    // 只有当用户明确要求关闭时（通过确认/取消按钮）才真正关闭
    if (!open && isOpen && !userTriggeredCloseRef.current) {
      return; // 阻止自动关闭
    }
    
    // 重置标志
    if (!open) {
      userTriggeredCloseRef.current = false;
    }
    
    onOpenChange(open);
  }, [isOpen, onOpenChange]);

  return (
    <Popover.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Popover.Portal>
        <Popover.Content 
          className={`task-date-range-picker-content ${className}`}
          side="bottom"
          align="center"
          sideOffset={8}
          style={getContentStyle()}
          onKeyDown={handleKeyDown}
        >
          <div className="task-date-range-picker-header">
            <Calendar size={16} />
            <h3>编辑任务日期范围</h3>
            <button
              className="task-date-range-picker-close"
              onClick={handleCancel}
              aria-label="关闭日历"
            >
              <X size={14} />
            </button>
          </div>

          <div className="task-date-range-picker-body">
            {/* 日期输入表单 */}
            <div className="date-range-form">
              {/* 日期标签行 */}
              <div className="date-labels-row">
                <label htmlFor="task-start-date" className="date-input-label">
                  开始日期
                </label>
                <span className="label-separator"></span>
                <label htmlFor="task-end-date" className="date-input-label">
                  结束日期
                </label>
              </div>
              
              {/* 日期输入行 */}
              <div className="date-inputs-row">
                <input
                  ref={startDateInputRef}
                  id="task-start-date"
                  type="date"
                  value={formatDateForInput(tempStartDate)}
                  onChange={handleStartDateChange}
                  className="task-date-input"
                  placeholder="选择开始日期"
                />
                
                <div className="date-range-separator">
                  <span>至</span>
                </div>
                
                <input
                  ref={endDateInputRef}
                  id="task-end-date"
                  type="date"
                  value={formatDateForInput(tempEndDate)}
                  onChange={handleEndDateChange}
                  className="task-date-input"
                  placeholder="选择结束日期"
                />
              </div>
            </div>

            {/* 日期范围信息 */}
            <div className="date-range-info">
              <p className="date-range-duration">
                持续时间：{calculateDuration()} 天
              </p>
            </div>

            {/* 操作按钮 */}
            <div className="date-range-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={handleCancel}
              >
                取消
              </button>
              <button
                type="button"
                className="btn-confirm"
                onClick={handleConfirm}
              >
                确认
              </button>
            </div>
          </div>

          <Popover.Arrow className="task-date-range-picker-arrow" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

export default TaskDateRangePicker;