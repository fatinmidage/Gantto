/**
 * React 错误边界组件
 * 捕获和处理组件渲染过程中的错误，提供优雅的错误处理
 */

import React, { Component, ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showErrorDetails?: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // 调用自定义错误处理函数
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // 开发环境下打印详细错误信息
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error);
      console.error('Error info:', errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义 fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 默认错误界面
      return (
        <div className="error-boundary-container" style={styles.container}>
          <div className="error-boundary-content" style={styles.content}>
            <div style={styles.icon}>⚠️</div>
            <h2 style={styles.title}>应用程序出现错误</h2>
            <p style={styles.message}>
              很抱歉，应用程序遇到了一个意外错误。请尝试刷新页面或联系支持团队。
            </p>
            
            <div style={styles.actions}>
              <button 
                onClick={this.handleRetry}
                style={styles.retryButton}
              >
                重试
              </button>
              <button 
                onClick={() => window.location.reload()}
                style={styles.refreshButton}
              >
                刷新页面
              </button>
            </div>

            {/* 开发环境或显式要求时显示错误详情 */}
            {(import.meta.env.DEV || this.props.showErrorDetails) && this.state.error && (
              <details style={styles.details}>
                <summary style={styles.summary}>错误详情</summary>
                <div style={styles.errorDetails}>
                  <p><strong>错误消息:</strong> {this.state.error.message}</p>
                  <p><strong>错误堆栈:</strong></p>
                  <pre style={styles.stack}>{this.state.error.stack}</pre>
                  {this.state.errorInfo && (
                    <>
                      <p><strong>组件堆栈:</strong></p>
                      <pre style={styles.stack}>{this.state.errorInfo.componentStack}</pre>
                    </>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 样式定义
const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    padding: '20px',
    backgroundColor: '#f9f9f9',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  content: {
    textAlign: 'center' as const,
    maxWidth: '600px',
    padding: '40px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
  },
  icon: {
    fontSize: '48px',
    marginBottom: '16px'
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: '16px'
  },
  message: {
    fontSize: '16px',
    color: '#6b7280',
    lineHeight: '1.5',
    marginBottom: '24px'
  },
  actions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    marginBottom: '24px'
  },
  retryButton: {
    padding: '8px 16px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  refreshButton: {
    padding: '8px 16px',
    backgroundColor: '#6b7280',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  details: {
    textAlign: 'left' as const,
    marginTop: '24px',
    padding: '16px',
    backgroundColor: '#f3f4f6',
    borderRadius: '4px'
  },
  summary: {
    cursor: 'pointer',
    fontWeight: 'bold',
    marginBottom: '8px'
  },
  errorDetails: {
    fontSize: '14px',
    color: '#374151'
  },
  stack: {
    fontSize: '12px',
    backgroundColor: '#1f2937',
    color: '#f9fafb',
    padding: '12px',
    borderRadius: '4px',
    overflow: 'auto',
    whiteSpace: 'pre-wrap' as const
  }
};

export default ErrorBoundary;