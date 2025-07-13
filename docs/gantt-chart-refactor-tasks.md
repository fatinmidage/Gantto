# GanttChart.tsx 拆分任务清单

## 📋 总体目标
将 1942 行的 `GanttChart.tsx` 拆分为多个 <200 行的专门组件，确保 **不改变任何现有 UI 显示效果和布局**。

## 🎯 拆分策略

### 当前文件结构分析
```
GanttChart.tsx (1942 行)
├── Helper Functions (91 行)
│   ├── getVisibleProjectRows
│   ├── getVisibleTasks  
│   └── getAllDescendantRows
├── Custom Hooks (38 行)
│   └── useThrottledMouseMove
├── Initial Data (144 行)
│   └── initialProjectRows 定义
├── Hooks Usage (17 行)
│   └── 自定义 hooks 调用
├── Main Render (1652 行)
│   ├── Toolbar (19 行)
│   ├── Title Column (232 行)
│   ├── Chart Area (1401 行)
│   └── Context Menu (N/A)
```

### 🔄 拆分目标组件

## 任务列表

### 阶段一：提取辅助工具和hooks（优先级：高）

#### 任务 1.1：提取层级帮助函数
**文件**: `src/components/gantt/GanttHelpers.ts`
**行数估计**: 120行
**内容**:
- [x] `getVisibleProjectRows` 函数
- [x] `getVisibleTasks` 函数  
- [x] `getAllDescendantRows` 函数
- [x] 相关类型定义
- [x] 单元测试用例

**验证标准**: 
- 所有现有功能正常工作
- 层级展开/折叠无变化
- 任务可见性逻辑一致

#### 任务 1.2：提取自定义 hook
**文件**: `src/hooks/gantt/useThrottledMouseMove.ts`
**行数估计**: 45行
**内容**:
- [x] `useThrottledMouseMove` hook
- [x] 类型定义
- [x] 性能优化保持

**验证标准**:
- 鼠标拖拽性能无下降
- 节流机制正常工作

### 阶段二：拆分标题列组件（优先级：高）

#### 任务 2.1：创建任务标题列组件
**文件**: `src/components/gantt/TaskTitleColumn.tsx`
**行数估计**: 180行
**内容**:
- [x] 标题列头部 (`title-header`)
- [x] 任务标题列表渲染
- [x] 层级缩进逻辑 (level * 20px)
- [x] 展开/折叠按钮
- [x] 拖拽指示器
- [x] 任务选择状态
- [x] 双击编辑功能

**Props 接口**:
```typescript
interface TaskTitleColumnProps {
  tasks: Task[];
  selectedTitleTaskId: string | null;
  verticalDragState: VerticalDragState;
  onTaskSelect: (taskId: string) => void;
  onTaskToggle: (taskId: string) => void;
  onTaskEdit: (taskId: string, newTitle: string) => void;
  onVerticalDragStart: (taskId: string, index: number) => void;
  titleColumnStyle: React.CSSProperties;
  titleHeaderStyle: React.CSSProperties;
  taskTitlesContainerStyle: React.CSSProperties;
}
```

**验证标准**:
- 标题列宽度保持 200px
- 层级缩进显示正确  
- 展开/折叠图标功能正常
- 双击编辑交互无变化
- 拖拽指示器位置准确

#### 任务 2.2：创建任务标题项组件  
**文件**: `src/components/gantt/TaskTitleItem.tsx`
**行数估计**: 120行
**内容**:
- [x] 单个任务标题渲染
- [x] 拖拽句柄
- [x] 展开/折叠按钮
- [x] 任务图标
- [x] 标题文本编辑
- [x] 选中状态样式

**Props 接口**:
```typescript  
interface TaskTitleItemProps {
  task: Task;
  index: number;
  isSelected: boolean;
  isDraggedTask: boolean;
  isTargetPosition: boolean;
  verticalDragState: VerticalDragState;
  onSelect: (taskId: string) => void;
  onToggle: (taskId: string) => void;
  onEdit: (taskId: string, newTitle: string) => void;
  onDragStart: (taskId: string, index: number) => void;
}
```

### 阶段三：拆分图表区域组件（优先级：高）

#### 任务 3.1：创建时间轴头部组件
**文件**: `src/components/gantt/TimelineHeader.tsx` 
**行数估计**: 150行
**内容**:
- [x] 月份标题渲染
- [x] 日期网格
- [x] 当前日期线
- [x] 缩放级别适配
- [x] 时间轴滚动同步

**Props 接口**:
```typescript
interface TimelineHeaderProps {
  startDate: Date;
  endDate: Date;
  zoomLevel: number;
  dayWidth: number;
  scrollLeft: number;
  timelineHeight: number;
}
```

#### 任务 3.2：创建图表网格组件
**文件**: `src/components/gantt/GanttGrid.tsx`
**行数估计**: 100行  
**内容**:
- [x] 垂直网格线渲染
- [x] 水平分隔线
- [x] 背景色交替
- [x] 滚动区域管理

