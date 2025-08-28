import { Project, User, OkrSet } from './types';

// 后端API基础URL
const API_BASE_URL = 'http://120.92.36.175:9000/api';

// 通用的API请求函数
const apiRequest = async <T>(endpoint: string, options?: RequestInit): Promise<T> => {
    try {
        console.log(`Making API request to: ${API_BASE_URL}${endpoint}`, options);
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
            ...options,
        });

        console.log(`API response status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`API error response:`, errorText);
            throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        console.log(`API response data:`, data);
        return data;
    } catch (error) {
        console.error(`API request error:`, error);
        throw error;
    }
};

export const api = {
    fetchProjects: (): Promise<Project[]> => {
        return apiRequest<Project[]>('/projects');
    },
    
    fetchOkrSets: (): Promise<OkrSet[]> => {
        return apiRequest<OkrSet[]>('/okr-sets');
    },
    
    fetchUsers: (): Promise<User[]> => {
        return apiRequest<User[]>('/users');
    },

    login: (userId: string): Promise<User> => {
        // 简化的登录逻辑：获取所有用户，然后找到指定用户
        return api.fetchUsers().then(users => {
            const user = users.find(u => u.id === userId);
            if (user) {
                return user;
            }
            throw new Error('User not found');
        });
    },

    createProject: (projectData: Omit<Project, 'id'>): Promise<Project> => {
        return apiRequest<Project>('/projects', {
            method: 'POST',
            body: JSON.stringify(projectData),
        });
    },
    
    updateProject: (projectId: string, updates: Partial<Project>): Promise<Project> => {
        return apiRequest<Project>(`/projects/${projectId}`, {
            method: 'PATCH',
            body: JSON.stringify(updates),
        });
    },

    deleteProject: (projectId: string): Promise<{ success: boolean }> => {
        return apiRequest<{ success: boolean }>(`/projects/${projectId}`, {
            method: 'DELETE',
        });
    },
    
    updateOkrSet: (updatedSet: OkrSet): Promise<OkrSet> => {
        return apiRequest<OkrSet>(`/okr-sets/${updatedSet.periodId}`, {
            method: 'PUT',
            body: JSON.stringify(updatedSet),
        });
    },

    createOkrSet: (periodId: string, periodName: string): Promise<OkrSet> => {
        return apiRequest<OkrSet>('/okr-sets', {
            method: 'POST',
            body: JSON.stringify({ periodId, periodName }),
        });
    },
    
    performWeeklyRollover: (): Promise<{ updatedProjectIds: string[] }> => {
        return apiRequest<{ updatedProjectIds: string[] }>('/perform-weekly-rollover', {
            method: 'POST',
        });
    }
};