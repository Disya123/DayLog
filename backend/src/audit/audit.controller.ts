import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CalendarAccessGuard } from '../auth/guards/calendar-access.guard';

@UseGuards(JwtAuthGuard, CalendarAccessGuard)
@Controller('calendars')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get(':id/audit')
  list(
    @Param('id') calendarId: string,
    @Query('taskId') taskId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.auditService.listForCalendar(
      calendarId,
      taskId,
      limit ? parseInt(limit, 10) : undefined,
    );
  }
}
