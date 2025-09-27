import React, { useState, useEffect, useCallback, useContext, createContext } from 'react';
import { api } from '../api.ts';
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
                    // 开发模式下调用不需要认证的模拟用户端点
                    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:9000/api'}/dev/mock-user`);
                    if (response.ok) {
                        const mockUser = await response.json();
                        setUser(mockUser);
                        setIsAuthenticated(true);
                        console.log('🔧 Mock user loaded from API:', mockUser.name);
                    } else {
                        // 如果 API 调用失败，使用本地模拟数据
                        const mockUser: User = {
                            id: appConfig.mockUserId || '22231',
                            name: '陈楠',
                            email: 'chennan1@kingsoft.com',
                            avatarUrl: `https://picsum.photos/seed/22231/40/40`,
                            deptId: 28508729,
                            deptName: '前端开发部'
                        };
                        setUser(mockUser);
                        setIsAuthenticated(true);
                        console.log('🔧 Mock user loaded locally (API unavailable):', mockUser.name);
                    }
                } catch (error) {
                    console.error('🔧 Failed to load mock user from API, using local fallback:', error);
                    // API 调用失败时的备选方案
                    const mockUser: User = {
                        id: appConfig.mockUserId || '22231',
                        name: '陈楠',
                        email: 'chennan1@kingsoft.com',
                        avatarUrl: `https://picsum.photos/seed/22231/40/40`,
                        deptId: 28508729,
                        deptName: '前端开发部'
                    };
                    setUser(mockUser);
                    setIsAuthenticated(true);
                    console.log('🔧 Mock user loaded locally (fallback):', mockUser.name);
                }
            } else {
                // 生产模式：检查OIDC和JWT认证状态
                console.log('🔐 Production mode: Checking OIDC authentication');
                
                try {
                    // 检查是否有保存的用户信息和JWT token
                    const savedUser = localStorage.getItem('oidc_user');
                    const jwtToken = localStorage.getItem('jwt_token');
                    
                    if (savedUser && jwtToken) {
                        console.log('🔐 Found saved user and JWT token, validating...');
                        
                        // 验证JWT token是否有效
                        try {
                            const testResponse = await fetch(`${appConfig.apiBaseUrl}/users`, {
                                headers: {
                                    'Authorization': `Bearer ${jwtToken}`
                                }
                            });
                            
                            if (testResponse.ok) {
                                // JWT token有效，恢复用户状态
                                const user = JSON.parse(savedUser);
                                setUser(user);
                                setIsAuthenticated(true);
                                console.log('🔐 JWT token valid, user restored:', user.name);
                            } else {
                                // JWT token无效，清除并重新登录
                                console.log('🔐 JWT token invalid, clearing and redirecting to login');
                                localStorage.removeItem('oidc_user');
                                localStorage.removeItem('oidc_token');
                                localStorage.removeItem('jwt_token');
                                setIsAuthenticated(false);
                                
                                // 在生产环境中重新引导到OIDC登录
                                if (appConfig.enableOIDC && !window.location.pathname.includes('/oidc-callback')) {
                                    console.log('🔐 Redirecting to OIDC login...');
                                    window.location.href = generateOIDCLoginUrl();
                                    return;
                                }
                            }
                        } catch (tokenError) {
                            console.error('🔐 Error validating JWT token:', tokenError);
                            // 清除无效的token
                            localStorage.removeItem('oidc_user');
                            localStorage.removeItem('oidc_token');
                            localStorage.removeItem('jwt_token');
                            setIsAuthenticated(false);
                        }
                    } else {
                        console.log('🔐 No saved authentication found');
                        setIsAuthenticated(false);
                        
                        // 在生产环境中自动引导到OIDC登录（除非在回调页面）
                        if (appConfig.enableOIDC && !window.location.pathname.includes('/oidc-callback')) {
                            console.log('🔐 Auto-redirecting to OIDC login...');
                            window.location.href = generateOIDCLoginUrl();
                            return;
                        }
                    }
                } catch (error) {
                    console.error('🗚️ Authentication initialization error:', error);
                }
            }
            
            setIsLoading(false);
        };
        
        initAuth();
    }, []);

    // 暴露给全局使用的登录方法
    window.completeOIDCLogin = async (userInfo: any, token: string) => {
        try {
            console.log('🔐 Starting OIDC login completion...', userInfo);
            
            // 第一步：调用JWT登录端点获取JWT token
            const jwtResponse = await fetch(`${appConfig.apiBaseUrl}/jwt-login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    access_token: token,
                    user_info: {
                        id: userInfo.sub || userInfo.id || userInfo.email,
                        email: userInfo.email,
                        name: userInfo.name || userInfo.preferred_username || userInfo.email
                    }
                })
            });
            
            if (!jwtResponse.ok) {
                const errorText = await jwtResponse.text();
                console.error('JWT login failed:', errorText);
                throw new Error(`JWT登录失败: ${jwtResponse.status} - ${errorText}`);
            }
            
            const jwtData = await jwtResponse.json();
            console.log('🔐 JWT login successful:', jwtData);
            
            // 第二步：通过邮箱查找数据库中的用户详细信息
            const usersResponse = await fetch(`${appConfig.apiBaseUrl}/users`, {
                headers: {
                    'Authorization': `Bearer ${jwtData.access_token}`
                }
            });
            
            if (!usersResponse.ok) {
                throw new Error('无法获取用户信息，请联系管理员');
            }
            
            const users = await usersResponse.json();
            const dbUser = users.find((u: any) => u.email.toLowerCase() === userInfo.email.toLowerCase());
            
            if (!dbUser) {
                console.error('User not found in database:', userInfo.email);
                alert('用户未在系统中找到，请联系管理员');
                return;
            }
            
            const user: User = {
                id: dbUser.id,
                name: dbUser.name,
                email: dbUser.email,
                avatarUrl: dbUser.avatarUrl,
                deptId: dbUser.deptId,
                deptName: dbUser.deptName
            };
            
            // 保存JWT token和用户信息到本地存储
            localStorage.setItem('jwt_token', jwtData.access_token);
            localStorage.setItem('oidc_user', JSON.stringify(user));
            localStorage.setItem('oidc_token', token); // 保留OIDC token用于登出
            
            console.log('🔐 User authentication completed:', user.name);
            
            setUser(user);
            setIsAuthenticated(true);
            
            // 跳转到首页
            window.location.href = '/';
        } catch (error) {
            console.error('Failed to complete OIDC login:', error);
            alert(`登录失败: ${error instanceof Error ? error.message : '未知错误'}，请重试`);
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
        localStorage.removeItem('jwt_token'); // 清除JWT token
        
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