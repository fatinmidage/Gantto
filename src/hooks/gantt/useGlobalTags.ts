import { useState, useCallback } from 'react';

/**
 * 全局标签状态管理 Hook
 * 统一管理甘特图中的所有标签数据，避免重复定义
 */
export const useGlobalTags = () => {
  // 统一的标签列表 - 合并所有现有标签并去重
  const [availableTags, setAvailableTags] = useState<string[]>([
    '重要', '紧急', '测试', '开发', '设计', '评审', '部署', '文档'
  ]);

  // 添加新标签
  const addTag = useCallback((tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !availableTags.includes(trimmedTag)) {
      setAvailableTags(prev => [...prev, trimmedTag]);
    }
  }, [availableTags]);

  // 删除标签
  const removeTag = useCallback((tag: string) => {
    setAvailableTags(prev => prev.filter(t => t !== tag));
  }, []);

  // 批量更新标签
  const updateTags = useCallback((newTags: string[]) => {
    setAvailableTags(newTags);
  }, []);

  // 重置为默认标签
  const resetToDefault = useCallback(() => {
    setAvailableTags(['重要', '紧急', '测试', '开发', '设计', '评审', '部署', '文档']);
  }, []);

  return {
    availableTags,
    setAvailableTags,
    addTag,
    removeTag,
    updateTags,
    resetToDefault
  };
};