# Gantto 项目 UI 组件对象名称

## 核心应用组件
- **App** - 主应用组件，位于 `App.tsx`
- **Header** - 应用头部组件，包含 logo、项目操作按钮
- **GanttChart** - 甘特图主组件，核心功能组件

## 工具栏与控制组件
- **Toolbar** - 图表工具栏，包含缩放、视图切换、任务操作按钮
- **TaskIcon** - 任务类型图标组件，支持不同任务类型
- **DragHandle** - 拖拽手柄组件，用于任务拖拽操作

## 甘特图核心渲染组件
- **TaskBars** - 任务条渲染组件，显示图表区域的任务条和里程碑
- **TimelineHeader** - 时间轴头部组件，显示时间刻度和网格线
- **TaskTitleColumn** - 任务标题列组件，左侧任务列表和层级结构

## 交互菜单组件
- **GanttContextMenu** - 甘特图右键菜单，提供"新建任务"、"新建节点"选项
- **TaskContextMenu** - 任务右键菜单，提供任务相关操作
- **ColorPicker** - 颜色选择器组件，用于修改任务颜色

## 数据与状态管理组件
- **GanttDataProvider** - 甘特图数据提供者，统一管理数据状态
- **GanttEventHandler** - 事件处理器组件，集中处理用户交互事件
- **TagManager** - 标签管理器组件，处理任务标签功能

## 主要界面区域
- **app-header** - 应用头部区域
- **app-main** - 主内容区域
- **gantt-toolbar** - 甘特图工具栏区域
- **title-column** - 任务标题列区域
- **gantt-timeline** - 时间轴区域
- **tasks** - 任务条展示区域

## 组件文件位置
```
src/
├── App.tsx                          # 主应用组件
├── components/
│   ├── Header.tsx                   # 应用头部
│   ├── Toolbar.tsx                  # 工具栏
│   ├── TaskIcon.tsx                 # 任务图标
│   ├── GanttChart.tsx               # 甘特图主组件
│   └── gantt/
│       ├── TaskBars.tsx             # 任务条渲染
│       ├── TimelineHeader.tsx       # 时间轴头部
│       ├── TaskTitleColumn.tsx      # 任务标题列
│       ├── GanttContextMenu.tsx     # 甘特图右键菜单
│       ├── TaskContextMenu.tsx      # 任务右键菜单
│       ├── ColorPicker.tsx          # 颜色选择器
│       ├── GanttDataProvider.tsx    # 数据提供者
│       ├── GanttEventHandler.tsx    # 事件处理器
│       └── TagManager.tsx           # 标签管理器
```

这些组件共同构成了 Gantto 甘特图应用的完整用户界面。