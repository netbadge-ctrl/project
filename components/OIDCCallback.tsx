import React, { useEffect, useState } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

const OIDC_CONFIG = {
    clientId: 'api-uss',
    clientSecret: 'fdd6739fdc5d36cf5f10b92b3464e165',
    provider: 'https://oidc-public.ksyun.com:443',
    redirectUri: 'http://127.0.0.1:5173/oidc-callback',
    // 可能需要使用不同的token endpoint
    tokenEndpoint: 'https://oidc-public.ksyun.com:443/token'
};

const OIDCCallback: React.FC = () => {
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [error, setError] = useState<string>('');

    useEffect(() => {
        const handleCallback = async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            const state = urlParams.get('state');
            const error = urlParams.get('error');

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
                
                // 通过后端API交换授权码获取token
                const tokenResponse = await fetch('http://localhost:9000/api/oidc-token', {
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
                    throw new Error(`Token exchange failed: ${tokenResponse.status} - ${errorText}`);
                }

                const tokens = await tokenResponse.json();
                console.log('Received tokens:', tokens);
                
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
                        window.completeOIDCLogin(userInfo, tokens.access_token);
                    } else {
                        // 备用方案：通过API查找用户并保存
                        try {
                            const usersResponse = await fetch('http://localhost:9000/api/users');
                            const users = await usersResponse.json();
                            const dbUser = users.find((u: any) => u.email.toLowerCase() === userInfo.email.toLowerCase());
                            
                            if (!dbUser) {
                                throw new Error('用户未在系统中找到');
                            }
                            
                            const user = {
                                id: dbUser.id,
                                name: dbUser.name,
                                email: dbUser.email,
                                avatarUrl: dbUser.avatarUrl
                            };
                            
                            localStorage.setItem('oidc_user', JSON.stringify(user));
                            localStorage.setItem('oidc_token', tokens.access_token);
                            
                            window.location.href = '/';
                        } catch (error) {
                            console.error('Failed to find user in database:', error);
                            throw new Error('用户身份验证失败，请联系管理员');
                        }
                    }
                } else {
                    throw new Error('No ID token received');
                }

            } catch (err) {
                console.error('OIDC callback error:', err);
                setStatus('error');
                setError(err instanceof Error ? err.message : 'Unknown error occurred');
            }
        };

        handleCallback();
    }, []);

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
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Login Failed</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                    >
                        Return to Home
                    </button>
                </div>
            </div>
        );
    }

    return null;
};

export default OIDCCallback;