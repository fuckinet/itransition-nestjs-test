import { IsISO8601, IsOptional, Length } from 'class-validator';

export class EditUserDto {
  @IsOptional()
  @Length(2, 24)
  firstname: string;

  @IsOptional()
  @Length(2, 24)
  lastname: string;

  @IsOptional()
  @IsISO8601()
  birthday: string;
}
