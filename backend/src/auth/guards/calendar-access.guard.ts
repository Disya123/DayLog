import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Actor } from '../../common/types';

@Injectable()
export class CalendarAccessGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const actor = request.user as Actor;
    const calendarId = request.params.calendarId ?? request.params.id;

    if (!actor) {
      throw new ForbiddenException('Actor not resolved');
    }

    // Гость привязан к одному календарю — проверяем совпадение
    if (actor.type === 'guest') {
      if (!actor.calendarId || actor.calendarId !== calendarId) {
        throw new ForbiddenException('Guest can only access the shared calendar');
      }
      return true;
    }

    // Владелец — ищем календарь среди его
    const calendar = await this.prisma.calendar.findFirst({
      where: { id: calendarId, ownerId: actor.id },
      select: { id: true },
    });

    if (!calendar) {
      throw new NotFoundException('Calendar not found or access denied');
    }

    return true;
  }
}
