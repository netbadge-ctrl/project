import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';
import App from './App';
import { AuthProvider } from './context/auth-context';
import { useAuth } from './context/auth-context';
import { startOIDCLogin } from './context/auth-context';
import { ThemeProvider } from './context/theme-context';
import { FilterStateProvider } from './context/FilterStateContext';
import { LoadingSpinner } from './components/LoadingSpinner';
import OIDCCallback from './components/OIDCCallback';
import { appConfig } from './config/env';
import { isDevelopment } from './config/env';

const AppGate: React.FC = () => {
    const authData = useAuth();
    const user = authData.user;
    const isLoading = authData.isLoading;
    const isAuthenticated = authData.isAuthenticated;

    // 检查是否是OIDC回调页面
    if (window.location.pathname === '/oidc-callback') {
        return <OIDCCallback />;
    }

    if (isLoading) {
        return <LoadingSpinner />;
    }

    // 如果未认证，根据环境配置决定处理方式
    if (!isAuthenticated) {
        if (isDevelopment && !appConfig.enableOIDC) {
            // 开发模式：显示认证失败信息
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-[#1A1A1A] text-gray-600 dark:text-gray-400">
                    <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md max-w-md">
                        <div className="text-yellow-500 mb-4">
                            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">开发模式认证失败</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">无法加载模拟用户，请检查后端服务是否启动</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                        >
                            重新加载
                        </button>
                    </div>
                </div>
            );
        } else {
            // 生产模式：跳转到OIDC登录
            startOIDCLogin();
            return (
                <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-[#1A1A1A] text-gray-600 dark:text-gray-400">
                    Redirecting to OIDC login...
                </div>
            );
        }
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-[#1A1A1A] text-red-500">
                Error: Unable to load user data.
            </div>
        );
    }

    return <App currentUser={user} />;
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <ThemeProvider>
    <AuthProvider>
      <FilterStateProvider>
        <AppGate />
      </FilterStateProvider>
    </AuthProvider>
  </ThemeProvider>
);