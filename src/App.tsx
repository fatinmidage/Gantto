import { Header, ErrorBoundary } from './components';
import { LazyGanttChart, preloadGanttChart } from './components/GanttChartLazy';
import { useGlobalErrorHandler } from './hooks';
import { useEffect } from 'react';
import './styles/index.css';

function App() {
  const { handleError } = useGlobalErrorHandler();

  // 预加载甘特图组件
  useEffect(() => {
    preloadGanttChart();
  }, []);

  const handleNewProject = () => {
    // 新建项目功能待实现
  };

  const handleOpenProject = () => {
    // 打开项目功能待实现
  };

  const handleSaveProject = () => {
    // 保存项目功能待实现
  };

  const handleAppError = (error: Error, errorInfo: React.ErrorInfo) => {
    handleError(error, {
      component: 'App',
      errorInfo: errorInfo.componentStack
    });
  };

  return (
    <ErrorBoundary onError={handleAppError}>
      <div className="app">
        <ErrorBoundary onError={handleAppError}>
          <Header
            onNewProject={handleNewProject}
            onOpenProject={handleOpenProject}
            onSaveProject={handleSaveProject}
          />
        </ErrorBoundary>
        <main className="app-main">
          <ErrorBoundary onError={handleAppError}>
            <LazyGanttChart />
          </ErrorBoundary>
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default App;
