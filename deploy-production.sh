#!/bin/bash

# 生产环境部署脚本
# 确保使用生产配置构建和部署

set -e

echo "开始生产环境部署..."

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "错误: 请在项目根目录运行此脚本"
    exit 1
fi

# 停止现有的开发服务器
echo "停止现有服务..."
pkill -f "vite" || true
pkill -f "node.*5173" || true
sleep 2

# 更新代码
echo "更新代码..."
git stash
git pull origin master

# 安装依赖
echo "安装依赖..."
npm install

# 清理旧的构建文件
echo "清理旧构建..."
rm -rf dist

# 使用生产配置构建
echo "使用生产配置构建项目..."
npm run build

# 检查构建是否成功
if [ ! -d "dist" ]; then
    echo "错误: 构建失败，dist目录不存在"
    exit 1
fi

# 启动生产服务器
echo "启动生产服务器..."
nohup npm run preview > /dev/null 2>&1 &

echo "等待服务器启动..."
sleep 5

# 检查服务器是否启动成功
if curl -f http://localhost:5173 > /dev/null 2>&1; then
    echo "✅ 生产环境部署成功！"
    echo "服务器运行在: http://localhost:5173"
else
    echo "❌ 服务器启动失败"
    exit 1
fi