import * as WebSocket from 'ws';
import * as eetase from 'eetase';
import * as http from 'http';
import {
  WebSocketAdapter,
  INestApplicationContext,
  HttpServer,
  Logger,
} from '@nestjs/common';
import { MessageMappingProperties } from '@nestjs/websockets';
import { Observable, fromEvent, EMPTY } from 'rxjs';
import { v4 as uuid } from 'uuid';
import { mergeMap, filter } from 'rxjs/operators';
import * as socketClusterServer from 'socketcluster-server';
import sccBrokerClient from 'scc-broker-client';

const SOCKETCLUSTER_LOG_LEVEL = process.env.SOCKETCLUSTER_LOG_LEVEL || 2;

const SCC_INSTANCE_ID = uuid();
const SCC_STATE_SERVER_HOST = process.env.SCC_STATE_SERVER_HOST || null;
const SCC_STATE_SERVER_PORT = process.env.SCC_STATE_SERVER_PORT || null;
const SCC_MAPPING_ENGINE = process.env.SCC_MAPPING_ENGINE || null;
const SCC_CLIENT_POOL_SIZE = process.env.SCC_CLIENT_POOL_SIZE || null;
const SCC_AUTH_KEY = process.env.SCC_AUTH_KEY || null;
const SCC_INSTANCE_IP = process.env.SCC_INSTANCE_IP || null;
const SCC_INSTANCE_IP_FAMILY = process.env.SCC_INSTANCE_IP_FAMILY || null;
const SCC_STATE_SERVER_CONNECT_TIMEOUT =
  Number(process.env.SCC_STATE_SERVER_CONNECT_TIMEOUT) || null;
const SCC_STATE_SERVER_ACK_TIMEOUT =
  Number(process.env.SCC_STATE_SERVER_ACK_TIMEOUT) || null;
const SCC_STATE_SERVER_RECONNECT_RANDOMNESS =
  Number(process.env.SCC_STATE_SERVER_RECONNECT_RANDOMNESS) || null;
const SCC_PUB_SUB_BATCH_DURATION =
  Number(process.env.SCC_PUB_SUB_BATCH_DURATION) || null;
const SCC_BROKER_RETRY_DELAY =
  Number(process.env.SCC_BROKER_RETRY_DELAY) || null;

const agOptions = {};

if (process.env.SOCKETCLUSTER_OPTIONS) {
  const envOptions = JSON.parse(process.env.SOCKETCLUSTER_OPTIONS);
  Object.assign(agOptions, envOptions);
}

function isEmpty(obj) {
  return Object.keys(obj).length === 0;
}

export class ScAdapter implements WebSocketAdapter {
  private readonly logger = new Logger(ScAdapter.name);
  constructor(
    private app: INestApplicationContext,
    private adapterHost: HttpServer,
  ) {}

  create(port: number, options: any = {}): any {
    const SOCKETCLUSTER_PORT = process.env.SOCKETCLUSTER_PORT || port;
    const httpServer = eetase(http.createServer());
    const agServer = socketClusterServer.attach(
      httpServer,
      isEmpty(agOptions) ? options : agOptions,
    );
    const expressInstance = this.adapterHost.getInstance();
    // Add GET /health-check express route
    expressInstance.get('/health-check', (req, res) => {
      res.status(200).send('OK');
    });
    // HTTP request handling loop.
    (async () => {
      for await (const requestData of httpServer.listener('request')) {
        // eslint-disable-next-line prefer-spread
        expressInstance.apply(null, requestData);
      }
    })();
    httpServer.listen(SOCKETCLUSTER_PORT);
    if (SOCKETCLUSTER_LOG_LEVEL >= 1) {
      (async () => {
        for await (const { error } of agServer.listener('error')) {
          this.logger.error(error);
        }
      })();
    }
    if (SOCKETCLUSTER_LOG_LEVEL >= 2) {
      this.logger.log(
        `SocketCluster worker with PID ${process.pid} is listening on port ${SOCKETCLUSTER_PORT}`,
      );

      (async () => {
        for await (const { warning } of agServer.listener('warning')) {
          this.logger.warn(warning);
        }
      })();
    }
    if (SCC_STATE_SERVER_HOST) {
      // Setup broker client to connect to SCC.
      const sccClient = sccBrokerClient.attach(agServer.brokerEngine, {
        instanceId: SCC_INSTANCE_ID,
        instancePort: SOCKETCLUSTER_PORT,
        instanceIp: SCC_INSTANCE_IP,
        instanceIpFamily: SCC_INSTANCE_IP_FAMILY,
        pubSubBatchDuration: SCC_PUB_SUB_BATCH_DURATION,
        stateServerHost: SCC_STATE_SERVER_HOST,
        stateServerPort: SCC_STATE_SERVER_PORT,
        mappingEngine: SCC_MAPPING_ENGINE,
        clientPoolSize: SCC_CLIENT_POOL_SIZE,
        authKey: SCC_AUTH_KEY,
        stateServerConnectTimeout: SCC_STATE_SERVER_CONNECT_TIMEOUT,
        stateServerAckTimeout: SCC_STATE_SERVER_ACK_TIMEOUT,
        stateServerReconnectRandomness: SCC_STATE_SERVER_RECONNECT_RANDOMNESS,
        brokerRetryDelay: SCC_BROKER_RETRY_DELAY,
      });

      if (SOCKETCLUSTER_LOG_LEVEL >= 1) {
        (async () => {
          for await (const { error } of sccClient.listener('error')) {
            error.name = 'SCCError';
            this.logger.error(error);
          }
        })();
      }
    }
    return agServer;
  }

  bindClientConnect(server, callback: (socket: WebSocket) => any) {
    (async () => {
      for await (const {
        socket: { socket },
      } of server.listener('connection')) {
        callback(socket);
      }
    })();
  }

  bindMessageHandlers(
    client: WebSocket,
    handlers: MessageMappingProperties[],
    process: (data: any) => Observable<any>,
  ) {
    fromEvent(client, 'message')
      .pipe(
        mergeMap((data) => this.bindMessageHandler(data, handlers, process)),
        filter((result) => result),
      )
      .subscribe((response: MessageEvent) => {
        return client.send(JSON.stringify(response));
      });
  }

  bindMessageHandler(
    buffer,
    handlers: MessageMappingProperties[],
    process: (data: any) => Observable<any>,
  ): Observable<any> {
    let message;
    // for ping-pong
    try {
      message = JSON.parse(buffer.data);
    } catch (e) {
      return EMPTY;
    }
    const messageHandler = handlers.find(
      (handler) => handler.message === message.event,
    );
    if (!messageHandler) {
      return EMPTY;
    }
    return process(messageHandler.callback(message.data));
  }

  close(server) {
    server.close();
  }
}
