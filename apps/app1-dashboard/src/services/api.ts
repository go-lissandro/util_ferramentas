import axios, { AxiosError } from 'axios';
import { useAuthStore } from '../store/authStore';

export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ── Request interceptor: inject Bearer token ───────────
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const tenant = useAuthStore.getState().tenant;
  if (tenant?.id) {
    config.headers['X-Tenant-ID'] = tenant.id;
  }
  return config;
});

// ── Response interceptor: handle 401 → logout ─────────
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ code?: string }>) => {
    const code = error.response?.data?.code;

    if (
      error.response?.status === 401 &&
      code !== 'INVALID_CREDENTIALS' // don't logout on bad login attempt
    ) {
      useAuthStore.getState().logout();
      window.location.href = '/app1/login';
    }

    return Promise.reject(error);
  }
);

// ── Typed API helpers ──────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ success: boolean; data: { user: unknown; tenant: unknown; accessToken: string; refreshToken: string } }>('/auth/login', { email, password }),

  register: (data: { name: string; email: string; password: string; tenantName?: string }) =>
    api.post('/auth/register', data),

  me: () => api.get('/auth/me'),

  logout: () => api.post('/auth/logout'),
};

export const usersApi = {
  list: () => api.get('/users'),
  updateRole: (id: string, role: string) => api.patch(`/users/${id}/role`, { role }),
  getApps: () => api.get('/users/apps'),
  updateAppPermission: (appKey: string, userId: string, canAccess: boolean) =>
    api.post(`/users/apps/${appKey}/permissions`, { userId, canAccess }),
};

export const billingApi = {
  getPlans: () => api.get('/billing/plans'),
  getSubscription: () => api.get('/billing/subscription'),
  checkout: (planId: string) => api.post('/billing/checkout', { planId }),
};
