import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CalendarAccessGuard } from '../auth/guards/calendar-access.guard';
import { ResourceAccessGuard } from '../auth/guards/resource-access.guard';
import { CurrentActor } from '../common/decorators/current-actor.decorator';
import { Actor } from '../common/types';

@UseGuards(JwtAuthGuard)
@Controller()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  // Создание задачи: calendarId в URL → CalendarAccessGuard проверяет доступ
  @UseGuards(CalendarAccessGuard)
  @Post('calendars/:calendarId/days/:dayId/tasks')
  create(
    @Param('dayId') dayId: string,
    @CurrentActor() actor: Actor,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasksService.create(dayId, actor, dto);
  }

  // PATCH / move / delete — calendarId резолвится из задачи через ResourceAccessGuard
  @UseGuards(ResourceAccessGuard)
  @Patch('tasks/:id')
  update(@Param('id') id: string, @CurrentActor() actor: Actor, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(id, actor, dto);
  }

  @UseGuards(ResourceAccessGuard)
  @Post('tasks/:id/move')
  move(@Param('id') id: string, @CurrentActor() actor: Actor, @Body() dto: MoveTaskDto) {
    return this.tasksService.move(id, actor, dto);
  }

  @UseGuards(ResourceAccessGuard)
  @Delete('tasks/:id')
  remove(@Param('id') id: string, @CurrentActor() actor: Actor) {
    return this.tasksService.remove(id, actor);
  }
}
