/**
 * 鼠标移动事件节流 Hook
 * 使用 requestAnimationFrame 优化拖拽性能
 */

import { useRef, useCallback, useEffect } from 'react';

/**
 * 节流鼠标移动事件 Hook
 * @param callback 鼠标移动事件回调函数
 * @param deps 依赖项数组
 * @returns 节流后的回调函数
 */
export const useThrottledMouseMove = (
  callback: (event: MouseEvent) => void,
  deps: React.DependencyList
) => {
  const requestRef = useRef<number>();
  
  const throttledCallback = useCallback((event: MouseEvent) => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    requestRef.current = requestAnimationFrame(() => {
      callback(event);
    });
  }, deps);

  useEffect(() => {
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  return throttledCallback;
};