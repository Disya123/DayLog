import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { DaysService } from './days.service';
import { CreateDayDto } from './dto/create-day.dto';
import { UpdateDayDto } from './dto/update-day.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CalendarAccessGuard } from '../auth/guards/calendar-access.guard';
import { ResourceAccessGuard } from '../auth/guards/resource-access.guard';

@UseGuards(JwtAuthGuard)
@Controller()
export class DaysController {
  constructor(private readonly daysService: DaysService) {}

  // Создание дня внутри календаря — calendarId в URL, проверяем через CalendarAccessGuard
  @UseGuards(CalendarAccessGuard)
  @Post('calendars/:calendarId/days')
  create(@Param('calendarId') calendarId: string, @Body() dto: CreateDayDto) {
    return this.daysService.create(calendarId, dto);
  }

  // PATCH/DELETE по id дня — резолвим calendarId из сущности
  @UseGuards(ResourceAccessGuard)
  @Patch('days/:id')
  update(@Param('id') id: string, @Body() dto: UpdateDayDto) {
    return this.daysService.update(id, dto);
  }

  @UseGuards(ResourceAccessGuard)
  @Delete('days/:id')
  remove(@Param('id') id: string) {
    return this.daysService.remove(id);
  }
}
