/**
 * ganttUtils 工具函数单元测试
 * 测试智能日期检测和替换功能
 */

import { describe, test, expect } from 'vitest';
import { 
  detectDateInLabel, 
  replaceDateInLabel, 
  hasDateInLabel,
  formatDateToMD
} from '../ganttUtils';

describe('智能日期检测和替换功能', () => {
  const testDate = new Date(2024, 1, 20); // 2024年2月20日

  describe('detectDateInLabel', () => {
    test('应该检测到 M.D 格式的日期', () => {
      const result = detectDateInLabel('项目开始 1.15');
      expect(result.hasDate).toBe(true);
      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].match).toBe('1.15');
      expect(result.matches[0].format).toBe('MD');
    });

    test('应该检测到 MM.DD 格式的日期', () => {
      const result = detectDateInLabel('里程碑 01.15 完成');
      expect(result.hasDate).toBe(true);
      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].match).toBe('01.15');
      expect(result.matches[0].format).toBe('MD');
    });

    test('应该检测到 YYYY/M/D 格式的日期', () => {
      const result = detectDateInLabel('项目 2024/1/15 启动');
      expect(result.hasDate).toBe(true);
      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].match).toBe('2024/1/15');
      expect(result.matches[0].format).toBe('YYYY_M_D');
    });

    test('应该检测到 YYYY-M-D 格式的日期', () => {
      const result = detectDateInLabel('截止日期 2024-12-31');
      expect(result.hasDate).toBe(true);
      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].match).toBe('2024-12-31');
      expect(result.matches[0].format).toBe('YYYY_M_D');
    });

    test('应该检测到多个日期', () => {
      const result = detectDateInLabel('从 1.15 到 12.30');
      expect(result.hasDate).toBe(true);
      expect(result.matches).toHaveLength(2);
      expect(result.matches[0].match).toBe('1.15');
      expect(result.matches[1].match).toBe('12.30');
    });

    test('纯文本不应该检测到日期', () => {
      const result = detectDateInLabel('重要里程碑');
      expect(result.hasDate).toBe(false);
      expect(result.matches).toHaveLength(0);
    });

    test('无效日期格式不应该被检测', () => {
      const result = detectDateInLabel('版本 1.5.3');
      expect(result.hasDate).toBe(false);
    });
  });

  describe('replaceDateInLabel', () => {
    test('应该替换 M.D 格式的日期', () => {
      const result = replaceDateInLabel('项目开始 1.15', testDate);
      expect(result).toBe('项目开始 2.20');
    });

    test('应该替换 MM.DD 格式的日期', () => {
      const result = replaceDateInLabel('里程碑 01.15 完成', testDate);
      expect(result).toBe('里程碑 02.20 完成');
    });

    test('应该替换 YYYY/M/D 格式的日期', () => {
      const result = replaceDateInLabel('项目 2024/1/15 启动', testDate);
      expect(result).toBe('项目 2024/2/20 启动');
    });

    test('应该替换多个日期', () => {
      const result = replaceDateInLabel('从 1.15 到 12.30', testDate);
      expect(result).toBe('从 2.20 到 2.20');
    });

    test('纯文本标签应该保持不变', () => {
      const result = replaceDateInLabel('重要里程碑', testDate);
      expect(result).toBe('重要里程碑');
    });

    test('空字符串应该返回默认格式', () => {
      const result = replaceDateInLabel('', testDate);
      expect(result).toBe('2.20');
    });

    test('复杂混合内容应该正确替换', () => {
      const result = replaceDateInLabel('里程碑（12.3）重要事件', testDate);
      expect(result).toBe('里程碑（2.20）重要事件');
    });
  });

  describe('hasDateInLabel', () => {
    test('包含日期的标签应该返回 true', () => {
      expect(hasDateInLabel('项目开始 1.15')).toBe(true);
      expect(hasDateInLabel('1.15')).toBe(true);
      expect(hasDateInLabel('2024/1/15')).toBe(true);
    });

    test('不包含日期的标签应该返回 false', () => {
      expect(hasDateInLabel('重要里程碑')).toBe(false);
      expect(hasDateInLabel('版本 1.5.3')).toBe(false);
      expect(hasDateInLabel('')).toBe(false);
    });
  });

  describe('formatDateToMD', () => {
    test('应该正确格式化日期为 M.D 格式', () => {
      const result = formatDateToMD(testDate);
      expect(result).toBe('2.20');
    });

    test('应该处理单位数的月份和日期', () => {
      const date = new Date(2024, 0, 5); // 1月5日
      const result = formatDateToMD(date);
      expect(result).toBe('1.5');
    });

    test('应该处理双位数的月份和日期', () => {
      const date = new Date(2024, 11, 25); // 12月25日
      const result = formatDateToMD(date);
      expect(result).toBe('12.25');
    });
  });
});