import { api } from './client';
import type { Task, AuditLog } from './types';

export const tasksApi = {
  create: (calendarId: string, dayId: string, title: string) =>
    api
      .post<Task>(`/calendars/${calendarId}/days/${dayId}/tasks`, { title })
      .then((r) => r.data),

  update: (id: string, data: { title?: string; done?: boolean; order?: number }) =>
    api.patch<Task>(`/tasks/${id}`, data).then((r) => r.data),

  move: (id: string, toDayId: string) =>
    api.post<Task>(`/tasks/${id}/move`, { toDayId }).then((r) => r.data),

  remove: (id: string) => api.delete(`/tasks/${id}`).then((r) => r.data),

  // Audit
  audit: (calendarId: string, taskId?: string) =>
    api
      .get<AuditLog[]>(`/calendars/${calendarId}/audit`, {
        params: taskId ? { taskId } : undefined,
      })
      .then((r) => r.data),
};
