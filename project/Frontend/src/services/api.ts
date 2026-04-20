import axios from 'axios';
import type { AxiosInstance } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface UserOut {
  user_id: number;
  username: string;
  email: string;
  role: string;
  active: boolean;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface YieldPredictionInput {
  country: string;
  crop: string;
  year: number;
  avg_temp: number;
  rainfall: number;
  rain_days: number;
  frost_days: number;
  heat_days: number;
  humidity: number;
  sown_area: number;
}

export interface YieldPredictionOutput {
  predicted_yield: number;
  production_estimate: number;
  shap_explaination?: number[];
}

export interface PredictionLog {
  pred_id: number;
  user_id: number;
  inputs_json: Record<string, any>;
  predicted_yield: number;
  shap_json?: number[];
  timestamp: string;
}

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.token = localStorage.getItem('access_token');
    if (this.token) {
      this.setAuthToken(this.token);
    }
  }

  private setAuthToken(token: string) {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // Auth endpoints
  async register(data: RegisterRequest): Promise<UserOut> {
    const response = await this.client.post<UserOut>('/auth/register', data);
    return response.data;
  }

  async login(username: string, password: string): Promise<Token> {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    const response = await this.client.post<Token>('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
      this.setAuthToken(response.data.access_token);
    }

    return response.data;
  }

  logout() {
    localStorage.removeItem('access_token');
    delete this.client.defaults.headers.common['Authorization'];
  }

  // User endpoints
  async predictYield(data: YieldPredictionInput): Promise<YieldPredictionOutput> {
    const response = await this.client.post<YieldPredictionOutput>('/user/predict-yield', data);
    return response.data;
  }

  async getPredictionHistory(): Promise<PredictionLog[]> {
    const response = await this.client.get<PredictionLog[]>('/user/my-predictions');
    return response.data;
  }

  // Admin endpoints
  async uploadCsvFile(formData: FormData): Promise<{ message: string }> {
    const response = await this.client.post<{ message: string }>('/admin/bulk-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async insertSingleData(data: any): Promise<{ message: string }> {
    const response = await this.client.post<{ message: string }>('/admin/data/single', data);
    return response.data;
  }

  async getExplorerData(skip: number = 0, limit: number = 50, filters?: any): Promise<any> {
    const params = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });
    if (filters?.country) params.append('country', filters.country);
    if (filters?.crop) params.append('crop', filters.crop);
    if (filters?.year) params.append('year', filters.year.toString());
    
    const response = await this.client.get(`/admin/data?${params.toString()}`);
    return response.data;
  }

  // Superuser endpoints
  async deleteFactData(factId: number): Promise<any> {
    const response = await this.client.delete(`/superuser/data/${factId}`);
    return response.data;
  }

  async getUsers(): Promise<UserOut[]> {
    const response = await this.client.get<UserOut[]>('/superuser/users');
    return response.data;
  }

  async updateUserRole(userId: number, role: string): Promise<any> {
    const response = await this.client.put(`/superuser/users/${userId}/role`, { role });
    return response.data;
  }

  async toggleUserActive(userId: number, active: boolean): Promise<any> {
    const response = await this.client.put(`/superuser/users/${userId}/active`, { active });
    return response.data;
  }

  async getModels(): Promise<any[]> {
    const response = await this.client.get<any[]>('/superuser/models');
    return response.data;
  }

  async activateModel(modelId: number): Promise<any> {
    const response = await this.client.put(`/superuser/models/activate/${modelId}`);
    return response.data;
  }

  async triggerRetraining(): Promise<any> {
    const response = await this.client.post('/superuser/retrain-model');
    return response.data;
  }

  async getKMeansReport(): Promise<any> {
    const response = await this.client.get('/admin/reports/kmeans');
    return response.data;
  }

  async getAprioriReport(): Promise<any> {
    const response = await this.client.get('/admin/reports/apriori');
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    const response = await this.client.get<{ status: string }>('/health');
    return response.data;
  }
}

export const apiClient = new ApiClient();
