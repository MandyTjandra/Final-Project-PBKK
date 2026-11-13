import {
  BrewRecipe,
  CoffeeBean,
  RatioCalculationResult,
  Review,
  User,
} from '../types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

function getAuthHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('brewlab_access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  // Auth
  async register(data: { email: string; password: string; name: string; role?: string }) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Registration failed' }));
      throw new Error(err.message || 'Registration failed');
    }
    const result = await res.json();
    if (result.accessToken) {
      localStorage.setItem('brewlab_access_token', result.accessToken);
      localStorage.setItem('brewlab_refresh_token', result.refreshToken);
      localStorage.setItem('brewlab_user', JSON.stringify(result.user));
    }
    return result;
  },

  async login(data: { email: string; password: string }) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Login failed' }));
      throw new Error(err.message || 'Invalid email or password');
    }
    const result = await res.json();
    if (result.accessToken) {
      localStorage.setItem('brewlab_access_token', result.accessToken);
      localStorage.setItem('brewlab_refresh_token', result.refreshToken);
      localStorage.setItem('brewlab_user', JSON.stringify(result.user));
    }
    return result;
  },

  async getMe(): Promise<User | null> {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: getAuthHeader(),
      });
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  },

  logout() {
    localStorage.removeItem('brewlab_access_token');
    localStorage.removeItem('brewlab_refresh_token');
    localStorage.removeItem('brewlab_user');
  },

  // Beans
  async getBeans(params?: {
    search?: string;
    roastLevel?: string;
    process?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: CoffeeBean[]; meta: any }> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.roastLevel) query.append('roastLevel', params.roastLevel);
    if (params?.process) query.append('process', params.process);
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));

    const res = await fetch(`${API_BASE}/beans?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch coffee beans');
    return res.json();
  },

  async getBeanById(id: string): Promise<CoffeeBean> {
    const res = await fetch(`${API_BASE}/beans/${id}`);
    if (!res.ok) throw new Error('Coffee bean not found');
    return res.json();
  },

  async createBean(data: any): Promise<CoffeeBean> {
    const res = await fetch(`${API_BASE}/beans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to create bean' }));
      throw new Error(err.message || 'Failed to create bean');
    }
    return res.json();
  },

  async updateBeanStock(id: string, stockGrams: number): Promise<CoffeeBean> {
    const res = await fetch(`${API_BASE}/beans/${id}/stock`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ stockGrams }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to update stock' }));
      throw new Error(err.message || 'Failed to update stock');
    }
    return res.json();
  },

  async deleteBean(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/beans/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    if (!res.ok) throw new Error('Failed to delete bean');
  },

  // Recipes
  async getRecipes(params?: {
    search?: string;
    method?: string;
    difficulty?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: BrewRecipe[]; meta: any }> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.method) query.append('method', params.method);
    if (params?.difficulty) query.append('difficulty', params.difficulty);
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));

    const res = await fetch(`${API_BASE}/recipes?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch recipes');
    return res.json();
  },

  async getRecipeById(id: string): Promise<BrewRecipe> {
    const res = await fetch(`${API_BASE}/recipes/${id}`);
    if (!res.ok) throw new Error('Recipe not found');
    return res.json();
  },

  async createRecipe(data: any): Promise<BrewRecipe> {
    const res = await fetch(`${API_BASE}/recipes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Failed to create recipe' }));
      throw new Error(err.message || 'Failed to create recipe');
    }
    return res.json();
  },

  async calculateRatio(data: {
    coffeeDoseGrams: number;
    targetRatio?: number;
    method: string;
  }): Promise<RatioCalculationResult> {
    const res = await fetch(`${API_BASE}/recipes/calculate-ratio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to calculate ratio');
    return res.json();
  },

  // Reviews
  async addReview(recipeId: string, rating: number, comment?: string): Promise<Review> {
    const res = await fetch(`${API_BASE}/recipes/${recipeId}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ rating, comment }),
    });
    if (!res.ok) throw new Error('Failed to post review');
    return res.json();
  },

  // File Upload
  async uploadImage(file: File): Promise<{ url: string; fileName: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('brewlab_access_token');
    const res = await fetch(`${API_BASE}/uploads/image`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(err.message || 'Failed to upload image');
    }

    return res.json();
  },
};
