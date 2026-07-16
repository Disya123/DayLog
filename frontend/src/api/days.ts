import { api } from './client';
import type { Day } from './types';

export const daysApi = {
  create: (calendarId: string, date: Date) =>
    api.post<Day>(`/calendars/${calendarId}/days`, { date }).then((r) => r.data),

  update: (id: string, data: { description?: unknown | null }) =>
    api.patch<Day>(`/days/${id}`, data).then((r) => r.data),

  remove: (id: string) => api.delete(`/days/${id}`).then((r) => r.data),
};
