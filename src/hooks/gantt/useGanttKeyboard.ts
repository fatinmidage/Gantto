import { useCallback, useEffect } from 'react';

interface UseGanttKeyboardProps {
  selectedTaskId?: string;
  selectedTitleTaskId?: string;
  onTaskDelete: (taskId: string) => void;
  onTaskDuplicate?: (taskId: string) => void;
  onTaskCreate?: () => void;
  onTaskEdit?: (taskId: string) => void;
  onTaskMove?: (taskId: string, direction: 'up' | 'down') => void;
  onTaskSelect?: (taskId: string) => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onSave?: () => void;
  enabled?: boolean;
}

export const useGanttKeyboard = ({
  selectedTaskId,
  selectedTitleTaskId,
  onTaskDelete,
  onTaskDuplicate,
  onTaskCreate,
  onTaskEdit,
  onTaskMove,
  onTaskSelect,
  onZoomIn,
  onZoomOut,
  onUndo,
  onRedo,
  onSave,
  enabled = true
}: UseGanttKeyboardProps) => {
  
  // 键盘快捷键处理
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // 如果不启用键盘快捷键，直接返回
    if (!enabled) return;
    
    // 检查是否在输入框中，如果是则忽略快捷键
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }
    
    const { key, ctrlKey, metaKey, shiftKey } = event;
    const isCtrlOrCmd = ctrlKey || metaKey;
    const currentSelectedId = selectedTaskId || selectedTitleTaskId;
    
    // 阻止默认行为的快捷键
    const shouldPreventDefault = () => {
      if (isCtrlOrCmd && (key === 's' || key === 'z' || key === 'y')) return true;
      if (key === 'Delete' || key === 'Backspace') return true;
      if (key === 'Enter' || key === 'F2') return true;
      if (key === 'n' && isCtrlOrCmd) return true;
      if (key === 'd' && isCtrlOrCmd) return true;
      if (key === 'ArrowUp' || key === 'ArrowDown') return true;
      if (key === '+' || key === '-') return true;
      return false;
    };
    
    if (shouldPreventDefault()) {
      event.preventDefault();
    }
    
    // 处理不同的快捷键
    switch (key) {
      case 'Delete':
      case 'Backspace':
        // 删除选中的任务
        if (currentSelectedId) {
          onTaskDelete(currentSelectedId);
        }
        break;
        
      case 'Enter':
        // 编辑选中的任务
        if (currentSelectedId && onTaskEdit) {
          onTaskEdit(currentSelectedId);
        }
        break;
        
      case 'F2':
        // 重命名选中的任务
        if (currentSelectedId && onTaskEdit) {
          onTaskEdit(currentSelectedId);
        }
        break;
        
      case 'n':
        // Ctrl+N 创建新任务
        if (isCtrlOrCmd && onTaskCreate) {
          onTaskCreate();
        }
        break;
        
      case 'd':
        // Ctrl+D 复制任务
        if (isCtrlOrCmd && currentSelectedId && onTaskDuplicate) {
          onTaskDuplicate(currentSelectedId);
        }
        break;
        
      case 'ArrowUp':
        // 上移任务或选择上一个任务
        if (currentSelectedId) {
          if (shiftKey && onTaskMove) {
            onTaskMove(currentSelectedId, 'up');
          } else if (onTaskSelect) {
            // TODO: 实现选择上一个任务的逻辑
          }
        }
        break;
        
      case 'ArrowDown':
        // 下移任务或选择下一个任务
        if (currentSelectedId) {
          if (shiftKey && onTaskMove) {
            onTaskMove(currentSelectedId, 'down');
          } else if (onTaskSelect) {
            // TODO: 实现选择下一个任务的逻辑
          }
        }
        break;
        
      case '+':
        // 放大视图
        if (onZoomIn) {
          onZoomIn();
        }
        break;
        
      case '-':
        // 缩小视图
        if (onZoomOut) {
          onZoomOut();
        }
        break;
        
      case 's':
        // Ctrl+S 保存
        if (isCtrlOrCmd && onSave) {
          onSave();
        }
        break;
        
      case 'z':
        // Ctrl+Z 撤销
        if (isCtrlOrCmd && !shiftKey && onUndo) {
          onUndo();
        }
        break;
        
      case 'y':
        // Ctrl+Y 重做
        if (isCtrlOrCmd && onRedo) {
          onRedo();
        }
        break;
        
      case 'Z':
        // Ctrl+Shift+Z 重做 (Mac风格)
        if (isCtrlOrCmd && shiftKey && onRedo) {
          onRedo();
        }
        break;
        
      case 'Escape':
        // 取消选择
        if (currentSelectedId && onTaskSelect) {
          onTaskSelect('');
        }
        break;
    }
  }, [
    enabled,
    selectedTaskId,
    selectedTitleTaskId,
    onTaskDelete,
    onTaskDuplicate,
    onTaskCreate,
    onTaskEdit,
    onTaskMove,
    onTaskSelect,
    onZoomIn,
    onZoomOut,
    onUndo,
    onRedo,
    onSave
  ]);
  
  // 添加键盘事件监听器
  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [enabled, handleKeyDown]);
  
  // 返回键盘快捷键信息，用于显示帮助
  const keyboardShortcuts = [
    { key: 'Delete/Backspace', description: '删除选中任务' },
    { key: 'Enter/F2', description: '编辑选中任务' },
    { key: 'Ctrl+N', description: '创建新任务' },
    { key: 'Ctrl+D', description: '复制任务' },
    { key: 'Shift+↑/↓', description: '上移/下移任务' },
    { key: '+/-', description: '放大/缩小视图' },
    { key: 'Ctrl+S', description: '保存项目' },
    { key: 'Ctrl+Z', description: '撤销' },
    { key: 'Ctrl+Y', description: '重做' },
    { key: 'Esc', description: '取消选择' }
  ];
  
  return {
    keyboardShortcuts,
    handleKeyDown
  };
};