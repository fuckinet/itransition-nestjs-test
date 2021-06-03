import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async createUser(registerUserDto: RegisterUserDto): Promise<User> {
    const user = new User();
    user.email = registerUserDto.email;
    user.password = await bcrypt.hash(registerUserDto.password, 10);
    user.firstName = registerUserDto.firstname;
    user.lastName = registerUserDto.lastname;
    user.birthday = registerUserDto.birthday;
    return await this.usersRepository.save(user);
  }

  async loginUser(loginUserDto: LoginUserDto): Promise<string> {
    const user = await this.usersRepository.findOne({
      where: {
        email: loginUserDto.login,
      },
    });
    if (!user) {
      throw new HttpException(
        { status: HttpStatus.BAD_REQUEST, error: 'Worng login or password!' },
        HttpStatus.BAD_REQUEST,
      );
    }
    const isValidPassword = await bcrypt.compare(
      loginUserDto.password,
      user.password,
    );
    if (!isValidPassword) {
      throw new HttpException(
        { status: HttpStatus.BAD_REQUEST, error: 'Worng login or password!' },
        HttpStatus.BAD_REQUEST,
      );
    }
    const payload = {
      id: user.id,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }
}
