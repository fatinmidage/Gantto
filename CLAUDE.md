# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Development server:**
```bash
pnpm tauri dev  # Start Tauri development server with hot reload
```

**Build commands:**
```bash
pnpm run build         # TypeScript compilation + Vite build
pnpm run build:analyze # Build with bundle analysis (outputs bundle-analysis.html)
pnpm run tauri build   # Build complete Tauri application for distribution
```

**Testing commands:**
```bash
pnpm test              # Run tests in watch mode
pnpm run test:ui       # Run tests with Vitest UI interface
pnpm run test:coverage # Run tests with coverage report
pnpm run test:run      # Run tests once (CI mode)
```

**Preview:**
```bash
pnpm run preview       # Preview built application locally
```

## Architecture Overview

This is a **Tauri-based cross-platform Gantt chart application** built with React + TypeScript. The architecture follows a modular, layered design with clear separation of concerns.

### Core Technology Stack
- **Frontend**: React 18 + TypeScript, Vite for bundling
- **Backend**: Tauri v2 (Rust-based desktop runtime)
- **UI Components**: Radix UI primitives + custom components
- **Testing**: Vitest + Testing Library + jsdom
- **Package Manager**: pnpm with workspace support

### High-Level Architecture Layers

**1. Application Layer (`src/App.tsx`)**
- Main application container with error boundaries
- Lazy-loaded Gantt chart component for performance
- Global error handling integration

**2. Component Architecture (`src/components/`)**
- **Core Container**: `GanttContainer` orchestrates all gantt components
- **State Management**: Refactored `GanttStateManager` (144 lines, 66% reduction) + `GanttEventCoordinator`
- **State Architecture**: Modular design with `state/GanttStateTypes.ts`, `state/GanttContainerManager.tsx`, `state/GanttStateCalculations.ts`
- **Data Layer**: `GanttDataProvider` for data flow
- **Timeline System**: `LayeredTimelineHeader`, `TimelineSettingsPanel`, `TimelineLayerSettings` for multi-layer timeline
- **Visualization**: `GanttChartHeader` + `GanttChartBody` for UI rendering
- **Interaction**: `GanttEventHandler` + context menus for user interactions

**3. Hook-Based Logic (`src/hooks/`)**
- **Gantt Hooks**: 20+ specialized hooks for different gantt functionality
- **State Hooks**: `useGanttState`, optimized `useGanttUIState` (122 lines), `useDragReducer`
- **UI State Modules**: `ui/useSelectionState.ts`, `ui/useMenuState.ts`, `ui/useModalState.ts`, `ui/useUIKeyboard.ts`
- **Interaction Hooks**: `useTaskBarDrag`, `useTaskManager`, `useTimeline`, `useLayeredTimeline`
- **Timeline Hooks**: `useTimelineSettings` for layered timeline configuration
- **Common Hooks**: `useThrottle`, `useCache`, `useErrorHandler`

**4. Type System (`src/types/`)**
- **Unified Exports**: All types accessible via `src/types/index.ts`
- **Core Models**: `Task`, `MilestoneNode`, `TaskBar` interfaces
- **Operation Types**: Create/Update/Batch operation interfaces
- **UI State Types**: Drag, selection, context menu state types

### Key Design Patterns

**Component Composition Pattern:**
- `GanttContainer` acts as composition root
- Each component has single responsibility
- Props drilling minimized through context and custom hooks

**Hook-First Architecture:**
- Business logic encapsulated in custom hooks
- Components focus on rendering and event handling
- Shared state managed through specialized hooks

**Type-Driven Development:**
- Comprehensive TypeScript interfaces for all data models
- Input/Output types for all operations
- Type guards for runtime safety

**Layered Timeline System:**
- Multi-scale timeline visualization with configurable layers
- Default three-layer structure: Year/Month/Week
- `LayeredTimelineHeader` component for multi-layer rendering
- `TimelineLayerSettings` and `TimelineSettingsPanel` for configuration
- `timelineLayerUtils` for layer calculation and management
- Adaptive time granularity with intelligent layer selection

