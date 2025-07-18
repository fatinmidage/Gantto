/**
 * 标题列宽度调整 Hook
 * 处理标题列的拖拽调整宽度功能
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { LAYOUT_CONSTANTS } from '../ganttStyles';

interface UseTitleColumnResizeProps {
  initialWidth: number;
  onWidthChange?: (width: number) => void;
}

export const useTitleColumnResize = ({
  initialWidth,
  onWidthChange
}: UseTitleColumnResizeProps) => {
  const [isResizing, setIsResizing] = useState(false);
  const [currentWidth, setCurrentWidth] = useState(initialWidth);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  // 同步外部宽度变化
  useEffect(() => {
    setCurrentWidth(initialWidth);
  }, [initialWidth]);

  // 开始拖拽调整宽度
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = currentWidth;
  }, [currentWidth]);

  // 拖拽调整宽度
  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    const deltaX = e.clientX - startXRef.current;
    const newWidth = Math.max(
      LAYOUT_CONSTANTS.MIN_TITLE_COLUMN_WIDTH, 
      Math.min(400, startWidthRef.current + deltaX)
    );
    
    setCurrentWidth(newWidth);
    onWidthChange?.(newWidth);
  }, [isResizing, onWidthChange]);

  // 结束拖拽
  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
  }, []);

  // 添加全局事件监听器
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  // 宽度调整手柄样式
  const resizeHandleStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    right: -4,
    width: '4px',
    height: '100%',
    backgroundColor: isResizing ? '#2196F3' : 'transparent',
    cursor: 'col-resize',
    zIndex: 100,
    borderRadius: '0 4px 4px 0',
    transition: 'all 0.2s ease',
    border: 'none'
  };

  return {
    currentWidth,
    isResizing,
    handleResizeStart,
    resizeHandleStyle
  };
};