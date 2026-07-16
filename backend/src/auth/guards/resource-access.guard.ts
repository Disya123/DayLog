import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Actor } from '../../common/types';

/**
 * Резолвит calendarId из сущности задачи/дня и проверяет,
 * что actor имеет доступ к этому календарю.
 * Используется на маршрутах вида /days/:id и /tasks/:id,
 * где calendarId не передаётся в URL напрямую.
 */
@Injectable()
export class ResourceAccessGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const actor = request.actor as Actor;
    const params = request.params;

    if (!actor) {
      throw new ForbiddenException('Actor not resolved');
    }

    let calendarId: string | undefined;

    if (params.taskId) {
      const task = await this.prisma.task.findUnique({
        where: { id: params.taskId },
        select: { day: { select: { calendarId: true } } },
      });
      if (!task) throw new NotFoundException('Task not found');
      calendarId = task.day.calendarId;
    } else if (params.id) {
      // /days/:id
      const day = await this.prisma.day.findUnique({
        where: { id: params.id },
        select: { calendarId: true },
      });
      if (!day) throw new NotFoundException('Day not found');
      calendarId = day.calendarId;
    }

    if (!calendarId) {
      throw new ForbiddenException('Could not resolve calendar from resource');
    }

    if (actor.type === 'guest') {
      if (actor.calendarId !== calendarId) {
        throw new ForbiddenException('Guest can only access the shared calendar');
      }
      return true;
    }

    const calendar = await this.prisma.calendar.findFirst({
      where: { id: calendarId, ownerId: actor.id },
      select: { id: true },
    });
    if (!calendar) {
      throw new NotFoundException('Resource not found or access denied');
    }

    // Сохраняем для использования в контроллере
    request.resolvedCalendarId = calendarId;
    return true;
  }
}
