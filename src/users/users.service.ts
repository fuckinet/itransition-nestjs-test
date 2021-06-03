import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { EditUserDto } from './dto/edit-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async editUser(id: number, editUserDto: EditUserDto): Promise<User> {
    const user = await this.usersRepository.findOne(id);
    if (!user) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'User with specified id not found!',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    if (editUserDto.firstname) {
      user.firstName = editUserDto.firstname;
    }
    if (editUserDto.lastname) {
      user.lastName = editUserDto.lastname;
    }
    if (editUserDto.birthday) {
      user.birthday = editUserDto.birthday;
    }
    await this.usersRepository.save(user);
    return user;
  }

  async findOneByEmail(email: string): Promise<User | undefined> {
    return this.usersRepository.findOne({
      where: {
        email,
      },
    });
  }
}
