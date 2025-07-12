import React from 'react';
import { 
  FileText, 
  FolderOpen, 
  Save, 
  Settings, 
  Moon, 
  Sun,
  BarChart3
} from 'lucide-react';

interface HeaderProps {
  onNewProject?: () => void;
  onOpenProject?: () => void;
  onSaveProject?: () => void;
  onToggleTheme?: () => void;
  isDarkMode?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  onNewProject,
  onOpenProject,
  onSaveProject,
  onToggleTheme,
  isDarkMode = false
}) => {
  return (
    <header className="app-header">
      <div className="header-left">
        <div className="app-logo">
          <BarChart3 size={32} className="logo-icon" />
          <h1 className="app-title">Gantto</h1>
        </div>
        <p className="app-subtitle">现代化甘特图项目管理工具</p>
      </div>
      
      <div className="header-actions">
        <div className="action-group">
          <button 
            className="action-btn primary" 
            onClick={onNewProject}
            title="新建项目"
          >
            <FileText size={18} />
            <span>新建</span>
          </button>
          <button 
            className="action-btn" 
            onClick={onOpenProject}
            title="打开项目"
          >
            <FolderOpen size={18} />
            <span>打开</span>
          </button>
          <button 
            className="action-btn" 
            onClick={onSaveProject}
            title="保存项目"
          >
            <Save size={18} />
            <span>保存</span>
          </button>
        </div>
        
        <div className="action-group">
          <button 
            className="action-btn icon-only" 
            onClick={onToggleTheme}
            title={isDarkMode ? "切换到亮色模式" : "切换到暗色模式"}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button 
            className="action-btn icon-only" 
            title="设置"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header; 