import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Actor } from '../common/types';
import { CreateCalendarDto } from './dto/create-calendar.dto';
import { UpdateCalendarDto } from './dto/update-calendar.dto';

@Injectable()
export class CalendarsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Список календарей владельца. Гость видит только свой привязанный. */
  async listForActor(actor: Actor) {
    if (actor.type === 'guest') {
      const calendar = await this.prisma.calendar.findUnique({
        where: { id: actor.calendarId! },
        include: {
          days: {
            orderBy: { date: 'asc' },
            include: { tasks: { orderBy: { order: 'asc' } } },
          },
        },
      });
      return calendar ? [calendar] : [];
    }
    return this.prisma.calendar.findMany({
      where: { ownerId: actor.id },
      orderBy: { createdAt: 'asc' },
      include: {
        _count: { select: { days: true, shareLinks: true } },
      },
    });
  }

  /** Полное дерево календаря: дни + задачи */
  async findOneWithTree(id: string) {
    return this.prisma.calendar.findUnique({
      where: { id },
      include: {
        days: {
          orderBy: { date: 'asc' },
          include: { tasks: { orderBy: { order: 'asc' } } },
        },
      },
    });
  }

  async create(actor: Actor, dto: CreateCalendarDto) {
    this.requireOwner(actor);
    return this.prisma.calendar.create({
      data: {
        ownerId: actor.id,
        title: dto.title,
        description: dto.description,
        color: dto.color ?? '#10b981',
      },
    });
  }

  async update(id: string, actor: Actor, dto: UpdateCalendarDto) {
    this.requireOwner(actor);
    await this.ensureOwnedBy(id, actor.id);
    return this.prisma.calendar.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, actor: Actor) {
    this.requireOwner(actor);
    await this.ensureOwnedBy(id, actor.id);
    await this.prisma.calendar.delete({ where: { id } });
    return { id };
  }

  // --- Share links ---

  async listShareLinks(calendarId: string, actor: Actor) {
    this.requireOwner(actor);
    await this.ensureOwnedBy(calendarId, actor.id);
    return this.prisma.shareLink.findMany({
      where: { calendarId },
      include: { _count: { select: { guests: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createShareLink(calendarId: string, actor: Actor) {
    this.requireOwner(actor);
    await this.ensureOwnedBy(calendarId, actor.id);
    return this.prisma.shareLink.create({
      data: { calendarId },
    });
  }

  async revokeShareLink(calendarId: string, linkId: string, actor: Actor) {
    this.requireOwner(actor);
    await this.ensureOwnedBy(calendarId, actor.id);
    await this.prisma.shareLink.delete({
      where: { id: linkId, calendarId },
    });
    return { id: linkId };
  }

  private requireOwner(actor: Actor) {
    if (actor.type !== 'user') {
      throw new ForbiddenException('Only the calendar owner can perform this action');
    }
  }

  private async ensureOwnedBy(calendarId: string, userId: string) {
    const calendar = await this.prisma.calendar.findFirst({
      where: { id: calendarId, ownerId: userId },
      select: { id: true },
    });
    if (!calendar) {
      throw new NotFoundException('Calendar not found or access denied');
    }
  }
}
