// API 配置和接口封装
const API_BASE_URL = 'http://localhost:9000';

// API 请求封装
export const api = {
  // 获取用户信息
  async getUser() {
    const response = await fetch(`${API_BASE_URL}/api/user`);
    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }
    return response.json();
  },

  // 获取用户列表
  async fetchUsers() {
    const response = await fetch(`${API_BASE_URL}/api/users`);
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    return response.json();
  },

  // 获取项目列表
  async getProjects() {
    const response = await fetch(`${API_BASE_URL}/api/projects`);
    if (!response.ok) {
      throw new Error('Failed to fetch projects');
    }
    return response.json();
  },

  // 获取项目列表（别名）
  async fetchProjects() {
    return this.getProjects();
  },

  // 获取OKR集合
  async fetchOkrSets() {
    const response = await fetch(`${API_BASE_URL}/api/okr-sets`);
    if (!response.ok) {
      throw new Error('Failed to fetch OKR sets');
    }
    return response.json();
  },

  // 创建OKR集合
  async createOkrSet(okrSet: any) {
    const response = await fetch(`${API_BASE_URL}/api/okr-sets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(okrSet),
    });
    if (!response.ok) {
      throw new Error('Failed to create OKR set');
    }
    return response.json();
  },

  // 更新OKR集合
  async updateOkrSet(periodId: string, okrSet: any) {
    const response = await fetch(`${API_BASE_URL}/api/okr-sets/${periodId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(okrSet),
    });
    if (!response.ok) {
      throw new Error('Failed to update OKR set');
    }
    return response.json();
  },

  // 执行周度滚动
  async performWeeklyRollover() {
    const response = await fetch(`${API_BASE_URL}/api/perform-weekly-rollover`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error('Failed to perform weekly rollover');
    }
    return response.json();
  },

  // 用户登录
  async login(credentials: any) {
    const response = await fetch(`${API_BASE_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    if (!response.ok) {
      throw new Error('Failed to login');
    }
    return response.json();
  },

  // 检查认证状态
  async checkAuth() {
    const response = await fetch(`${API_BASE_URL}/api/check-auth`);
    if (!response.ok) {
      throw new Error('Failed to check auth');
    }
    return response.json();
  },

  // OIDC令牌交换
  async oidcTokenExchange(token: any) {
    const response = await fetch(`${API_BASE_URL}/api/oidc-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(token),
    });
    if (!response.ok) {
      throw new Error('Failed to exchange OIDC token');
    }
    return response.json();
  },

  // 获取任务列表
  async getTasks() {
    const response = await fetch(`${API_BASE_URL}/api/tasks`);
    if (!response.ok) {
      throw new Error('Failed to fetch tasks');
    }
    return response.json();
  },

  // 创建项目
  async createProject(project: any) {
    const response = await fetch(`${API_BASE_URL}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(project),
    });
    if (!response.ok) {
      throw new Error('Failed to create project');
    }
    return response.json();
  },

  // 更新项目
  async updateProject(id: string, project: any) {
    const response = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(project),
    });
    if (!response.ok) {
      throw new Error('Failed to update project');
    }
    return response.json();
  },

  // 删除项目
  async deleteProject(id: string) {
    const response = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete project');
    }
    return response.json();
  },

  // 创建任务
  async createTask(task: any) {
    const response = await fetch(`${API_BASE_URL}/api/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(task),
    });
    if (!response.ok) {
      throw new Error('Failed to create task');
    }
    return response.json();
  },

  // 更新任务
  async updateTask(id: string, task: any) {
    const response = await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(task),
    });
    if (!response.ok) {
      throw new Error('Failed to update task');
    }
    return response.json();
  },

  // 删除任务
  async deleteTask(id: string) {
    const response = await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete task');
    }
    return response.json();
  },

  // 刷新用户数据
  async refreshUsers() {
    const response = await fetch(`${API_BASE_URL}/api/refresh-users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error('Failed to refresh users');
    }
    return response.json();
  },

  // 同步员工数据
  async syncEmployees() {
    const response = await fetch(`${API_BASE_URL}/api/sync-employees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error('Failed to sync employees');
    }
    return response.json();
  }
};

export default api;