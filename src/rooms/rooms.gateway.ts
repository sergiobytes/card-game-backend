import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { parseMessage } from '../common/validation/parse-message';
import { GameRuleError } from '../game/engine/game-rule.error';
import type { Room } from './entities/room.entity';
import {
  type Ack,
  ClientEvents,
  type JoinedResponse,
  ServerEvents,
} from './rooms.events';
import { RoomsService } from './rooms.service';
import {
  CreateRoomSchema,
  JoinRoomSchema,
  PlayCardSchema,
  RejoinRoomSchema,
  TargetPlayerSchema,
  UpdateRulesSchema,
} from './schemas/room-messages.schema';
import type { JoinedRoom } from './usecases/create-room.usecase';
import type { RoomActorInput } from './usecases/room-action.usecase';

/** Lo que el servidor recuerda de cada socket: en qué sala está y quién es. */
interface SocketSession {
  code?: string;
  playerId?: string;
}

export type GameSocket = Socket<
  Record<string, never>,
  Record<string, never>,
  Record<string, never>,
  SocketSession
>;

/** Canal privado de un jugador: ahí le llega su propia vista. */
export const playerChannel = (code: string, playerId: string) =>
  `${code}:${playerId}`;

@WebSocketGateway()
export class RoomsGateway implements OnGatewayDisconnect {
  private readonly logger = new Logger(RoomsGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(private readonly roomsService: RoomsService) {}

  // ---------- Entrar y salir ----------

  @SubscribeMessage(ClientEvents.CreateRoom)
  create(
    @ConnectedSocket() socket: GameSocket,
    @MessageBody() body: unknown,
  ): Promise<Ack<JoinedResponse>> {
    return this.respond(() => {
      const { name } = parseMessage(CreateRoomSchema, body);
      return this.enter(socket, this.roomsService.create(name));
    });
  }

  @SubscribeMessage(ClientEvents.JoinRoom)
  join(
    @ConnectedSocket() socket: GameSocket,
    @MessageBody() body: unknown,
  ): Promise<Ack<JoinedResponse>> {
    return this.respond(() => {
      const { code, name } = parseMessage(JoinRoomSchema, body);
      return this.enter(socket, this.roomsService.join(code, name));
    });
  }

  @SubscribeMessage(ClientEvents.RejoinRoom)
  rejoin(
    @ConnectedSocket() socket: GameSocket,
    @MessageBody() body: unknown,
  ): Promise<Ack<JoinedResponse>> {
    return this.respond(() => {
      const { code, token } = parseMessage(RejoinRoomSchema, body);
      return this.enter(socket, this.roomsService.rejoin(code, token));
    });
  }

  @SubscribeMessage(ClientEvents.LeaveRoom)
  leave(@ConnectedSocket() socket: GameSocket): Promise<Ack<null>> {
    return this.respond(() => {
      const actor = this.actor(socket);
      const room = this.roomsService.leave(actor);
      void socket.leave(playerChannel(actor.code, actor.playerId));
      socket.data = {};
      this.broadcast(room);
      return null;
    });
  }

  @SubscribeMessage(ClientEvents.KickPlayer)
  kick(
    @ConnectedSocket() socket: GameSocket,
    @MessageBody() body: unknown,
  ): Promise<Ack<null>> {
    return this.respond(() => {
      const actor = this.actor(socket);
      const { playerId } = parseMessage(TargetPlayerSchema, body);
      const room = this.roomsService.kick(actor, playerId);
      const channel = playerChannel(actor.code, playerId);
      this.server.to(channel).emit(ServerEvents.Kicked);
      this.server.in(channel).socketsLeave(channel);
      this.broadcast(room);
      return null;
    });
  }

  // ---------- Jugar ----------

  @SubscribeMessage(ClientEvents.UpdateRules)
  updateRules(
    @ConnectedSocket() socket: GameSocket,
    @MessageBody() body: unknown,
  ): Promise<Ack<null>> {
    return this.act(socket, (actor) =>
      this.roomsService.updateRules(
        actor,
        parseMessage(UpdateRulesSchema, body),
      ),
    );
  }

  @SubscribeMessage(ClientEvents.StartRound)
  start(@ConnectedSocket() socket: GameSocket): Promise<Ack<null>> {
    return this.act(socket, (actor) => this.roomsService.start(actor));
  }

  @SubscribeMessage(ClientEvents.PlayCard)
  play(
    @ConnectedSocket() socket: GameSocket,
    @MessageBody() body: unknown,
  ): Promise<Ack<null>> {
    return this.act(socket, (actor) => {
      const { cardId, color } = parseMessage(PlayCardSchema, body);
      return this.roomsService.play(actor, cardId, color);
    });
  }

  @SubscribeMessage(ClientEvents.DrawCard)
  draw(@ConnectedSocket() socket: GameSocket): Promise<Ack<null>> {
    return this.act(socket, (actor) => this.roomsService.draw(actor));
  }

  @SubscribeMessage(ClientEvents.PassTurn)
  pass(@ConnectedSocket() socket: GameSocket): Promise<Ack<null>> {
    return this.act(socket, (actor) => this.roomsService.pass(actor));
  }

  @SubscribeMessage(ClientEvents.DeclareLast)
  declareLast(@ConnectedSocket() socket: GameSocket): Promise<Ack<null>> {
    return this.act(socket, (actor) => this.roomsService.declareLast(actor));
  }

  @SubscribeMessage(ClientEvents.CatchPlayer)
  catchPlayer(
    @ConnectedSocket() socket: GameSocket,
    @MessageBody() body: unknown,
  ): Promise<Ack<null>> {
    return this.act(socket, (actor) => {
      const { playerId } = parseMessage(TargetPlayerSchema, body);
      return this.roomsService.catchPlayer(actor, playerId);
    });
  }

  @SubscribeMessage(ClientEvents.SkipTurn)
  skipTurn(
    @ConnectedSocket() socket: GameSocket,
    @MessageBody() body: unknown,
  ): Promise<Ack<null>> {
    return this.act(socket, (actor) => {
      const { playerId } = parseMessage(TargetPlayerSchema, body);
      return this.roomsService.skipTurn(actor, playerId);
    });
  }

  // ---------- Conexiones ----------

  handleDisconnect(socket: GameSocket): void {
    const { code, playerId } = socket.data ?? {};
    if (!code || !playerId) return;
    const room = this.roomsService.disconnect(code, playerId, socket.id);
    if (room) this.broadcast(room);
  }

  /** Le manda a cada jugador su propia vista de la sala. */
  broadcast(room: Room): void {
    if (!this.roomsService.isOpen(room)) return;
    for (const id of this.roomsService.memberIds(room)) {
      this.server
        .to(playerChannel(room.code, id))
        .emit(ServerEvents.State, this.roomsService.viewFor(room, id));
    }
  }

  private enter(socket: GameSocket, joined: JoinedRoom): JoinedResponse {
    this.handleDisconnect(socket); // por si esta pestaña venía de otra sala
    const { room, playerId, token } = joined;
    socket.data = { code: room.code, playerId };
    void socket.join(playerChannel(room.code, playerId));
    this.roomsService.connect(room, playerId, socket.id);
    this.broadcast(room);
    return { code: room.code, playerId, token };
  }

  private actor(socket: GameSocket): RoomActorInput {
    const { code, playerId } = socket.data ?? {};
    if (!code || !playerId) {
      throw new GameRuleError('Primero entra a una sala.');
    }
    return { code, playerId };
  }

  private act(
    socket: GameSocket,
    action: (actor: RoomActorInput) => Room,
  ): Promise<Ack<null>> {
    return this.respond(() => {
      this.broadcast(action(this.actor(socket)));
      return null;
    });
  }

  private async respond<T>(fn: () => T): Promise<Ack<T>> {
    try {
      return { ok: true, data: await fn() };
    } catch (error) {
      if (error instanceof GameRuleError) {
        return { ok: false, error: error.message };
      }
      this.logger.error(error);
      return {
        ok: false,
        error: 'Algo salió mal en el servidor. Intenta de nuevo.',
      };
    }
  }
}
