import React, { useState, useCallback } from 'react';
import { GanttStateManager, GanttEventCoordinator, GanttContainer } from './gantt';
import { useTimelineSettings } from '../hooks/gantt/useTimelineSettings';

// 导入初始数据
import { initialProjectRows, initialChartTasks, initialMilestones } from '../data/initialData';


interface GanttChartProps {
  startDate?: Date;
  endDate?: Date;
  timelineHeight?: number;
  taskHeight?: number;
}

const GanttChart: React.FC<GanttChartProps> = ({
  startDate: initialStartDate,
  endDate: initialEndDate,
  timelineHeight = 55,
  taskHeight = 22
}) => {
  // 动态计算默认日期范围：当天前1个月至后5个月（总共6个月跨度）
  const today = new Date();
  const defaultStart = initialStartDate || new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
  const defaultEnd = initialEndDate || new Date(today.getFullYear(), today.getMonth() + 5, today.getDate());
  
  // 日期范围状态管理
  const [dateRangeStart, setDateRangeStart] = useState<Date>(defaultStart);
  const [dateRangeEnd, setDateRangeEnd] = useState<Date>(defaultEnd);
  
  
  // 分层时间轴状态管理
  const timelineSettings = useTimelineSettings();
  
  // 处理日期范围变化
  const handleDateRangeChange = useCallback((startDate: Date, endDate: Date) => {
    setDateRangeStart(startDate);
    setDateRangeEnd(endDate);
  }, []);
  

  // 处理分层配置变化
  const handleLayerConfigChange = useCallback((config: typeof timelineSettings.config) => {
    timelineSettings.updateConfig(config);
  }, [timelineSettings]);

  // 处理分层模式切换
  const handleLayerModeToggle = useCallback((_enabled: boolean) => {
    // 这里可以添加额外的逻辑，比如保存用户偏好设置
  }, []);

  return (
    <GanttStateManager
      startDate={dateRangeStart}
      endDate={dateRangeEnd}
      timelineHeight={timelineHeight}
      taskHeight={taskHeight}
      initialProjectRows={initialProjectRows}
      initialChartTasks={initialChartTasks}
      initialMilestones={initialMilestones}
      layerConfig={timelineSettings.config}
    >
      {(stateData) => (
        <GanttEventCoordinator
          sortedChartTasks={stateData.sortedChartTasks}
          leftPanelTasks={stateData.leftPanelTasks}
          milestones={stateData.milestones}
          taskHeight={taskHeight}
          isDragging={stateData.isDragging}
          verticalDragState={stateData.verticalDragState}
          tempDragPosition={stateData.tempDragPosition}
          draggedTask={stateData.draggedTask}
          draggedTaskData={stateData.draggedTaskData}
          dragType={stateData.dragType}
          isHoveringEdge={stateData.isHoveringEdge}
          setIsHoveringEdge={stateData.setIsHoveringEdge}
          startHorizontalDrag={stateData.startHorizontalDrag}
          startVerticalDrag={stateData.startVerticalDrag}
          updateHorizontalDragPosition={stateData.updateHorizontalDragPosition}
          updateVerticalDragPosition={stateData.updateVerticalDragPosition}
          updateDragMetrics={stateData.updateDragMetrics}
          resetHorizontalDrag={stateData.resetHorizontalDrag}
          resetVerticalDrag={stateData.resetVerticalDrag}
          onMilestoneUpdate={stateData.milestoneManager.handleMilestoneUpdate}
          pixelToDate={stateData.pixelToDate}
          dateToPixel={stateData.dateToPixel}
          dateRange={stateData.dateRange}
          setProjectRows={stateData.setProjectRows}
          ganttEvents={stateData.ganttEvents}
          handleTaskUpdate={stateData.handleTaskUpdate}
          containerRef={stateData.containerRef}
        >
          {(handlers) => (
            <GanttContainer
              // Header props
              onAddTask={stateData.ganttEvents.addNewTask}
              onDeleteTask={() => stateData.ganttInteractions.selectedTitleTaskId && stateData.ganttEvents.deleteTaskCore(stateData.ganttInteractions.selectedTitleTaskId)}
              onEditTask={() => {}}
              onAddSubtask={() => stateData.ganttInteractions.selectedTitleTaskId && stateData.ganttInteractions.handleCreateSubtask(stateData.ganttInteractions.selectedTitleTaskId)}
              canAddSubtask={!!stateData.ganttInteractions.selectedTitleTaskId}
              // 日期范围相关
              dateRangeStart={dateRangeStart}
              dateRangeEnd={dateRangeEnd}
              onDateRangeChange={handleDateRangeChange}
              
              // 分层时间轴相关
              onLayerConfigChange={handleLayerConfigChange}
              onLayerModeToggle={handleLayerModeToggle}
              isLayeredModeEnabled={true}
              
              // Body props
              leftPanelTasks={stateData.leftPanelTasks}
              chartTaskRows={stateData.chartTaskRows}
              selectedTitleTaskId={stateData.ganttInteractions.selectedTitleTaskId}
              verticalDragState={stateData.verticalDragState}
              draggedTask={stateData.draggedTask}
              tempDragPosition={stateData.tempDragPosition}
              isHoveringEdge={stateData.isHoveringEdge}
              isDragging={stateData.isDragging}
              timelineHeight={timelineHeight}
              taskHeight={taskHeight}
              taskContentHeight={stateData.taskContentHeight}
              layeredTimeScales={stateData.layeredTimeScales}
              layerConfig={stateData.layerConfig}
              dateRange={stateData.dateRange}
              dateToPixel={stateData.dateToPixel}
              onTaskSelect={stateData.ganttInteractions.setSelectedTitleTaskId}
              onChartTaskSelect={stateData.setSelectedChartTaskId}
              onTaskToggle={stateData.ganttInteractions.handleToggleExpand}
              onTaskCreateSubtask={stateData.ganttInteractions.handleCreateSubtask}
              onTitleMouseDown={handlers.handleTitleMouseDown}
              onTaskUpdate={handlers.handleTaskUpdate}
              onMouseDown={handlers.handleMouseDown}
              onTaskContextMenu={stateData.ganttInteractions.handleTaskContextMenu}
              onEdgeHover={handlers.handleEdgeHover}
              onMouseLeave={() => stateData.setIsHoveringEdge(null)}
              onContextMenu={stateData.ganttInteractions.handleContextMenu}
              onMouseMove={handlers.handleMouseMove}
              onMouseUp={handlers.handleMouseUp}
              onTitleMouseMove={handlers.handleTitleMouseMove}
              onTitleMouseUp={handlers.handleTitleMouseUp}
              
              // Menu props
              tasks={stateData.tasks}
              contextMenuState={stateData.ganttInteractions.contextMenu}
              taskContextMenuState={stateData.ganttInteractions.taskContextMenu}
              milestoneContextMenuState={stateData.milestoneContextMenuState}
              defaultRowId={stateData.leftPanelTasks[0]?.id || 'row-0'}
              availableTags={stateData.availableTags}
              onContextMenuClose={() => stateData.ganttInteractions.setContextMenu({ visible: false, x: 0, y: 0, clickPosition: { x: 0, y: 0 } })}
              onTaskContextMenuClose={() => stateData.ganttInteractions.setTaskContextMenu({ visible: false, x: 0, y: 0, taskId: null })}
              onMilestoneContextMenuClose={() => stateData.setMilestoneContextMenuState({ visible: false, x: 0, y: 0, milestoneId: null })}
              onCreateTask={handlers.handleCreateTask}
              onCreateMilestone={handlers.handleCreateMilestone}
              onColorChange={stateData.ganttEvents.handleColorChange}
              onTagAdd={stateData.ganttEvents.handleTagAdd}
              onTagRemove={stateData.ganttEvents.handleTagRemove}
              onTaskDelete={stateData.ganttEvents.deleteTaskCore}
              onLabelEdit={stateData.ganttEvents.handleLabelEdit}
              onMilestoneIconChange={(milestoneId: string, iconType: any, color?: string) => {
                const updates: any = { id: milestoneId, iconType };
                if (color) {
                  updates.color = color;
                }
                stateData.milestoneManager.updateMilestone(updates);
              }}
              onMilestoneLabelEdit={(milestoneId: string, label: string) => stateData.milestoneManager.updateMilestone({ id: milestoneId, label })}
              onMilestoneDateChange={(milestoneId: string, newDate: Date) => stateData.milestoneManager.updateMilestoneDate(milestoneId, newDate)}
              onMilestoneDelete={(milestoneId: string) => stateData.milestoneManager.deleteMilestone(milestoneId)}
              pixelToDate={stateData.pixelToDate}
              containerRef={stateData.containerRef}
              isCurrentDateInRange={stateData.isCurrentDateInRange}
              
              // 里程碑相关
              milestones={stateData.milestones}
              selectedMilestone={stateData.selectedMilestone}
              onMilestoneSelect={stateData.milestoneManager.selectMilestone}
              onMilestoneContextMenu={(e, milestoneId) => {
                e.preventDefault();
                e.stopPropagation();
                stateData.setMilestoneContextMenuState({
                  visible: true,
                  x: e.clientX,
                  y: e.clientY,
                  milestoneId
                });
              }}
              onMilestoneDragStart={(e, milestone) => {
                // 调用专门的里程碑拖拽处理逻辑
                if (handlers?.handleMilestoneDragStart) {
                  handlers.handleMilestoneDragStart(e, milestone);
                }
              }}
            />
          )}
        </GanttEventCoordinator>
      )}
    </GanttStateManager>
  );
}

export default GanttChart;