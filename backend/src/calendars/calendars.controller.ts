import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CalendarsService } from './calendars.service';
import { CreateCalendarDto } from './dto/create-calendar.dto';
import { UpdateCalendarDto } from './dto/update-calendar.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CalendarAccessGuard } from '../auth/guards/calendar-access.guard';
import { CurrentActor } from '../common/decorators/current-actor.decorator';
import { Actor } from '../common/types';

@UseGuards(JwtAuthGuard)
@Controller('calendars')
export class CalendarsController {
  constructor(private readonly calendarsService: CalendarsService) {}

  @Get()
  list(@CurrentActor() actor: Actor) {
    return this.calendarsService.listForActor(actor);
  }

  @Post()
  create(@CurrentActor() actor: Actor, @Body() dto: CreateCalendarDto) {
    return this.calendarsService.create(actor, dto);
  }

  @UseGuards(CalendarAccessGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.calendarsService.findOneWithTree(id);
  }

  @UseGuards(CalendarAccessGuard)
  @Patch(':id')
  update(@Param('id') id: string, @CurrentActor() actor: Actor, @Body() dto: UpdateCalendarDto) {
    return this.calendarsService.update(id, actor, dto);
  }

  @UseGuards(CalendarAccessGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentActor() actor: Actor) {
    return this.calendarsService.remove(id, actor);
  }

  // --- Share links (owner only) ---

  @UseGuards(CalendarAccessGuard)
  @Get(':id/share')
  listShareLinks(@Param('id') id: string, @CurrentActor() actor: Actor) {
    return this.calendarsService.listShareLinks(id, actor);
  }

  @UseGuards(CalendarAccessGuard)
  @Post(':id/share')
  createShareLink(@Param('id') id: string, @CurrentActor() actor: Actor) {
    return this.calendarsService.createShareLink(id, actor);
  }

  @UseGuards(CalendarAccessGuard)
  @Delete(':id/share/:linkId')
  revokeShareLink(
    @Param('id') id: string,
    @Param('linkId') linkId: string,
    @CurrentActor() actor: Actor,
  ) {
    return this.calendarsService.revokeShareLink(id, linkId, actor);
  }
}
