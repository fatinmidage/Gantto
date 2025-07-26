# 里程碑拖拽问题修复总结

## 问题描述

里程碑节点在拖拽时总是从创建日期的位置开始移动，而不是从当前日期位置开始移动，导致用户体验不佳。

## 调试过程

### 1. 添加调试代码

在以下三个关键位置添加了详细的调试日志：

- **useMilestoneDrag.ts** (第91-110行): 拖拽开始处的坐标信息
- **TaskBarsContainer.tsx** (第114-142行): 坐标转换处的计算过程
- **GanttEventCoordinator.tsx** (第120-145行): 里程碑事件处理转换

### 2. 问题根因分析

通过调试日志发现了核心问题：**坐标不一致**

#### 关键发现：
- **里程碑存储的X坐标**: `305` (创建时的坐标)
- **基于日期重新计算的X坐标**: `306.75555555555553` (第一次) / `333.2` (第二次)
- **坐标差异**: `1.75` → `28.2` (越来越大，表明日期已更新但存储坐标未同步)

#### 问题链路：
1. **GanttEventCoordinator** 中转换任务对象时，使用的是**存储坐标 305**
2. **TaskBarsContainer** 中渲染时，使用的是**重新计算坐标 306.76/333.2**  
3. 拖拽开始时基于**旧的存储坐标**，但视觉上里程碑已经显示在**新计算坐标**位置
4. **结果**：拖拽总是从创建时的旧位置开始，而不是当前显示位置

## 修复方案

### 修复1: 坐标转换逻辑修复

**文件**: `src/components/gantt/GanttEventCoordinator.tsx` (第120-145行)

**问题**: 里程碑转换为任务对象时使用存储的旧坐标 `milestone.x`

**解决**: 使用基于日期重新计算的坐标 `dateToPixel(milestone.date)`

```typescript
// 🔧 修复前
task = {
  // ...
  x: milestone.x || 0,  // 使用存储的旧坐标
  // ...
};

// 🔧 修复后  
const currentRenderX = dateToPixel(milestone.date);
task = {
  // ...
  x: currentRenderX,  // 使用当前渲染坐标
  // ...
};
```

### 修复2: 坐标同步检测

**文件**: `src/components/gantt/TaskBarsContainer.tsx` (第114-142行)

**目的**: 检测并记录存储坐标与渲染坐标的差异，为将来的自动同步做准备

```typescript
// 🔧 添加坐标漂移检测
const hasCoordinateDrift = milestone.x && Math.abs(milestoneX - milestone.x) > 0.1;

// 🔧 未来可添加自动同步逻辑
if (hasCoordinateDrift && !isBeingDragged && onMilestoneUpdate) {
  // 同步存储坐标到渲染坐标
}
```

## 技术细节

### 坐标系统架构问题

里程碑在系统中维护了两套坐标：

1. **存储坐标** (`milestone.x`, `milestone.y`): 创建时基于日期计算的坐标，存储在数据中
2. **渲染坐标**: 每次渲染时基于当前日期范围动态计算的坐标 `dateToPixel(milestone.date)`

### 为什么会产生坐标不一致？

1. **时间轴缩放**: 用户可能调整了时间轴的显示范围
2. **日期更新**: 里程碑的日期可能被修改，但存储坐标未同步更新
3. **精度差异**: 浮点数计算精度导致的微小差异累积

## 修复效果

### 预期结果
- ✅ 里程碑拖拽从当前显示位置开始，而不是从创建位置
- ✅ 拖拽行为更加自然和符合用户预期
- ✅ 解决坐标不一致导致的视觉错位问题

### 测试步骤
1. 运行应用程序 `pnpm tauri dev`
2. 尝试拖拽里程碑节点
3. 确认拖拽从当前显示位置开始
4. 验证拖拽过程中的视觉反馈正确

## 后续优化建议

### 1. 坐标系统重构（可选）
考虑统一坐标系统，避免双重维护：
- 要么只存储日期，渲染时计算坐标
- 要么实时同步存储坐标与渲染坐标

### 2. 性能优化
- 减少不必要的坐标重新计算
- 使用 `useMemo` 缓存坐标计算结果

### 3. 调试代码清理
在确认修复效果后，移除调试 console.log 语句

## 相关文件

### 修改的文件
- `src/hooks/gantt/useMilestoneDrag.ts` - 添加调试日志
- `src/components/gantt/TaskBarsContainer.tsx` - 坐标转换调试 + 同步检测
- `src/components/gantt/GanttEventCoordinator.tsx` - 坐标转换逻辑修复

### 核心修复位置
- **主要修复**: `GanttEventCoordinator.tsx:136` - 使用渲染坐标替代存储坐标
- **辅助优化**: `TaskBarsContainer.tsx:138` - 坐标差异检测

---

**修复日期**: 2025-01-26  
**问题优先级**: 高  
**修复状态**: 已完成，待测试验证