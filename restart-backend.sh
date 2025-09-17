#!/bin/bash

# 停止现有的后端服务
echo "停止现有的后端服务..."
pkill -f project-management-backend
pkill -f backend-app

# 等待进程完全停止
sleep 2

# 进入后端目录
cd backend

# 重新构建
echo "重新构建后端服务..."
go build -o backend-app .

# 启动新的后端服务
echo "启动后端服务..."
nohup ./backend-app > backend.log 2>&1 &

# 显示进程状态
sleep 2
echo "后端服务状态:"
ps aux | grep -E "(backend-app|project-management-backend)" | grep -v grep

echo "后端服务已重启完成!"
echo "日志文件: backend/backend.log"