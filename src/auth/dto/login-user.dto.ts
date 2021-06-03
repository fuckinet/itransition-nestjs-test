import { IsEmail, IsNotEmpty, Length } from 'class-validator';

export class LoginUserDto {
  @IsEmail()
  login: string;

  @IsNotEmpty()
  @Length(4, 24)
  password: string;
}
