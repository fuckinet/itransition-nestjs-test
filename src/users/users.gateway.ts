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
  constructor(private readonly usersService: UsersService) {
    setInterval(() => {
      (async () => {
        try {
          // Publish data; wait for an acknowledgement from the back end broker (if it exists).
          await this.server.exchange.invokePublish('testChannel', 'This is some more data');
          console.log('success publish with ack a message');
        } catch (error) {
          console.error(error);
        }
      })();
    }, 2000);
  }
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
