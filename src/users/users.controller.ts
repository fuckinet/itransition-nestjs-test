import { Body, Controller, Patch, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { EditUserDto } from './dto/edit-user.dto';
import { userIdDto } from './dto/user-id.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async editUser(@Param() params: userIdDto, @Body() editUserDto: EditUserDto) {
    const { id } = params;
    await this.usersService.editUser(id, editUserDto);
  }
}
