import { IsEmail, IsNotEmpty, Length, IsISO8601 } from 'class-validator';

export class RegisterUserDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @Length(4, 24)
  password: string;

  @IsNotEmpty()
  @Length(2, 24)
  firstname: string;

  @IsNotEmpty()
  @Length(2, 24)
  lastname: string;

  @IsNotEmpty()
  @IsISO8601()
  birthday: string;
}
