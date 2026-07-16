import { api } from './client';
import type { Calendar, ShareLink } from './types';

export const calendarsApi = {
  list: () => api.get<Calendar[]>('/calendars').then((r) => r.data),

  findOne: (id: string) => api.get<Calendar>(`/calendars/${id}`).then((r) => r.data),

  create: (data: { title: string; description?: string; color?: string }) =>
    api.post<Calendar>('/calendars', data).then((r) => r.data),

  update: (id: string, data: { title?: string; description?: string; color?: string }) =>
    api.patch<Calendar>(`/calendars/${id}`, data).then((r) => r.data),

  remove: (id: string) => api.delete(`/calendars/${id}`).then((r) => r.data),

  // Share links
  listShareLinks: (id: string) =>
    api.get<ShareLink[]>(`/calendars/${id}/share`).then((r) => r.data),

  createShareLink: (id: string) =>
    api.post<ShareLink>(`/calendars/${id}/share`).then((r) => r.data),

  revokeShareLink: (calendarId: string, linkId: string) =>
    api.delete(`/calendars/${calendarId}/share/${linkId}`).then((r) => r.data),
};