**Props 接口**:
```typescript
interface GanttGridProps {
  startDate: Date;
  endDate: Date; 
  dayWidth: number;
  taskHeight: number;
  taskCount: number;
  scrollLeft: number;
  scrollTop: number;
}
```

#### 任务 3.3：创建任务条渲染组件
**文件**: `src/components/gantt/TaskBars.tsx`
**行数估计**: 180行
**内容**:
- [x] 任务条渲染逻辑
- [x] 里程碑点渲染
- [x] 进度条显示
- [x] 任务状态样式
- [x] 拖拽预览效果

**Props 接口**:
```typescript
interface TaskBarsProps {
  tasks: Task[];
  dayWidth: number;
  taskHeight: number;
  startDate: Date;
  dragState: DragState;
  onTaskDragStart: (taskId: string, event: React.MouseEvent) => void;
  onTaskClick: (taskId: string) => void;
}
```

### 阶段四：拆分交互管理组件（优先级：中）

#### 任务 4.1：创建拖拽管理组件
**文件**: `src/components/gantt/DragManager.tsx`
**行数估计**: 120行
**内容**:
- [x] 水平拖拽逻辑
- [x] 垂直拖拽逻辑  
- [x] 拖拽预览
- [x] 拖拽约束处理
- [x] 事件监听管理

#### 任务 4.2：创建滚动管理组件
**文件**: `src/components/gantt/ScrollManager.tsx`
**行数估计**: 80行
**内容**:
- [x] 水平滚动同步
- [x] 垂直滚动处理
- [x] 滚动边界控制
- [x] 滚动性能优化

### 阶段五：重构主容器组件（优先级：高）

#### 任务 5.1：重构 GanttChart 主组件
**文件**: `src/components/GanttChart.tsx` (重构后)
**行数估计**: 80行
**内容**:
- [x] 组件组装和布局
- [x] Props 传递协调
- [x] 状态管理集成
- [x] 事件处理协调

**新的组件结构**:
```jsx
const GanttChart = (props) => {
  // Hook 调用和状态管理
  
  return (
    <>
      <Toolbar {...toolbarProps} />
      <div className="gantt-container" style={containerStyle}>
        <TaskTitleColumn {...titleColumnProps} />
        <div className="chart-area" style={chartAreaStyle}>
          <TimelineHeader {...timelineProps} />
          <div className="chart-content" style={chartContentStyle}>
            <GanttGrid {...gridProps} />
            <TaskBars {...taskBarsProps} />
            <DragManager {...dragProps} />
          </div>
        </div>
      </div>
    </>
  );
};
```

## 📋 验证检查清单

### 🎨 UI/UX 一致性验证
- [ ] 整体布局尺寸无变化
- [ ] 颜色样式完全一致
- [ ] 字体和文本显示无差异
- [ ] 间距和边距保持原样
- [ ] 圆角和边框效果一致

### 🔧 功能完整性验证  
- [ ] 任务拖拽（水平+垂直）正常
- [ ] 任务创建和编辑功能
- [ ] 层级展开/折叠机制
- [ ] 缩放和视图切换
- [ ] 滚动同步无问题
- [ ] 选择和高亮状态

### ⚡ 性能验证
- [ ] 渲染性能无下降
- [ ] 内存使用量无增加
- [ ] 拖拽流畅度保持
- [ ] 滚动响应速度一致

### 🧪 回归测试
- [ ] 所有现有交互路径正常
- [ ] 边界情况处理正确
- [ ] 错误处理机制完整
- [ ] 数据一致性保证

## 🚀 执行计划

### 第一周：基础拆分
- 完成任务 1.1, 1.2 (工具函数和hooks)
- 完成任务 2.1, 2.2 (标题列组件)

### 第二周：核心组件  
- 完成任务 3.1, 3.2, 3.3 (图表区域组件)
- 开始任务 4.1, 4.2 (交互管理)

### 第三周：集成优化
- 完成任务 5.1 (主组件重构)
- 全面验证和测试
- 性能优化调整

## ⚠️ 注意事项

1. **严格保持样式**: 所有 `style` 属性和 CSS 类名必须完全保留
2. **Props 传递**: 确保所有必要的 props 正确传递到子组件
3. **事件处理**: 保持现有的事件处理逻辑和回调函数
4. **状态同步**: 确保拆分后的组件间状态同步正确
5. **性能考虑**: 避免不必要的重新渲染，保持现有的优化
6. **渐进式实施**: 一次只拆分一个组件，确保每步都可验证

## 📊 预期结果

拆分完成后的文件大小分布：
- `GanttChart.tsx`: 80行 (主容器)
- `TaskTitleColumn.tsx`: 180行  
- `TaskTitleItem.tsx`: 120行
- `TimelineHeader.tsx`: 150行
- `GanttGrid.tsx`: 100行
- `TaskBars.tsx`: 180行
- `DragManager.tsx`: 120行
- `ScrollManager.tsx`: 80行
- `GanttHelpers.ts`: 120行

**总计**: ~1130行，所有文件均 <200行，符合代码规范要求。