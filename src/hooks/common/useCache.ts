import { useCallback, startTransition } from 'react';

// 批量更新Hook - 用于优化React状态更新性能
export const useBatchedUpdates = () => {
  return useCallback((fn: () => void) => {
    startTransition(() => {
      fn();
    });
  }, []);
};

// 通用缓存Hook - 可用于缓存计算结果或其他数据
export const useCache = <T>() => {
  const cache = new Map<string, T>();
  
  const get = useCallback((key: string): T | undefined => {
    return cache.get(key);
  }, []);
  
  const set = useCallback((key: string, value: T): void => {
    cache.set(key, value);
  }, []);
  
  const has = useCallback((key: string): boolean => {
    return cache.has(key);
  }, []);
  
  const clear = useCallback((): void => {
    cache.clear();
  }, []);
  
  const remove = useCallback((key: string): boolean => {
    return cache.delete(key);
  }, []);
  
  return {
    get,
    set,
    has,
    clear,
    remove,
    size: cache.size
  };
};