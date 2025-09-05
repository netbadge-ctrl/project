#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const envConfigs = {
  development: {
    VITE_APP_ENV: 'development',
    VITE_API_BASE_URL: 'http://localhost:9000/api',
    VITE_FRONTEND_URL: 'http://localhost:5173',
    VITE_ENABLE_OIDC: 'false',
    VITE_MOCK_USER_ID: '22231'
  },
  production: {
    VITE_APP_ENV: 'production',
    VITE_API_BASE_URL: 'http://120.92.36.175:9000/api',
    VITE_FRONTEND_URL: 'http://120.92.36.175:5173',
    VITE_ENABLE_OIDC: 'true',
    VITE_MOCK_USER_ID: ''
  }
};

function writeEnvFile(env) {
  const config = envConfigs[env];
  if (!config) {
    console.error(`❌ 未知环境: ${env}`);
    console.log('可用环境: development, production');
    process.exit(1);
  }

  const envContent = Object.entries(config)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  fs.writeFileSync('.env.local', envContent);
  
  console.log(`✅ 已切换到 ${env} 环境`);
  console.log('📋 当前配置:');
  Object.entries(config).forEach(([key, value]) => {
    console.log(`  ${key}=${value}`);
  });
  console.log('\n🔄 请重启开发服务器以应用新配置');
}

const env = process.argv[2];
if (!env) {
  console.log('🔧 环境配置切换工具');
  console.log('');
  console.log('用法: node switch-env.js <environment>');
  console.log('');
  console.log('可用环境:');
  console.log('  development  - 本地开发模式 (禁用OIDC)');
  console.log('  production   - 生产环境模式 (启用OIDC)');
  console.log('');
  console.log('示例:');
  console.log('  node switch-env.js development');
  console.log('  node switch-env.js production');
  process.exit(0);
}

writeEnvFile(env);