#!/bin/bash

# OIDC 401 错误修复部署脚本
# 解决线上环境OIDC登录401未授权错误

echo "🔧 开始部署OIDC 401错误修复..."
echo "============================================"

# 检查环境
if [ ! -f ".env.production" ]; then
    echo "❌ 错误：未找到生产环境配置文件"
    exit 1
fi

echo "📋 当前修复内容："
echo "✅ JWT认证系统集成到OIDC登录流程"
echo "✅ API调用自动携带JWT认证头"
echo "✅ Token过期自动重新登录"
echo "✅ 错误处理和用户体验优化"
echo ""

# 构建项目
echo "🔨 构建项目..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 构建失败！"
    exit 1
fi

echo "✅ 构建成功"

# 检查后端服务
echo "🔍 检查后端服务..."
backend_pid=$(ps aux | grep "project-management-backend" | grep -v grep | awk '{print $2}')

if [ ! -z "$backend_pid" ]; then
    echo "🔄 发现运行中的后端服务 (PID: $backend_pid)，正在重启..."
    kill $backend_pid
    sleep 2
fi

# 启动后端服务
echo "🚀 启动后端服务..."
cd backend
nohup go run main.go > backend.log 2>&1 &
backend_new_pid=$!
echo "✅ 后端服务已启动 (PID: $backend_new_pid)"

# 等待后端启动
sleep 3

# 检查后端是否正常运行
if curl -s http://localhost:9000/health > /dev/null; then
    echo "✅ 后端服务健康检查通过"
else
    echo "❌ 后端服务启动失败"
    cat backend.log
    exit 1
fi

cd ..

# 启动前端预览服务
echo "🌐 启动前端预览服务..."

# 杀死旧的预览服务
preview_pid=$(ps aux | grep "vite preview" | grep -v grep | awk '{print $2}')
if [ ! -z "$preview_pid" ]; then
    echo "🔄 发现运行中的预览服务 (PID: $preview_pid)，正在重启..."
    kill $preview_pid
    sleep 2
fi

# 启动新的预览服务
nohup npm run preview > frontend.log 2>&1 &
preview_new_pid=$!
echo "✅ 前端预览服务已启动 (PID: $preview_new_pid)"

# 等待前端启动
sleep 5

echo ""
echo "🎉 OIDC 401错误修复部署完成！"
echo "============================================"
echo "📊 服务状态："
echo "  - 前端服务: http://localhost:5173/ (PID: $preview_new_pid)"
echo "  - 后端服务: http://localhost:9000/ (PID: $backend_new_pid)"
echo ""
echo "🔧 修复内容验证："
echo "  1. 访问应用进行OIDC登录"
echo "  2. 检查JWT token是否正确获取"
echo "  3. 验证API调用是否正常工作"
echo ""
echo "📋 测试页面："
echo "  - JWT认证测试: http://localhost:5173/test-jwt-auth.html"
echo ""
echo "🚨 如果仍有问题，检查日志文件："
echo "  - 后端日志: backend/backend.log"
echo "  - 前端日志: frontend.log"
echo ""
echo "✅ 修复完成！OIDC登录401错误应已解决。"