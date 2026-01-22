const API_BASE = 'http://localhost:3001';

class ApiClient {
  private getToken() {
    return localStorage.getItem('accessToken');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const token = this.getToken();
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (response.status === 401) {
      await this.refreshToken();
      const newToken = this.getToken();
      if (newToken) {
        return fetch(`${API_BASE}${endpoint}`, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${newToken}`,
            ...options.headers,
          },
        });
      }
    }

    return response;
  }

  async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return;

    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const { accessToken } = await response.json();
        localStorage.setItem('accessToken', accessToken);
      }
    } catch {
      this.logout();
    }
  }

  async login(email: string, password: string) {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      return data;
    }
    const errorData = await response.json();
    throw new Error(errorData.error || errorData[0]?.message || 'Login failed');
  }

  async register(email: string, password: string) {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      return data;
    }
    const errorData = await response.json();
    throw new Error(errorData.error || errorData[0]?.message || 'Registration failed');
  }

  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  async getTasks(params: { page?: number; search?: string; status?: string } = {}) {
    const query = new URLSearchParams(params as any).toString();
    const response = await this.request(`/tasks?${query}`);
    return response.json();
  }

  async createTask(title: string, description?: string) {
    const response = await this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify({ title, description }),
    });
    return response.json();
  }

  async updateTask(id: string, data: { title?: string; description?: string }) {
    const response = await this.request(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async deleteTask(id: string) {
    const response = await this.request(`/tasks/${id}`, { method: 'DELETE' });
    return response.json();
  }

  async toggleTask(id: string) {
    const response = await this.request(`/tasks/${id}/toggle`, { method: 'PATCH' });
    return response.json();
  }
}

export const api = new ApiClient();