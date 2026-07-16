import { Type } from 'class-transformer';
import { IsDate, IsOptional } from 'class-validator';

export class CreateDayDto {
  @Type(() => Date)
  @IsDate()
  date: Date;
}
