import React from 'react';
import GanttStateManager from './gantt/GanttStateManager';
import GanttEventCoordinator from './gantt/GanttEventCoordinator';
import GanttContainer from './gantt/GanttContainer';


// 导入初始数据
import { initialProjectRows, initialChartTasks } from '../data/initialData';


interface GanttChartProps {
  startDate?: Date;
  endDate?: Date;
  timelineHeight?: number;
  taskHeight?: number;
}

const GanttChart: React.FC<GanttChartProps> = ({
  startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
  endDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
  timelineHeight = 40,
  taskHeight = 30
}) => {

  return (
    <GanttStateManager
      startDate={startDate}
      endDate={endDate}
      timelineHeight={timelineHeight}
      taskHeight={taskHeight}
      initialProjectRows={initialProjectRows}
      initialChartTasks={initialChartTasks}
    >
      {(stateData) => (
        <GanttEventCoordinator
          sortedChartTasks={stateData.sortedChartTasks}
          leftPanelTasks={stateData.leftPanelTasks}
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
          pixelToDate={stateData.pixelToDate}
          dateRange={stateData.dateRange}
          setProjectRows={stateData.setProjectRows}
          ganttEvents={stateData.ganttEvents}
        >
          {(handlers) => (
            <GanttContainer
              // Header props
              onZoomIn={stateData.handleZoomIn}
              onZoomOut={stateData.handleZoomOut}
              onAddTask={stateData.ganttEvents.addNewTask}
              onDeleteTask={() => stateData.ganttInteractions.selectedTitleTaskId && stateData.ganttEvents.deleteTaskCore(stateData.ganttInteractions.selectedTitleTaskId)}
              onEditTask={() => {/* TODO: 实现编辑功能 */}}
              onViewToday={stateData.handleViewToday}
              onAddSubtask={() => stateData.ganttInteractions.selectedTitleTaskId && stateData.ganttInteractions.handleCreateSubtask(stateData.ganttInteractions.selectedTitleTaskId)}
              zoomLevel={stateData.zoomLevel}
              canZoomIn={stateData.zoomLevel < 1}
              canZoomOut={stateData.zoomLevel > 0.01}
              canAddSubtask={!!stateData.ganttInteractions.selectedTitleTaskId}
              
              // Body props
              leftPanelTasks={stateData.leftPanelTasks}
              chartTaskRows={stateData.chartTaskRows}
              selectedTitleTaskId={stateData.ganttInteractions.selectedTitleTaskId}
              selectedChartTaskId={stateData.selectedChartTaskId}
              verticalDragState={stateData.verticalDragState}
              draggedTask={stateData.draggedTask}
              tempDragPosition={stateData.tempDragPosition}
              isHoveringEdge={stateData.isHoveringEdge}
              isDragging={stateData.isDragging}
              timelineHeight={timelineHeight}
              taskHeight={taskHeight}
              taskContentHeight={stateData.taskContentHeight}
              timeScales={stateData.timeScales}
              onTaskSelect={stateData.ganttInteractions.setSelectedTitleTaskId}
              onChartTaskSelect={stateData.setSelectedChartTaskId}
              onTaskToggle={stateData.ganttInteractions.handleToggleExpand}
              onTaskCreateSubtask={stateData.ganttInteractions.handleCreateSubtask}
              onTitleMouseDown={handlers.handleTitleMouseDown}
              onMouseDown={handlers.handleMouseDown}
              onTaskContextMenu={stateData.ganttInteractions.handleTaskContextMenu}
              onEdgeHover={handlers.handleEdgeHover}
              onMouseLeave={() => stateData.setIsHoveringEdge(null)}
              onContextMenu={stateData.ganttInteractions.handleContextMenu}
              dateToPixel={stateData.dateToPixel}
              onMouseMove={handlers.handleMouseMove}
              onMouseUp={handlers.handleMouseUp}
              onTitleMouseMove={handlers.handleTitleMouseMove}
              onTitleMouseUp={handlers.handleTitleMouseUp}
              
              // Menu props
              tasks={stateData.tasks}
              contextMenuState={stateData.ganttInteractions.contextMenu}
              taskContextMenuState={stateData.ganttInteractions.taskContextMenu}
              defaultRowId={stateData.leftPanelTasks[0]?.id || 'row-0'}
              availableTags={stateData.availableTags}
              onContextMenuClose={() => stateData.ganttInteractions.setContextMenu({ visible: false, x: 0, y: 0, clickPosition: { x: 0, y: 0 } })}
              onTaskContextMenuClose={() => stateData.ganttInteractions.setTaskContextMenu({ visible: false, x: 0, y: 0, taskId: null })}
              onCreateTask={handlers.handleCreateTask}
              onCreateMilestone={handlers.handleCreateMilestone}
              onColorChange={stateData.ganttEvents.handleColorChange}
              onTagAdd={stateData.ganttEvents.handleTagAdd}
              onTagRemove={stateData.ganttEvents.handleTagRemove}
              onTaskDelete={stateData.ganttEvents.deleteTaskCore}
              pixelToDate={stateData.pixelToDate}
            />
          )}
        </GanttEventCoordinator>
      )}
    </GanttStateManager>
  );
}

export default GanttChart;