### Data Flow Architecture

**Task Management Flow:**
1. `GanttDataProvider` manages global task state
2. `useTaskManager` hook provides CRUD operations
3. `GanttStateManager` coordinates state updates
4. Components receive updates via props/context

**Interaction Flow:**
1. User interactions captured by `GanttEventHandler`
2. Events processed by specialized hooks (`useTaskBarDrag`, `useTaskSelection`)
3. State updates propagated through `GanttEventCoordinator`
4. UI updates triggered via React state changes

**Drag & Drop System:**
- `useDragReducer` for complex drag state management
- `useHorizontalDrag` + `useVerticalDrag` for axis-specific dragging
- Real-time visual feedback during drag operations

### Testing Strategy
- **Unit Tests**: Hook testing with `@testing-library/react-hooks`
- **Integration Tests**: Component testing with `@testing-library/react`
- **Component Tests**: Timeline components (`TimelineSettingsPanel.test.tsx`)
- **Utility Tests**: Timeline layer utilities (`timelineLayerUtils.test.ts`)
- **Hook Tests**: Comprehensive coverage in `hooks/gantt/__tests__/` directory
- **Setup**: Global test configuration in `src/test/setup.ts`
- **Coverage**: Comprehensive coverage excluding config/build files

## Development Guidelines

**Component Development:**
- Follow existing patterns in `src/components/gantt/`
- Use TypeScript interfaces from `src/types/`
- Implement error boundaries for robustness
- Leverage existing hooks rather than creating new state

**Hook Development:**
- Place in appropriate `src/hooks/gantt/` or `src/hooks/common/`
- Export from `src/hooks/index.ts` for unified imports
- Write comprehensive tests in `__tests__` directories
- Follow naming convention: `use[Feature][Aspect]`

**State Management:**
- Prefer hook-based state over external state libraries
- Use modular state architecture: separate types, calculations, and container management
- Use `useDragReducer` pattern for complex state machines
- Leverage UI sub-modules (`ui/useSelectionState`, `ui/useMenuState`) for specialized UI state
- Keep state as close to usage as possible
- Implement optimistic updates for better UX

**Timeline Development:**
- Use `LayeredTimelineHeader` for multi-layer timeline rendering
- Leverage `timelineLayerUtils` for layer calculations and management
- Implement timeline settings through `TimelineSettingsPanel` and `TimelineLayerSettings`
- Follow three-layer default structure: Year/Month/Week
- Use `useLayeredTimeline` and `useTimelineSettings` hooks for timeline state management

**Styling:**
- CSS modules organized in `src/styles/components/`
- Follow existing naming conventions in stylesheet files
- Use CSS custom properties for theme consistency
- Responsive design principles applied throughout

## Key Utilities

### Timeline System Utilities
- **`timelineLayerUtils.ts`**: Core utilities for layered timeline calculation and management
- **`menuPositioning.ts`**: Smart positioning logic for context menus and dropdowns

### Architecture Enhancements
- Modular state management with clear separation of concerns
- Optimized component hierarchy with reduced bundle size
- Enhanced type safety with comprehensive TypeScript interfaces

## Important Notes

- **Tauri Context**: This is a desktop application - web-specific APIs may not work
- **Performance**: Lazy loading implemented for heavy components (see `GanttChartLazy.tsx`)
- **Timeline Architecture**: New layered timeline system with configurable multi-scale visualization
- **State Management**: Refactored for modularity and performance (66% reduction in core state manager)
- **Internationalization**: Currently Chinese-focused but structured for i18n expansion
- **Bundle Analysis**: Use `ANALYZE=true pnpm run build` to analyze bundle size
- **Development Port**: Fixed at 1420 for Tauri integration (configured in vite.config.ts)