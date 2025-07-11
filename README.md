# Gantto - 简洁高效的跨平台甘特图工具

Gantto 是一款基于 MVP (最小可行产品) 原则开发的现代化甘特图软件，使用 Tauri + React + TypeScript 构建。它旨在为项目经理、团队和个人提供一个轻量、美观且高效的项目规划与跟踪解决方案。

## ✨ 项目愿景

我们致力于打造一款：
- **直观易用**: 拥有简洁现代的 UI 和流畅的交互体验。
- **功能强大**: 满足核心的项目规划、任务依赖和进度跟踪需求。
- **跨平台**: 在 Windows, macOS 和 Linux 上提供一致的体验。
- **安全可靠**: 数据存储在本地，保障用户数据隐私。

## 🚀 功能特性

### 已实现 (v0.1.0)
- **任务管理**: 创建、编辑和删除任务。
- **时间轴视图**: 在可缩放的时间轴上可视化任务。
- **拖拽交互**: 通过拖拽直观地调整任务的开始时间和持续时间。
- **进度跟踪**: 为每个任务设置并显示完成进度。
- **今日标记**: 高亮显示当前日期，便于定位。

### 路线图 (Roadmap)
- **任务依赖**: 支持设置“完成-开始”等依赖关系。
- **层级任务 (WBS)**: 支持父子任务结构。
- **项目导入/导出**: 支持从 JSON 文件导入或导出项目。
- **导出为图片/PDF**: 将甘特图导出为便于分享的格式。
- **多语言支持**: 提供中文、英文等多种语言界面。

## 📖 使用说明

1. **创建任务**: 在任务列表中添加新任务。
2. **调整任务**: 在图表区域拖动任务条的左右边缘或整体来调整其时间。
3. **更新进度**: 在任务详情中修改任务的完成百分比。
4. **缩放视图**: 使用时间轴上方的控件切换视图粒度（天/周/月）。

## 🛠️ 技术栈

- **核心框架**: [Tauri](https://tauri.app/) (v2) - 使用 Rust 构建安全、轻量的跨平台应用。
- **前端**: [React](https://react.dev/) (v18) + [TypeScript](https://www.typescriptlang.org/)
- **构建工具**: [Vite](https://vitejs.dev/)
- **样式**: CSS Modules / Styled-components (待定)
- **状态管理**: Zustand / Redux Toolkit (待定)

## 🔧 开发环境

### 环境要求
- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://www.rust-lang.org/tools/install) (v1.70+)
- [pnpm](https://pnpm.io/) (推荐)

### 本地开发
```bash
# 1. 克隆项目
git clone https://github.com/your-username/gantto.git

# 2. 安装依赖
pnpm install

# 3. 启动开发模式
pnpm run tauri dev
```

### 构建应用
```bash
pnpm run tauri build
```

## 🤝 贡献指南

我们欢迎所有形式的贡献！无论是提交 Issue、发起 Pull Request，还是改进文档，都对我们非常有帮助。

在您开始之前，请先阅读我们的贡献指南（待创建）。

## 📝 许可证

本项目基于 [MIT](https://opensource.org/licenses/MIT) 许可证开源。
