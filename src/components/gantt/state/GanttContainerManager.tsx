import { useRef, useState, useEffect } from 'react';

/**
 * 甘特图容器管理Hook
 * 负责容器尺寸监听和管理
 */
export const useGanttContainerManager = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  useEffect(() => {
    const updateContainerWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        setContainerWidth(width);
      }
    };
    
    // 初始化宽度
    updateContainerWidth();
    
    // 监听窗口大小变化
    const handleResize = () => {
      updateContainerWidth();
    };
    
    window.addEventListener('resize', handleResize);
    
    // 使用 ResizeObserver 监听容器大小变化（如果支持）
    let resizeObserver: ResizeObserver | null = null;
    if (window.ResizeObserver && containerRef.current) {
      resizeObserver = new ResizeObserver(updateContainerWidth);
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  return {
    containerRef,
    containerWidth
  };
};