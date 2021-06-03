import { Body, Controller, Post, HttpCode, UseGuards } from '@nestjs/common';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(204)
  async registerUser(@Body() registerUserDto: RegisterUserDto) {
    await this.authService.createUser(registerUserDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async loginUser(@Body() loginUserDto: LoginUserDto) {
    const jwt = await this.authService.loginUser(loginUserDto);
    return { token: jwt };
  }
}
