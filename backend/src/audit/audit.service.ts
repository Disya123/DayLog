import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Actor } from '../common/types';

export type AuditAction = 'status_changed' | 'moved' | 'created' | 'deleted' | 'title_changed';

export interface AuditLogEntry {
  calendarId: string;
  actor: Actor;
  action: AuditAction;
  taskId: string;
  fromDayId?: string;
  toDayId?: string;
  meta?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  log(entry: AuditLogEntry) {
    return this.prisma.auditLog.create({
      data: {
        calendarId: entry.calendarId,
        actorType: entry.actor.type,
        actorName: entry.actor.name,
        action: entry.action,
        taskId: entry.taskId,
        fromDayId: entry.fromDayId,
        toDayId: entry.toDayId,
        meta: entry.meta
          ? (entry.meta as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      },
    });
  }

  listForCalendar(calendarId: string, taskId?: string, limit = 50) {
    return this.prisma.auditLog.findMany({
      where: { calendarId, ...(taskId ? { taskId } : {}) },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 200),
    });
  }
}
