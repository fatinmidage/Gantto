import { describe, it, expect } from 'vitest';
import { useGlobalTags } from '../useGlobalTags';
import { renderHook, act } from '@testing-library/react';

describe('useGlobalTags', () => {
  it('should initialize with default tags', () => {
    const { result } = renderHook(() => useGlobalTags());
    
    expect(result.current.availableTags).toEqual([
      '重要', '紧急', '测试', '开发', '设计', '评审', '部署', '文档'
    ]);
  });

  it('should add new tag', () => {
    const { result } = renderHook(() => useGlobalTags());
    
    act(() => {
      result.current.addTag('新功能');
    });
    
    expect(result.current.availableTags).toContain('新功能');
    expect(result.current.availableTags).toHaveLength(9);
  });

  it('should not add duplicate tags', () => {
    const { result } = renderHook(() => useGlobalTags());
    
    act(() => {
      result.current.addTag('重要');
    });
    
    expect(result.current.availableTags).toHaveLength(8);
  });

  it('should remove tag', () => {
    const { result } = renderHook(() => useGlobalTags());
    
    act(() => {
      result.current.removeTag('测试');
    });
    
    expect(result.current.availableTags).not.toContain('测试');
    expect(result.current.availableTags).toHaveLength(7);
  });

  it('should update tags', () => {
    const { result } = renderHook(() => useGlobalTags());
    
    act(() => {
      result.current.updateTags(['标签1', '标签2', '标签3']);
    });
    
    expect(result.current.availableTags).toEqual(['标签1', '标签2', '标签3']);
  });

  it('should reset to default tags', () => {
    const { result } = renderHook(() => useGlobalTags());
    
    act(() => {
      result.current.updateTags(['自定义标签']);
      result.current.resetToDefault();
    });
    
    expect(result.current.availableTags).toEqual([
      '重要', '紧急', '测试', '开发', '设计', '评审', '部署', '文档'
    ]);
  });
});