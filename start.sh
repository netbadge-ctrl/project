#!/bin/bash

# 部署脚本：更新 codebuddy 项目并重启服务

set -e  # 遇到错误时停止执行

echo "开始部署 codebuddy..."

# 删除旧的项目目录
echo "删除旧的项目目录..."
rm -rf /opt/codebuddy

# 克隆最新代码
echo "克隆最新代码..."
git clone git@gitee.com:fengyikai/codebuddy.git /opt/codebuddy

# 进入项目目录
cd /opt/codebuddy

# 停止现有服务
echo "停止现有服务..."
# 停止后端服务
if [ -f backend.pid ]; then
    kill $(cat backend.pid) 2>/dev/null || true
    rm -f backend.pid
fi

# 停止前端服务
if [ -f frontend.pid ]; then
    kill $(cat frontend.pid) 2>/dev/null || true
    rm -f frontend.pid
fi

# 等待进程完全结束
sleep 3

# 启动后端服务
echo "启动后端服务..."
cd backend
export DATABASE_URL="postgresql://admin:Kingsoft0531@120.92.44.85:51022/project_codebuddy?sslmode=disable"
export PORT="9000"
source /root/.bash_profile

# 编译后端服务（如果需要）
go mod tidy
go build -o project-management-backend main.go

# 启动后端服务并记录 PID
nohup ./project-management-backend > backend.log 2>&1 &
echo $! > ../backend.pid
cd ..

# 启动前端服务
echo "启动前端服务..."
# 安装依赖（如果需要）
npm install

# 启动前端服务并记录 PID
nohup npm run dev > frontend.log 2>&1 &
echo $! > frontend.pid

echo "部署完成！"
echo "后端服务 PID: $(cat backend.pid)"
echo "前端服务 PID: $(cat frontend.pid)"

# 显示服务状态
sleep 2
echo "检查服务状态..."
ps aux | grep -E "(project-management-backend|vite)" | grep -v grep