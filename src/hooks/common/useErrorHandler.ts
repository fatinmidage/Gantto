/**
 * 错误处理 Hook
 * 提供统一的错误处理机制，包括错误记录、用户通知和恢复策略
 */

import { useState, useCallback } from 'react';

export interface ErrorInfo {
  message: string;
  stack?: string;
  timestamp: Date;
  userAgent?: string;
  url?: string;
  userId?: string;
  context?: Record<string, unknown>;
}

export interface ErrorHandlerConfig {
  enableLogging?: boolean;
  enableUserNotification?: boolean;
  enableAutoRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  onError?: (error: ErrorInfo) => void;
}

export interface ErrorHandlerResult {
  errors: ErrorInfo[];
  lastError: ErrorInfo | null;
  hasErrors: boolean;
  handleError: (error: Error | string, context?: Record<string, unknown>) => void;
  clearErrors: () => void;
  clearLastError: () => void;
  retryLastAction: () => void;
  executeWithErrorHandling: <T>(
    action: () => Promise<T> | T, 
    context?: Record<string, unknown>
  ) => Promise<T | null>;
}

const defaultConfig: ErrorHandlerConfig = {
  enableLogging: true,
  enableUserNotification: true,
  enableAutoRetry: false,
  maxRetries: 3,
  retryDelay: 1000
};

export const useErrorHandler = (config: ErrorHandlerConfig = {}): ErrorHandlerResult => {
  const mergedConfig = { ...defaultConfig, ...config };
  const [errors, setErrors] = useState<ErrorInfo[]>([]);
  const [lastError, setLastError] = useState<ErrorInfo | null>(null);
  const [lastAction, setLastAction] = useState<(() => Promise<unknown> | unknown) | null>(null);

  const createErrorInfo = useCallback((
    error: Error | string, 
    context?: Record<string, unknown>
  ): ErrorInfo => {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = typeof error === 'string' ? undefined : error.stack;

    return {
      message: errorMessage,
      stack: errorStack,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      context
    };
  }, []);

  const logError = useCallback((errorInfo: ErrorInfo) => {
    if (mergedConfig.enableLogging) {
      console.error('Error Handler:', {
        message: errorInfo.message,
        stack: errorInfo.stack,
        timestamp: errorInfo.timestamp,
        context: errorInfo.context
      });
    }
  }, [mergedConfig.enableLogging]);

  const notifyUser = useCallback((_errorInfo: ErrorInfo) => {
    if (mergedConfig.enableUserNotification) {
      // 这里可以集成 toast 通知系统
      // 用户通知逻辑待实现
    }
  }, [mergedConfig.enableUserNotification]);

  const handleError = useCallback((
    error: Error | string, 
    context?: Record<string, unknown>
  ) => {
    const errorInfo = createErrorInfo(error, context);
    
    // 记录错误
    logError(errorInfo);
    
    // 通知用户
    notifyUser(errorInfo);
    
    // 更新状态
    setErrors(prev => [...prev, errorInfo]);
    setLastError(errorInfo);
    
    // 调用自定义错误处理函数
    if (mergedConfig.onError) {
      mergedConfig.onError(errorInfo);
    }
  }, [createErrorInfo, logError, notifyUser, mergedConfig.onError]);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const clearLastError = useCallback(() => {
    setLastError(null);
  }, []);

  const retryLastAction = useCallback(async () => {
    if (lastAction) {
      try {
        await lastAction();
        clearLastError();
      } catch (error) {
        handleError(error as Error, { retryAttempt: true });
      }
    }
  }, [lastAction, clearLastError, handleError]);

  const executeWithErrorHandling = useCallback(async <T>(
    action: () => Promise<T> | T,
    context?: Record<string, unknown>
  ): Promise<T | null> => {
    let retries = 0;
    
    const executeAction = async (): Promise<T | null> => {
      try {
        setLastAction(() => action);
        const result = await action();
        return result;
      } catch (error) {
        const errorWithContext = {
          ...context,
          retryAttempt: retries,
          maxRetries: mergedConfig.maxRetries
        };
        
        handleError(error as Error, errorWithContext);
        
        // 自动重试逻辑
        if (mergedConfig.enableAutoRetry && retries < (mergedConfig.maxRetries || 3)) {
          retries++;
          
          // 延迟重试
          if (mergedConfig.retryDelay) {
            await new Promise(resolve => setTimeout(resolve, mergedConfig.retryDelay));
          }
          
          return executeAction();
        }
        
        return null;
      }
    };
    
    return executeAction();
  }, [handleError, mergedConfig.enableAutoRetry, mergedConfig.maxRetries, mergedConfig.retryDelay]);

  return {
    errors,
    lastError,
    hasErrors: errors.length > 0,
    handleError,
    clearErrors,
    clearLastError,
    retryLastAction,
    executeWithErrorHandling
  };
};

// 全局错误处理实例
let globalErrorHandler: ErrorHandlerResult | null = null;

export const useGlobalErrorHandler = (): ErrorHandlerResult => {
  const errorHandler = useErrorHandler({
    enableLogging: true,
    enableUserNotification: true,
    onError: (_errorInfo) => {
      // 可以在这里添加全局错误报告逻辑
      // 比如发送到错误监控服务
      if (import.meta.env.PROD) {
        // 生产环境可以集成 Sentry 等错误监控
        // 错误上报逻辑待实现
      }
    }
  });

  if (!globalErrorHandler) {
    globalErrorHandler = errorHandler;
  }

  return errorHandler;
};

export default useErrorHandler;