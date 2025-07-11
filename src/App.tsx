import React, { useState } from 'react';
import GanttChart from './components/GanttChart';
import Header from './components/Header';
import './App.css';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const handleNewProject = () => {
    console.log('新建项目');
    // TODO: 实现新建项目功能
  };

  const handleOpenProject = () => {
    console.log('打开项目');
    // TODO: 实现打开项目功能
  };

  const handleSaveProject = () => {
    console.log('保存项目');
    // TODO: 实现保存项目功能
  };

  const handleToggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className={`app ${isDarkMode ? 'dark-theme' : 'light-theme'}`}>
      <Header
        onNewProject={handleNewProject}
        onOpenProject={handleOpenProject}
        onSaveProject={handleSaveProject}
        onToggleTheme={handleToggleTheme}
        isDarkMode={isDarkMode}
      />
      <main className="app-main">
        <GanttChart />
      </main>
    </div>
  );
}

export default App;
