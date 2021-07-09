import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from '@nestjs/websockets';
import { AGServer } from 'socketcluster-server';
import { UsersService } from './users.service';

@WebSocketGateway(8000)
export class UsersGateway {
  constructor(private readonly usersService: UsersService) {}
  @WebSocketServer()
  server: AGServer;

  @SubscribeMessage('getUser')
  async onEvent(client: any, id: any): Promise<WsResponse<unknown>> {
    const user = await this.usersService.findOneById(id);
    return {
      event: 'getUser',
      data: user
        ? {
            id: user.id,
            firstname: user.firstName,
            lastname: user.lastName,
          }
        : null,
    };
  }
}
