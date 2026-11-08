import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { CardColor } from '../game/types/card.types';
import { Rules } from '../game/types/game-state.types';
import { PlayerView, toPlayerView } from '../game/views/player-view';
import { Room } from './entities/room.entity';
import { attachSocket, detachSocket, onlineIds } from './room-connections';
import { ROOM_SWEEP_EVERY_MS } from './rooms.constants';
import { RoomsRepository } from './rooms.repository';
import { CatchPlayerUseCase } from './usecases/catch-player.usecase';
import { CreateRoomUseCase, JoinedRoom } from './usecases/create-room.usecase';
import { DeclareLastUseCase } from './usecases/declare-last.usecase';
import { DrawCardUseCase } from './usecases/draw-card.usecase';
import { JoinRoomUseCase } from './usecases/join-room.usecase';
import { KickPlayerUseCase } from './usecases/kick-player.usecase';
import { LeaveRoomUseCase } from './usecases/leave-room.usecase';
import { PassTurnUseCase } from './usecases/pass-turn.usecase';
import { PlayCardUseCase } from './usecases/play-card.usecase';
import { RejoinRoomUseCase } from './usecases/rejoin-room.usecase';
import { RemoveIdleRoomsUseCase } from './usecases/remove-idle-rooms.usecase';
import { RoomActorInput } from './usecases/room-action.usecase';
import { SkipTurnUseCase } from './usecases/skip-turn.usecase';
import { StartRoundUseCase } from './usecases/start-round.usecase';
import { UpdateRulesUseCase } from './usecases/update-rules.usecase';

/** Punto de entrada a las salas: cada método delega en su usecase. */
@Injectable()
export class RoomsService implements OnModuleInit, OnModuleDestroy {
  private sweeper?: NodeJS.Timeout;

  constructor(
    private readonly roomsRepository: RoomsRepository,
    private readonly createRoomUseCase: CreateRoomUseCase,
    private readonly joinRoomUseCase: JoinRoomUseCase,
    private readonly rejoinRoomUseCase: RejoinRoomUseCase,
    private readonly leaveRoomUseCase: LeaveRoomUseCase,
    private readonly kickPlayerUseCase: KickPlayerUseCase,
    private readonly updateRulesUseCase: UpdateRulesUseCase,
    private readonly startRoundUseCase: StartRoundUseCase,
    private readonly playCardUseCase: PlayCardUseCase,
    private readonly drawCardUseCase: DrawCardUseCase,
    private readonly passTurnUseCase: PassTurnUseCase,
    private readonly declareLastUseCase: DeclareLastUseCase,
    private readonly catchPlayerUseCase: CatchPlayerUseCase,
    private readonly skipTurnUseCase: SkipTurnUseCase,
    private readonly removeIdleRoomsUseCase: RemoveIdleRoomsUseCase,
  ) {}

  onModuleInit(): void {
    this.sweeper = setInterval(
      () => this.removeIdleRoomsUseCase.execute(),
      ROOM_SWEEP_EVERY_MS,
    );
    this.sweeper.unref();
  }

  onModuleDestroy(): void {
    clearInterval(this.sweeper);
  }

  create(name: string): JoinedRoom {
    return this.createRoomUseCase.execute({ name });
  }

  join(code: string, name: string): JoinedRoom {
    return this.joinRoomUseCase.execute({ code, name });
  }

  rejoin(code: string, token: string): JoinedRoom {
    return this.rejoinRoomUseCase.execute({ code, token });
  }

  leave(actor: RoomActorInput): Room {
    return this.leaveRoomUseCase.execute(actor);
  }

  kick(actor: RoomActorInput, targetId: string): Room {
    return this.kickPlayerUseCase.execute({ ...actor, targetId });
  }

  updateRules(actor: RoomActorInput, rules: Partial<Rules>): Room {
    return this.updateRulesUseCase.execute({ ...actor, rules });
  }

  start(actor: RoomActorInput): Room {
    return this.startRoundUseCase.execute(actor);
  }

  play(actor: RoomActorInput, cardId: string, color?: CardColor): Room {
    return this.playCardUseCase.execute({ ...actor, cardId, color });
  }

  draw(actor: RoomActorInput): Room {
    return this.drawCardUseCase.execute(actor);
  }

  pass(actor: RoomActorInput): Room {
    return this.passTurnUseCase.execute(actor);
  }

  declareLast(actor: RoomActorInput): Room {
    return this.declareLastUseCase.execute(actor);
  }

  catchPlayer(actor: RoomActorInput, targetId: string): Room {
    return this.catchPlayerUseCase.execute({ ...actor, targetId });
  }

  skipTurn(actor: RoomActorInput, targetId: string): Room {
    return this.skipTurnUseCase.execute({ ...actor, targetId });
  }

  // ---------- Conexiones y vistas (las usa el gateway) ----------

  connect(room: Room, playerId: string, socketId: string): void {
    attachSocket(room, playerId, socketId);
  }

  /** Devuelve la sala si sigue abierta, para avisar a los demás. */
  disconnect(code: string, playerId: string, socketId: string): Room | null {
    if (!this.roomsRepository.exists(code)) return null;
    const room = this.roomsRepository.findByCode(code);
    detachSocket(room, playerId, socketId);
    return room;
  }

  isOpen(room: Room): boolean {
    return this.roomsRepository.exists(room.code);
  }

  memberIds(room: Room): string[] {
    return [...room.state.players, ...room.state.waiting].map((p) => p.id);
  }

  viewFor(room: Room, playerId: string): PlayerView {
    return toPlayerView(room.state, room.code, playerId, onlineIds(room));
  }

  roomCount(): number {
    return this.roomsRepository.count();
  }
}
