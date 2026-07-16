import { IsOptional } from 'class-validator';

export class UpdateDayDto {
  /** ProseMirror JSON из TipTap. null очищает описание. */
  @IsOptional()
  description?: unknown;
}
