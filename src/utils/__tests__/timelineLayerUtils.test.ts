/**
 * 时间轴分层工具函数测试
 * 专门测试月份分隔线位置准确性
 */

import { 
  generateLayeredTimeScales, 
  TimelineLayerConfig, 
  DateRange 
} from '../timelineLayerUtils';

// 模拟dateToPixel函数，基于固定容器宽度计算
const createMockDateToPixel = (startDate: Date, endDate: Date, containerWidth: number) => {
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
  const pixelPerDay = containerWidth / totalDays;
  
  return (date: Date): number => {
    // 标准化到UTC午夜
    const normalizedDate = new Date(Date.UTC(
      date.getFullYear(), 
      date.getMonth(), 
      date.getDate()
    ));
    const normalizedStartDate = new Date(Date.UTC(
      startDate.getFullYear(), 
      startDate.getMonth(), 
      startDate.getDate()
    ));
    
    const daysDiff = (normalizedDate.getTime() - normalizedStartDate.getTime()) / (24 * 60 * 60 * 1000);
    return daysDiff * pixelPerDay;
  };
};

describe('月份分隔线位置准确性测试', () => {
  // 测试场景：2025年6月23日 - 2025年8月20日（覆盖你截图中的时间范围）
  const startDate = new Date(2025, 5, 23); // 6月23日
  const endDate = new Date(2025, 7, 20);   // 8月20日
  const containerWidth = 1200; // 固定容器宽度
  
  const dateRange: DateRange = { startDate, endDate };
  const config: TimelineLayerConfig = {
    layers: 2,
    bottom: 'day',
    middle: 'month'
  };
  
  const mockDateToPixel = createMockDateToPixel(startDate, endDate, containerWidth);
  
  test('月份分隔线应该精确对齐到月份边界', () => {
    const layeredTimeScales = generateLayeredTimeScales(config, dateRange, mockDateToPixel);
    
    // 获取月份层（middle层）
    const monthLayer = layeredTimeScales.layers.find(layer => layer.type === 'month');
    expect(monthLayer).toBeDefined();
    
    if (monthLayer) {
      // 验证7月份的月份项
      const julyItem = monthLayer.items.find(item => 
        item.startDate.getMonth() === 6 && item.startDate.getFullYear() === 2025
      );
      
      expect(julyItem).toBeDefined();
      
      if (julyItem) {
        // 7月1日的期望像素位置
        const july1st = new Date(2025, 6, 1);
        const expectedJuly1stPixel = Math.round(mockDateToPixel(july1st));
        
        // 8月1日的期望像素位置
        const august1st = new Date(2025, 7, 1);
        const expectedAugust1stPixel = Math.round(mockDateToPixel(august1st));
        
        console.log('7月份分隔线位置验证:', {
          julyItem: {
            label: julyItem.label,
            startDate: julyItem.startDate.toLocaleDateString(),
            endDate: julyItem.endDate.toLocaleDateString(),
            x: julyItem.x,
            width: julyItem.width,
            endX: julyItem.x + julyItem.width
          },
          expected: {
            july1stPixel: expectedJuly1stPixel,
            august1stPixel: expectedAugust1stPixel,
            expectedWidth: expectedAugust1stPixel - expectedJuly1stPixel
          },
          accuracy: {
            startDiff: Math.abs(julyItem.x - expectedJuly1stPixel),
            endDiff: Math.abs((julyItem.x + julyItem.width) - expectedAugust1stPixel)
          }
        });
        
        // 验证7月份的左边分隔线（应该在7月1日的位置）
        expect(Math.abs(julyItem.x - expectedJuly1stPixel)).toBeLessThanOrEqual(1);
        
        // 验证7月份的右边分隔线（应该在8月1日的位置）
        expect(Math.abs((julyItem.x + julyItem.width) - expectedAugust1stPixel)).toBeLessThanOrEqual(1);
        
        // 验证月份宽度计算的准确性
        const expectedWidth = expectedAugust1stPixel - expectedJuly1stPixel;
        expect(Math.abs(julyItem.width - expectedWidth)).toBeLessThanOrEqual(1);
      }
    }
  });
  
  test('所有月份分隔线都应该对齐到日期边界', () => {
    const layeredTimeScales = generateLayeredTimeScales(config, dateRange, mockDateToPixel);
    
    const monthLayer = layeredTimeScales.layers.find(layer => layer.type === 'month');
    expect(monthLayer).toBeDefined();
    
    if (monthLayer) {
      monthLayer.items.forEach((monthItem, index) => {
        // 验证每个月份项的开始位置都对齐到月份的第一天
        const expectedStartPixel = Math.round(mockDateToPixel(monthItem.startDate));
        expect(Math.abs(monthItem.x - expectedStartPixel)).toBeLessThanOrEqual(1);
        
        // 验证每个月份项的结束位置都对齐到下个月的第一天  
        const expectedEndPixel = Math.round(mockDateToPixel(monthItem.endDate));
        expect(Math.abs((monthItem.x + monthItem.width) - expectedEndPixel)).toBeLessThanOrEqual(1);
        
        console.log(`月份${monthItem.label}对齐验证:`, {
          startDate: monthItem.startDate.toLocaleDateString(),
          endDate: monthItem.endDate.toLocaleDateString(),
          actualX: monthItem.x,
          expectedX: expectedStartPixel,
          actualEndX: monthItem.x + monthItem.width,
          expectedEndX: expectedEndPixel,
          startDiff: Math.abs(monthItem.x - expectedStartPixel),
          endDiff: Math.abs((monthItem.x + monthItem.width) - expectedEndPixel)
        });
      });
    }
  });
  
  test('月份分隔线位置应该有亚像素级精度', () => {
    const layeredTimeScales = generateLayeredTimeScales(config, dateRange, mockDateToPixel);
    
    const monthLayer = layeredTimeScales.layers.find(layer => layer.type === 'month');
    expect(monthLayer).toBeDefined();
    
    if (monthLayer) {
      monthLayer.items.forEach(monthItem => {
        // 所有月份分隔线位置都应该是整数像素（经过Math.round处理）
        expect(Number.isInteger(monthItem.x)).toBe(true);
        expect(Number.isInteger(monthItem.x + monthItem.width)).toBe(true);
      });
    }
  });
});