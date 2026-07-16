import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Actor } from '../common/types';
import { CreateDayDto } from './dto/create-day.dto';
import { UpdateDayDto } from './dto/update-day.dto';

@Injectable()
export class DaysService {
  constructor(private readonly prisma: PrismaService) {}

  async create(calendarId: string, dto: CreateDayDto) {
    // Нормализуем дату к началу UTC-дня
    const normalized = normalizeToDate(dto.date);

    const existing = await this.prisma.day.findUnique({
      where: { calendarId_date: { calendarId, date: normalized } },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('A day with this date already exists in the calendar');
    }

    return this.prisma.day.create({
      data: { calendarId, date: normalized },
      include: { tasks: { orderBy: { order: 'asc' } } },
    });
  }

  async update(id: string, dto: UpdateDayDto) {
    const day = await this.findOwned(id);
    return this.prisma.day.update({
      where: { id },
      data: {
        description:
          dto.description === undefined
            ? undefined
            : dto.description === null
              ? Prisma.JsonNull
              : (dto.description as Prisma.InputJsonValue),
      },
      include: { tasks: { orderBy: { order: 'asc' } } },
    });
  }

  async remove(id: string) {
    await this.findOwned(id);
    await this.prisma.day.delete({ where: { id } });
    return { id };
  }

  async getCalendarIdForDay(id: string): Promise<string> {
    const day = await this.prisma.day.findUnique({
      where: { id },
      select: { calendarId: true },
    });
    if (!day) {
      throw new NotFoundException('Day not found');
    }
    return day.calendarId;
  }

  private async findOwned(id: string) {
    const day = await this.prisma.day.findUnique({
      where: { id },
      include: { tasks: { orderBy: { order: 'asc' } } },
    });
    if (!day) {
      throw new NotFoundException('Day not found');
    }
    return day;
  }
}

/** Округляем до полуночи UTC, чтобы дата хранилась без времени. */
export function normalizeToDate(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}
