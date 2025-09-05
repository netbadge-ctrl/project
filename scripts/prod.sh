#!/bin/bash

# 生产环境启动脚本

echo "🚀 启动生产环境..."
echo "📋 配置信息:"
echo "  - 环境: production"
echo "  - OIDC认证: 启用"
echo "  - API地址: http://120.92.36.175:9000/api"
echo "  - 认证方式: OIDC单点登录"
echo ""

# 设置生产环境变量
export VITE_APP_ENV=production
export VITE_API_BASE_URL=http://120.92.36.175:9000/api
export VITE_FRONTEND_URL=http://120.92.36.175:5173
export VITE_ENABLE_OIDC=true
export VITE_MOCK_USER_ID=

# 构建并启动生产版本
npm run build
npm run preview