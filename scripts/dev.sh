#!/bin/bash

# 开发环境启动脚本

echo "🔧 启动开发环境..."
echo "📋 配置信息:"
echo "  - 环境: development"
echo "  - OIDC认证: 禁用"
echo "  - API地址: http://localhost:9000/api"
echo "  - 模拟用户: 陈楠 (ID: 22231)"
echo ""

# 设置开发环境变量
export VITE_APP_ENV=development
export VITE_API_BASE_URL=http://localhost:9000/api
export VITE_FRONTEND_URL=http://localhost:5173
export VITE_ENABLE_OIDC=false
export VITE_MOCK_USER_ID=22231

# 启动前端开发服务器
npm run dev