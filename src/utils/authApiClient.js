/**
 * API 认证客户端
 * 处理JWT认证和API请求
 */

export class AuthAPIClient {
    constructor() {
        this.baseURL = '/api';
        this.token = localStorage.getItem('jwt_token');
    }

    /**
     * 设置JWT令牌
     */
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('jwt_token', token);
        } else {
            localStorage.removeItem('jwt_token');
        }
    }

    /**
     * 获取认证头
     */
    getAuthHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    /**
     * JWT登录
     */
    async jwtLogin(userInfo) {
        try {
            const response = await fetch(`${this.baseURL}/jwt-login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    access_token: `mock_oidc_token_${Date.now()}`,
                    user_info: userInfo
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                this.setToken(data.access_token);
                return { success: true, data };
            } else {
                return { success: false, error: data };
            }
        } catch (error) {
            return { success: false, error: { message: error.message } };
        }
    }

    /**
     * 检查令牌是否有效
     */
    async validateToken() {
        if (!this.token) return false;
        
        try {
            const response = await fetch(`${this.baseURL}/projects`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });
            
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    /**
     * 通用API请求方法
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            ...options,
            headers: {
                ...this.getAuthHeaders(),
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, config);
            
            // 如果是401，清除token并抛出认证错误
            if (response.status === 401) {
                this.setToken(null);
                throw new Error('认证失败，请重新登录');
            }
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error(`API请求失败 [${config.method || 'GET'} ${endpoint}]:`, error);
            throw error;
        }
    }

    /**
     * GET 请求
     */
    async get(endpoint) {
        return this.request(endpoint);
    }

    /**
     * POST 请求
     */
    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * PATCH 请求
     */
    async patch(endpoint, data) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    /**
     * DELETE 请求
     */
    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }

    /**
     * 登出
     */
    logout() {
        this.setToken(null);
    }

    /**
     * 检查是否已登录
     */
    isAuthenticated() {
        return !!this.token;
    }
}

// 创建全局实例
export const apiClient = new AuthAPIClient();

/**
 * API 方法封装
 */
export const api = {
    // 认证相关
    auth: {
        login: (userInfo) => apiClient.jwtLogin(userInfo),
        logout: () => apiClient.logout(),
        isAuthenticated: () => apiClient.isAuthenticated(),
        validateToken: () => apiClient.validateToken()
    },

    // 项目相关
    projects: {
        getAll: () => apiClient.get('/projects'),
        create: (project) => apiClient.post('/projects', project),
        update: (id, updates) => apiClient.patch(`/projects/${id}`, updates),
        delete: (id) => apiClient.delete(`/projects/${id}`)
    },

    // 用户相关
    users: {
        getAll: () => apiClient.get('/users'),
        refresh: () => apiClient.post('/refresh-users'),
        syncEmployees: () => apiClient.post('/sync-employees')
    },

    // OKR相关
    okr: {
        getAll: () => apiClient.get('/okr-sets'),
        create: (okr) => apiClient.post('/okr-sets', okr),
        update: (periodId, okr) => apiClient.request(`/okr-sets/${periodId}`, {
            method: 'PUT',
            body: JSON.stringify(okr)
        })
    },

    // 其他操作
    operations: {
        weeklyRollover: () => apiClient.post('/perform-weekly-rollover'),
        migrateData: () => apiClient.post('/migrate-initial-data')
    }
};

/**
 * 认证守卫装饰器
 * 自动处理认证检查和错误处理
 */
export function withAuth(apiFunction) {
    return async (...args) => {
        try {
            if (!apiClient.isAuthenticated()) {
                throw new Error('请先登录');
            }
            
            return await apiFunction(...args);
        } catch (error) {
            if (error.message.includes('认证失败')) {
                // 可以在这里触发重新登录流程
                console.error('认证失败，需要重新登录');
            }
            throw error;
        }
    };
}

/**
 * 批量应用认证守卫
 */
function applyAuthGuard(apiObj) {
    const guarded = {};
    for (const [key, value] of Object.entries(apiObj)) {
        if (typeof value === 'function') {
            guarded[key] = withAuth(value);
        } else if (typeof value === 'object') {
            guarded[key] = applyAuthGuard(value);
        } else {
            guarded[key] = value;
        }
    }
    return guarded;
}

// 应用认证守卫到敏感API
export const secureApi = {
    ...api,
    projects: applyAuthGuard(api.projects),
    users: applyAuthGuard(api.users),
    okr: applyAuthGuard(api.okr),
    operations: applyAuthGuard(api.operations)
};

// 默认导出安全API
export default secureApi;