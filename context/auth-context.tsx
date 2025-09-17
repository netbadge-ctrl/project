import React, { useState, useEffect, useCallback, useContext, createContext } from 'react';
import { api } from '../api';
import { User } from '../types';
import { appConfig, isDevelopment } from '../config/env';

interface AuthContextType {
    user: User | null;
    login: (userId: string) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// OIDC配置 - 使用环境配置
const OIDC_CONFIG = appConfig.oidc;

// 生成OIDC登录URL
const generateOIDCLoginUrl = (): string => {
    const params = new URLSearchParams({
        client_id: OIDC_CONFIG.clientId,
        response_type: 'code',
        scope: OIDC_CONFIG.scopes.join(' '),
        redirect_uri: OIDC_CONFIG.redirectUri,
        state: Math.random().toString(36).substring(2, 15)
    });
    
    return `${OIDC_CONFIG.provider}/auth?${params.toString()}`;
};

// 检查本地存储的认证状态
const checkLocalAuth = (): User | null => {
    const userStr = localStorage.getItem('oidc_user');
    const token = localStorage.getItem('oidc_token');
    
    if (userStr && token) {
        try {
            return JSON.parse(userStr);
        } catch {
            localStorage.removeItem('oidc_user');
            localStorage.removeItem('oidc_token');
        }
    }
    
    return null;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const initAuth = async () => {
            setIsLoading(true);
            
            // 开发模式：跳过OIDC认证，使用模拟用户
            if (isDevelopment && !appConfig.enableOIDC) {
                console.log('🔧 Development mode: Using mock authentication');
                try {
                    const users = await api.fetchUsers();
                    const mockUser = users.find(u => u.id === appConfig.mockUserId) || users[0];
                    
                    if (mockUser) {
                        setUser(mockUser);
                        setIsAuthenticated(true);
                        console.log('🔧 Mock user loaded:', mockUser.name);
                    } else {
                        console.error('🔧 No mock user found');
                        setIsAuthenticated(false);
                    }
                } catch (error) {
                    console.error('🔧 Failed to load mock user:', error);
                    setIsAuthenticated(false);
                }
            } else {
                // 生产模式：使用OIDC认证
                const localUser = checkLocalAuth();
                
                if (localUser) {
                    setUser(localUser);
                    setIsAuthenticated(true);
                } else {
                    setIsAuthenticated(false);
                }
            }
            
            setIsLoading(false);
        };
        
        initAuth();
    }, []);

    // 暴露给全局使用的登录方法
    window.completeOIDCLogin = async (userInfo: any, token: string) => {
        try {
            // 通过邮箱查找数据库中的用户
            const users = await api.fetchUsers();
            const dbUser = users.find(u => u.email.toLowerCase() === userInfo.email.toLowerCase());
            
            if (!dbUser) {
                console.error('User not found in database:', userInfo.email);
                alert('用户未在系统中找到，请联系管理员');
                return;
            }
            
            const user: User = {
                id: dbUser.id, // 使用数据库中的用户ID
                name: dbUser.name, // 使用数据库中的用户名
                email: dbUser.email,
                avatarUrl: dbUser.avatarUrl
            };
            
            // 保存到本地存储
            localStorage.setItem('oidc_user', JSON.stringify(user));
            localStorage.setItem('oidc_token', token);
            
            setUser(user);
            setIsAuthenticated(true);
            
            // 跳转到首页
            window.location.href = '/';
        } catch (error) {
            console.error('Failed to complete OIDC login:', error);
            alert('登录失败，请重试');
        }
    };

    const login = useCallback(async (userId: string) => {
        setIsLoading(true);
        try {
            const loggedInUser = await api.login(userId);
            setUser(loggedInUser);
            setIsAuthenticated(true);
        } catch (error) {
            console.error("Login failed", error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logout = useCallback(() => {
        // 清除本地存储
        localStorage.removeItem('oidc_user');
        localStorage.removeItem('oidc_token');
        
        setUser(null);
        setIsAuthenticated(false);
        
        // OIDC登出
        const token = localStorage.getItem('oidc_token');
        if (token) {
            const logoutUrl = `https://oidc.ksyun.com/logout?post_logout_redirect_uri=${encodeURIComponent(window.location.origin)}&id_token_hint=${token}`;
            window.location.href = logoutUrl;
        } else {
            // 如果没有token，直接刷新页面
            window.location.reload();
        }
    }, []);
    
    // 暴露给全局使用的登录方法
    const startOIDCLogin = () => {
        window.location.href = generateOIDCLoginUrl();
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading, isAuthenticated }}>
            {children}
        </AuthContext.Provider>
    );
};

// 暴露登录方法到全局
export const startOIDCLogin = () => {
    window.location.href = generateOIDCLoginUrl();
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};