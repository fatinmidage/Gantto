# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Gantto is a modern cross-platform Gantt chart application built with Tauri + React + TypeScript. It provides an intuitive interface for project planning, task management, and progress tracking with features like drag-and-drop task management, hierarchical task structures, and visual timeline views.

## Development Commands

### Setup and Installation
```bash
pnpm install               # Install dependencies
```

### Development
```bash
pnpm run dev              # Start Vite development server only
pnpm run tauri dev        # Start full Tauri development mode (recommended)
```

### Building
```bash
pnpm run build            # Build frontend (TypeScript compilation + Vite build)
pnpm run tauri build      # Build complete Tauri application for distribution
```

### Preview
```bash
pnpm run preview          # Preview built frontend locally
```

## Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Tauri v2 (Rust)
- **UI Components**: Radix UI (@radix-ui/react-dropdown-menu, @radix-ui/react-tooltip)
- **Icons**: Lucide React
- **Package Manager**: pnpm

### Project Structure
```
src/                          # Frontend source code
├── App.tsx                   # Main application component with theme management
├── main.tsx                  # React application entry point
├── components/               # React components
│   ├── GanttChart.tsx        # Main Gantt chart component (complex, 2000+ lines)
│   ├── Header.tsx            # Application header with project controls
│   ├── TaskIcon.tsx          # Task type icons and drag handles
│   └── Toolbar.tsx           # Chart toolbar with zoom/view controls
└── assets/                   # Static assets

src-tauri/                    # Tauri backend
├── src/                      # Rust source code
├── tauri.conf.json          # Tauri configuration
└── Cargo.toml               # Rust dependencies

public/                       # Static files
dist/                        # Build output
```

### Key Components

#### GanttChart.tsx
The core component handling:
- **Task Management**: CRUD operations for tasks with hierarchical support (parent/child relationships)
- **Drag & Drop**: Horizontal task dragging for timeline adjustment and vertical dragging for task reordering
- **Task Hierarchy**: Support for parent-child task relationships with expand/collapse functionality
- **Visual Features**: Progress bars, task status indicators, current date line, timeline scaling
- **State Management**: Complex state including task data, drag states, zoom levels, and selection

#### Task Data Structure
```typescript
interface Task {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  color: string;
  x: number;               // Calculated position
  width: number;           // Calculated width  
  order: number;           // Display order
  type?: 'milestone' | 'development' | 'testing' | 'delivery' | 'default';
  status?: 'pending' | 'in-progress' | 'completed' | 'overdue';
  progress?: number;       // 0-100
  parentId?: string;       // For hierarchical tasks
  children?: string[];     // Child task IDs
  level?: number;          // Nesting level (0 = root)
  isExpanded?: boolean;    // Expand/collapse state
}
```

## Development Notes

### Chinese Language Support
- The project uses Chinese for UI text and comments
- Use appropriate Chinese localization patterns when adding new features
- Follow existing naming conventions in Chinese comments

### Tauri Development
- Use `pnpm run tauri dev` for development (not just `pnpm run dev`)
- Frontend runs on http://localhost:1420 during development
- Tauri configuration is in `src-tauri/tauri.conf.json`

### Code Style and Patterns
- Uses functional React components with hooks
- Extensive use of `useCallback`, `useMemo` for performance optimization
- Custom hooks for drag functionality and performance optimizations
- TypeScript with strict typing throughout

### Performance Considerations
- The GanttChart component uses throttled mouse events for smooth dragging
- Batched React updates for drag operations
- Memoized calculations for date/pixel conversions
- Lazy evaluation of visible tasks based on hierarchy expansion state

### Cursor AI Rules Integration
The project includes Cursor AI rules (`.cursor/rules/commandplan.mdc`) that enforce:
- RIPER-5 development protocol with strict mode transitions
- Chinese language responses with structured planning approach
- Systematic code analysis and implementation phases

## Common Development Tasks

### Adding New Task Types
1. Update the `Task` interface type union in `GanttChart.tsx:15`
2. Add corresponding icon handling in `TaskIcon.tsx`
3. Update styling in CSS for the new type class

### Modifying Task Hierarchy
- Tasks support unlimited nesting via `parentId`/`children` relationships
- Use helper functions `getVisibleTasks()` and `calculateParentProgress()` 
- Maintain task ordering when implementing hierarchy changes

### Extending Drag Functionality
- Horizontal dragging: Modify `handleMouseMoveCore()` and related handlers
- Vertical dragging: Extend `VerticalDragState` and related mouse handlers
- Performance: Use the existing `useDragCache()` and `useThrottledMouseMove()` hooks

## Testing and Quality

### Testing Commands
```bash
# Currently no test setup - tests need to be configured
# Project uses TypeScript strict mode for type checking
pnpm run build            # Validates TypeScript compilation
```

### Code Quality
- TypeScript strict mode enabled for type safety
- Use Chinese language for UI text and comments
- Follow existing component patterns and performance optimizations