import { IsString } from 'class-validator';

export class MoveTaskDto {
  @IsString()
  toDayId: string;
}
