import {
  Body,
  Controller,
  Patch,
  Param,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { EditUserDto } from './dto/edit-user.dto';
import { userIdDto } from './dto/user-id.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorators';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id')
  @Roles('admin')
  async editUser(@Param() params: userIdDto, @Body() editUserDto: EditUserDto) {
    const { id } = params;
    const user = await this.usersService.findOneById(id);
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
    await this.usersService.saveUser(user);
    return {
      id: user.id,
      ...editUserDto,
    };
  }
}
