# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## 项目概述

这是一个企业级项目管理系统（CodeBuddy v2.8.5），支持OKR管理、项目跟踪、团队协作等功能。系统采用前后端分离架构：
- 前端：React 19 + TypeScript + Vite + TailwindCSS
- 后端：Go 1.21+ + Gin + PostgreSQL/SQLite
- 认证：支持OIDC认证和本地模拟用户

## 常用开发命令

### 环境管理
```bash
# 切换到开发模式（推荐，无需OIDC配置）
node switch-env.cjs development

# 切换到生产模式
node switch-env.cjs production

# 检查当前环境配置
node check-env.cjs
```

### 前端开发
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

### 后端开发
```bash
# 进入后端目录
cd backend

# 安装依赖
go mod tidy

# 编译
go build -o project-management-backend main.go

# 运行
./project-management-backend

# 或使用部署脚本
./deploy.sh
```

### 完整部署
```bash
# 使用启动脚本（包含前后端）
./start.sh

# 停止服务（如果有对应的脚本）
./stop.sh
```

## 代码架构

### 前端架构
```
src/
├── App.tsx              # 主应用组件，状态管理中心
├── api.ts               # API调用封装
├── types.ts             # TypeScript类型定义
└── components/          # UI组件库
    ├── MainContent.tsx      # 项目总览页面
    ├── PersonalView.tsx     # 个人视图
    ├── OKRPage.tsx         # OKR管理页面
    ├── KanbanView.tsx      # 看板视图
    ├── WeeklyMeetingView.tsx # 周会视图
    └── ...                 # 其他UI组件
```

### 后端架构
```
backend/
├── main.go             # 入口文件
├── internal/
│   ├── api/            # HTTP API处理
│   ├── config/         # 配置管理
│   ├── database/       # 数据库操作
│   └── scheduler/      # 定时任务
└── projects.db         # SQLite数据库文件
```

### 核心数据模型
- **Project**: 项目实体，包含状态、团队成员、评论、变更日志
- **OKR**: 目标和关键结果，支持多周期管理
- **User**: 用户信息，包含部门归属
- **TeamMember**: 团队成员，支持多时段排期
- **Role**: 角色配置（产品、前端、后端、测试）

## 开发要点

### 环境切换机制
系统支持两种运行模式：
- **development**: 使用模拟用户"陈楠"登录，无需OIDC配置
- **production**: 完整OIDC认证流程

切换环境后需重启开发服务器。

### 状态管理
- 主要状态在`App.tsx`中管理，使用React hooks
- 采用乐观更新策略，先更新UI后调用API
- 错误处理：API失败时回滚到数据源

### 数据持久化
- 前端通过`api.ts`与后端通信
- 后端支持PostgreSQL和SQLite两种数据库
- 生产环境使用PostgreSQL，本地开发可使用SQLite

### 组件通信
- 父组件向子组件传递回调函数
- 使用Modal组件处理复杂交互（评论、角色编辑等）
- ViewType控制页面切换

### 定时任务
- 每周一自动执行weekly rollover
- 将上周更新移至lastWeekUpdate字段
- 清空weeklyUpdate为新一周准备

### 项目生命周期
项目状态流转：未开始 → 讨论中 → 产品设计 → 需求完成 → 评审完成 → 开发中 → 开发完成 → 测试中 → 测试完成 → 本周已上线 → 已完成

### OKR周期管理
- 支持半年度OKR周期（H1/H2）
- 自动识别当前期间
- 支持创建新周期和历史查看

## API端点
```
GET  /health                     - 健康检查
GET  /api/users                  - 获取用户列表
GET  /api/projects               - 获取项目列表
POST /api/projects               - 创建新项目
PATCH /api/projects/:id          - 更新项目
DELETE /api/projects/:id         - 删除项目
GET  /api/okr-sets               - 获取OKR集合
POST /api/okr-sets               - 创建OKR集合
POST /api/perform-weekly-rollover - 执行周度滚动
```

## 开发注意事项

### 新建项目流程
1. 点击新建按钮创建临时项目（isNew标记）
2. 编辑项目信息（仅更新本地状态）
3. 保存时调用API创建真实项目
4. 创建成功后刷新数据并清除编辑状态

### 团队成员管理
- 支持多时段排期（TimeSlot）
- 兼容旧版单时段格式
- 变更日志自动记录人员调整

### 评论系统
- 支持@提及功能
- 已读状态跟踪
- 支持回复特定用户

### 环境变量配置
关键环境变量：
- `VITE_API_BASE_URL`: API服务地址
- `VITE_ENABLE_OIDC`: 是否启用OIDC认证
- `VITE_MOCK_USER_ID`: 开发模式下的模拟用户ID

## 数据库配置
生产环境PostgreSQL连接：
```
postgresql://admin:Kingsoft0531@120.92.44.85:51022/project_codebuddy?sslmode=disable
```

本地开发使用SQLite：`backend/projects.db`

## 部署信息
- 前端服务端口：5173
- 后端服务端口：9000  
- 生产服务器：120.92.36.175
- 需要在安全组开放对应端口