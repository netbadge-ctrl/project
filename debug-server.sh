#!/bin/bash

echo "=== 调试服务器连接问题 ==="

echo "1. 检查端口监听状态:"
netstat -tlnp | grep :9000 || echo "端口 9000 没有监听"
netstat -tlnp | grep :5173 || echo "端口 5173 没有监听"

echo ""
echo "2. 检查进程状态:"
ps aux | grep -E "(project-management-backend|vite)" | grep -v grep || echo "没有找到相关进程"

echo ""
echo "3. 检查防火墙状态:"
iptables -L INPUT | grep -E "(9000|5173)" || echo "防火墙可能阻塞了端口"

echo ""
echo "4. 测试本地连接:"
curl -s http://localhost:9000/health && echo " - 本地 9000 端口正常" || echo " - 本地 9000 端口失败"
curl -s http://127.0.0.1:9000/health && echo " - 127.0.0.1:9000 正常" || echo " - 127.0.0.1:9000 失败"

echo ""
echo "5. 检查日志文件:"
if [ -f /opt/codebuddy/backend/backend.log ]; then
    echo "后端日志 (最后10行):"
    tail -10 /opt/codebuddy/backend/backend.log
else
    echo "后端日志文件不存在"
fi

if [ -f /opt/codebuddy/frontend.log ]; then
    echo "前端日志 (最后10行):"
    tail -10 /opt/codebuddy/frontend.log
else
    echo "前端日志文件不存在"
fi