#!/bin/bash

echo "=== 网络连接诊断 ==="

echo "1. 检查本机IP地址:"
hostname -I

echo "2. 检查网络接口:"
ip addr show | grep -E "(inet|UP)"

echo "3. 从本机测试外部IP访问:"
timeout 10 curl -s http://120.92.44.85:9000/health && echo " - 外部IP访问成功" || echo " - 外部IP访问失败"

echo "4. 测试端口连通性:"
timeout 5 telnet 120.92.44.85 9000 2>&1 | head -3

echo "5. 检查当前监听的服务:"
netstat -tlnp | grep -E ":9000|:5173"

echo "6. 测试不同IP绑定:"
curl -s http://127.0.0.1:9000/health && echo " - localhost 正常"
curl -s http://$(hostname -I | awk '{print $1}'):9000/health && echo " - 内网IP 正常" || echo " - 内网IP 失败"