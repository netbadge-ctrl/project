#!/bin/bash

# 部署检查脚本 - 验证项目配置是否正确

echo "🔍 CodeBuddy 项目部署检查 (版本 2.8.0)"
echo "================================================"

# 检查项目版本
echo "📋 检查项目版本..."
VERSION=$(grep '"version"' package.json | cut -d'"' -f4)
echo "  当前版本: $VERSION"

# 检查依赖
echo ""
echo "📦 检查关键依赖..."
if [ -f "package.json" ]; then
    echo "  ✅ package.json 存在"
    
    # 检查 Tailwind CSS 版本
    TAILWIND_VERSION=$(grep '"tailwindcss"' package.json | cut -d'"' -f4)
    echo "  📦 Tailwind CSS: $TAILWIND_VERSION"
    
    # 检查 React 版本
    REACT_VERSION=$(grep '"react"' package.json | cut -d'"' -f4)
    echo "  ⚛️  React: $REACT_VERSION"
    
    # 检查 Vite 版本
    VITE_VERSION=$(grep '"vite"' package.json | cut -d'"' -f4)
    echo "  ⚡ Vite: $VITE_VERSION"
else
    echo "  ❌ package.json 不存在"
fi

# 检查配置文件
echo ""
echo "⚙️  检查配置文件..."
if [ -f "tailwind.config.js" ]; then
    echo "  ✅ tailwind.config.js 存在"
else
    echo "  ❌ tailwind.config.js 缺失"
fi

if [ -f "postcss.config.js" ]; then
    echo "  ✅ postcss.config.js 存在"
else
    echo "  ❌ postcss.config.js 缺失"
fi

if [ -f "vite.config.ts" ]; then
    echo "  ✅ vite.config.ts 存在"
else
    echo "  ❌ vite.config.ts 缺失"
fi

# 检查样式文件
echo ""
echo "🎨 检查样式文件..."
if [ -f "styles.css" ]; then
    echo "  ✅ styles.css 存在"
    # 检查是否包含 Tailwind 指令
    if grep -q "@tailwind" styles.css; then
        echo "  ✅ Tailwind 指令已配置"
    else
        echo "  ❌ Tailwind 指令缺失"
    fi
else
    echo "  ❌ styles.css 缺失"
fi

# 检查 HTML 文件
echo ""
echo "📄 检查 HTML 文件..."
if [ -f "index.html" ]; then
    echo "  ✅ index.html 存在"
    # 检查是否移除了 CDN
    if grep -q "cdn.tailwindcss.com" index.html; then
        echo "  ⚠️  仍包含 Tailwind CDN (应该移除)"
    else
        echo "  ✅ Tailwind CDN 已移除"
    fi
else
    echo "  ❌ index.html 缺失"
fi

# 检查 API 配置
echo ""
echo "🌐 检查 API 配置..."
if [ -f "api.ts" ]; then
    echo "  ✅ api.ts 存在"
    API_URL=$(grep "API_BASE_URL" api.ts | head -1 | cut -d"'" -f2)
    echo "  🔗 API 地址: $API_URL"
else
    echo "  ❌ api.ts 缺失"
fi

# 检查部署脚本
echo ""
echo "🚀 检查部署脚本..."
scripts=("scripts/dev.sh" "scripts/prod.sh" "start.sh" "backend/deploy.sh")
for script in "${scripts[@]}"; do
    if [ -f "$script" ]; then
        echo "  ✅ $script 存在"
    else
        echo "  ❌ $script 缺失"
    fi
done

# 检查 node_modules
echo ""
echo "📁 检查依赖安装..."
if [ -d "node_modules" ]; then
    echo "  ✅ node_modules 存在"
    # 检查关键依赖
    if [ -d "node_modules/tailwindcss" ]; then
        echo "  ✅ Tailwind CSS 已安装"
    else
        echo "  ❌ Tailwind CSS 未安装"
    fi
    
    if [ -d "node_modules/react" ]; then
        echo "  ✅ React 已安装"
    else
        echo "  ❌ React 未安装"
    fi
else
    echo "  ❌ node_modules 不存在，需要运行 npm install"
fi

# 检查服务状态
echo ""
echo "🔧 检查服务状态..."
if curl -s http://localhost:5173 > /dev/null; then
    echo "  ✅ 前端服务运行正常 (http://localhost:5173)"
else
    echo "  ❌ 前端服务未运行"
fi

if curl -s http://localhost:9000/health > /dev/null; then
    echo "  ✅ 后端服务运行正常 (http://localhost:9000)"
else
    echo "  ❌ 后端服务未运行"
fi

echo ""
echo "================================================"
echo "🎉 检查完成！"
echo ""
echo "💡 建议的部署命令："
echo "  开发环境: ./scripts/dev.sh"
echo "  生产环境: ./scripts/prod.sh"
echo "  服务器部署: ./start.sh"
echo ""