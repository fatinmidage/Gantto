import { useRef, useCallback } from 'react';

// 节流Hook - 用于优化高频事件处理（如鼠标移动）
export const useThrottle = <T extends (...args: any[]) => void>(
  callback: T,
  _delay: number = 16 // 默认60fps，使用requestAnimationFrame代替
): T => {
  const requestRef = useRef<number>();
  
  const throttledCallback = useCallback((...args: Parameters<T>) => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    
    requestRef.current = requestAnimationFrame(() => {
      callback(...args);
    });
  }, [callback]) as T;
  
  return throttledCallback;
};

// 专门用于鼠标移动事件的节流Hook
export const useThrottledMouseMove = <T extends (event: MouseEvent) => void>(
  callback: T,
  dependencies: any[] = []
): T => {
  const requestRef = useRef<number>();
  
  const throttledCallback = useCallback((event: MouseEvent) => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    
    requestRef.current = requestAnimationFrame(() => {
      callback(event);
    });
  }, dependencies) as T;
  
  return throttledCallback;
};