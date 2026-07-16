// Типы, соответствующие Prisma-моделям на бэкенде

export type ActorType = 'user' | 'guest';

export interface Actor {
  type: ActorType;
  id: string;
  name: string;
  email?: string;
  calendarId?: string;
  shareLinkId?: string;
}

export interface AuthResponse {
  accessToken: string;
  actor: Actor;
}

export interface Calendar {
  id: string;
  ownerId: string;
  title: string;
  description?: string | null;
  color: string;
  createdAt: string;
  updatedAt: string;
  days?: Day[];
  _count?: { days: number; shareLinks: number };
}

export interface ShareLink {
  id: string;
  calendarId: string;
  token: string;
  createdAt: string;
  _count?: { guests: number };
}

export interface Day {
  id: string;
  calendarId: string;
  date: string;
  description?: unknown | null;
  tasks: Task[];
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  dayId: string;
  title: string;
  done: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  calendarId: string;
  actorType: string;
  actorName: string;
  action: string;
  taskId: string;
  fromDayId?: string | null;
  toDayId?: string | null;
  meta?: unknown | null;
  createdAt: string;
}
