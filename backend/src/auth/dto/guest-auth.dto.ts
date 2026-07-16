import { IsString, MinLength, MaxLength } from 'class-validator';

export class GuestAuthDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(1)
  @MaxLength(60)
  name: string;
}
