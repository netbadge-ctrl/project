import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider, useAuth, startOIDCLogin } from './context/auth-context';
import { ThemeProvider } from './context/theme-context';
import { LoadingSpinner } from './components/LoadingSpinner';
import OIDCCallback from './components/OIDCCallback';

const AppGate: React.FC = () => {
    const { user, isLoading, isAuthenticated } = useAuth();

    // 检查是否是OIDC回调页面
    if (window.location.pathname === '/oidc-callback') {
        return <OIDCCallback />;
    }

    if (isLoading) {
        return <LoadingSpinner />;
    }

    // 如果未认证，直接跳转到OIDC登录页面
    if (!isAuthenticated) {
        startOIDCLogin();
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-[#1A1A1A] text-gray-600 dark:text-gray-400">
                Redirecting to OIDC login...
            </div>
        );
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
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <AppGate />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);