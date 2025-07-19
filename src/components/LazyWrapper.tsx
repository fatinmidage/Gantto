/**
 * Lazy Loading 包装组件
 * 为动态导入的组件提供加载状态和错误处理
 */

import React, { Suspense, ComponentType } from 'react';
import { ErrorBoundary } from './index';

interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
}

// 默认加载组件
const DefaultLoadingFallback: React.FC = () => (
  <div className="lazy-loading-container" style={styles.container}>
    <div className="lazy-loading-spinner" style={styles.spinner}>
      <div style={styles.spinnerCircle}></div>
    </div>
    <p style={styles.loadingText}>加载中...</p>
  </div>
);

// 默认错误组件
const DefaultErrorFallback: React.FC = () => (
  <div className="lazy-error-container" style={styles.errorContainer}>
    <div style={styles.errorIcon}>⚠️</div>
    <p style={styles.errorText}>组件加载失败</p>
    <button 
      onClick={() => window.location.reload()}
      style={styles.retryButton}
    >
      重新加载
    </button>
  </div>
);

/**
 * Lazy Wrapper 组件
 * 包装 Suspense 和 ErrorBoundary，提供统一的加载和错误处理
 */
export const LazyWrapper: React.FC<LazyWrapperProps> = ({
  children,
  fallback = <DefaultLoadingFallback />,
  errorFallback = <DefaultErrorFallback />
}) => {
  return (
    <ErrorBoundary fallback={errorFallback}>
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
};

/**
 * 创建 Lazy 组件的高阶函数
 * @param importFunction 动态导入函数
 * @param options 配置选项
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFunction: () => Promise<{ default: T }>,
  options: {
    fallback?: React.ReactNode;
    errorFallback?: React.ReactNode;
    displayName?: string;
  } = {}
): React.FC<React.ComponentProps<T>> {
  // 创建 lazy 组件
  const LazyComponent = React.lazy(importFunction);
  
  // 注意：React.lazy 组件不支持直接设置 displayName

  // 返回包装后的组件
  const WrappedComponent: React.FC<React.ComponentProps<T>> = (props) => {
    return (
      <LazyWrapper 
        fallback={options.fallback}
        errorFallback={options.errorFallback}
      >
        <LazyComponent {...props} />
      </LazyWrapper>
    );
  };

  // 设置包装组件的 displayName
  WrappedComponent.displayName = `LazyWrapper(${options.displayName || 'Component'})`;

  return WrappedComponent;
}

/**
 * 预加载函数
 * 用于预先加载 lazy 组件，避免在需要时才加载
 */
export function preloadLazyComponent(
  importFunction: () => Promise<{ default: ComponentType<any> }>
): void {
  // 在空闲时预加载
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      importFunction().catch(console.error);
    });
  } else {
    // fallback 到 setTimeout
    setTimeout(() => {
      importFunction().catch(console.error);
    }, 100);
  }
}

// 样式定义
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    minHeight: '200px'
  },
  spinner: {
    position: 'relative' as const,
    width: '40px',
    height: '40px',
    marginBottom: '16px'
  },
  spinnerCircle: {
    width: '100%',
    height: '100%',
    border: '3px solid #f3f3f3',
    borderTop: '3px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  loadingText: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0'
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    minHeight: '200px',
    textAlign: 'center' as const
  },
  errorIcon: {
    fontSize: '32px',
    marginBottom: '16px'
  },
  errorText: {
    fontSize: '14px',
    color: '#ef4444',
    marginBottom: '16px'
  },
  retryButton: {
    padding: '8px 16px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  }
};

// 添加 CSS 动画（如果还没有的话）
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  if (!document.head.querySelector('style[data-lazy-spinner]')) {
    style.setAttribute('data-lazy-spinner', 'true');
    document.head.appendChild(style);
  }
}

export default LazyWrapper;