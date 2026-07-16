import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { Actor } from '../common/types';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(dayId: string, actor: Actor, dto: CreateTaskDto) {
    const day = await this.prisma.day.findUnique({
      where: { id: dayId },
      select: { id: true, calendarId: true },
    });
    if (!day) {
      throw new NotFoundException('Day not found');
    }

    // Очередной order = max(order) + 1
    const lastTask = await this.prisma.task.findFirst({
      where: { dayId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    const nextOrder = (lastTask?.order ?? -1) + 1;

    const task = await this.prisma.task.create({
      data: {
        dayId,
        title: dto.title,
        order: nextOrder,
      },
    });

    await this.auditService.log({
      calendarId: day.calendarId,
      actor,
      action: 'created',
      taskId: task.id,
      toDayId: day.id,
    });

    return task;
  }

  async update(id: string, actor: Actor, dto: UpdateTaskDto) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: { day: { select: { calendarId: true, id: true } } },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const updated = await this.prisma.task.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.done !== undefined && { done: dto.done }),
        ...(dto.order !== undefined && { order: dto.order }),
      },
    });

    // Аудит значимых изменений
    if (dto.done !== undefined && dto.done !== task.done) {
      await this.auditService.log({
        calendarId: task.day.calendarId,
        actor,
        action: 'status_changed',
        taskId: id,
        toDayId: task.day.id,
        meta: { from: task.done, to: dto.done },
      });
    }
    if (dto.title !== undefined && dto.title !== task.title) {
      await this.auditService.log({
        calendarId: task.day.calendarId,
        actor,
        action: 'title_changed',
        taskId: id,
        toDayId: task.day.id,
      });
    }

    return updated;
  }

  async move(id: string, actor: Actor, dto: MoveTaskDto) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: { day: { select: { id: true, calendarId: true } } },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const targetDay = await this.prisma.day.findUnique({
      where: { id: dto.toDayId },
      select: { id: true, calendarId: true },
    });
    if (!targetDay) {
      throw new NotFoundException('Target day not found');
    }
    // Оба дня должны принадлежать одному календарю
    if (targetDay.calendarId !== task.day.calendarId) {
      throw new NotFoundException('Target day does not belong to the same calendar');
    }

    const lastTask = await this.prisma.task.findFirst({
      where: { dayId: targetDay.id },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    const nextOrder = (lastTask?.order ?? -1) + 1;

    const fromDayId = task.day.id;

    const moved = await this.prisma.task.update({
      where: { id },
      data: { dayId: targetDay.id, order: nextOrder },
    });

    await this.auditService.log({
      calendarId: task.day.calendarId,
      actor,
      action: 'moved',
      taskId: id,
      fromDayId,
      toDayId: targetDay.id,
    });

    return moved;
  }

  async remove(id: string, actor: Actor) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: { day: { select: { id: true, calendarId: true } } },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.prisma.task.delete({ where: { id } });

    await this.auditService.log({
      calendarId: task.day.calendarId,
      actor,
      action: 'deleted',
      taskId: id,
      toDayId: task.day.id,
    });

    return { id };
  }

  /** Резолвит calendarId задачи — используется ResourceAccessGuard */
  async getCalendarIdForTask(id: string): Promise<string | null> {
    const task = await this.prisma.task.findUnique({
      where: { id },
      select: { day: { select: { calendarId: true } } },
    });
    return task?.day.calendarId ?? null;
  }
}
