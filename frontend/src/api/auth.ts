import { api } from './client';
import type { AuthResponse, Actor } from './types';

export const authApi = {
  register: (data: { email: string; password: string; name: string }) =>
    api.post<AuthResponse>('/auth/register', data).then((r) => r.data),

  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  loginAsGuest: (data: { token: string; name: string }) =>
    api.post<AuthResponse>('/auth/guest', data).then((r) => r.data),

  me: () => api.get<Actor & { type: string }>('/auth/me').then((r) => r.data),
};
