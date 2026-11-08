import { Injectable } from '@nestjs/common';
import { GameState } from '../../game/types/game-state.types';
import { Room } from '../entities/room.entity';
import { RoomsRepository } from '../rooms.repository';

export interface RoomActorInput {
  code: string;
  playerId: string;
}

/**
 * Base de las acciones sobre una sala: busca la sala, aplica la regla sobre
 * una copia del estado y solo la guarda si no hubo error. Así una jugada
 * inválida nunca deja la partida a medias.
 */
@Injectable()
export abstract class RoomActionUseCase<
  TInput extends RoomActorInput = RoomActorInput,
> {
  constructor(protected readonly roomsRepository: RoomsRepository) {}

  execute(input: TInput, now = Date.now()): Room {
    const room = this.roomsRepository.findByCode(input.code);
    const draft = structuredClone(room.state);
    this.apply(draft, input, room);
    room.state = draft;
    room.lastActivity = now;
    this.afterApply(room, input);
    return room;
  }

  protected abstract apply(state: GameState, input: TInput, room: Room): void;

  /** Para lo que va fuera del estado del juego (tokens, borrar la sala). */
  protected afterApply(_room: Room, _input: TInput): void {}
}
