<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 企业级项目管理系统

这是一个功能完整的企业级项目管理系统，支持OKR管理、项目跟踪、团队协作等功能。

## 🔧 环境配置（重要）

本项目支持**本地调试**和**线上环境**两种模式：

### 本地调试模式（推荐用于开发）
```bash
# 1. 切换到开发模式
node switch-env.cjs development

# 2. 启动前端服务
npm install
npm run dev

# 访问: http://localhost:5173/
# 自动使用模拟用户"陈楠"登录，无需OIDC配置
```

### 线上环境模式（用于生产部署）
```bash
# 1. 切换到生产模式
node switch-env.cjs production

# 2. 构建并启动
npm run build
npm run preview

# 访问: http://120.92.36.175:5173/
# 使用完整OIDC认证流程
```

### 环境状态检查
```bash
# 检查当前环境配置
node check-env.cjs
```

> 📖 **详细配置说明**: 查看 [环境配置上下文记录](./ENVIRONMENT_CONTEXT.md) 了解完整的环境切换方法和故障排除指南

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key (可选)
3. Run the app:
   `npm run dev`

## Deploy on Server

**Prerequisites:** Go 1.21+, Node.js 16+, npm 8+

### Quick Start

1. Make sure ports 5173 (frontend) and 9000 (backend) are open in your server's security group
2. Start the application:
   `./start.sh`
3. Stop the application:
   `./stop.sh`

### Manual Deployment

See [SERVER_DEPLOYMENT.md](SERVER_DEPLOYMENT.md) for detailed deployment instructions.