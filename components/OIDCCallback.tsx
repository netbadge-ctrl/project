import React, { useEffect, useState, useRef } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { appConfig } from '../config/env';

// 全局标志，防止多个组件实例同时处理OIDC回调
let globalOIDCProcessing = false;

const OIDC_CONFIG = {
    ...appConfig.oidc,
    // 可能需要使用不同的token endpoint
    tokenEndpoint: 'https://oidc-public.ksyun.com:443/token'
};

const OIDCCallback: React.FC = () => {
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [error, setError] = useState<string>('');
    const hasProcessedRef = useRef(false); // 防止重复处理
    const isProcessingRef = useRef(false); // 防止并发处理

    useEffect(() => {
        // 增强的重复执行防护
        if (hasProcessedRef.current || isProcessingRef.current) {
            console.log('OIDC callback already processed or processing, skipping...');
            return;
        }

        // 检查URL中是否还有授权码参数，如果没有则说明已经处理过
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        if (!code) {
            console.log('No authorization code in URL, callback already processed');
            hasProcessedRef.current = true;
            return;
        }

        // 全局处理标志检查
        if (globalOIDCProcessing) {
            console.log('Another OIDC callback is already being processed globally');
            return;
        }

        const handleCallback = async () => {
            // 设置处理中标志
            isProcessingRef.current = true;
            globalOIDCProcessing = true;
            
            console.log('Starting OIDC callback processing...');
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            const state = urlParams.get('state');
            const error = urlParams.get('error');
            
            // 立即清理URL参数，防止刷新页面时重复处理
            window.history.replaceState({}, document.title, window.location.pathname);

            if (error) {
                setStatus('error');
                setError(`OIDC Error: ${error}`);
                return;
            }

            if (!code) {
                setStatus('error');
                setError('No authorization code received');
                return;
            }

            try {
                console.log('Starting token exchange with code:', code);
                
                // 多重检查防止重复使用授权码
                const sessionKey = `oidc_processing_${code}`;
                const usedCodes = JSON.parse(localStorage.getItem('used_oidc_codes') || '[]');
                
                // 检查是否正在处理相同的授权码
                if (sessionStorage.getItem(sessionKey)) {
                    throw new Error('授权码正在处理中，请稍候');
                }
                
                // 检查授权码是否已被使用
                if (usedCodes.includes(code)) {
                    throw new Error('授权码已被使用，请重新登录');
                }
                
                // 标记正在处理
                sessionStorage.setItem(sessionKey, 'processing');
                
                // 通过后端API交换授权码获取token
                const tokenResponse = await fetch(`${appConfig.apiBaseUrl}/oidc-token`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        code: code,
                        redirect_uri: OIDC_CONFIG.redirectUri
                    })
                });

                console.log('Token response status:', tokenResponse.status);

                if (!tokenResponse.ok) {
                    const errorText = await tokenResponse.text();
                    console.error('Token exchange error response:', errorText);
                    
                    // 解析后端返回的错误信息
                    try {
                        const errorData = JSON.parse(errorText);
                        if (errorData.error) {
                            throw new Error(errorData.error);
                        } else {
                            throw new Error(`Token exchange failed: ${tokenResponse.status} - ${errorText}`);
                        }
                    } catch (parseError) {
                        // 如果解析失败，使用原始错误信息
                        throw new Error(`Token exchange failed: ${tokenResponse.status} - ${errorText}`);
                    }
                }

                const tokens = await tokenResponse.json();
                console.log('Received tokens:', tokens);
                
                // 标记授权码为已使用
                const updatedUsedCodes = [...usedCodes, code];
                localStorage.setItem('used_oidc_codes', JSON.stringify(updatedUsedCodes));
                
                // 清理处理标记
                sessionStorage.removeItem(sessionKey);
                
                // 清理过期的授权码记录（保留最近10个）
                if (updatedUsedCodes.length > 10) {
                    localStorage.setItem('used_oidc_codes', JSON.stringify(updatedUsedCodes.slice(-10)));
                }
                
                // 解析用户信息
                if (tokens.id_token) {
                    // 解码JWT token获取用户信息（正确的base64url解码）
                    const payload = tokens.id_token.split('.')[1];
                    // Base64URL解码：替换字符并添加padding
                    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
                    const paddedBase64 = base64 + '='.repeat((4 - base64.length % 4) % 4);
                    
                    let userInfo;
                    try {
                        const decodedPayload = atob(paddedBase64);
                        userInfo = JSON.parse(decodedPayload);
                        console.log('Decoded user info:', userInfo);
                    } catch (decodeError) {
                        console.error('Failed to decode JWT payload:', decodeError);
                        throw new Error('Failed to decode user information from token');
                    }
                    
                    // 调用全局登录完成方法
                    if (window.completeOIDCLogin) {
                        await window.completeOIDCLogin(userInfo, tokens.access_token);
                    } else {
                        // 备用方案：直接调用JWT登录端点
                        try {
                            console.log('🔐 Fallback: Using direct JWT login...');
                            
                            // 调用JWT登录端点
                            const jwtResponse = await fetch(`${appConfig.apiBaseUrl}/jwt-login`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    access_token: tokens.access_token,
                                    user_info: {
                                        id: userInfo.sub || userInfo.id || userInfo.email,
                                        email: userInfo.email,
                                        name: userInfo.name || userInfo.preferred_username || userInfo.email
                                    }
                                })
                            });
                            
                            if (!jwtResponse.ok) {
                                const errorText = await jwtResponse.text();
                                throw new Error(`JWT登录失败: ${jwtResponse.status} - ${errorText}`);
                            }
                            
                            const jwtData = await jwtResponse.json();
                            
                            // 获取用户信息
                            const usersResponse = await fetch(`${appConfig.apiBaseUrl}/users`, {
                                headers: {
                                    'Authorization': `Bearer ${jwtData.access_token}`
                                }
                            });
                            
                            if (!usersResponse.ok) {
                                throw new Error('无法获取用户信息');
                            }
                            
                            const users = await usersResponse.json();
                            const dbUser = users.find((u: any) => u.email.toLowerCase() === userInfo.email.toLowerCase());
                            
                            if (!dbUser) {
                                throw new Error('用户未在系统中找到');
                            }
                            
                            const user = {
                                id: dbUser.id,
                                name: dbUser.name,
                                email: dbUser.email,
                                avatarUrl: dbUser.avatarUrl,
                                deptId: dbUser.deptId,
                                deptName: dbUser.deptName
                            };
                            
                            // 保存JWT token和用户信息
                            localStorage.setItem('jwt_token', jwtData.access_token);
                            localStorage.setItem('oidc_user', JSON.stringify(user));
                            localStorage.setItem('oidc_token', tokens.access_token);
                            
                            window.location.href = '/';
                        } catch (error) {
                            console.error('Fallback JWT login failed:', error);
                            throw new Error(`用户身份验证失败: ${error instanceof Error ? error.message : '未知错误'}，请联系管理员`);
                        }
                    }
                } else {
                    throw new Error('No ID token received');
                }

            } catch (err) {
                console.error('OIDC callback error:', err);
                setStatus('error');
                setError(err instanceof Error ? err.message : 'Unknown error occurred');
                
                // 清理处理标记
                const sessionKey = `oidc_processing_${code}`;
                sessionStorage.removeItem(sessionKey);
            } finally {
                // 标记为已处理
                hasProcessedRef.current = true;
                isProcessingRef.current = false;
                globalOIDCProcessing = false;
            }
        };

        handleCallback();
    }, []); // 空依赖数组，确保只执行一次

    if (status === 'loading') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-[#1A1A1A]">
                <LoadingSpinner />
                <p className="mt-4 text-gray-600 dark:text-gray-400">Processing login...</p>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-[#1A1A1A]">
                <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md max-w-md">
                    <div className="text-red-500 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">登录失败</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={() => window.location.href = '/'}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                        >
                            返回首页
                        </button>
                        {error.includes('授权码') && (
                            <button
                                onClick={() => {
                                    // 清理本地存储的授权码记录
                                    localStorage.removeItem('used_oidc_codes');
                                    sessionStorage.clear();
                                    window.location.href = '/';
                                }}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors"
                            >
                                清理缓存并重新登录
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default OIDCCallback;